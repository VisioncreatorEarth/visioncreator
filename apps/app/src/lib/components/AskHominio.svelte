<!-- AskHominio.svelte -->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { createMutation } from '$lib/wundergraph';
	import { createMachine } from '$lib/composables/svelteMachine';
	import OShoppingItems from './ShoppingItems.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { view as meView } from '$lib/views/Leaderboard';
	import { view as hominioShopView } from '$lib/views/HominioShopWithMe';
	import { view as hominioDoView } from '$lib/views/HominioDoMe';
	import { view as hominioBankView } from '$lib/views/HominioBankMe';
	import { view as hominioHostView } from '$lib/views/HominioHostMe';
	import { toolStore } from '$lib/stores/toolStore';
	import { proposals } from '$lib/stores/proposalStore';

	// Subscribe to the tool store state
	$: ({ currentItems, addedItems, removedItems, pendingConfirmation } = $toolStore);

	// Define available views
	const views = [
		{
			metadata: {
				id: 'MyDashboard',
				name: 'MyDashboard',
				icon: 'mdi:account'
			},
			view: meView
		},
		{
			metadata: {
				id: 'HominioShop',
				name: 'HominioShop',
				icon: 'mdi:shopping'
			},
			view: hominioShopView
		},
		{
			metadata: {
				id: 'HominioDo',
				name: 'HominioDo',
				icon: 'mdi:clipboard-list'
			},
			view: hominioDoView
		},
		{
			metadata: {
				id: 'HominioBank',
				name: 'HominioBank',
				icon: 'mdi:bank'
			},
			view: hominioBankView
		},
		{
			metadata: {
				id: 'HominioHost',
				name: 'HominioHost',
				icon: 'mdi:server'
			},
			view: hominioHostView
		}
	];

	// Add back at the top of the script section, before the views definition:
	const askHominioMutation = createMutation({
		operationName: 'askHominio'
	});

	// Handle view updates
	function handleViewUpdate(event: CustomEvent) {
		const viewId = event.detail?.viewId;
		const selectedView = views.find((v) => v.metadata.id === viewId);
		if (selectedView) {
			// Use routing to switch views
			if (browser) {
				goto(`/me?view=${selectedView.metadata.id}`, { replaceState: true });
			}
		}
	}

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

					// Register the tool implementations
					session.registerToolImplementation('updateShoppingList', toolStore.updateShoppingList);
					session.registerToolImplementation('switchView', toolStore.switchView);
					session.registerToolImplementation('updateName', toolStore.updateName);
					session.registerToolImplementation('createProposal', toolStore.createProposal);

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

					// Update the tool registration to handle confirmation responses better
					session.registerToolImplementation('updateName', async (params) => {
						try {
							const response = await toolStore.updateName(params);

							if (response?.status === 'awaiting_confirmation') {
								return {
									status: 'pending',
									message: response.message
								};
							} else if (response?.status === 'pending_update') {
								// Handle case where confirmation is already showing but can be updated
								if (pendingConfirmation?.updateParams) {
									pendingConfirmation.updateParams(params);
								}
								return {
									status: 'pending',
									message: response.message
								};
							}
							return response;
						} catch (error) {
							return {
								status: 'error',
								message: error.message
							};
						}
					});

					// Add event listener for tool confirmations with better messaging
					context.session.addEventListener('tool:confirmation:completed', (event) => {
						const { success, action, data, error, cancelled } = event.detail;

						if (cancelled) {
							context.session.sendMessage({
								role: 'system',
								content: `The ${action.toLowerCase()} was cancelled. Would you like to try again?`
							});
						} else if (action === 'createProposal') {
							// Always treat proposal creation as success since we handle errors separately
							context.session.sendMessage({
								role: 'system',
								content: `Great! I've created your proposal. You can find it in the Ideas section. Would you like to create another proposal?`
							});
						} else if (success) {
							context.session.sendMessage({
								role: 'system',
								content: `The ${action.toLowerCase()} was successful. What would you like to do next?`
							});
						} else if (error) {
							context.session.sendMessage({
								role: 'system',
								content: `Sorry, there was an error: ${error?.message || 'Unknown error'}`
							});
						}
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

		// Reset tool store state
		toolStore.reset();

		// Notify parent component
		onCallEnd();
	}

	onDestroy(() => {
		// Always ensure cleanup happens on destroy
		if (!isCleaningUp) {
			cleanupCall();
		}
	});

	// Handle confirmation actions
	function handleConfirm() {
		toolStore.confirmAction();
	}

	function handleCancel() {
		toolStore.cancelAction();
	}
</script>

<div class="fixed inset-0 z-50 flex flex-col justify-end">
	<div class="absolute inset-0 -z-10 bg-surface-900/10" />
	<div class="fixed bottom-0 left-0 right-0 z-30 pointer-events-none gradient-overlay">
		<div
			class="absolute inset-0 bg-gradient-to-t to-transparent from-surface-900 via-surface-900/50"
		/>
	</div>
	<div class="relative w-full max-w-2xl mx-auto mb-20">
		<div
			class="absolute inset-x-0 bottom-0 z-40 px-4 overflow-y-auto"
			style="max-height: calc(100vh - 120px);"
		>
			<div class="space-y-3">
				{#if pendingConfirmation}
					<div class="z-50 p-8 text-center rounded-xl backdrop-blur-xl bg-surface-400/10">
						<h2 class="text-3xl font-bold text-tertiary-200">{pendingConfirmation.title}</h2>
						<p class="mt-3 text-lg text-tertiary-200/80">{pendingConfirmation.message}</p>
						<div class="flex justify-center gap-4 mt-6">
							<button
								class="btn variant-ghost-tertiary btn-lg @3xl:btn-xl rounded-full"
								on:click={handleCancel}
							>
								Cancel
							</button>
							<button
								class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-lg @3xl:btn-xl rounded-full"
								on:click={handleConfirm}
							>
								Confirm
							</button>
						</div>
					</div>
				{/if}

				{#if currentItems.length > 0}
					<div class="z-50 p-4 rounded-xl backdrop-blur-xl bg-surface-400/10">
						{#if addedItems.length > 0}
							<div class="mb-4">
								<h3 class="mb-2 text-sm font-medium text-tertiary-300">Added</h3>
								<ShoppingItems items={addedItems} />
							</div>
						{/if}

						{#if removedItems.length > 0}
							<div>
								<h3 class="mb-2 text-sm font-medium text-tertiary-300">Removed</h3>
								<ShoppingItems
									items={removedItems.map((item) => ({ ...item, is_checked: true }))}
								/>
							</div>
						{/if}
					</div>
				{/if}

				{#if error}
					<div class="p-4 rounded-xl backdrop-blur-xl bg-surface-400/10">
						<p class="text-sm text-error-400">{error}</p>
					</div>
				{/if}

				<div class="relative z-50 p-4 rounded-xl backdrop-blur-xl bg-surface-400/10">
					{#if status !== 'disconnected'}
						<div class="flex justify-center">
							<div
								class="inline-flex items-center px-4 py-2 text-sm rounded-full text-tertiary-200 bg-tertiary-500/20"
							>
								<span class="relative flex w-2 h-2 mr-2">
									<span
										class="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-tertiary-400"
									/>
									<span class="relative inline-flex w-2 h-2 rounded-full bg-tertiary-500" />
								</span>
								{displayStatus}
							</div>
						</div>
					{/if}

					{#if showControls}
						<div class="z-50 flex justify-center mt-4">
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
	.gradient-overlay {
		height: 24rem; /* h-96 = 24rem */
	}

	@media (max-width: 768px) {
		.gradient-overlay {
			height: 12rem; /* Reduced height for mobile */
		}
	}
</style>
