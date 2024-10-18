<script lang="ts">
	import { onMount } from 'svelte';

	let isRecording = false;
	let transcript = '';
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];

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
		} catch (error) {
			console.error('Error sending audio to server:', error);
		}
	}
</script>

<div
	class="flex flex-col items-center justify-center min-h-screen bg-gradient-radial bg-surface-900"
>
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

	<div class="w-full max-w-md p-4 rounded-lg bg-surface-800 dark:bg-surface-900">
		<h2 class="mb-2 text-xl font-bold text-white dark:text-tertiary-300">Transcript:</h2>
		<p class="text-white dark:text-tertiary-300">{transcript}</p>
	</div>
</div>

<style>
	:global(.bg-gradient-radial) {
		background-image: radial-gradient(
			circle,
			var(--tw-gradient-from) 0%,
			var(--tw-gradient-to) 100%
		);
	}
</style>
