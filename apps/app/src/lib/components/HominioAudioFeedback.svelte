<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';

	export let audioFile: string;

	const dispatch = createEventDispatcher<{
		complete: void;
	}>();

	let hominioAudio: HTMLAudioElement;
	let isPlaying = false;

	$: if (audioFile) {
		playFeedback();
	}

	async function playFeedback() {
		try {
			hominioAudio = new Audio(audioFile);
			isPlaying = true;

			hominioAudio.addEventListener('ended', () => {
				isPlaying = false;
				dispatch('complete');
			});

			await hominioAudio.play();
		} catch (error) {
			console.warn('⚠️ Audio feedback playback failed:', error);
			dispatch('complete');
		}
	}

	onDestroy(() => {
		if (hominioAudio) {
			hominioAudio.pause();
			hominioAudio = null;
		}
	});
</script>

<div class="flex items-center justify-center flex-1">
	<AudioVisualizer mode="hominio" isRecording={isPlaying} audioElement={hominioAudio} />
</div>
