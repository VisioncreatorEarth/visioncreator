<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ComposeView from './ComposeView.svelte';
	import { dev } from '$app/environment';

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
		console.log('VoiceControl: Processing recording');
		try {
			const transcriptionResult = await handleTranscription(); // Changed from transcribeAudio to handleTranscription
			console.log('VoiceControl: Transcription completed:', transcriptionResult);

			transcript = transcriptionResult;
			const aiResponse = await handleAIProcessing(transcriptionResult);
			console.log('VoiceControl: AI processing completed:', aiResponse);

			if (aiResponse.isAction) {
				console.log('VoiceControl: Action view detected, keeping modal open');
			} else {
				isRecordingOrProcessing = false;
			}
		} catch (error) {
			console.error('VoiceControl: Error processing recording:', error);
			isRecordingOrProcessing = false;
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
		console.log('Starting AI processing with transcription:', transcriptionResult);
		processingState = 'Programming...';
		messages = [...messages, { role: 'user', content: transcriptionResult }];

		try {
			const response = await fetch('/local/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messages })
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			console.log('Received AI response:', data);

			// Handle action views
			if (data.isAction && data.actionConfig) {
				console.log('Received action config:', data.actionConfig);
				currentAction = data.actionConfig;
				messages = [...messages, { role: 'assistant', content: data.content }];
				return data;
			}

			messages = [...messages, { role: 'assistant', content: data.content }];

			if (data.viewConfiguration) {
				dispatch('updateView', {
					view: data.viewConfiguration
				});
			}

			return data;
		} catch (error) {
			console.error('Error in handleAIProcessing:', error);
			throw error;
		}
	}

	onMount(() => {
		if (dev) {
			requestMicrophonePermission();
		}
	});
</script>

{#if isRecordingOrProcessing}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 bg-surface-900/50 backdrop-blur-sm"
		transition:fade
	>
		<div
			class="relative z-10 flex flex-col w-full overflow-hidden bg-surface-600 rounded-3xl"
			class:max-w-6xl={currentAction}
		>
			{#if isRecording}
				<div class="p-4">
					<AudioVisualizer {isRecording} {audioStream} />
				</div>
			{:else if currentAction}
				<div class="relative">
					<div class="p-6">
						<ComposeView
							view={currentAction.view}
							{session}
							showSpacer={false}
							on:mount={() => console.log('VoiceControl: ComposeView mounted')}
						/>
					</div>
					<button
						class="absolute flex items-center justify-center w-8 h-8 transition-colors rounded-full bottom-2 right-4 bg-surface-700 hover:bg-surface-800 text-tertiary-400 hover:text-tertiary-300"
						on:click={() => (isRecordingOrProcessing = false)}
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
			{:else}
				<div class="flex flex-col items-center justify-center p-8">
					<div
						class="w-12 h-12 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"
					/>
					<p class="mt-4 text-lg text-tertiary-300">{processingState}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<div bind:this={messageContainer} class="flex-1 p-4 overflow-y-auto">
	{#each messages as message}
		<div class="mb-4">
			<div class="font-bold">{message.role}</div>
			<div class="whitespace-pre-wrap">{message.content}</div>
		</div>
	{/each}
</div>
