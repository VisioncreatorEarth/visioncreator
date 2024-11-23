<!-- AskHominio.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { createMutation } from '$lib/wundergraph';
	import { createMachine } from '$lib/composables/svelteMachine';

	const askHominioMutation = createMutation({
		operationName: 'askHominio'
	});

	// Machine context type
	type Context = {
		error: string | null;
		transcripts: any[];
		currentCallId: string | null;
		session: any | null;
		isLoading: boolean;
	};

	// Machine states type
	type State =
		| 'disconnected'
		| 'connecting'
		| 'idle'
		| 'listening'
		| 'thinking'
		| 'speaking'
		| 'disconnecting';

	// Machine events type
	type Event =
		| 'START'
		| 'CONNECTED'
		| 'ERROR'
		| 'DISCONNECT'
		| 'STATUS_CHANGED'
		| 'SPEAKING'
		| 'TRANSCRIPT';

	// Create the machine
	const machine = createMachine<Context, State, Event>(
		{
			id: 'call',
			initial: 'disconnected',
			context: {
				error: null,
				transcripts: [],
				currentCallId: null,
				session: null,
				isLoading: false
			},
			states: {
				disconnected: {
					on: {
						START: {
							target: 'connecting',
							actions: ['startCall']
						}
					}
				},
				connecting: {
					on: {
						CONNECTED: { target: 'idle' },
						ERROR: {
							target: 'disconnected',
							actions: ['handleError']
						}
					}
				},
				idle: {
					on: {
						STATUS_CHANGED: [
							{ target: 'listening', guard: 'isListening' },
							{ target: 'thinking', guard: 'isThinking' },
							{ target: 'speaking', guard: 'isSpeaking' }
						],
						DISCONNECT: {
							target: 'disconnecting',
							actions: ['endCall']
						}
					}
				},
				listening: {
					on: {
						STATUS_CHANGED: [
							{ target: 'idle', guard: 'isIdle' },
							{ target: 'thinking', guard: 'isThinking' },
							{ target: 'speaking', guard: 'isSpeaking' }
						],
						DISCONNECT: {
							target: 'disconnecting',
							actions: ['endCall']
						}
					}
				},
				thinking: {
					on: {
						STATUS_CHANGED: [
							{ target: 'idle', guard: 'isIdle' },
							{ target: 'listening', guard: 'isListening' },
							{ target: 'speaking', guard: 'isSpeaking' }
						],
						DISCONNECT: {
							target: 'disconnecting',
							actions: ['endCall']
						}
					}
				},
				speaking: {
					on: {
						STATUS_CHANGED: [
							{ target: 'idle', guard: 'isIdle' },
							{ target: 'listening', guard: 'isListening' },
							{ target: 'thinking', guard: 'isThinking' }
						],
						DISCONNECT: {
							target: 'disconnecting',
							actions: ['endCall']
						}
					}
				},
				disconnecting: {
					on: {
						STATUS_CHANGED: {
							target: 'disconnected',
							guard: 'isDisconnected'
						}
					}
				}
			}
		},
		{
			// Actions
			startCall: async (context) => {
				context.isLoading = true;
				context.error = null;
				context.transcripts = [];

				try {
					const result = await $askHominioMutation.mutateAsync({
						action: 'create'
					});

					if (!result?.joinUrl) {
						throw new Error('No join URL received');
					}

					context.currentCallId = result.callId;
					context.session = new UltravoxSession({
						joinUrl: result.joinUrl,
						transcriptOptional: false,
						experimentalMessages: new Set(['debug', 'status', 'transcripts', 'speaking']),
						webSocketConfig: {
							reconnect: true,
							maxRetries: 3,
							retryDelay: 1000
						}
					});

					// Client tool implementation for shopping list updates
					const updateShoppingList = async (parameters: any) => {
						try {
							console.log('Shopping list update received:', parameters.items);
							return {
								result: 'Shopping list updated (mock response)',
								responseType: 'success'
							};
						} catch (error) {
							console.error('Error in shopping list update:', error);
							return {
								result: 'Failed to update shopping list',
								responseType: 'error'
							};
						}
					};

					// Register shopping list tool
					context.session.registerToolImplementation('updateShoppingList', updateShoppingList);

					// Add event listeners
					context.session.addEventListener('status', (event) => {
						machine.send('STATUS_CHANGED');
					});

					context.session.addEventListener('transcripts', () => {
						const currentTranscripts = context.session?.transcripts || [];
						const finalTranscripts = currentTranscripts
							.filter((t: any) => t.isFinal && t.text)
							.map((t: any) => ({
								text: t.text,
								speaker: t.speaker
							}));

						if (finalTranscripts.length > context.transcripts.length) {
							context.transcripts = finalTranscripts;
						}
					});

					context.session.addEventListener('error', (event) => {
						context.error = event.detail.message || 'Unknown error occurred';
						machine.send('ERROR');
					});

					// Join the call with retry logic
					let retries = 0;
					const maxRetries = 3;

					while (retries < maxRetries) {
						try {
							await context.session.joinCall(result.joinUrl);
							machine.send('CONNECTED');
							break;
						} catch (error) {
							retries++;
							if (retries === maxRetries) {
								throw error;
							}
							await new Promise((resolve) => setTimeout(resolve, 1000));
						}
					}

					// Auto-close timer (20 seconds)
					setTimeout(() => {
						machine.send('DISCONNECT');
					}, 30000);
				} catch (e) {
					context.error =
						e instanceof Error ? e.message : 'Failed to start call. Please try again.';
					machine.send('ERROR');
					if (context.session) {
						context.session.leaveCall().catch(() => {});
						context.session = null;
					}
				} finally {
					context.isLoading = false;
				}
			},
			endCall: async (context) => {
				if (!context.currentCallId) return;

				try {
					await $askHominioMutation.mutateAsync({
						action: 'end',
						callId: context.currentCallId
					});

					if (context.session) {
						await context.session.leaveCall();
					}
				} catch (e) {
					context.error = e instanceof Error ? e.message : 'Failed to end call';
				} finally {
					context.currentCallId = null;
					context.session = null;
					context.transcripts = [];
				}
			},
			handleError: (context) => {
				if (context.session) {
					context.session.leaveCall().catch(() => {});
					context.session = null;
				}
				context.currentCallId = null;
				context.transcripts = [];
			}
		},
		{
			// Guards
			isIdle: (context) => context.session?.status === 'idle',
			isListening: (context) => context.session?.status === 'listening',
			isThinking: (context) => context.session?.status === 'thinking',
			isSpeaking: (context) => context.session?.status === 'speaking',
			isDisconnected: (context) => !context.session || context.session?.status === 'disconnected'
		}
	);

	// Reactive values from machine state
	$: ({ value: status, context } = $machine);
	$: isCallActive = ['idle', 'listening', 'thinking', 'speaking'].includes(status);
	$: ({ error, transcripts, isLoading } = context);

	// Helper for UI status display
	$: displayStatus = (() => {
		switch (status) {
			case 'connecting':
				return 'Connecting...';
			case 'idle':
				return 'Ready';
			case 'listening':
				return 'Listening';
			case 'thinking':
				return 'Thinking';
			case 'speaking':
				return 'Speaking';
			case 'disconnecting':
				return 'Disconnecting...';
			default:
				return 'Disconnected';
		}
	})();

	let isCleaningUp = false;

	export let session: any;
	export let onCallEnd: () => void = () => {};
	export let showControls: boolean = true;  // Default to showing controls

	// Create a method to start the call
	export function startCall() {
		machine.send('START');
	}

	// Create a method to stop the call
	export function stopCall() {
		if (isCleaningUp) return; // Prevent recursive calls
		isCleaningUp = true;
		
		machine.send('DISCONNECT');
		cleanupCall();
		
		isCleaningUp = false;
	}

	function cleanupCall() {
		if (context.session) {
			// Ensure we properly leave the call
			try {
				context.session.leaveCall().catch(() => {});
			} catch (e) {
				console.error('Error leaving call:', e);
			}
			context.session = null;
		}
		
		// Reset machine state
		machine.reset();
		
		// Notify parent component
		onCallEnd();
	}

	onDestroy(() => {
		// Always ensure cleanup happens on destroy
		if (!isCleaningUp) {
			cleanupCall();
		}
	});
</script>

<div class="fixed bottom-20 left-1/2 z-50 transform -translate-x-1/2">
	<div class="flex flex-col gap-4 items-center">
		{#if transcripts.length > 0}
			<div
				class="w-full max-w-md p-4 rounded-lg shadow-lg bg-surface-100-800-token overflow-y-auto max-h-[60vh]"
			>
				{#each transcripts as transcript}
					<div class="flex flex-col mb-3 last:mb-0">
						<div class="flex {transcript.speaker === 'agent' ? 'justify-start' : 'justify-end'}">
							<div
								class="variant-ghost-{transcript.speaker === 'agent'
									? 'tertiary'
									: 'primary'} rounded-lg p-3 max-w-[85%]"
							>
								<p class="text-sm font-medium">
									{transcript.speaker === 'agent' ? 'Assistant' : 'You'}
								</p>
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
			{#if status !== 'disconnected'}
				<div
					class="inline-flex items-center px-4 py-2 text-sm rounded-full shadow-inner text-tertiary-200 bg-surface-700"
				>
					<span class="flex relative mr-2 w-2 h-2">
						<span
							class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-tertiary-400"
						/>
						<span class="inline-flex relative w-2 h-2 rounded-full bg-tertiary-500" />
					</span>
					{displayStatus}
				</div>
			{/if}

			{#if showControls}
				<div class="flex justify-center w-full">
					{#if !isCallActive}
						<button
							class="btn variant-ghost-primary"
							on:click={() => machine.send('START')}
							disabled={status === 'connecting' || isLoading}
						>
							{status === 'connecting' ? 'Connecting...' : 'Start Call'}
						</button>
					{:else}
						<button
							class="btn variant-ghost-error"
							on:click={() => machine.send('DISCONNECT')}
							disabled={status === 'disconnecting'}
						>
							{status === 'disconnecting' ? 'Disconnecting...' : 'Stop'}
						</button>
					{/if}
				</div>
			{/if}
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
