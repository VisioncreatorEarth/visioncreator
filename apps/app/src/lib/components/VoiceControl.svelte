<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ComposeView from './ComposeView.svelte';
	import { dev } from '$app/environment';
	import { currentIntent, type Message } from '$lib/agentStore';

	export let session = null;
	export let isRecording = false;
	export let isPressed = false;

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

	export async function handleLongPress() {
		console.log('VoiceControl: Long press handler called');
		if (dev) {
			if (isFirstLongPress) {
				console.log('VoiceControl: First long press, requesting microphone permission');
				const permissionGranted = await requestMicrophonePermission();
				if (!permissionGranted) {
					console.error('VoiceControl: Microphone permission denied');
					return;
				}
				isFirstLongPress = false;
			}

			isRecording = true;
			isRecordingOrProcessing = true;
			playAudio('start'); // Add start sound
			startRecording();
			console.log('VoiceControl: Recording started');
		}
	}

	export async function handleRelease() {
		if (dev && isRecording) {
			isRecording = false;
			stopRecording();
			playAudio('workingonit'); // Play working sound when recording stops
			await processRecording();
		}
	}

	async function processRecording() {
		try {
			const transcriptionResult = await handleTranscription();
			transcript = transcriptionResult;

			startProcessingMessages();
			const aiResponse = await handleAIProcessing(transcriptionResult);
			stopProcessingMessages();

			// Keep modal open only for action views
			if (!aiResponse.viewConfiguration && !aiResponse.content?.action) {
				isRecordingOrProcessing = false;
			}
		} catch (error) {
			console.error('Error processing recording:', error);
			handleError(error);
		}
	}

	function cleanup() {
		stopProcessingMessages();
		transcript = '';
		scrollToBottom();
		isRecordingOrProcessing = false;
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
		let result;

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

			result = await response.json();
			console.log('AI Response:', result);

			// Update messages in UI
			if ($currentIntent) {
				currentMessages = [...$currentIntent.messages];
			}

			// Handle tool results with actions
			if (result.type === 'tool_result' && result.content) {
				currentAction = {
					action: result.content.action,
					view: result.content.view
				};
				isRecordingOrProcessing = true;
				isProcessingNewRequest = false;
				return result;
			}

			// Handle clarification needed case
			if (result.type === 'clarification_needed') {
				playAudio('workingonit');
				isProcessingNewRequest = false;
				isRecordingOrProcessing = true;

				if ($currentIntent) {
					currentMessages = [...$currentIntent.messages];
				}

				setTimeout(() => {
					transcript = 'Please clarify your request...';
					processingState = '';
				}, 1000);

				return result;
			}

			// Handle direct view configurations
			if (result.viewConfiguration) {
				console.log('Dispatching view update:', result.viewConfiguration);
				window.dispatchEvent(
					new CustomEvent('updateView', {
						detail: { view: result.viewConfiguration }
					})
				);
			}

			playAudio('done');
			return result;
		} catch (error) {
			console.error('Error in handleAIProcessing:', error);
			throw error;
		} finally {
			// Only reset states if we don't have an action or clarification
			if (result && result.type !== 'clarification_needed' && result.type !== 'tool_result') {
				isProcessingNewRequest = false;
				isRecordingOrProcessing = false;
			}
		}
	}

	function handleFormClose() {
		currentAction = null;
		isRecordingOrProcessing = false;
		isProcessingNewRequest = false;
	}

	onMount(() => {
		if (dev) {
			requestMicrophonePermission();
		}
	});
</script>

{#if isRecordingOrProcessing}
	<!-- Full screen backdrop with blur -->
	<div
		class="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm"
		on:click={handleFormClose}
		on:keydown={(e) => e.key === 'Escape' && handleFormClose()}
	/>

	<!-- Modal Wrapper - Adjusted bottom padding -->
	<div
		class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 mb-20"
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal Container -->
		<div
			class="relative w-full max-w-4xl min-h-[300px] max-h-[70vh] overflow-hidden border shadow-xl rounded-xl bg-surface-700/95 border-surface-700"
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
			<div class="flex flex-col h-full">
				{#if isRecording}
					<div class="flex items-center justify-center w-full h-full">
						<div class="w-full max-w-lg">
							<AudioVisualizer {isRecording} {audioStream} />
						</div>
					</div>
				{:else}
					<!-- Chat history and processing state -->
					<div class="flex-1 p-6 overflow-y-auto" bind:this={messageContainer}>
						<div class="space-y-4">
							{#each currentMessages as message (message.timestamp)}
								<div class="flex flex-col gap-2">
									<div class="text-sm font-medium text-tertiary-400">
										{message.role === 'user' ? 'You' : message.role}
									</div>
									<div class="p-3 rounded-lg bg-surface-800">
										{message.content}
									</div>
								</div>
							{/each}
						</div>
					</div>

					{#if isProcessingNewRequest}
						<div class="flex flex-col items-center justify-center gap-4 p-8">
							<div
								class="w-16 h-16 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"
							/>
							<p class="text-xl text-center text-tertiary-300">{processingState}</p>
						</div>
					{:else if transcript}
						<div class="p-4 text-center text-tertiary-300">
							{transcript}
						</div>
					{/if}
				{/if}

				{#if currentAction}
					<div class="flex-1 p-4">
						<ComposeView view={currentAction.view} />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
