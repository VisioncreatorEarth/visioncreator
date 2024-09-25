<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { MediaPlayerElement } from 'vidstack/elements';

	const dispatch = createEventDispatcher();

	let playerElement: MediaPlayerElement | null = null;

	onMount(() => {
		import('vidstack/bundle').then(() => {
			playerElement = document.querySelector('media-player');

			if (playerElement) {
				playerElement.addEventListener('play', handlePlaybackStarted);
				playerElement.addEventListener('ended', handlePlaybackEnded);
			}
		});

		return () => {
			if (playerElement) {
				playerElement.removeEventListener('play', handlePlaybackStarted);
				playerElement.removeEventListener('ended', handlePlaybackEnded);
			}
		};
	});

	function handlePlaybackStarted() {
		playerElement?.enterFullscreen().catch((error) => {
			console.error('Failed to enter fullscreen:', error);
		});
	}

	function handlePlaybackEnded() {
		dispatch('videoEnded');
	}
</script>

<div class="video-container">
	<media-player title="Welcome" src="wald.mp4">
		<media-provider />
		<media-plyr-layout thumbnails="wald-first-frame.jpg" />
	</media-player>
</div>

<style>
	.video-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(media-player) {
		width: 100%;
		height: 100%;
	}

	:global(media-player::part(container)) {
		width: 100%;
		height: 100%;
	}
</style>
