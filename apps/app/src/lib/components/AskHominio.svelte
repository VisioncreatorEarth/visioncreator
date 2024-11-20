<!-- AskHominio.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { createMutation } from '$lib/wundergraph';

	// Create mutations
	const askHominioMutation = createMutation({
		operationName: 'askHominio'
	});

	let session: UltravoxSession | null = null;
	let status:
		| 'disconnected'
		| 'disconnecting'
		| 'connecting'
		| 'idle'
		| 'listening'
		| 'thinking'
		| 'speaking' = 'disconnected';
	let error: string | null = null;
	let transcripts: string[] = [];
	let isCallActive = false;
	let isSpeaking = false;
	let processedTranscripts = new Set<string>();
	let transcriptsContainer: HTMLDivElement | null = null;

	// Helper function for consistent log formatting
	function formatLog(type: string, message: string) {
		console.log(`[${type}]: ${message}`);
	}

	function handleStatusChange(event: any) {
		const sessionStatus = session?.status;
		formatLog('STATUS', sessionStatus || 'Unknown');

		if (!sessionStatus) {
			formatLog('WARNING', 'No session status available');
			return;
		}

		switch (sessionStatus) {
			case 'disconnected':
				status = 'disconnected';
				isCallActive = false;
				break;
			case 'disconnecting':
				status = 'disconnecting';
				break;
			case 'connecting':
				status = 'connecting';
				break;
			case 'idle':
				status = 'idle';
				isCallActive = true;
				break;
			case 'listening':
				status = 'listening';
				isCallActive = true;
				break;
			case 'thinking':
				status = 'thinking';
				isCallActive = true;
				break;
			case 'speaking':
				status = 'speaking';
				isCallActive = true;
				break;
			default:
				formatLog('WARNING', `Unknown status received: ${sessionStatus}`);
		}
	}

	async function startCall() {
		try {
			formatLog('STATUS', 'Starting shopping assistant...');
			status = 'connecting';
			error = null;
			transcripts = [];
			processedTranscripts.clear(); // Clear the set when starting a new call

			const result = await $askHominioMutation.mutateAsync({
				chat_message_prompts: ['Start shopping assistant']
			});

			if (result.error) {
				throw new Error(result.error.message || 'Failed to create call');
			}

			if (!result.data?.joinUrl) {
				throw new Error('No join URL received');
			}

			formatLog('STATUS', 'Creating Ultravox session...');
			// Enable debug messages
			const debugMessages = new Set(['debug']);
			session = new UltravoxSession({
				joinUrl: result.data.joinUrl,
				transcriptOptional: false,
				experimentalMessages: debugMessages
			});

			// Add event listeners
			session.addEventListener('status', handleStatusChange);

			session.addEventListener('transcripts', () => {
				// Access transcripts directly from session
				const currentTranscripts = session?.transcripts || [];

				// Only process and display final transcripts that we haven't seen before
				currentTranscripts
					.filter((t: any) => {
						// Only process transcripts that:
						// 1. Are final
						// 2. Have actual text content
						// 3. Haven't been processed before
						// 4. For user transcripts, ensure they're not null/undefined
						return (
							t.isFinal &&
							t.text &&
							!processedTranscripts.has(t.text) &&
							(t.speaker === 'agent' || (t.speaker === 'user' && t.text !== 'null'))
						);
					})
					.forEach((t: any) => {
						const role = t.speaker === 'agent' ? 'ASSISTANT-SPEAKER' : 'USER-TRANSCRIPT';
						formatLog(role, `${t.text} [${t.medium}]`);
						processedTranscripts.add(t.text);
					});

				// Update the UI transcripts array with only valid final transcripts
				transcripts = currentTranscripts
					.filter(
						(t: any) =>
							t.isFinal &&
							t.text &&
							(t.speaker === 'agent' || (t.speaker === 'user' && t.text !== 'null'))
					)
					.map((t: any) => `${t.speaker === 'user' ? 'You' : 'Assistant'}: ${t.text}`);

				// Update the display in the UI
				if (transcriptsContainer) {
					transcriptsContainer.scrollTop = transcriptsContainer.scrollHeight;
				}
			});

			session.addEventListener('speaking', (event) => {
				formatLog('STATUS', `Speaking: ${event.detail}`);
				isSpeaking = event.detail;
			});

			session.addEventListener('error', (event) => {
				formatLog('ERROR', event.detail.message || 'Unknown error occurred');
				error = event.detail.message || 'Unknown error occurred';
				status = 'disconnected';
			});

			// Add debug message listener
			session.addEventListener('experimental_message', (msg) => {
				if (!msg.detail) return;

				if (msg.detail.type === 'tool_call') {
					const { function: fn, args, invocation_id } = msg.detail;
					formatLog(
						'DEBUG-TOOL',
						`Tool Call [${invocation_id}]: ${fn} Args: ${JSON.stringify(args)}`
					);
				} else if (msg.detail.type === 'tool_result') {
					const { result, invocation_id } = msg.detail;
					formatLog('DEBUG-TOOL', `Tool Result [${invocation_id}]: ${JSON.stringify(result)}`);
				} else if (msg.detail.messages) {
					msg.detail.messages.forEach((m: any) => {
						if (m.text) {
							// Only show messages with text
							formatLog('DEBUG-MSG', `${m.role}: ${m.text}`);
						}
					});
				}
			});

			formatLog('STATUS', 'Joining call...');
			await session.joinCall(result.data.joinUrl);
			formatLog('STATUS', 'Call successfully connected!');
		} catch (err) {
			formatLog('ERROR', err instanceof Error ? err.message : 'Failed to start call');
			error = err instanceof Error ? err.message : 'Failed to start call';
			status = 'disconnected';
		}
	}

	async function endCall() {
		try {
			if (session) {
				formatLog('STATUS', 'Ending call...');
				status = 'disconnecting';
				await session.leaveCall();
				session = null;
				status = 'disconnected';
				isCallActive = false;
				transcripts = [];
				processedTranscripts.clear(); // Clear the set when ending the call
				isSpeaking = false;
				formatLog('STATUS', 'Call ended successfully');
			}
		} catch (err) {
			formatLog('ERROR', err instanceof Error ? err.message : 'Failed to end call');
			error = err instanceof Error ? err.message : 'Failed to end call';
			status = 'disconnected';
			isCallActive = false;
			session = null;
		}
	}

	onDestroy(() => {
		if (session) {
			formatLog('STATUS', 'Cleaning up session...');
			session
				.leaveCall()
				.then(() => formatLog('STATUS', 'Session cleanup successful'))
				.catch((err) => formatLog('ERROR', 'Session cleanup error:', err));
			session = null;
		}
	});
</script>

<div class="fixed bottom-20 left-1/2 z-50 transform -translate-x-1/2">
	<div class="flex flex-col gap-4 items-center">
		<!-- {#if isCallActive && transcripts.length > 0}
			<div
				bind:this={transcriptsContainer}
				class="overflow-y-auto p-4 w-full max-w-md max-h-[60vh] rounded-lg shadow-lg bg-surface-100-800-token"
			>
				{#each transcripts as transcript}
					<div class="flex flex-col mb-3 last:mb-0">
						{#if transcript.startsWith('Assistant:')}
							<div class="flex justify-start">
								<div class="variant-ghost-tertiary rounded-lg p-3 max-w-[85%]">
									<p class="text-sm font-medium">Assistant</p>
									<p class="text-sm">{transcript.replace('Assistant:', '')}</p>
								</div>
							</div>
						{:else}
							<div class="flex justify-end">
								<div class="variant-ghost-primary rounded-lg p-3 max-w-[85%]">
									<p class="text-sm font-medium">You</p>
									<p class="text-sm">{transcript.replace('You:', '')}</p>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if} -->

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
					{status}
				</div>
			{/if}

			<div class="flex justify-center w-full">
				{#if !isCallActive}
					<button
						class="btn variant-ghost-primary"
						on:click={startCall}
						disabled={status === 'connecting'}
					>
						{status === 'connecting' ? 'Connecting...' : 'Start Call'}
					</button>
				{:else}
					<button class="btn variant-ghost-error" on:click={endCall}> Stop </button>
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
