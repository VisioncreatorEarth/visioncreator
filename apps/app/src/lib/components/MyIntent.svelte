<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount } from 'svelte';
	import AudioRecorder from './AudioRecorder.svelte';
	import { createMutation } from '$lib/wundergraph';
	import AudioVisualizer from './AudioVisualizer.svelte';

	export let isOpen = false;
	export let onRecordingStateChange: (isRecording: boolean, isProcessing: boolean) => void;

	const dispatch = createEventDispatcher();

	let audioRecorderComponent: AudioRecorder;
	let audioStream: MediaStream | null = null;
	let isRecording = false;
	let transcription = '';
	let isProcessing = false;

	// Create the mutation instance
	const transcribeAudioMutation = createMutation({
		operationName: 'transcribeAudio'
	});

	onMount(() => {
		return () => {
			if (isRecording && audioRecorderComponent) {
				audioRecorderComponent.stopRecording();
			}
		};
	});

	export const handleLongPressStart = async () => {
		console.log('🎤 Long press started');
		try {
			await new Promise((resolve) => setTimeout(resolve, 100));

			if (audioRecorderComponent) {
				isRecording = true;
				onRecordingStateChange(true, false);
				await audioRecorderComponent.startRecording();
				transcription = '';
				console.log('✅ Recording started successfully');
			}
		} catch (error) {
			console.error('❌ Start recording failed:', error);
			isRecording = false;
			onRecordingStateChange(false, false);
		}
	};

	export const handleLongPressEnd = async () => {
		console.log('🎤 Long press ended');
		if (!isRecording || !audioRecorderComponent) {
			console.log('⚠️ No active recording to stop');
			return;
		}

		try {
			isRecording = false;
			isProcessing = true;
			onRecordingStateChange(false, true);

			const audioBlob = await audioRecorderComponent.stopRecording();
			console.log('✅ Recording stopped successfully');

			// Convert blob to base64
			const base64 = await new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const base64Data = reader.result as string;
					resolve(base64Data.split(',')[1]);
				};
				reader.readAsDataURL(audioBlob);
			});

			console.log('🎤 Sending audio for transcription...');
			const response = await $transcribeAudioMutation.mutateAsync({
				audioBase64: base64
			});

			if (response.data?.text) {
				transcription = response.data.text;
				console.log('📝 Transcription result:', transcription);
			}
		} catch (error) {
			console.error('❌ Processing failed:', error);
		} finally {
			isProcessing = false;
			onRecordingStateChange(false, false);
			isOpen = false; // Close the modal after processing
		}
	};

	function handleRecordingStateChange(event: CustomEvent<{ isRecording: boolean }>) {
		isRecording = event.detail.isRecording;
		onRecordingStateChange(isRecording, isProcessing);
		console.log('🎤 Recording state changed:', isRecording);
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-lg"
		transition:fade={{ duration: 200 }}
	>
		<div class="relative z-10 w-full max-w-lg mx-auto mb-32">
			<div class="relative flex flex-col items-center justify-center mx-auto text-center">
				{#if isRecording}
					<!-- Recording State: User Avatar -->
					<div class="mb-24">
						<AudioVisualizer {isRecording} {audioStream} mode="user" />
					</div>
				{:else if isProcessing}
					<!-- Processing State: Hominio Avatar -->
					<div class="mb-24">
						<AudioVisualizer {isRecording} {audioStream} mode="hominio" />
					</div>
				{/if}

				<!-- Keep AudioRecorder mounted but hidden -->
				<div class="hidden">
					<AudioRecorder
						bind:this={audioRecorderComponent}
						bind:isRecording
						bind:audioStream
						on:stateChange={handleRecordingStateChange}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Transcription Message Bubble -->
{#if transcription && !isProcessing && !isRecording}
	<div
		class="fixed z-40 max-w-md px-6 py-3 mx-auto -translate-x-1/2 bottom-24 left-1/2 rounded-2xl bg-surface-900/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
	>
		<p class="text-base text-tertiary-200">
			{transcription}
		</p>
	</div>
{/if}

<style>
	/* Custom scrollbar for transcription */
	p {
		scrollbar-width: thin;
		scrollbar-color: rgb(var(--color-tertiary-500)) transparent;
	}

	p::-webkit-scrollbar {
		width: 4px;
	}

	p::-webkit-scrollbar-track {
		background: transparent;
	}

	p::-webkit-scrollbar-thumb {
		background-color: rgb(var(--color-tertiary-500));
		border-radius: 20px;
	}
</style>
