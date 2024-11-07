<script lang="ts">
	import { fade } from 'svelte/transition';
	import { writable, derived } from 'svelte/store';
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher();
	let isLongPressActive = false;

	const stateMachineConfig = {
		id: 'intentMachine',
		initial: 'setup',
		context: {
			permissionState: 'prompt',
			permissionRequesting: false,
			isOpen: false
		},
		states: {
			setup: {
				entry: ['initializePermissions'],
				on: {
					PERMISSION_GRANTED: {
						target: 'idle'
					},
					INITIALIZED: {
						target: 'idle'
					}
				}
			},
			idle: {
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
						target: 'idle',
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

		const guards = {
			isPermissionGranted: (context) => {
				console.log('🔒 Checking permission state:', context.permissionState);
				return context.permissionState === 'granted';
			},
			isPermissionNotGranted: (context) => {
				console.log('🔒 Checking permission state:', context.permissionState);
				return context.permissionState !== 'granted';
			}
		};

		const actions = {
			initializePermissions: async () => {
				try {
					// First try to get existing permissions without prompting
					const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
					console.log('🎤 Checking initial permission state:', permissionStatus.state);

					// Immediately update context with current permission state
					update((state) => {
						state.context.permissionState = permissionStatus.state;
						return state;
					});

					// If already granted, transition to idle
					if (permissionStatus.state === 'granted') {
						console.log('✅ Microphone permission already granted');
						send('PERMISSION_GRANTED');
					} else {
						// Try to get microphone access silently (without prompt)
						try {
							console.log('🎤 Attempting silent microphone access...');
							const stream = await navigator.mediaDevices.getUserMedia({
								audio: true,
								// This option tries to prevent the permission prompt
								preferCurrentTab: true
							});

							// If we get here, permission was granted silently
							stream.getTracks().forEach((track) => track.stop());

							update((state) => {
								state.context.permissionState = 'granted';
								return state;
							});

							console.log('✅ Silent microphone access successful');
							send('PERMISSION_GRANTED');
						} catch (mediaError) {
							console.log('ℹ️ Silent microphone access failed, waiting for user interaction');
							send('INITIALIZED');
						}
					}

					// Set up permission change listener
					permissionStatus.addEventListener('change', () => {
						console.log('🔄 Permission state changed to:', permissionStatus.state);
						update((state) => {
							state.context.permissionState = permissionStatus.state;
							return state;
						});

						if (permissionStatus.state === 'granted') {
							send('PERMISSION_GRANTED');
						}
					});
				} catch (error) {
					console.error('❌ Error during permission initialization:', error);
					send('INITIALIZED');
				}
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
			openModal: () => {
				update((state) => {
					state.context.isOpen = true;
					return state;
				});
			},
			closeModal: () => {
				update((state) => {
					state.context.isOpen = false;
					return state;
				});
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

						transition.actions?.forEach((action) => actions[action]?.());

						const newStateConfig = state.config.states[target];
						const entryActions = newStateConfig?.entry || [];
						entryActions.forEach((action) => actions[action]?.());

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
			reset: () => set({ value: config.initial, context: config.context, config })
		};
	}

	export let onRecordingStateChange: (isRecording: boolean, isProcessing: boolean) => void;

	const machine = createMachineStore(stateMachineConfig);
	const currentState = derived(machine, ($machine) => $machine.value);
	const context = derived(machine, ($machine) => $machine.context);

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
		machine.send('INITIALIZED');
	});

	export const initialize = async () => {
		console.log('🚀 MyIntent initialization started');
		await machine.initialize();
		const state = machine.getState();
		console.log('✨ MyIntent initialized with permission state:', state.context.permissionState);
		return state.context.permissionState;
	};

	onMount(async () => {
		console.log('🔄 MyIntent component mounting...');
		await initialize();
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
