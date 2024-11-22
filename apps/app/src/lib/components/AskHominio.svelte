<!-- AskHominio.svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { UltravoxSession } from 'ultravox-client';
  import { createMutation } from '$lib/wundergraph';

  const askHominioMutation = createMutation({
    operationName: 'askHominio'
  });

  let session: UltravoxSession | null = null;
  let status: 'disconnected' | 'disconnecting' | 'connecting' | 'idle' | 'listening' | 'thinking' | 'speaking' =
    'disconnected';
  let error: string | null = null;
  let isCallActive = false;
  let isSpeaking = false;
  let currentCallId: string | null = null;
  let isLoading = false;
  let transcripts: { text: string; speaker: 'agent' | 'user' }[] = [];

  // Helper function for consistent log formatting
  function formatLog(type: string, message: string) {
    console.log(`[${type}]: ${message}`);
  }

  function handleStatusChange(event: any) {
    const sessionStatus = session?.status;
    formatLog('STATUS', sessionStatus || 'Unknown');

    if (!sessionStatus) return;

    status = sessionStatus;
    isCallActive = ['idle', 'listening', 'thinking', 'speaking'].includes(sessionStatus);
  }

  async function startCall() {
    formatLog('START', 'Starting new call...');
    isLoading = true;
    error = null;
    transcripts = [];

    try {
      const result = await $askHominioMutation.mutateAsync({
        action: 'create'
      });

      formatLog('RESPONSE', JSON.stringify(result, null, 2));

      if (!result?.joinUrl) {
        throw new Error('No join URL received');
      }

      currentCallId = result.callId;
      
      // Create Ultravox session with debug messages
      formatLog('SESSION', 'Creating Ultravox session...');
      const debugMessages = new Set(['debug', 'status', 'transcripts', 'speaking']);
      session = new UltravoxSession({
        joinUrl: result.joinUrl,
        transcriptOptional: false,
        experimentalMessages: debugMessages,
        webSocketConfig: {
          reconnect: true,
          maxRetries: 3,
          retryDelay: 1000
        }
      });

      // Add event listeners
      session.addEventListener('status', handleStatusChange);
      
      session.addEventListener('speaking', (event) => {
        formatLog('SPEAKING', String(event.detail));
        isSpeaking = event.detail;
      });

      session.addEventListener('transcripts', () => {
        const currentTranscripts = session?.transcripts || [];
        formatLog('TRANSCRIPTS', JSON.stringify(currentTranscripts));
        
        transcripts = currentTranscripts
          .filter((t: any) => t.isFinal && t.text)
          .map((t: any) => ({
            text: t.text,
            speaker: t.speaker
          }));
      });

      session.addEventListener('error', (event) => {
        formatLog('ERROR', event.detail.message || 'Unknown error');
        error = event.detail.message || 'Unknown error occurred';
        status = 'disconnected';
      });

      // Add debug message listener
      session.addEventListener('experimental_message', (msg) => {
        if (!msg.detail) return;
        formatLog('DEBUG', JSON.stringify(msg.detail));
      });

      // Join the call with retry logic
      formatLog('JOIN', 'Joining call...');
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          await session.joinCall(result.joinUrl);
          formatLog('SUCCESS', `Call started: ${currentCallId}`);
          break;
        } catch (error) {
          retries++;
          formatLog('RETRY', `Join attempt ${retries} failed: ${error}`);
          if (retries === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Auto-close timer (20 seconds)
      setTimeout(() => {
        formatLog('TIMER', 'Auto-closing call after 20 seconds');
        endCall();
      }, 20000);

    } catch (e) {
      formatLog('ERROR', e instanceof Error ? e.message : 'Failed to start call');
      error = e instanceof Error ? e.message : 'Failed to start call. Please try again.';
      status = 'disconnected';
      if (session) {
        session.leaveCall().catch(() => {});
        session = null;
      }
    } finally {
      isLoading = false;
    }
  }

  async function endCall() {
    if (!currentCallId) return;

    formatLog('END', `Ending call: ${currentCallId}`);
    
    try {
      // First leave the WebSocket session
      if (session) {
        status = 'disconnecting';
        await session.leaveCall();
        session = null;
      }

      // Then end the call via API
      await $askHominioMutation.mutateAsync({
        action: 'end',
        callId: currentCallId
      });

      formatLog('SUCCESS', 'Call ended successfully');
      
      // Reset state
      status = 'disconnected';
      isCallActive = false;
      currentCallId = null;
      isSpeaking = false;
      transcripts = [];
      
    } catch (e) {
      formatLog('ERROR', e instanceof Error ? e.message : 'Failed to end call');
      error = e instanceof Error ? e.message : 'Failed to end call';
      status = 'disconnected';
    }
  }

  onDestroy(() => {
    if (session) {
      formatLog('CLEANUP', 'Cleaning up session...');
      session.leaveCall().catch(err => formatLog('ERROR', `Cleanup error: ${err}`));
      session = null;
    }
  });
</script>

<div class="fixed bottom-20 left-1/2 z-50 transform -translate-x-1/2">
  <div class="flex flex-col gap-4 items-center">
    {#if transcripts.length > 0}
      <div class="w-full max-w-md p-4 rounded-lg shadow-lg bg-surface-100-800-token overflow-y-auto max-h-[60vh]">
        {#each transcripts as transcript}
          <div class="flex flex-col mb-3 last:mb-0">
            <div class="flex {transcript.speaker === 'agent' ? 'justify-start' : 'justify-end'}">
              <div class="variant-ghost-{transcript.speaker === 'agent' ? 'tertiary' : 'primary'} rounded-lg p-3 max-w-[85%]">
                <p class="text-sm font-medium">{transcript.speaker === 'agent' ? 'Assistant' : 'You'}</p>
                <p class="text-sm">{transcript.text}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if error}
      <div class="p-4 text-sm rounded-lg variant-ghost-error">{error}</div>
    {/if}

    <div
      class="flex flex-col gap-4 items-center px-12 py-8 w-full max-w-md rounded-xl shadow-lg bg-surface-800"
    >
      {#if status !== 'idle'}
        <div
          class="inline-flex items-center px-4 py-2 text-sm rounded-full shadow-inner text-tertiary-200 bg-surface-700"
        >
          <span class="flex relative mr-2 w-2 h-2">
            <span
              class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-tertiary-400"
            />
            <span class="inline-flex relative w-2 h-2 rounded-full bg-tertiary-500" />
          </span>
          {status} {isSpeaking ? '(Speaking)' : ''}
        </div>
      {/if}

      <div class="flex justify-center w-full">
        {#if !isCallActive}
          <button
            class="btn variant-ghost-primary"
            on:click={startCall}
            disabled={status === 'connecting' || isLoading}
          >
            {status === 'connecting' ? 'Connecting...' : 'Start Call'}
          </button>
        {:else}
          <button class="btn variant-ghost-error" on:click={endCall} disabled={status === 'disconnecting'}>
            {status === 'disconnecting' ? 'Stopping...' : 'Stop'}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Add smooth scrolling for transcripts */
  div :global(.overflow-y-auto) {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }

  div :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
  }

  div :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: transparent;
  }

  div :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
</style>
