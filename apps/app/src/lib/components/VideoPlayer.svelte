<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';

	export let youtubeUrl: string;
	export let posterFrame: string;

	const dispatch = createEventDispatcher();

	let playerElement: HTMLElement | null = null;

	onMount(() => {
		import('vidstack/bundle')
			.then(() => {
				playerElement = document.querySelector('media-player');

				if (playerElement) {
					playerElement.addEventListener('play', handlePlaybackStarted);
					playerElement.addEventListener('ended', handlePlaybackEnded);

					// Ensure highest quality is selected
					playerElement.addEventListener('can-play', () => {
						const player = playerElement as any;
						if (player.qualities && player.qualities.length > 0) {
							const highestQuality = player.qualities[player.qualities.length - 1];
							player.quality = highestQuality.value;
						}
					});

					// Additional listener for quality change
					playerElement.addEventListener('quality-change', () => {
						const player = playerElement as any;
						if (player.qualities && player.qualities.length > 0) {
							const highestQuality = player.qualities[player.qualities.length - 1];
							player.quality = highestQuality.value;
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
		(playerElement as any)?.enterFullscreen?.().catch((error: Error) => {
			console.error('Failed to enter fullscreen:', error);
		});
	}

	function handlePlaybackEnded() {
		if (playerElement) {
			(playerElement as any).exitFullscreen?.().catch((error: Error) => {
				console.error('Failed to exit fullscreen:', error);
			});
		}
		dispatch('videoEnded');
	}
</script>

<div class="video-container">
	<media-player src={youtubeUrl} poster={posterFrame} crossorigin playsinline>
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
