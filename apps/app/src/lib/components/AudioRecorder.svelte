<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';

	const dispatch = createEventDispatcher<{
		stateChange: { isRecording: boolean };
	}>();

	let audioStream: MediaStream | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	export let isRecording = false;

	export async function startRecording() {
		try {
			audioStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			mediaRecorder = new MediaRecorder(audioStream, {
				mimeType: 'audio/webm;codecs=opus'
			});

			audioChunks = [];
			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.start(50);
			isRecording = true;
			dispatch('stateChange', { isRecording: true });
		} catch (error) {
			console.error('❌ Recording setup failed:', error);
			cleanup();
			throw error;
		}
	}

	export async function stopRecording(): Promise<Blob> {
		if (!mediaRecorder || !isRecording) {
			throw new Error('No active recording');
		}

		try {
			const chunks = await new Promise<Blob[]>((resolve) => {
				const currentChunks = [...audioChunks];
				mediaRecorder!.addEventListener('stop', () => resolve(currentChunks), { once: true });
				mediaRecorder!.requestData();
				mediaRecorder!.stop();
			});

			return new Blob(chunks, { type: 'audio/webm' });
		} finally {
			cleanup();
		}
	}

	function cleanup() {
		if (mediaRecorder?.state === 'recording') {
			mediaRecorder.stop();
		}

		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
			audioStream = null;
		}

		mediaRecorder = null;
		audioChunks = [];
		isRecording = false;
		dispatch('stateChange', { isRecording: false });
	}

	onDestroy(cleanup);
</script>

<div class="flex items-center justify-center h-48">
	<AudioVisualizer mode="user" {isRecording} {audioStream} />
</div>
