<script lang="ts">
	import { fade } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();
	let isLongPressActive = false;

	const stateMachineConfig = {
		id: 'intentMachine',
		initial: 'init',
		context: {
			permissionState: 'prompt',
			permissionRequesting: false,
			isOpen: false
		},
		states: {
			init: {
				entry: ['initializePermissions'],
				on: {
					LONG_PRESS: [
						{
							target: 'recording',
							guard: 'isPermissionGranted',
							actions: ['openModal', 'startRecording']
						},
						{
							target: 'requestPermissions',
							guard: 'isPermissionNotGranted',
							actions: ['openModal']
						}
					]
				}
			},
			requestPermissions: {
				entry: ['openModal', 'requestMicrophonePermission'],
				on: {
					PERMISSION_GRANTED: {
						target: 'readyToRecord'
					},
					PERMISSION_DENIED: {
						target: 'permissionBlocked'
					}
				}
			},
			permissionBlocked: {
				entry: ['openModal'],
				on: {
					TRY_AGAIN: {
						target: 'requestPermissions',
						actions: ['requestMicrophonePermission']
					}
				}
			},
			readyToRecord: {
				entry: ['openModal'],
				on: {
					LONG_PRESS: {
						target: 'recording'
					}
				}
			},
			recording: {
				entry: ['openModal', 'startRecording'],
				exit: ['stopRecording'],
				on: {
					RELEASE: {
						target: 'processing'
					}
				}
			},
			processing: {
				entry: ['startProcessingTimer', 'openModal'],
				exit: ['closeModal'],
				on: {
					TIMEOUT: {
						target: 'init',
						actions: ['cleanup']
					}
				}
			}
		}
	};

	function createMachineStore(config) {
		const { subscribe, set, update } = writable({
			value: config.initial,
			context: config.context,
			config
		});

		const actions = {
			initializePermissions: async () => {
				console.log('🎯 initializePermissions action started');
				try {
					const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
					console.log('🎤 Checking initial permission state:', permissionStatus.state);

					update((state) => {
						state.context.permissionState = permissionStatus.state;
						return state;
					});

					permissionStatus.addEventListener('change', () => {
						console.log('🔄 Permission state changed to:', permissionStatus.state);
						update((state) => {
							state.context.permissionState = permissionStatus.state;
							return state;
						});
					});
				} catch (error) {
					console.error('❌ Error during permission initialization:', error);
				} finally {
					console.log('✅ initializePermissions action completed');
				}
			},
			openModal: () => {
				update((state) => {
					state.context.isOpen = true;
					return state;
				});
			},
			requestMicrophonePermission: async () => {
				try {
					update((state) => {
						state.context.permissionRequesting = true;
						return state;
					});

					console.log('🎤 Explicitly requesting microphone permission...');
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					stream.getTracks().forEach((track) => track.stop());

					update((state) => {
						state.context.permissionState = 'granted';
						return state;
					});

					console.log('✅ Microphone permission explicitly granted');
					send('PERMISSION_GRANTED');
				} catch (error) {
					console.error('❌ Permission request failed:', error);
					update((state) => {
						state.context.permissionState = 'denied';
						return state;
					});
					send('PERMISSION_DENIED');
				} finally {
					update((state) => {
						state.context.permissionRequesting = false;
						return state;
					});
				}
			},
			startRecording: () => {
				console.log('🎤 Recording started');
			},
			stopRecording: () => {
				console.log('🛑 Recording stopped');
			},
			startProcessingTimer: () => {
				setTimeout(() => {
					send('TIMEOUT');
				}, 2000);
			},
			cleanup: () => {
				console.log('🧹 Cleaning up');
				update((state) => {
					state.context.isOpen = false;
					return state;
				});
			}
		};

		const guards = {
			isPermissionGranted: (context) => {
				console.log('🔒 Permission check:', context.permissionState);
				return context.permissionState === 'granted';
			},
			isPermissionNotGranted: (context) => {
				console.log('🔒 Permission check:', context.permissionState);
				return context.permissionState !== 'granted';
			}
		};

		console.log('🚀 Initializing machine with state:', config.initial);
		const initialStateConfig = config.states[config.initial];
		if (initialStateConfig?.entry) {
			console.log('📥 Running entry actions for initial state:', initialStateConfig.entry);
			initialStateConfig.entry.forEach((actionName) => {
				console.log('⚡ Executing entry action:', actionName);
				actions[actionName]?.();
			});
		}

		function send(event) {
			update((state) => {
				const currentStateConfig = state.config.states[state.value];
				const transitions = currentStateConfig?.on?.[event];

				if (transitions) {
					const transition = Array.isArray(transitions)
						? transitions.find((t) => guards[t.guard]?.(state.context) ?? true)
						: transitions;

					if (transition) {
						const target = transition.target;
						console.log(`🔄 State transition: ${state.value} -> ${target}`);

						const exitActions = currentStateConfig?.exit || [];
						exitActions.forEach((action) => {
							console.log('📤 Executing exit action:', action);
							actions[action]?.();
						});

						transition.actions?.forEach((action) => {
							console.log('➡️ Executing transition action:', action);
							actions[action]?.();
						});

						const newStateConfig = state.config.states[target];
						const entryActions = newStateConfig?.entry || [];
						entryActions.forEach((action) => {
							console.log('📥 Executing entry action:', action);
							actions[action]?.();
						});

						return {
							...state,
							value: target
						};
					}
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
			reset: () => {
				console.log('🔄 Resetting machine to initial state');
				set({ value: config.initial, context: config.context, config });
				const initialStateConfig = config.states[config.initial];
				initialStateConfig?.entry?.forEach((actionName) => {
					console.log('⚡ Executing entry action on reset:', actionName);
					actions[actionName]?.();
				});
			}
		};
	}

	export let onRecordingStateChange: (isRecording: boolean, isProcessing: boolean) => void;

	const machine = createMachineStore(stateMachineConfig);
	console.log('📦 Machine created with initial state:', machine.getState().value);
	const currentState = derived(machine, ($machine) => $machine.value);
	const context = derived(machine, ($machine) => $machine.context);

	$: if ($currentState) {
		console.log('🔍 State changed to:', $currentState, 'Context:', $context);
	}

	$: if ($currentState) {
		const isRecording = $currentState === 'recording';
		const isProcessing = $currentState === 'processing';
		console.log('Current state:', $currentState);
		onRecordingStateChange(isRecording, isProcessing);
	}

	export const handleLongPressStart = async () => {
		console.log('🎤 Long press started');
		isLongPressActive = true;

		// Always send LONG_PRESS event, let the state machine handle the logic
		machine.send('LONG_PRESS');
	};

	export const handleLongPressEnd = async () => {
		console.log('🎤 Long press ended');
		isLongPressActive = false;
		machine.send('RELEASE');
	};

	// Use the setup function on mount
	onMount(() => {
		console.log('🔄 MyIntent component mounting...');
		// No need to send any events, entry actions will run automatically
	});
</script>

{#if $context.isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-surface-900/30 backdrop-blur-xl"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="w-full max-w-lg p-8 mx-4 mb-24 border rounded-xl bg-tertiary-200/10 backdrop-blur-xl border-tertiary-200/20"
		>
			{#if $currentState === 'requestPermissions'}
				<div class="text-center">
					<div class="mb-4 text-4xl">🎤</div>
					<h2 class="text-2xl font-bold text-tertiary-200">Microphone Access Required</h2>
					<p class="mt-2 text-tertiary-200/80">Please allow microphone access to continue.</p>
				</div>
			{:else if $currentState === 'permissionBlocked'}
				<div class="text-center">
					<div class="mb-4 text-4xl">🚫</div>
					<h2 class="text-2xl font-bold text-tertiary-200">Microphone Access Blocked</h2>
					<p class="mt-2 text-tertiary-200/80">
						Please enable microphone access in your browser settings.
					</p>
					<div class="text-sm text-tertiary-200/60">
						<p>How to enable:</p>
						<ol class="mt-2 text-left list-decimal list-inside">
							<li>Click the lock icon in your browser's address bar</li>
							<li>Find "Microphone" in the permissions list</li>
							<li>Change the setting to "Allow"</li>
							<li>Refresh the page</li>
						</ol>
					</div>
				</div>
			{:else if $currentState === 'readyToRecord'}
				<div class="text-center">
					<div class="mb-4 text-4xl">🎤</div>
					<h2 class="text-2xl font-bold text-tertiary-200">Ready to Record</h2>
					<p class="mt-2 text-tertiary-200/80">Press and hold to start recording.</p>
				</div>
			{:else if $currentState === 'recording'}
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
