<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ComposeView from './ComposeView.svelte';
	import { dev } from '$app/environment';
	import { currentIntent, intentHistory, type Message } from '$lib/agentStore';

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
	$: if ($currentIntent) {
		currentMessages = $currentIntent.messages;
	} else {
		currentMessages = [];
	}

	$: {
		if (currentAction) {
			console.log('VoiceControl: Current action updated:', currentAction);
			console.log('VoiceControl: Action view:', currentAction.view);
		}
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
			startRecording();
			console.log('VoiceControl: Recording started');
		}
	}

	export async function handleRelease() {
		if (dev && isRecording) {
			isRecording = false;
			stopRecording();
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

	function playAudio(audioName: string) {
		const randomAudio = Math.floor(Math.random() * 5) + 1;
		const audio = new Audio(`/audio/${audioName}${randomAudio}.mp3`);
		audio.play().catch((error) => {
			console.error('Error playing audio:', error);
		});
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

		try {
			if (!transcriptionResult) {
				throw new Error('No transcription result to process');
			}

			const response = await fetch('/local/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: [
						...currentMessages,
						{
							role: 'user',
							content: transcriptionResult
						}
					],
					sessionId: session?.user?.id
				})
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();

			// Handle view updates
			if (data.viewConfiguration) {
				dispatch('updateView', {
					view: data.viewConfiguration
				});
				isRecordingOrProcessing = false;
			}
			// Handle action views
			else if (data.type === 'tool_result' && data.content?.action) {
				currentAction = {
					action: data.content.action,
					view: data.content.view
				};
				isRecordingOrProcessing = true;
			}

			isProcessingNewRequest = false;
			return data;
		} catch (error) {
			console.error('Error in handleAIProcessing:', error);
			isProcessingNewRequest = false;
			throw error;
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
	<div
		class="fixed inset-x-0 z-50 flex justify-center px-4 bottom-24 sm:px-6"
		on:click|self={handleFormClose}
		on:keydown={(e) => e.key === 'Escape' && handleFormClose()}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="relative z-10 w-full max-w-md overflow-hidden border shadow-lg rounded-2xl bg-surface-800/95 backdrop-blur-sm border-surface-700"
		>
			<div class="relative">
				{#if isRecording}
					<div class="p-4">
						<AudioVisualizer {isRecording} {audioStream} />
					</div>
				{:else if isProcessingNewRequest}
					<div class="flex flex-col items-center justify-center p-8">
						<div
							class="w-12 h-12 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"
						/>
						<p class="mt-4 text-lg text-tertiary-300">{processingState}</p>
					</div>
				{:else if currentAction}
					<div class="relative">
						<ComposeView
							view={currentAction.view}
							{session}
							showSpacer={false}
							on:mount={() => console.log('VoiceControl: ComposeView mounted')}
							on:close={handleFormClose}
							on:message={(event) => {
								// Handle form messages
								if (event.detail) {
									intentManager.addMessage(event.detail);
								}
								handleFormClose();
							}}
						/>
					</div>
				{/if}

				<!-- Close button -->
				<button
					class="absolute flex items-center justify-center w-8 h-8 transition-colors rounded-full top-2 right-2 bg-surface-700 hover:bg-surface-800 text-tertiary-400 hover:text-tertiary-300"
					on:click={handleFormClose}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

<div bind:this={messageContainer} class="flex-1 p-4 overflow-y-auto">
	{#each currentMessages as message}
		<div class="mb-4">
			<div class="font-bold">{message.role}</div>
			<div class="whitespace-pre-wrap">{message.content}</div>
			{#if message.toolResult}
				<div class="mt-2 text-sm text-tertiary-400">
					Tool Result: {message.toolResult.type}
				</div>
			{/if}
		</div>
	{/each}
</div>
