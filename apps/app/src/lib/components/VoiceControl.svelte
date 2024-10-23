<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
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
		if (dev) {
			if (isFirstLongPress) {
				const permissionGranted = await requestMicrophonePermission();
				if (!permissionGranted) {
					console.log('Microphone permission denied');
					return;
				}
				isFirstLongPress = false;
			}

			if (mediaRecorder && mediaRecorder.state === 'inactive') {
				isRecording = true;
				isRecordingOrProcessing = true;
				transcript = 'Recording...';
				startRecording();
			}
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
		startProcessingMessages();
		playAudio('workingonit');

		try {
			const transcriptionResult = await handleTranscription();
			const aiResponse = await handleAIProcessing(transcriptionResult);

			// Make sure we're dispatching the view update
			if (aiResponse.viewConfiguration) {
				dispatch('updateView', {
					view: aiResponse.viewConfiguration
				});
			}

			playAudio('done');
			cleanup();
		} catch (error) {
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
		processingState = 'Programming...';
		messages = [...messages, { role: 'user', content: transcriptionResult }];

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
		messages = [...messages, { role: 'assistant', content: data.content }];

		// Extract view configuration and dispatch it
		if (data.viewConfiguration) {
			dispatch('updateView', {
				view: data.viewConfiguration
			});
		}

		return data;
	}

	onMount(() => {
		if (dev) {
			requestMicrophonePermission();
		}
	});
</script>

{#if isRecordingOrProcessing}
	<div
		class="fixed inset-0 z-40 pointer-events-none bg-surface-900/50 backdrop-blur-sm"
		transition:fade
	>
		<div
			class="absolute p-6 transform -translate-x-1/2 bottom-24 left-1/2 bg-surface-800 rounded-3xl"
		>
			{#if isRecording}
				<AudioVisualizer {isRecording} {audioStream} />
			{:else}
				<div class="flex flex-col items-center justify-center">
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
