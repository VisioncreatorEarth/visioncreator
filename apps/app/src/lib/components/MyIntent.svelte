<script lang="ts">
	import { fade } from 'svelte/transition';
	import { derived } from 'svelte/store';
	import { createEventDispatcher, onMount } from 'svelte';
	import { createMachine, type MachineConfig } from '$lib/composables/svelteMachine';

	const dispatch = createEventDispatcher();
	let isLongPressActive = false;

	interface IntentContext {
		permissionState: 'prompt' | 'granted' | 'denied';
		permissionRequesting: boolean;
		isOpen: boolean;
	}

	const intentConfig: MachineConfig<IntentContext, string, string> = {
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

	const intentActions = {
		initializePermissions: async (context: IntentContext) => {
			try {
				const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
				context.permissionState = permissionStatus.state as 'prompt' | 'granted' | 'denied';

				permissionStatus.addEventListener('change', () => {
					context.permissionState = permissionStatus.state as 'prompt' | 'granted' | 'denied';
				});
			} catch (error) {
				// Handle error silently
			}
		},
		openModal: (context: IntentContext) => {
			context.isOpen = true;
		},
		requestMicrophonePermission: async (context: IntentContext) => {
			try {
				context.permissionRequesting = true;
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				stream.getTracks().forEach((track) => track.stop());
				context.permissionState = 'granted';
				machine.send('PERMISSION_GRANTED');
			} catch (error) {
				context.permissionState = 'denied';
				machine.send('PERMISSION_DENIED');
			} finally {
				context.permissionRequesting = false;
			}
		},
		startRecording: () => {
			// Implement recording logic
		},
		stopRecording: () => {
			// Implement stop recording logic
		},
		startProcessingTimer: () => {
			setTimeout(() => {
				machine.send('TIMEOUT');
			}, 2000);
		},
		cleanup: (context: IntentContext) => {
			context.isOpen = false;
		},
		closeModal: (context: IntentContext) => {
			context.isOpen = false;
		}
	};

	const intentGuards = {
		isPermissionGranted: (context: IntentContext) => context.permissionState === 'granted',
		isPermissionNotGranted: (context: IntentContext) => context.permissionState !== 'granted'
	};

	export let onRecordingStateChange: (isRecording: boolean, isProcessing: boolean) => void;

	const machine = createMachine(intentConfig, intentActions, intentGuards);
	const currentState = derived(machine, ($machine) => $machine.value);
	const context = derived(machine, ($machine) => $machine.context);

	$: if ($currentState) {
		const isRecording = $currentState === 'recording';
		const isProcessing = $currentState === 'processing';
		onRecordingStateChange(isRecording, isProcessing);
	}

	export const handleLongPressStart = () => {
		isLongPressActive = true;
		machine.send('LONG_PRESS');
	};

	export const handleLongPressEnd = () => {
		isLongPressActive = false;
		machine.send('RELEASE');
	};

	onMount(() => {
		// Initial setup happens automatically through machine initialization
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
