<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { MediaPlayerElement } from 'vidstack/elements';

	const dispatch = createEventDispatcher();

	let playerElement: any = null; // Using 'any' to bypass TypeScript errors

	onMount(() => {
		import('vidstack/bundle')
			.then(() => {
				playerElement = document.querySelector('media-player');

				if (playerElement) {
					playerElement.addEventListener('play', handlePlaybackStarted);
					playerElement.addEventListener('ended', handlePlaybackEnded);
				}
			})
			.catch((error) => console.error('Failed to load vidstack:', error));

		return () => {
			if (playerElement) {
				playerElement.removeEventListener('play', handlePlaybackStarted);
				playerElement.removeEventListener('ended', handlePlaybackEnded);
			}
		};
	});

	function handlePlaybackStarted() {
		playerElement?.enterFullscreen?.().catch((error: Error) => {
			console.error('Failed to enter fullscreen:', error);
		});
	}

	function handlePlaybackEnded() {
		if (playerElement) {
			playerElement.exitFullscreen?.().catch((error: Error) => {
				console.error('Failed to exit fullscreen:', error);
			});
			// We're not resetting the currentTime or pausing the video
		}
		dispatch('videoEnded');
	}
</script>

<div class="video-container">
	<media-player src="https://youtu.be/rRtBklL49gM" poster="introposter.jpg" crossorigin>
		<media-provider>
			<media-video-quality default-quality="1080p" />
		</media-provider>
		<media-plyr-layout />
	</media-player>
</div>

<style>
	.video-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
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
