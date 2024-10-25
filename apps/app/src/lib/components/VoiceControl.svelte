<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ComposeView from './ComposeView.svelte';
	import { dev } from '$app/environment';
	import { currentIntent, type Message, intentManager } from '$lib/agentStore';

	export let session = null;
	export let isRecording = false;
	export let isPressed = false;
	export let needsClarification = false; // Add this new state

	const dispatch = createEventDispatcher();

	let isFirstLongPress = true;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let audioStream: MediaStream | null = null;
	let isRecordingOrProcessing = false;
	let processingState = '';
	let messages: Array<{ role: string; content: string }> = [];
	let messageContainer: HTMLDivElement;
	let transcript = '';

	const processingMessages = [
		'Brewing code...',
		'Bending pixels...',
		'Wrangling bits...',
		'Feeding gremlins...',
		'Aligning stars...',
		'Consulting oracles...',
		'Summoning functions...',
		'Decoding matrix...',
		'Reticulating splines...',
		'Charging flux capacitor...'
	];

	let processingInterval: number;

	let currentAction: { action: string; view: any } | null = null;
	let isProcessingNewRequest = false;

	let currentMessages: Message[] = [];

	// Subscribe to current intent messages
	$: {
		if ($currentIntent) {
			currentMessages = [...$currentIntent.messages];
			console.log('Current messages updated:', currentMessages);
		} else {
			currentMessages = [];
		}
	}

	$: {
		if (currentAction) {
			console.log('VoiceControl: Current action updated:', currentAction);
			console.log('VoiceControl: Action view:', currentAction.view);
		}
	}

	// Add scroll behavior when messages update
	$: if (currentMessages.length) {
		setTimeout(scrollToBottom, 100);
	}

	function startRecording() {
		if (mediaRecorder && mediaRecorder.state === 'inactive') {
			audioChunks = [];

			mediaRecorder.start();
			transcript = 'Recording...';
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
		}
	}

	async function requestMicrophonePermission() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			setupMediaRecorder(stream);
			return true;
		} catch (error) {
			console.error('Error requesting microphone permission:', error);
			return false;
		}
	}

	function setupMediaRecorder(stream) {
		mediaRecorder = new MediaRecorder(stream);
		audioStream = stream;

		mediaRecorder.ondataavailable = (event) => {
			audioChunks.push(event.data);
		};
	}

	function startProcessingMessages() {
		let index = 0;
		processingState = processingMessages[index];
		processingInterval = setInterval(() => {
			index = (index + 1) % processingMessages.length;
			processingState = processingMessages[index];
		}, 3000 + Math.random() * 2000);
	}

	function stopProcessingMessages() {
		clearInterval(processingInterval);
		processingState = '';
	}

	function scrollToBottom() {
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	function playAudio(audioName: string) {
		const randomAudio = Math.floor(Math.random() * 5) + 1;
		const audio = new Audio(`/audio/${audioName}${randomAudio}.mp3`);
		audio.play().catch((error) => {
			console.error('Error playing audio:', error);
		});
	}

	// Add these variables at the top of the script
	let longPressTimer: number;
	const LONG_PRESS_DURATION = 300; // Reduced from default 500ms
	const CLICK_TOLERANCE = 200; // Time window to detect quick clicks

	export async function handleLongPress() {
		if (dev) {
			if (isFirstLongPress) {
				const permissionGranted = await requestMicrophonePermission();
				if (!permissionGranted) return;
				isFirstLongPress = false;
			}

			isRecording = true;
			isRecordingOrProcessing = true;
			startRecording();
		}
	}

	export function handlePress() {
		if (dev) {
			longPressTimer = window.setTimeout(() => {
				handleLongPress();
			}, LONG_PRESS_DURATION);
		}
	}

	export async function handleRelease() {
		if (dev) {
			clearTimeout(longPressTimer);

			if (isRecording) {
				isRecording = false;
				isProcessingNewRequest = true;
				stopRecording();
				await processRecording();
			} else if (Date.now() - lastPressTime < CLICK_TOLERANCE) {
				// Handle single click action if needed
				dispatch('click');
			}
		}
	}

	// Add touch handlers for better mobile support
	export function handleTouchStart(event: TouchEvent) {
		event.preventDefault();
		handlePress();
	}

	export function handleTouchEnd(event: TouchEvent) {
		event.preventDefault();
		handleRelease();
	}

	async function processRecording() {
		try {
			const transcriptionResult = await handleTranscription();
			transcript = transcriptionResult;

			startProcessingMessages();
			const aiResponse = await handleAIProcessing(transcriptionResult);

			// Only stop processing messages if we're not in clarification mode
			if (!aiResponse.needsClarification) {
				stopProcessingMessages();
			}

			// Keep modal open for clarification or actions
			if (
				aiResponse.needsClarification ||
				aiResponse.viewConfiguration ||
				aiResponse.content?.action
			) {
				isRecordingOrProcessing = true;
			} else {
				isRecordingOrProcessing = false;
			}
		} catch (error) {
			console.error('Error processing recording:', error);
			handleError(error);
		}
	}

	function cleanup() {
		if (!needsClarification) {
			// Only cleanup if we're not in clarification mode
			stopProcessingMessages();
			transcript = '';
			scrollToBottom();
			isRecordingOrProcessing = false;
		}
	}

	function handleError(error: Error) {
		console.error('Processing error:', error);
		stopProcessingMessages();
		transcript = 'An error occurred during processing.';
		processingState = '';
		isRecordingOrProcessing = false;
	}

	async function handleTranscription() {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error('Transcription timeout'));
			}, 10000);

			mediaRecorder.onstop = async () => {
				clearTimeout(timeoutId);
				const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				const formData = new FormData();
				formData.append('audio', audioBlob, 'recording.webm');

				try {
					const response = await fetch('/local/api/speech-to-text', {
						method: 'POST',
						body: formData
					});

					if (!response.ok) {
						throw new Error('Failed to transcribe audio');
					}

					const data = await response.json();
					resolve(data.text);
				} catch (error) {
					reject(error);
				}
			};
		});
	}

	async function handleAIProcessing(transcriptionResult: string) {
		isProcessingNewRequest = true;
		currentAction = null;

		try {
			const response = await fetch('/local/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [...currentMessages, { role: 'user', content: transcriptionResult }],
					sessionId: session?.user?.id
				})
			});

			if (!response.ok) throw new Error('Network response was not ok');
			const result = await response.json();
			console.log('AI Response:', result);

			// Handle clarification needed
			if (result.type === 'clarification_needed') {
				needsClarification = true;
				isProcessingNewRequest = false;
				isRecordingOrProcessing = true;
				transcript = result.content;
				processingState = 'Waiting for clarification...';
				return result;
			}

			// Handle view agent response - update page view
			if (result.message?.toolResult?.type === 'view') {
				window.dispatchEvent(
					new CustomEvent('updateView', {
						detail: {
							view: result.message.toolResult.data
						}
					})
				);

				isProcessingNewRequest = false;
				isRecordingOrProcessing = false;
				return result;
			}

			// Handle action view - only update modal
			if (result.type === 'action' && result.content) {
				currentAction = {
					action: result.content.action,
					view: result.content.view
				};
				isProcessingNewRequest = false;
				isRecordingOrProcessing = true;
				return result;
			}

			// Handle clarification
			if (result.type === 'clarification_needed') {
				isProcessingNewRequest = false;
				isRecordingOrProcessing = true;
				transcript = result.content;
				return result;
			}

			// Handle regular response
			isProcessingNewRequest = false;
			isRecordingOrProcessing = false;
			return result;
		} catch (error) {
			console.error('Error in handleAIProcessing:', error);
			throw error;
		}
	}

	// Separate reset and close functions
	function resetContext() {
		if (!needsClarification) {
			// First reset the local state
			currentMessages = [];
			currentAction = null;
			needsClarification = false;
			isProcessingNewRequest = false;
			transcript = '';
			stopProcessingMessages();

			// Then reset the server state and store
			fetch('/local/api/chat', { method: 'DELETE' })
				.then(() => {
					intentManager.resetContext();
				})
				.catch((error) => {
					console.error('Error resetting context:', error);
				});
		}
	}

	function handleFormClose() {
		if (!needsClarification) {
			currentAction = null;
			isRecordingOrProcessing = false; // This is crucial
			isProcessingNewRequest = false;
			stopProcessingMessages();
			resetContext();
		}
	}

	// Handle click outside
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !needsClarification) {
			handleFormClose();
		}
	}

	// Add page reload handler
	onMount(() => {
		if (dev) {
			requestMicrophonePermission();
		}

		window.addEventListener('beforeunload', resetContext);
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				resetContext();
			}
		});

		return () => {
			window.removeEventListener('beforeunload', resetContext);
			document.removeEventListener('visibilitychange', resetContext);
		};
	});

	onDestroy(() => {
		resetContext();
	});
</script>

{#if isRecordingOrProcessing}
	<!-- Full screen backdrop with blur -->
	<div
		class="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm"
		on:click|self={handleBackdropClick}
		on:keydown={(e) => e.key === 'Escape' && handleFormClose()}
		role="presentation"
	/>

	<!-- Modal Wrapper -->
	<div
		class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 mb-20"
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal Container -->
		<div
			class="relative w-full max-w-4xl overflow-hidden border shadow-xl rounded-xl bg-surface-700/95 border-surface-700"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between p-4 border-b border-surface-700">
				<h2 class="text-lg font-semibold text-tertiary-200">
					{#if isRecording}
						Recording...
					{:else if isProcessingNewRequest}
						Processing Request
					{:else if currentAction}
						Action Required
					{/if}
				</h2>

				<button
					class="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-surface-700 hover:bg-surface-600 text-tertiary-400 hover:text-tertiary-300"
					on:click={handleFormClose}
				>
					<Icon icon="ph:x" class="w-5 h-5" />
				</button>
			</div>

			<!-- Modal Content -->
			<div class="flex flex-col min-h-[200px] max-h-[60vh]">
				<!-- Changed from min-h-[300px] -->
				{#if isRecording}
					<div class="flex items-center justify-center flex-1 p-4">
						<!-- Reduced padding from p-8 -->
						<AudioVisualizer {isRecording} {audioStream} />
					</div>
				{:else if isProcessingNewRequest}
					<div class="flex items-center justify-center flex-1">
						<div class="flex flex-col items-center gap-4">
							<div
								class="w-12 h-12 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"
							/>
							<p class="text-lg text-tertiary-300">{processingState}</p>
						</div>
					</div>
				{:else if currentAction}
					<div class="flex-1">
						<ComposeView view={currentAction.view} />
					</div>
				{:else}
					<div class="flex-1 p-4 overflow-y-auto" bind:this={messageContainer}>
						<div class="space-y-3">
							{#each currentMessages as message (message.timestamp)}
								<div class="flex flex-col gap-1.5">
									<div class="text-xs font-medium text-tertiary-400">
										{message.role === 'user' ? 'You' : message.role}
									</div>
									<div class="p-2.5 rounded-lg bg-surface-800/80">
										{message.content}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if transcript && !currentAction && !isRecording && !isProcessingNewRequest}
					<div class="absolute inset-0 flex items-center justify-center p-4">
						<div
							class="max-w-md p-6 text-lg text-center text-tertiary-200 bg-surface-800/90 rounded-xl"
						>
							{transcript}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if needsClarification}
	<div class="p-4 text-center bg-surface-800/50">
		<p class="text-tertiary-200">
			Please clarify your request by holding the microphone button again.
		</p>
	</div>
{/if}
