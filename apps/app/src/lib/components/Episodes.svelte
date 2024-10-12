<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	interface Video {
		id: string;
		title: string;
		hookTitle: string;
		description: string;
		poster: string;
		youtubeId: string;
	}

	const allVideos: Video[] = [
		{
			id: 'intro',
			title: 'Intro',
			hookTitle: 'The beginning of an exciting journey',
			description: 'The beginning of an exciting journey',
			poster: 'introposter.jpg',
			youtubeId: 'rRtBklL49gM'
		},
		{
			id: 'episode1',
			title: 'Episode 1',
			hookTitle: 'The day I jumped and took action on the biggest decision of my life',
			description: 'The day I jumped and took action on the biggest decision of my life',
			poster: '001_poster.png',
			youtubeId: 'K8iiYmb0r10'
		}
	];

	const videos: Writable<Video[]> = writable(allVideos);

	let selectedVideo: Video = $videos[1]; // Start with Episode 1
	let playerElement: HTMLElement | null = null;
	let isPlaying: boolean = false;

	onMount(() => {
		import('vidstack/bundle').catch(console.error).then(() => {
			playerElement = document.querySelector('media-player');

			if (playerElement) {
				playerElement.addEventListener('ended', handlePlaybackEnded);
			}
		});

		return () => {
			if (playerElement) {
				playerElement.removeEventListener('ended', handlePlaybackEnded);
			}
		};
	});

	function handlePlaybackEnded() {
		isPlaying = false;
		moveToNextVideo();
	}

	function moveToNextVideo() {
		const currentIndex = $videos.findIndex((v) => v.id === selectedVideo.id);
		if (currentIndex < $videos.length - 1) {
			selectedVideo = $videos[currentIndex + 1];
		} else {
			selectedVideo = $videos[0];
		}
	}

	function selectVideo(video: Video) {
		selectedVideo = video;
		isPlaying = false;
	}

	function playVideo() {
		isPlaying = true;
		setTimeout(() => {
			if (playerElement) {
				(playerElement as any).play();
			}
		}, 100);
	}
</script>

<div class="video-grid flex bg-surface-800 text-surface-50 p-4">
	<div class="main-view w-2/3 pr-4">
		<h2 class="text-2xl font-bold mb-4 text-primary-400">Now Playing</h2>
		<div class="aspect-w-16 aspect-h-9 bg-surface-600 rounded-lg overflow-hidden relative">
			{#if !isPlaying}
				<img
					src={selectedVideo.poster}
					alt={selectedVideo.title}
					class="object-cover w-full h-full"
				/>
				<div
					class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50"
				>
					<h1 class="h1 text-primary-300 mb-8 text-center px-4">
						{selectedVideo.title} - {selectedVideo.hookTitle}
					</h1>
					<button
						class="bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-full flex items-center"
						on:click={playVideo}
					>
						<Icon icon="mdi:play" class="mr-2 text-2xl" />
						Play
					</button>
				</div>
			{:else}
				<div class="video-container">
					<media-player
						src={`https://youtu.be/${selectedVideo.youtubeId}`}
						on:ended={handlePlaybackEnded}
						poster={selectedVideo.poster}
						playsinline
						autoplay
					>
						<media-provider>
							<media-video-quality default-quality="1080p" />
						</media-provider>
						<media-plyr-layout />
					</media-player>
				</div>
			{/if}
		</div>
		<h3 class="text-xl font-semibold mt-4">{selectedVideo.title}: {selectedVideo.hookTitle}</h3>
		<p class="text-primary-300">{selectedVideo.description}</p>
	</div>

	<div class="episode-list w-1/3 pl-4">
		<h2 class="text-2xl font-bold mb-4 text-primary-400">Episodes</h2>
		<div class="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
			{#each $videos as video (video.id)}
				<button
					class="video-card bg-surface-700 rounded-lg overflow-hidden shadow-lg flex cursor-pointer w-full text-left relative"
					on:click={() => selectVideo(video)}
				>
					<div class="w-1/3 relative">
						<img src={video.poster} alt={video.title} class="object-cover w-full h-full" />
						<div class="absolute inset-0 flex items-center justify-center">
							<Icon icon="mdi:play" class="text-primary-300 text-3xl" />
						</div>
					</div>
					<div class="w-2/3 p-4">
						<h3 class="text-lg font-semibold">{video.title}</h3>
						<p class="text-sm text-primary-300">{video.hookTitle}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>
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

	/* Hide the default play button */
	:global(media-player .plyr__control--overlaid) {
		display: none !important;
	}
</style>
