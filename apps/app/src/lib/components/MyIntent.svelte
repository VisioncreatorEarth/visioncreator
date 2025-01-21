<script lang="ts">
	import { fade } from 'svelte/transition';
	import { derived } from 'svelte/store';
	import { onDestroy, onMount } from 'svelte';
	import { createMachine, type MachineConfig } from '$lib/composables/svelteMachine';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { eventBus } from '$lib/composables/eventBus';
	import AskHominio from './AskHominio.svelte';

	export let session: any;
	export let onRecordingStateChange: (isRecording: boolean, isProcessing: boolean) => void;

	let isLongPressActive = false;
	let askHominioComponent: any;

	const checkCapabilities = createQuery({
		operationName: 'checkCapabilities',
		enabled: false
	});

	let requestStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
	let requestMessage = '';

	const sendMailMutation = createMutation({
		operationName: 'sendMail'
	});

	async function handleRequestMinutes() {
		if (!session?.user?.id) return;

		requestStatus = 'loading';
		try {
			await $sendMailMutation.mutateAsync({
				id: session.user.id,
				subject: 'Requesting Minutes',
				body: 'Would love to have some more minutes'
			});

			requestStatus = 'success';
			requestMessage =
				"We'll respond back to you by mail during the next 48 working hours, giving you more minutes to play with Hominio (might be slower during christmas and new year)";

			setTimeout(() => {
				machine.send('CLOSE');
				requestStatus = 'idle';
				requestMessage = '';
			}, 5000);
		} catch (error) {
			requestStatus = 'error';
			requestMessage = 'Failed to send request. Please try again later.';
			console.error('Failed to send email:', error);
		}
	}

	interface IntentContext {
		permissionState: 'prompt' | 'granted' | 'denied';
		permissionRequesting: boolean;
		isOpen: boolean;
		callState: {
			duration: number;
			status: 'connecting' | 'active' | 'ending';
			systemPrompt: string;
		};
	}

	const intentConfig: MachineConfig<IntentContext> = {
		id: 'intentMachine',
		initial: 'init',
		context: {
			permissionState: 'prompt',
			permissionRequesting: false,
			isOpen: false,
			callState: {
				duration: 0,
				status: 'connecting',
				systemPrompt: 'You are a friendly AI assistant. Keep your responses brief and clear.'
			}
		},
		states: {
			init: {
				entry: ['initializePermissions', 'closeModal'],
				on: {
					LONG_PRESS: [
						{
							target: 'calling',
							guard: 'isPermissionGranted',
							actions: ['startNewConversation', 'openModal']
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
						target: 'readyToCall',
						actions: ['openModal']
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
			readyToCall: {
				entry: ['openModal'],
				on: {
					LONG_PRESS: {
						target: 'calling',
						actions: ['startNewConversation']
					},
					CLOSE: {
						target: 'init',
						actions: ['cleanup']
					}
				}
			},
			calling: {
				entry: ['openModal'],
				on: {
					END_CALL: {
						target: 'init',
						actions: ['cleanup']
					},
					WAITINGLIST: {
						target: 'waitinglist',
						actions: ['cleanup']
					},
					PAYWALL_ERROR: {
						target: 'paywall',
						actions: ['cleanup']
					}
				}
			},
			paywall: {
				entry: ['openModal'],
				on: {
					CLOSE: {
						target: 'init',
						actions: ['cleanup']
					},
					UPGRADE: {
						target: 'init',
						actions: ['navigateToUpgrade']
					}
				}
			},
			waitinglist: {
				entry: ['openModal'],
				on: {
					CLOSE: {
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
				context.permissionState = permissionStatus.state;
				permissionStatus.addEventListener('change', () => {
					context.permissionState = permissionStatus.state;
				});
			} catch (error) {
				console.error('Error querying permissions:', error);
				context.permissionState = 'prompt';
			}
		},
		requestMicrophonePermission: async (context: IntentContext) => {
			context.permissionRequesting = true;
			try {
				// Just check permission without keeping the stream
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				// Immediately stop the test stream
				stream.getTracks().forEach((track) => track.stop());
				context.permissionState = 'granted';
				machine.send('PERMISSION_GRANTED');
			} catch (error) {
				console.error('Error requesting microphone permission:', error);
				context.permissionState = 'denied';
				machine.send('PERMISSION_DENIED');
			} finally {
				context.permissionRequesting = false;
			}
		},
		startNewConversation: async () => {
			try {
				const result = await $checkCapabilities.refetch();
				console.log('Frontend - Capability check result:', result.data);

				if (result.data?.status === 'NO_CAPABILITY') {
					console.log('Frontend - No capability');
					machine.send('WAITINGLIST');
					return;
				}

				if (result.data?.status === 'NO_MINUTES') {
					console.log('Frontend - No minutes available');
					machine.send('PAYWALL_ERROR');
					return;
				}

				if (result.data?.status === 'OK') {
					console.log('Frontend - Remaining minutes:', result.data.remainingMinutes);
					if (result.data.remainingMinutes < 0.1667) {
						console.log('Frontend - Less than 10 seconds remaining');
						machine.send('PAYWALL_ERROR');
						return;
					}
					// The conversation will be handled by AskHominio component
					return;
				}
			} catch (error) {
				console.error('Frontend - Error checking capabilities:', error);
				machine.send('END_CALL');
			}
		},
		cleanup: (context: IntentContext) => {
			// Don't call stopCall here since it will be triggered by state change
			context.callState.status = 'connecting';
			context.callState.duration = 0;
			context.isOpen = false;
		},
		closeModal: (context: IntentContext) => {
			context.isOpen = false;
		},
		openModal: (context: IntentContext) => {
			context.isOpen = true;
		},
		navigateToUpgrade: () => {
			window.location.href = '/me/subscriptions';
		}
	};

	const intentGuards = {
		isPermissionGranted: (context: IntentContext) => context.permissionState === 'granted',
		isPermissionNotGranted: (context: IntentContext) => context.permissionState !== 'granted'
	};

	const machine = createMachine(intentConfig, intentActions, intentGuards);
	const currentState = derived(machine, ($machine) => $machine.value);
	const context = derived(machine, ($machine) => $machine.context);

	// Mock call duration timer
	let durationInterval: ReturnType<typeof setInterval>;

	$: if ($currentState === 'calling' && !durationInterval) {
		// Start duration timer when entering calling state
		durationInterval = setInterval(() => {
			machine.getState().context.callState.duration += 1;
		}, 1000);
	} else if ($currentState !== 'calling' && durationInterval) {
		// Clear timer when leaving calling state
		clearInterval(durationInterval);
		durationInterval = undefined;
	}

	$: if ($currentState === 'calling' && askHominioComponent) {
		askHominioComponent.startCall();
	}

	$: if ($currentState !== 'calling' && askHominioComponent) {
		askHominioComponent.stopCall();
	}

	// Format duration as mm:ss
	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	$: {
		const isRecording = $currentState === 'calling';
		const isProcessing = false;
		onRecordingStateChange(isRecording, isProcessing);
	}

	function handleModalClose() {
		machine.send('CLOSE');
		requestStatus = 'idle';
		requestMessage = '';
	}

	export const handleLongPressStart = () => {
		isLongPressActive = true;
		machine.send('LONG_PRESS');
	};

	export const handleLongPressEnd = () => {
		isLongPressActive = false;
		// Don't end the call on release anymore
	};

	let warningTimeout: NodeJS.Timeout;
	let warningMessage = '';

	function showWarning(message: string) {
		warningMessage = message;
		warningTimeout = setTimeout(() => {
			warningMessage = '';
		}, 3000);
	}

	function handleVisibilityChange() {
		if (document.hidden && $currentState === 'calling') {
			showWarning('Call will end if you leave this page');
			// Give user a moment to return
			setTimeout(() => {
				if (document.hidden && $currentState === 'calling') {
					console.log('Page hidden, ending call...');
					machine.send('END_CALL');
				}
			}, 1000);
		}
	}

	function handleBlur() {
		if ($currentState === 'calling') {
			console.log('Window blurred, ending call...');
			machine.send('END_CALL');
		}
	}

	onMount(() => {
		const handleStateChange = (event: string) => {
			machine.send(event);
		};

		eventBus.on('intent:stateChange', handleStateChange);

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('blur', handleBlur);

		return () => {
			eventBus.off('intent:stateChange', handleStateChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('blur', handleBlur);
		};
	});

	export function stopCall() {
		if ($currentState === 'calling') {
			machine.send('END_CALL');
		}
	}
</script>

{#if $context.isOpen}
	<div
		class="flex fixed inset-0 z-50 flex-col justify-end"
		transition:fade={{ duration: 200 }}
		on:click|self={handleModalClose}
	>
		<!-- Separate backdrop div with iOS-compatible blur -->
		<div class="absolute inset-0 -z-10 bg-surface-900/10" />
		{#if $currentState === 'calling'}
			<AskHominio
				bind:this={askHominioComponent}
				bind:session
				onCallEnd={() => machine.send('END_CALL')}
				showControls={false}
			/>
		{:else}
			<div class="relative mx-auto mb-20 w-full max-w-4xl">
				<div
					class="overflow-y-auto absolute inset-x-0 bottom-0 px-4"
					style="max-height: calc(100vh - 120px);"
				>
					<div class="space-y-3">
						<div class="rounded-xl backdrop-blur-xl bg-surface-400/10">
							{#if $currentState === 'requestPermissions'}
								<div class="p-6 text-center">
									<div class="mb-4 text-4xl">🎤</div>
									<h2 class="text-2xl font-bold text-tertiary-200">Microphone Access Required</h2>
									<p class="mt-2 text-tertiary-200/80">
										Please allow microphone access to continue
									</p>
								</div>
							{:else if $currentState === 'permissionBlocked'}
								<div class="p-6 text-center">
									<div class="mb-4 text-4xl">🚫</div>
									<h2 class="text-2xl font-bold text-tertiary-200">Microphone Access Blocked</h2>
									<p class="mt-2 text-tertiary-200/80">
										Please enable microphone access in your browser settings and try again
									</p>
									<button
										class="btn variant-ghost-tertiary btn-md @3xl:btn-lg rounded-full"
										on:click={() => machine.send('TRY_AGAIN')}
									>
										Try Again
									</button>
								</div>
							{:else if $currentState === 'readyToCall'}
								<div class="p-4 text-center">
									<div class="mb-4 text-4xl">🎤</div>
									<h2 class="text-2xl font-bold text-tertiary-200">Ready to Record</h2>
									<p class="mt-2 text-tertiary-200/80">
										Press and hold to start talking to Hominio.
									</p>
								</div>
							{:else if $currentState === 'paywall'}
								<div class="p-6 text-center">
									<div class="flex justify-center mb-4">
										<Icon
											icon="solar:lock-password-bold-duotone"
											width="64"
											height="64"
											class="text-tertiary-200 [--icon-secondary:theme(colors.surface.200)]"
										/>
									</div>
									<h2 class="text-2xl font-bold text-tertiary-200">Your Hominio Minutes are Up</h2>
									<p class="mt-2 text-tertiary-200/80">
										Request more minutes to continue using Hominio. We'll get back to you shortly
										with additional free minutes!
									</p>

									{#if requestMessage}
										<div
											class="mt-4 p-3 rounded-lg {requestStatus === 'success'
												? 'bg-success-500/20 text-success-400'
												: 'bg-error-500/20 text-error-400'}"
										>
											{requestMessage}
										</div>
									{/if}

									<div class="flex gap-4 justify-center mt-4">
										<button
											class="btn variant-ghost-tertiary btn-md @3xl:btn-lg rounded-full"
											on:click={() => machine.send('CLOSE')}
											disabled={requestStatus === 'loading'}
										>
											Maybe Later
										</button>
										<button
											class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg rounded-full"
											on:click={handleRequestMinutes}
											disabled={requestStatus === 'loading'}
										>
											{#if requestStatus === 'loading'}
												<div
													class="w-5 h-5 rounded-full border-2 animate-spin border-tertiary-200 border-t-transparent"
												/>
											{:else}
												Request Minutes
											{/if}
										</button>
									</div>
								</div>
							{:else if $currentState === 'waitinglist'}
								<div class="p-6 text-center">
									<h2 class="text-2xl font-bold text-tertiary-200">Early BETA Access</h2>
									<p class="mt-2 text-tertiary-200/80">
										Invite 3 visioncreators to get early BETA access!
									</p>
									<div class="flex justify-center mt-4">
										<button
											class="btn variant-ghost-tertiary btn-md @3xl:btn-lg rounded-full"
											on:click={() => machine.send('CLOSE')}
										>
											Maybe Later
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="fixed right-0 bottom-0 left-0 z-30 h-96 pointer-events-none">
		<div
			class="absolute inset-0 bg-gradient-to-t to-transparent from-surface-900 via-surface-900/50"
		/>
	</div>
{/if}

{#if warningMessage}
	<div class="z-50 p-4 text-center rounded-xl backdrop-blur-xl bg-error-500/10 animate-fade-in">
		<p class="text-lg font-medium text-error-400">{warningMessage}</p>
	</div>
{/if}
