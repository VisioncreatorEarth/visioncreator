<script lang="ts">
  import { createMutation, createQuery } from '$lib/wundergraph';
  import { onMount } from 'svelte';
  import FileTree from './FileTree.svelte';

  const sandboxStartMutation = createMutation({
    operationName: 'sandboxStart'
  });

  const sandboxListQuery = createQuery({
    operationName: 'sandboxList',
    liveQuery: true
  });

  const sandboxStopMutation = createMutation({
    operationName: 'sandboxStop'
  });

  const sandboxWriteFileMutation = createMutation({
    operationName: 'sandboxWriteFile'
  });

  // File read query - don't initialize with empty values
  const readFileQuery = createQuery({
    operationName: 'sandboxFsRead',
    enabled: false
  });

  let selectedSandboxId: string | null = null;
  let iframeUrl: string | null = null;
  let currentFilePath: string | null = null;
  let code = '';
  let editorReady = false;

  async function runSandbox() {
    try {
      console.log('🚀 Starting SvelteKit sandbox...');
      const response = await $sandboxStartMutation.mutateAsync({});
      console.log('✨ Sandbox response:', response);

      if (response.success && response.url) {
        selectedSandboxId = response.id;
        iframeUrl = response.url;
        console.log('🎯 Selected sandbox:', selectedSandboxId);
        console.log('🌐 Set iframe URL to:', iframeUrl);
      } else {
        console.error('❌ Missing URL in sandbox response:', response);
      }
    } catch (error) {
      console.error('❌ Error starting sandbox:', error);
    }
  }

  function selectSandbox(id: string, url: string) {
    console.log('🔄 Switching to sandbox:', id, 'with URL:', url);
    selectedSandboxId = id;
    iframeUrl = url;
  }

  async function stopSandbox(id: string) {
    try {
      console.log('🛑 Stopping sandbox:', id);
      const response = await $sandboxStopMutation.mutateAsync({
        sandboxId: id
      });

      if (response.success) {
        console.log('✅ Successfully stopped sandbox:', id);
        if (selectedSandboxId === id) {
          selectedSandboxId = null;
          iframeUrl = null;
        }
        await $sandboxListQuery.refetch();
      } else {
        console.error('❌ Failed to stop sandbox:', response.error);
      }
    } catch (error) {
      console.error('❌ Error stopping sandbox:', error);
    }
  }

  async function handleFileSelect(event: CustomEvent<{ path: string }>) {
    console.log('🎯 Sandbox: Received file select event:', event.detail);
    const { path } = event.detail;
    
    if (!path || !selectedSandboxId) {
      console.error('❌ Sandbox: Missing path or sandbox ID:', { path, selectedSandboxId });
      return;
    }

    const input = {
      sandboxId: selectedSandboxId,
      path: path
    };

    console.log('📥 Sandbox: Requesting file content with:', input);

    try {
      const result = await $readFileQuery.refetch({ input });

      console.log('📄 Sandbox: Received file content result:', result);

      if (result.data?.success && result.data.content !== undefined) {
        console.log('✅ Sandbox: File read successful, updating editor');
        currentFilePath = path;
        code = result.data.content;
        editorReady = true;
      } else if (result.data?.error) {
        console.error('❌ Sandbox: Backend error reading file:', {
          error: result.data.error,
          input
        });
      } else {
        console.error('❌ Sandbox: Failed to read file:', {
          input,
          result
        });
      }
    } catch (error) {
      console.error('💥 Sandbox: Exception reading file:', {
        error,
        input
      });
    }
  }

  $: if (editorReady && code && currentFilePath && selectedSandboxId) {
    console.log('💾 Sandbox: Writing file:', {
      path: currentFilePath,
      contentLength: code.length
    });
    
    $sandboxWriteFileMutation.mutate({
      sandboxId: selectedSandboxId,
      path: currentFilePath,
      content: code
    });
  }

  onMount(() => {
    $sandboxListQuery.refetch();
  });
</script>

<div class="grid grid-cols-[1fr_3fr] gap-4 p-4 bg-surface-800 rounded-lg h-[calc(100vh-2rem)]">
  <!-- Left side: Sandbox Controls, List and File Tree -->
  <div class="flex flex-col gap-4 overflow-hidden">
    <!-- Sandbox Controls -->
    <div class="flex-none">
      <button
        class="w-full btn variant-filled"
        on:click={runSandbox}
        disabled={$sandboxStartMutation.isLoading}
      >
        {#if $sandboxStartMutation.isLoading}Starting...{:else}Start New Sandbox{/if}
      </button>
    </div>

    <!-- Sandbox List -->
    <div class="flex-none overflow-y-auto max-h-48">
      {#if $sandboxListQuery.isSuccess && $sandboxListQuery.data?.sandboxes}
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-semibold text-surface-50">Running Sandboxes:</h3>
          {#each $sandboxListQuery.data.sandboxes as sandbox}
            {#if sandbox.url}
              <button
                class="flex flex-col gap-2 p-3 rounded-md border transition-colors cursor-pointer
                  {sandbox.id === selectedSandboxId
                  ? 'bg-surface-700 border-surface-500'
                  : 'bg-surface-900 border-surface-700 hover:bg-surface-800'}"
                on:click={() => selectSandbox(sandbox.id, sandbox.url)}
              >
                <div class="flex justify-between items-center">
                  <span
                    class="text-sm truncate {sandbox.id === selectedSandboxId
                      ? 'text-surface-50'
                      : 'text-surface-200'}"
                  >
                    {sandbox.id}
                  </span>
                  <button
                    class="btn btn-sm variant-soft-error"
                    on:click={(e) => {
                      e.stopPropagation();
                      stopSandbox(sandbox.id);
                    }}
                    disabled={$sandboxStopMutation.isLoading}
                  >
                    Stop
                  </button>
                </div>
                {#if sandbox.id === selectedSandboxId}
                  <span class="text-xs text-success-400">Currently Displayed</span>
                {/if}
              </button>
            {/if}
          {/each}
        </div>
      {:else if $sandboxListQuery.isLoading}
        <p class="text-surface-400">Loading sandboxes...</p>
      {:else if $sandboxListQuery.error}
        <p class="text-error-400">Error: {$sandboxListQuery.error.message}</p>
      {:else}
        <p class="text-surface-400">No active sandboxes</p>
      {/if}
    </div>

    <!-- File Tree -->
    {#if selectedSandboxId}
      <div class="flex-1 min-h-0 overflow-hidden border border-surface-700 rounded">
        <FileTree 
          sandboxId={selectedSandboxId} 
          on:fileSelect={handleFileSelect} 
        />
      </div>
    {/if}
  </div>

  <!-- Right side: Code Editor and Sandbox Display -->
  <div class="grid grid-cols-[2fr_3fr] gap-4 overflow-hidden">
    <!-- Code Editor -->
    <div class="flex flex-col gap-2 overflow-hidden">
      <h3 class="text-lg font-semibold text-surface-50 flex-none">
        {#if currentFilePath}
          <span class="text-sm text-surface-400">{currentFilePath}</span>
        {:else}
          Code Editor
        {/if}
      </h3>
      <textarea
        bind:value={code}
        class="flex-1 p-4 font-mono text-sm rounded-md border resize-none bg-surface-900 border-surface-700 min-h-0"
        spellcheck="false"
      />
    </div>

    <!-- Sandbox Display -->
    <div class="flex flex-col overflow-hidden">
      <div class="flex-1 rounded-md border bg-surface-900 border-surface-700 overflow-hidden">
        {#if iframeUrl}
          <div
            class="absolute top-2 right-2 z-10 p-2 text-xs rounded-md opacity-50 transition-opacity bg-surface-800 hover:opacity-100"
          >
            {iframeUrl}
          </div>
          <iframe
            title="SvelteKit Sandbox"
            src={iframeUrl}
            class="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            on:load={() => console.log('🎉 iframe loaded')}
            on:error={(e) => console.error('❌ iframe error:', e)}
          />
        {:else}
          <div class="flex justify-center items-center h-full text-surface-400">
            <p>Start a sandbox to see the content here</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .file-tree {
    height: 100%;
    overflow-y: auto;
  }
</style>
