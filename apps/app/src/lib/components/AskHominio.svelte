<!-- AskHominio.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { createMutation } from '$lib/wundergraph';
	import { createMachine } from '$lib/composables/svelteMachine';
	import OShoppingItems from './o-ShoppingItems.svelte';

	// Create updateShoppingList mutation
	const addItemsMutation = createMutation({
		operationName: 'addItemsToShoppingList'
	});

	// Shopping list client tool implementation
	let currentItems: any[] = [];
	let addedItems: any[] = [];
	let removedItems: any[] = [];

	const updateShoppingListTool = async (parameters: any) => {
		try {
			// Handle double-stringified JSON
			let itemsArray;
			if (typeof parameters.items === 'string') {
				const parsed = JSON.parse(parameters.items);
				itemsArray = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
			} else {
				itemsArray = parameters.items;
			}

			// Group items by action
			addedItems = itemsArray.filter((item: any) => item.action === 'add');
			removedItems = itemsArray.filter((item: any) => item.action === 'remove');

			// Update display items
			currentItems = [...addedItems, ...removedItems];

			// Process added items
			if (addedItems.length > 0) {
				await $addItemsMutation.mutateAsync({
					action: 'add',
					items: addedItems.map((item: any) => ({
						name: item.name,
						category: item.category,
						quantity: parseFloat(item.quantity) || 1,
						unit: item.unit,
						icon: item.icon
					}))
				});
			}

			// Process removed items
			if (removedItems.length > 0) {
				await $addItemsMutation.mutateAsync({
					action: 'remove',
					items: removedItems.map((item: any) => ({
						name: item.name,
						category: item.category
					}))
				});
			}

			return 'Items updated successfully';
		} catch (error) {
			console.error('Error updating shopping list:', error);
			throw new Error('Failed to process shopping list items');
		}
	};

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
					const session = new UltravoxSession({
						joinUrl: result.joinUrl,
						transcriptOptional: false,
						experimentalMessages: new Set(['debug', 'status', 'transcripts', 'speaking']),
						webSocketConfig: {
							reconnect: true,
							maxRetries: 3,
							retryDelay: 1000
						}
					});

					// Register the shopping list tool
					session.registerToolImplementation('updateShoppingList', updateShoppingListTool);

					context.session = session;

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
					}, 200000);
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
					// First end the call and handle transcript
					const endResponse = await $askHominioMutation.mutateAsync({
						action: 'end',
						callId: context.currentCallId
					});
					console.log('End call response:', endResponse);

					// Then ensure we leave the call session
					if (context.session) {
						await context.session.leaveCall();
					}
				} catch (e) {
					context.error = e instanceof Error ? e.message : 'Failed to end call';
					console.error('Error ending call:', e);
				} finally {
					// Always clean up the context
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
	export let showControls: boolean = true; // Default to showing controls

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

<div class="flex fixed inset-0 z-50 flex-col justify-end backdrop-blur-xl bg-surface-900/ghost">
	<div class="relative mx-auto mb-20 w-full max-w-2xl">
		<div
			class="overflow-y-auto absolute inset-x-0 bottom-0 px-4"
			style="max-height: calc(100vh - 120px);"
		>
			<div class="space-y-3">
				<!-- Commenting out transcriptions UI for now
				{#if transcripts.length > 0}
					<div class="p-4 rounded-xl backdrop-blur-xl bg-tertiary-200/10">
						{#each transcripts as transcript}
							<div class="flex flex-col mb-3 last:mb-0">
								<div
									class="flex {transcript.speaker === 'agent' ? 'justify-start' : 'justify-end'}"
								>
									<div
										class="rounded-lg p-3 max-w-[85%] {transcript.speaker === 'agent'
											? 'bg-tertiary-500/20'
											: 'bg-primary-500/20'}"
									>
										<p class="text-sm font-medium text-tertiary-200">
											{transcript.speaker === 'agent' ? 'Assistant' : 'You'}
										</p>
										<p class="text-sm text-tertiary-200/80">{transcript.text}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				-->

				{#if currentItems.length > 0}
					<div class="p-4 rounded-xl backdrop-blur-xl bg-tertiary-200/10">
						{#if addedItems.length > 0}
							<div class="mb-4">
								<h3 class="mb-2 text-sm font-medium text-tertiary-200">Items to Add:</h3>
								<OShoppingItems items={addedItems} />
							</div>
						{/if}

						{#if removedItems.length > 0}
							<div>
								<h3 class="mb-2 text-sm font-medium text-tertiary-200">Items to Remove:</h3>
								<OShoppingItems items={removedItems.map(item => ({ ...item, is_checked: false }))} />
							</div>
						{/if}
					</div>
				{/if}

				{#if error}
					<div class="p-4 rounded-xl backdrop-blur-xl bg-error-500/10">
						<p class="text-sm text-error-400">{error}</p>
					</div>
				{/if}

				<div class="p-4 rounded-xl backdrop-blur-xl bg-tertiary-200/10">
					{#if status !== 'disconnected'}
						<div class="flex justify-center">
							<div
								class="inline-flex items-center px-4 py-2 text-sm rounded-full text-tertiary-200 bg-tertiary-500/20"
							>
								<span class="flex relative mr-2 w-2 h-2">
									<span
										class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-tertiary-400"
									/>
									<span class="inline-flex relative w-2 h-2 rounded-full bg-tertiary-500" />
								</span>
								{displayStatus}
							</div>
						</div>
					{/if}

					{#if showControls}
						<div class="flex justify-center mt-4">
							{#if !isCallActive}
								<button
									class="px-4 py-2 text-white rounded-lg bg-tertiary-500"
									on:click={() => machine.send('START')}
									disabled={status === 'connecting' || isLoading}
								>
									{status === 'connecting' ? 'Connecting...' : 'Start Call'}
								</button>
							{:else}
								<button
									class="px-4 py-2 text-white rounded-lg bg-error-500"
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
	</div>
</div>

<style>
</style>
