<script lang="ts">
	import { fade } from 'svelte/transition';
	import { derived } from 'svelte/store';
	import { onDestroy } from 'svelte';
	import { createMachine, type MachineConfig } from '$lib/composables/svelteMachine';
	import { createMutation } from '$lib/wundergraph';
	import { hominioAgent } from '$lib/agents/hominioAgent';
	import { conversationManager } from '$lib/stores/intentStore';

	let isLongPressActive = false;

	interface IntentContext {
		permissionState: 'prompt' | 'granted' | 'denied';
		permissionRequesting: boolean;
		isOpen: boolean;
		audioStream: MediaStream | null;
		mediaRecorder: MediaRecorder | null;
		audioChunks: Blob[];
		audioData: Blob | null;
		visualizerMode: 'user' | 'assistant';
		hominioAudio: HTMLAudioElement | null;
		currentTranscription: string | null;
		isStartingRecording: boolean;
		actionView: any | null;
		actionMessage: string | null;
	}

	const intentConfig: MachineConfig<IntentContext> = {
		id: 'intentMachine',
		initial: 'init',
		context: {
			permissionState: 'prompt',
			permissionRequesting: false,
			isOpen: false,
			audioStream: null,
			mediaRecorder: null,
			audioChunks: [],
			audioData: null,
			visualizerMode: 'user',
			hominioAudio: null,
			currentTranscription: null,
			isStartingRecording: false,
			actionView: null,
			actionMessage: null
		},
		states: {
			init: {
				entry: ['initializePermissions'],
				on: {
					LONG_PRESS: [
						{
							target: 'recording',
							guard: 'isPermissionGranted',
							actions: ['startNewConversation', 'openModal', 'startRecording']
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
						target: 'recording',
						actions: ['startNewConversation', 'startRecording']
					}
				}
			},
			recording: {
				entry: ['openModal', 'startRecording'],
				exit: ['stopRecording'],
				on: {
					RELEASE: {
						target: 'transcribing',
						actions: ['prepareTranscription']
					}
				}
			},
			transcribing: {
				entry: ['prepareTranscription'],
				on: {
					TRANSCRIPTION_SUCCESS: {
						target: 'processing',
						actions: ['handleTranscriptionSuccess', 'processTranscription']
					},
					TRANSCRIPTION_ERROR: {
						target: 'error',
						actions: ['handleTranscriptionError']
					},
					WAITINGLIST: {
						target: 'waitinglist',
						actions: ['cleanup']
					},
					PAYWALL: {
						target: 'paywall',
						actions: ['cleanup']
					}
				}
			},
			processing: {
				entry: ['playHominioAudio'],
				on: {
					ACTION_READY: {
						target: 'action',
						actions: ['setActionView']
					},
					PROCESSING_COMPLETE: {
						target: 'init',
						actions: ['cleanup']
					},
					TRANSCRIPTION_ERROR: {
						target: 'error',
						actions: ['handleTranscriptionError']
					}
				}
			},
			action: {
				entry: ['confirmActionView'],
				on: {
					CLOSE: {
						target: 'init',
						actions: ['cleanup']
					}
				}
			},
			error: {
				entry: ['handleTranscriptionError', 'openModal'],
				on: {
					TRY_AGAIN: {
						target: 'init',
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

	const transcribeAudioMutation = createMutation({
		operationName: 'transcribeAudio'
	});

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

		startNewConversation: (context: IntentContext) => {
			conversationManager.startNewConversation();
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

		startRecording: async (context: IntentContext) => {
			if (context.isStartingRecording) {
				return;
			}

			context.isStartingRecording = true;

			try {
				// Clean up any existing stream first
				if (context.audioStream) {
					context.audioStream.getTracks().forEach((track) => track.stop());
					context.audioStream = null;
				}

				// Get audio stream
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					}
				});

				context.audioStream = stream;
				context.visualizerMode = 'user';

				// Use correct MIME type for iOS compatibility
				const recorder = new MediaRecorder(stream, {
					mimeType: 'video/mp4; codecs=mp4a.40.2'
				});

				context.audioChunks = [];
				recorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						context.audioChunks.push(event.data);
					}
				};

				recorder.start(50);
				context.mediaRecorder = recorder;
			} catch (error) {
				machine.send('TRANSCRIPTION_ERROR');
			} finally {
				context.isStartingRecording = false;
			}
		},

		stopRecording: (context: IntentContext) => {
			// Stop the MediaRecorder if it's recording
			if (context.mediaRecorder?.state === 'recording') {
				context.mediaRecorder.stop();
			}

			// Immediately stop all audio tracks
			if (context.audioStream) {
				context.audioStream.getTracks().forEach((track) => {
					track.stop();
				});
				context.audioStream = null;
			}
		},

		prepareTranscription: async (context: IntentContext) => {
			try {
				if (!context.mediaRecorder) {
					console.error('No media recorder found');
					machine.send('TRANSCRIPTION_ERROR');
					return;
				}

				// Add a small delay before processing to ensure we capture the full audio
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Process existing audio chunks without waiting for new ones
				const audioBlob = new Blob(context.audioChunks, { type: 'audio/mp4' });

				if (audioBlob.size < 100) {
					throw new Error('Audio recording too short');
				}

				// Convert to base64
				const base64 = await blobToBase64(audioBlob);
				context.audioData = base64;

				// If we have audio data, proceed with transcription
				if (context.audioData) {
					await intentActions.startTranscription(context);
				} else {
					throw new Error('No audio data available after preparation');
				}
			} catch (error) {
				console.error('Error preparing transcription:', error);
				machine.send('TRANSCRIPTION_ERROR');
			}
		},

		startTranscription: async (context: IntentContext) => {
			try {
				if (!context.audioData) {
					console.error('No audio data available');
					machine.send('TRANSCRIPTION_ERROR');
					return;
				}

				const response = await $transcribeAudioMutation.mutateAsync({
					audioBase64: context.audioData
				});

				if (response.data?.text) {
					context.currentTranscription = response.data.text;
					machine.send('TRANSCRIPTION_SUCCESS');
					console.log('Transcription successful:', context.currentTranscription);
				}
			} catch (error) {
				console.error('Transcription error:', error);
				if (error.name === 'AuthorizationError' || error.code === 'AuthorizationError') {
					machine.send('WAITINGLIST');
				} else {
					machine.send('TRANSCRIPTION_ERROR');
				}
			}
		},

		playHominioAudio: async (context: IntentContext) => {
			context.visualizerMode = 'hominio';
			context.hominioAudio = new Audio(getRandomWorkingAudio());

			try {
				context.hominioAudio.setAttribute('playsinline', '');
				context.hominioAudio.setAttribute('webkit-playsinline', '');
				context.hominioAudio.muted = false;
				context.hominioAudio.preload = 'auto';

				await context.hominioAudio.play();
			} catch (error) {
				// Continue without audio but keep hominio mode
			}
		},

		processTranscription: async (context: IntentContext) => {
			try {
				console.log('Starting processTranscription');
				const response = await hominioAgent.processRequest(
					context.currentTranscription!,
					conversationManager.getMessageContext() || []
				);

				if (response?.message?.payload) {
					const payload = response.message.payload;
					console.log('Received payload:', payload);

					if (payload.type === 'action') {
						// Set the action view data first
						context.actionView = payload.data;
						context.actionMessage = response.message?.content;
						context.isOpen = true;

						console.log('Sending ACTION_READY event');
						// Then send the state transition event
						machine.send('ACTION_READY');
					} else {
						machine.send('PROCESSING_COMPLETE');
					}
				} else {
					machine.send('PROCESSING_COMPLETE');
				}
			} catch (error) {
				console.error('Processing error:', error);
				machine.send('TRANSCRIPTION_ERROR');
			}
		},

		handleTranscriptionSuccess: (context: IntentContext) => {
			// Additional success handling if needed
		},

		handleTranscriptionError: (context: IntentContext) => {
			console.log('Handling transcription error');
			// Ensure cleanup on error
			if (context.audioStream) {
				context.audioStream.getTracks().forEach((track) => {
					track.stop();
				});
				context.audioStream = null;
			}
			context.visualizerMode = 'user';
			context.mediaRecorder = null;
			context.audioChunks = [];
			context.audioData = null;
			context.currentTranscription = null;
		},

		handlePaywall: (context: IntentContext) => {
			context.visualizerMode = 'user';
		},

		cleanup: (context: IntentContext) => {
			context.mediaRecorder = null;
			context.audioChunks = [];
			context.audioData = null;
			context.currentTranscription = null;
			context.visualizerMode = 'user';
			context.isStartingRecording = false;

			// Don't reset these immediately when cleaning up after action
			if ($currentState !== 'action') {
				context.isOpen = false;
				context.actionView = null;
				context.actionMessage = null;
			}

			conversationManager.endCurrentConversation();
		},

		setActionView: (context: IntentContext) => {
			console.log('Setting Action View:', {
				hasView: !!context.actionView,
				currentState: $currentState
			});

			// The view should already be set in the context from processTranscription
			if (!context.actionView) {
				console.error('No action view data available');
				machine.send('TRANSCRIPTION_ERROR');
			}
		},

		confirmActionView: (context: IntentContext) => {
			console.log('Action View Confirmed:', {
				hasView: !!context.actionView,
				view: context.actionView,
				isOpen: context.isOpen,
				currentState: $currentState
			});
		}
	};

	const intentGuards = {
		isPermissionGranted: (context: IntentContext) => context.permissionState === 'granted',
		isPermissionNotGranted: (context: IntentContext) => context.permissionState !== 'granted'
	};

	export let session: any;
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

	// Helper function for blob to base64 conversion with proper data URL format
	function blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				// Ensure proper data URL format
				const result = reader.result as string;
				resolve(result);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	// Helper function for random audio selection
	function getRandomWorkingAudio(): string {
		const audioNum = Math.floor(Math.random() * 5) + 1;
		return `/audio/workingonit${audioNum}.mp3`;
	}

	onDestroy(() => {
		// Ensure cleanup runs when component is destroyed
		intentActions.cleanup(machine.getState().context);
	});
</script>

{#if $context.isOpen}
	<div
		class="fixed inset-0 z-50 flex flex-col justify-end bg-surface-900/30 backdrop-blur-xl"
		transition:fade={{ duration: 200 }}
	>
		<!-- Main container with proper bottom spacing -->
		<div class="relative w-full max-w-xl mx-auto mb-20">
			<!-- Scrollable content area - starts from top -->
			<div class="px-4 overflow-y-auto" style="max-height: calc(100vh - 120px);">
				<!-- Messages Container -->
				<div class="space-y-3">
					<!-- User Transcription Message -->
					{#if $context.currentTranscription}
						<div class="flex gap-4 p-4 rounded-xl bg-tertiary-200/10 backdrop-blur-xl">
							<div class="flex-shrink-0">
								<div
									class="flex items-center justify-center w-10 h-10 rounded-full bg-tertiary-200/20"
								>
									<svg
										class="w-6 h-6 text-tertiary-200"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
							</div>
							<div class="flex-1">
								<p class="text-tertiary-200">{$context.currentTranscription}</p>
							</div>
						</div>
					{/if}

					<!-- Assistant Response Message -->
					{#if $currentState === 'action' && $context.actionMessage}
						<div class="flex gap-4 p-4 rounded-xl bg-tertiary-200/10 backdrop-blur-xl">
							<div class="flex-shrink-0">
								<div
									class="flex items-center justify-center w-10 h-10 rounded-full bg-tertiary-200/20"
								>
									<img src="/logo.png" alt="Assistant" class="w-6 h-6" />
								</div>
							</div>
							<div class="flex-1">
								<p class="text-tertiary-200">{$context.actionMessage}</p>
							</div>
						</div>
					{/if}

					<!-- Modal Content -->
					<div class="rounded-xl bg-tertiary-200/10 backdrop-blur-xl">
						{#if $currentState === 'action' && $context.actionView}
							<div class="p-1 sm:p-2">
								<ComposeView view={$context.actionView} {session} showSpacer={false} />
							</div>
						{:else if $currentState === 'requestPermissions'}
							<div class="p-4 text-center">
								<div class="mb-4 text-4xl">🎤</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Enable Microphone</h2>
								<p class="mt-2 text-tertiary-200/80">Please allow microphone access to continue.</p>
								<div class="mt-4 text-sm text-tertiary-200/60">
									<p>How to enable:</p>
									<ol class="mt-2 text-left list-decimal list-inside">
										<li>Click the lock icon in your browser's address bar</li>
										<li>Find "Microphone" in the permissions list</li>
										<li>Change the setting to "Allow"</li>
										<li>Refresh the page</li>
									</ol>
								</div>
							</div>
						{:else if $currentState === 'permissionBlocked'}
							<div class="p-4 text-center">
								<div class="mb-4 text-4xl">🚫</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Microphone Blocked</h2>
								<p class="mt-2 text-tertiary-200/80">
									Please enable microphone access in your browser settings.
								</p>
								<button
									class="px-4 py-2 mt-4 text-sm font-medium rounded-lg bg-tertiary-200 text-surface-900"
									on:click={() => machine.send('TRY_AGAIN')}
								>
									Try Again
								</button>
							</div>
						{:else if $currentState === 'readyToRecord'}
							<div class="p-4 text-center">
								<div class="mb-4 text-4xl">🎤</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Ready to Record</h2>
								<p class="mt-2 text-tertiary-200/80">Press and hold to start recording.</p>
							</div>
						{:else if $currentState === 'recording'}
							<div class="p-4 text-center">
								<div class="mb-4">
									<div class="w-12 h-12 mx-auto bg-red-500 rounded-full animate-pulse" />
								</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Recording...</h2>
								<p class="mt-2 text-tertiary-200/80">Release to process your request</p>
							</div>
						{:else if $currentState === 'transcribing'}
							<div class="p-4 text-center">
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
								<h2 class="text-2xl font-bold text-tertiary-200">Transcribing...</h2>
								<p class="mt-2 text-tertiary-200/80">Please wait...</p>
							</div>
						{:else if $currentState === 'processing'}
							<div class="p-4 text-center">
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
						{:else if $currentState === 'error'}
							<div class="p-4 text-center">
								<div class="mb-4 text-4xl">❌</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Transcription Error</h2>
								<p class="mt-2 text-tertiary-200/80">
									An error occurred while processing the transcription.
								</p>
								<button
									class="px-4 py-2 mt-4 text-sm font-medium rounded-lg bg-tertiary-200 text-surface-900"
									on:click={() => machine.send('TRY_AGAIN')}
								>
									Try Again
								</button>
							</div>
						{:else if $currentState === 'paywall'}
							<div class="p-4 text-center">
								<div class="mb-4 text-4xl">💸</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Paywall</h2>
								<p class="mt-2 text-tertiary-200/80">You've reached the paywall limit.</p>
							</div>
						{:else if $currentState === 'waitinglist'}
							<div class="p-4 text-center">
								<div class="mb-4 text-4xl">🎉</div>
								<h2 class="text-2xl font-bold text-tertiary-200">Coming Soon!</h2>
								<p class="mt-2 text-tertiary-200/80">
									You're on the waiting list. Rank up in the leaderboard to get early access!
								</p>
								<div class="mt-4 space-y-2">
									<p class="text-sm text-tertiary-200/60">Want to skip the queue? Here's how:</p>
									<ul class="text-sm list-disc list-inside text-tertiary-200/80">
										<li>Participate in community challenges</li>
										<li>Share your progress</li>
										<li>Help other members</li>
									</ul>
								</div>
								<button
									class="px-4 py-2 mt-6 text-sm font-medium transition-colors rounded-lg bg-tertiary-200 text-surface-900 hover:bg-tertiary-300"
									on:click={() => machine.send('CLOSE')}
								>
									Got it
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Bottom fade effect -->
			<div
				class="absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-surface-900/30 to-transparent"
			/>
		</div>
	</div>
{/if}
