<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let youtubeId: string;
	export let posterFrame: string;

	const dispatch = createEventDispatcher();
	const baseUrl = 'https://www.youtube-nocookie.com/watch?v=';

	let playerElement: any = null;

	onMount(() => {
		import('vidstack/bundle')
			.then(() => {
				playerElement = document.querySelector('media-player');

				if (playerElement) {
					playerElement.addEventListener('play', handlePlaybackStarted);
					playerElement.addEventListener('ended', handlePlaybackEnded);

					// Ensure highest quality is selected
					playerElement.addEventListener('can-play', () => {
						if (playerElement.qualities && playerElement.qualities.length > 0) {
							const highestQuality = playerElement.qualities[playerElement.qualities.length - 1];
							playerElement.quality = highestQuality.value;
						}
					});

					// Additional listener for quality change
					playerElement.addEventListener('quality-change', () => {
						if (playerElement.qualities && playerElement.qualities.length > 0) {
							const highestQuality = playerElement.qualities[playerElement.qualities.length - 1];
							playerElement.quality = highestQuality.value;
						}
					});
				}
			})
			.catch((error: Error) => console.error('Failed to load vidstack:', error));

		return () => {
			if (playerElement) {
				playerElement.removeEventListener('play', handlePlaybackStarted);
				playerElement.removeEventListener('ended', handlePlaybackEnded);
			}
		};
	});

	function handlePlaybackStarted() {
		if (playerElement && !playerElement.fullscreen) {
			playerElement.enterFullscreen().catch((error: Error) => {
				console.error('Failed to enter fullscreen:', error);
				// Fallback for iOS
				if (document.documentElement.requestFullscreen) {
					document.documentElement.requestFullscreen().catch(console.error);
				}
			});
		}
	}

	function handlePlaybackEnded() {
		if (playerElement) {
			if (playerElement.fullscreen) {
				playerElement.exitFullscreen().catch((error: Error) => {
					console.error('Failed to exit fullscreen:', error);
				});
			}
			// Fallback for iOS and other cases
			if (document.exitFullscreen) {
				document.exitFullscreen().catch(console.error);
			}

			// Reset the player to show the poster frame
			playerElement.currentTime = 0;
			playerElement.pause();
			playerElement.src = ''; // Clear the source
			setTimeout(() => {
				playerElement.src = `${baseUrl}${youtubeId}`; // Reset the source
				playerElement.load(); // Reload the player
			}, 100);
		}
		dispatch('videoEnded');
	}
</script>

<div class="video-container">
	<media-player src={`${baseUrl}${youtubeId}`} poster={posterFrame} crossorigin>
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
	:global(media-player::part(youtube)) {
		display: none !important;
	}
</style>
