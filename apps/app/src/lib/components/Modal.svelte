<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { createEventDispatcher, onMount } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';

	export let isOpen: boolean;
	export let activeTab: string;
	export let me: { id: string; email: string; onboarded: boolean };
	export let isFirstTime: boolean;

	const dispatch = createEventDispatcher();

	interface Message {
		role: 'user' | 'assistant' | 'system';
		content: string;
		image?: string;
	}

	let messages: Message[] = [];
	let isRecording = false;
	let transcript = '';
	let processingState = '';
	let longPressTimer: ReturnType<typeof setTimeout>;
	let buttonElement: HTMLButtonElement;
	let pressStartTime: number;
	let lastToggleTime = 0;
	const DEBOUNCE_DELAY = 300;
	let isPressed = false;
	let isFirstLongPress = true;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let messageContainer: HTMLDivElement;
	let isRecordingOrProcessing = false;
	let audioStream: MediaStream | null = null;

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

	function setActiveTab(tab: string) {
		dispatch('setActiveTab', tab);
	}

	function toggleModal() {
		dispatch('toggleModal');
	}

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		dispatch('navigate', href);
	}

	function scrollToBottom() {
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	async function handleMouseDown() {
		isPressed = true;
		pressStartTime = performance.now();
		longPressTimer = setTimeout(async () => {
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
				console.log(`Long press detected after ${performance.now() - pressStartTime}ms`);
			} else {
				console.log('MediaRecorder not available or already recording');
			}
		}, 500);
	}

	async function handleMouseUp() {
		isPressed = false;
		const currentTime = performance.now();
		const pressDuration = currentTime - pressStartTime;
		clearTimeout(longPressTimer);

		if (currentTime - lastToggleTime > DEBOUNCE_DELAY) {
			if (isRecording) {
				isRecording = false;
				stopRecording();
				startProcessingMessages();

				// Play a random "working on it" audio file
				const randomAudio = Math.floor(Math.random() * 5) + 1;
				const audio = new Audio(`/audio/workingonit${randomAudio}.mp3`);
				audio.play().catch((error) => {
					console.error('Error playing audio:', error);
				});

				try {
					// Wait for the transcription result
					const transcriptionResult = await new Promise((resolve, reject) => {
						const timeoutId = setTimeout(() => {
							reject(new Error('Transcription timeout'));
						}, 10000); // 10 second timeout

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

					// Update processing state for code generation
					processingState = 'Programming...';

					// Add user message with actual transcription result
					messages = [...messages, { role: 'user', content: transcriptionResult }];

					// Actual API call to Claude AI for code generation
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
					const aiGeneratedCode = data.content;

					// Add assistant message
					messages = [...messages, { role: 'assistant', content: aiGeneratedCode }];

					// Dispatch event with the new view configuration
					if (data.viewConfiguration) {
						dispatch('updateView', data.viewConfiguration);
					}

					// Process complete, play a random "done" audio file
					const randomDoneAudio = Math.floor(Math.random() * 5) + 1;
					const doneAudio = new Audio(`/audio/done${randomDoneAudio}.mp3`);
					doneAudio.play().catch((error) => {
						console.error('Error playing done audio:', error);
					});

					stopProcessingMessages();
					transcript = '';
					scrollToBottom();
					isRecordingOrProcessing = false;
				} catch (error) {
					stopProcessingMessages();
					transcript = 'An error occurred during processing.';
					processingState = '';
					isRecordingOrProcessing = false;
				}
			} else if (pressDuration < 500) {
				toggleModal();
				lastToggleTime = currentTime;
			}
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
		}, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
	}

	function stopProcessingMessages() {
		clearInterval(processingInterval);
		processingState = '';
	}

	onMount(() => {
		buttonElement?.addEventListener('touchstart', handleMouseDown);
		buttonElement?.addEventListener('touchend', handleMouseUp);
		return () => {
			buttonElement?.removeEventListener('touchstart', handleMouseDown);
			buttonElement?.removeEventListener('touchend', handleMouseUp);
		};
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 bg-surface-900/50 backdrop-blur-sm"
		on:click={toggleModal}
		on:keydown={(e) => e.key === 'Escape' && toggleModal()}
		role="dialog"
		aria-modal="true"
		transition:fade
	>
		<div
			class="w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			on:click|stopPropagation
		>
			<div class="flex flex-col flex-grow w-full h-full p-4 overflow-hidden">
				{#if activeTab === 'actions'}
					<slot name="actions" />
				{:else if activeTab === 'settings'}
					<slot name="settings" />
				{:else if activeTab === 'legal'}
					<div class="flex flex-col items-start justify-center w-full h-full">
						<ListBox class="w-full max-w-sm">
							<ListBoxItem
								value="privacy"
								on:click={(e) => handleLinkClick(e, '/en/privacy-policy')}
							>
								Privacy Policy
							</ListBoxItem>
							<ListBoxItem value="imprint" on:click={(e) => handleLinkClick(e, '/en/imprint')}>
								Site Notice
							</ListBoxItem>
						</ListBox>
					</div>
				{/if}
			</div>

			<!-- Tab navigation -->
			<div class="flex items-center justify-between p-2 border-t border-surface-500">
				<ul class="flex flex-wrap text-sm font-medium text-center sm:text-md">
					{#each ['actions', 'settings', 'legal'] as tab}
						<li class="relative px-0.5 sm:px-1">
							<button
								class={`inline-block px-2 py-2 sm:px-3 rounded-lg transition-colors duration-200 ${
									activeTab === tab
										? 'text-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click={() => setActiveTab(tab)}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
							{#if activeTab === tab}
								<div
									class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-primary-500 rounded-full"
								/>
							{/if}
						</li>
					{/each}
				</ul>
				<button class="p-2 text-tertiary-400 hover:text-tertiary-300" on:click={toggleModal}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

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

<div
	class="fixed z-50 flex items-center justify-center transform -translate-x-1/2 bottom-4 left-1/2"
>
	<div class="relative flex items-center">
		{#if me.onboarded}
			<div class="relative">
				<button
					bind:this={buttonElement}
					class="flex items-center justify-center transition-all duration-300 border rounded-full shadow-lg bg-primary-500 w-14 h-14 border-tertiary-400 hover:shadow-xl hover:scale-105"
					class:hidden={isOpen}
					class:recording-border={isRecording || isPressed}
					on:mousedown={handleMouseDown}
					on:mouseup={handleMouseUp}
					on:mouseleave={handleMouseUp}
				>
					<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1) translateX(-50%);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05) translateX(-48%);
		}
	}

	.animate-pulse {
		animation: pulse 2s infinite;
	}

	.recording-border {
		box-shadow: 0 0 0 2px red, 0 0 0 4px rgba(255, 0, 0, 0.5);
		animation: pulse-red 0.3s infinite alternate;
	}

	@keyframes pulse-red {
		0% {
			box-shadow: 0 0 0 2px red, 0 0 0 4px rgba(255, 0, 0, 0.5);
		}
		100% {
			box-shadow: 0 0 0 2px red, 0 0 0 8px rgba(255, 0, 0, 0);
		}
	}
</style>
