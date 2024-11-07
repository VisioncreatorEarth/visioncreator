<script lang="ts">
	import { fade } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// State Machine Configuration
	const stateMachineConfig = {
		id: 'intentMachine',
		initial: 'idle',
		states: {
			idle: {
				on: {
					LONG_PRESS: {
						target: 'recording',
						actions: ['startRecording']
					}
				}
			},
			recording: {
				on: {
					RELEASE: {
						target: 'processing',
						actions: ['startProcessing']
					}
				}
			},
			processing: {
				on: {
					TIMEOUT: {
						target: 'idle',
						actions: ['cleanup']
					}
				},
				entry: ['startProcessingTimer']
			}
		}
	};

	// State Machine Store Implementation
	function createMachineStore(config) {
		const { subscribe, set, update } = writable({
			value: config.initial,
			context: {},
			config
		});

		// Action handlers
		const actions = {
			startRecording: () => {
				console.log('🎤 Recording started');
				isOpen = true;
			},
			startProcessing: () => {
				console.log('⚡ Processing started');
			},
			startProcessingTimer: () => {
				setTimeout(() => {
					send('TIMEOUT');
				}, 3000);
			},
			cleanup: () => {
				console.log('🧹 Cleaning up');
				isOpen = false;
				set({
					value: config.initial,
					context: {},
					config
				});
			}
		};

		// Send events to the machine
		function send(event) {
			update((state) => {
				const currentStateConfig = state.config.states[state.value];
				const transition = currentStateConfig?.on?.[event];

				if (transition) {
					console.log(`🔄 State transition: ${state.value} -> ${transition.target}`);

					transition.actions?.forEach((action) => actions[action]?.());

					const newStateConfig = state.config.states[transition.target];
					const entryActions = newStateConfig?.entry || [];
					entryActions.forEach((action) => actions[action]?.());

					return {
						...state,
						value: transition.target
					};
				}
				return state;
			});
		}

		return {
			subscribe,
			send,
			getState: () => {
				let currentState;
				subscribe((state) => {
					currentState = state;
				})();
				return currentState;
			},
			reset: () => set({ value: config.initial, context: {}, config })
		};
	}

	// Props
	export let isOpen = false;
	export let onRecordingStateChange: (isRecording: boolean, isProcessing: boolean) => void;

	// Create machine instance
	const machine = createMachineStore(stateMachineConfig);

	// Derived states for UI
	const currentState = derived(machine, ($machine) => $machine.value);

	// Watch state changes and notify parent
	$: if ($currentState) {
		const isRecording = $currentState === 'recording';
		const isProcessing = $currentState === 'processing';
		console.log('Current state:', $currentState);
		onRecordingStateChange(isRecording, isProcessing);
	}

	// Exported methods for ActionModal
	export const handleLongPressStart = async () => {
		console.log('🎤 Long press started');
		machine.send('LONG_PRESS');
	};

	export const handleLongPressEnd = async () => {
		console.log('🎤 Long press ended');
		machine.send('RELEASE');
	};
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-surface-900/30 backdrop-blur-xl"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full max-w-lg p-8 mx-4 mb-24 border rounded-xl bg-tertiary-200/10 backdrop-blur-xl border-tertiary-200/20"
		>
			{#if $currentState === 'recording'}
				<div class="text-center">
					<div class="mb-4">
						<svg
							class="w-12 h-12 mx-auto text-tertiary-200"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
							/>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-tertiary-200">Recording...</h2>
					<p class="mt-2 text-tertiary-200/80">Release to process your request</p>
				</div>
			{:else if $currentState === 'processing'}
				<div class="text-center">
					<div class="mb-4">
						<svg
							class="w-12 h-12 mx-auto text-tertiary-200 animate-spin"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-tertiary-200">Processing...</h2>
					<p class="mt-2 text-tertiary-200/80">Please wait...</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
