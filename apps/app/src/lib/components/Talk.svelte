<script lang="ts">
	import { onMount } from 'svelte';

	let isRecording = false;
	let transcript = '';
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];

	export let onTranscriptReady: (text: string) => void;

	onMount(() => {
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				mediaRecorder = new MediaRecorder(stream);

				mediaRecorder.ondataavailable = (event) => {
					audioChunks.push(event.data);
				};

				mediaRecorder.onstop = async () => {
					const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
					await sendAudioToServer(audioBlob);
					audioChunks = [];
				};
			})
			.catch((error) => console.error('Error accessing microphone:', error));
	});

	function startRecording() {
		if (!isRecording && mediaRecorder) {
			mediaRecorder.start();
			isRecording = true;
			transcript = '';
		}
	}

	function stopRecording() {
		if (isRecording && mediaRecorder) {
			mediaRecorder.stop();
			isRecording = false;
		}
	}

	async function sendAudioToServer(audioBlob: Blob) {
		const formData = new FormData();
		formData.append('audio', audioBlob, 'recording.webm');

		try {
			const response = await fetch('/api/speech-to-text', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to transcribe audio');
			}

			const data = await response.json();
			transcript = data.text;
			onTranscriptReady(transcript);
		} catch (error) {
			console.error('Error sending audio to server:', error);
		}
	}
</script>

<div class="relative mb-8">
	<button
		on:mousedown={startRecording}
		on:mouseup={stopRecording}
		on:mouseleave={stopRecording}
		on:touchstart={startRecording}
		on:touchend={stopRecording}
		class="flex items-center justify-center w-32 h-32 overflow-hidden transition-all duration-200 ease-in-out rounded-full focus:outline-none"
		class:border-4={isRecording}
		class:border-red-500={isRecording}
	>
		<img src="/logo.png" alt="Logo" class="object-contain w-full h-full" />
	</button>
</div>
