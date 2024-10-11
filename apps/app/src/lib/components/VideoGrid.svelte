<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import InstagramShare from './InstagramShare.svelte';

	interface Video {
		id: number;
		title: string;
		hookTitle: string;
		description: string;
		image: string;
		watched: boolean;
	}

	let showShareScreen = false;

	function getRandomImageUrl(): string {
		return `https://random.imagecdn.app/1080/600?${Math.random().toString()}`;
	}

	const allVideos: Video[] = [
		{
			id: 1,
			title: 'Intro',
			hookTitle: 'The Journey Begins',
			description: 'Embark on an epic adventure that will change everything.',
			image: getRandomImageUrl(),
			watched: false
		},
		{
			id: 2,
			title: 'Episode 1',
			hookTitle: 'The Unexpected Turn',
			description: 'A surprising twist sets the stage for an unforgettable journey.',
			image: getRandomImageUrl(),
			watched: false
		},
		{
			id: 3,
			title: 'Episode 2',
			hookTitle: 'A Revelation Unfolds',
			description: 'Secrets are revealed that will shake the foundation of everything.',
			image: getRandomImageUrl(),
			watched: false
		},
		{
			id: 4,
			title: 'Episode 3',
			hookTitle: 'Secrets Unveiled',
			description: 'The truth comes to light, changing the course of the adventure.',
			image: getRandomImageUrl(),
			watched: false
		},
		{
			id: 5,
			title: 'Episode 4',
			hookTitle: 'The Turning Point',
			description: "A crucial decision must be made that will affect everyone's fate.",
			image: getRandomImageUrl(),
			watched: false
		}
	];

	const videos: Writable<Video[]> = writable(allVideos);

	let selectedVideo: Video = $videos[0] ?? allVideos[0];
	let playerElement: HTMLElement | null = null;
	let isPlaying: boolean = false;

	onMount(() => {
		import('vidstack/bundle').catch(console.error).then(() => {
			playerElement = document.querySelector('media-player') as HTMLElement;

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
		markAsWatched(selectedVideo);
		moveToNextVideo();
		// showShareScreen = true; // Commented out Instagram share step
	}

	function moveToNextVideo() {
		const currentIndex = $videos.findIndex((v) => v.id === selectedVideo.id);
		if (currentIndex < $videos.length - 1) {
			selectedVideo = $videos[currentIndex + 1];
		} else {
			selectedVideo = $videos[0];
		}
		showShareScreen = false;
	}

	function selectVideo(video: Video) {
		selectedVideo = video;
		isPlaying = false;
	}

	function playVideo() {
		isPlaying = true;
		setTimeout(() => {
			if (playerElement) {
				(playerElement as HTMLMediaElement).play();
			}
		}, 100);
	}

	function markAsWatched(video: Video) {
		videos.update((vs) => vs.map((v) => (v.id === video.id ? { ...v, watched: true } : v)));
	}

	// function handleShareComplete() {
	//     showShareScreen = false;
	//     moveToNextVideo();
	// }
</script>

<div class="video-grid flex bg-surface-800 text-surface-50 p-4">
	<div class="main-view w-2/3 pr-4">
		<h2 class="text-2xl font-bold mb-4 text-primary-400">Now Playing</h2>
		<div class="aspect-w-16 aspect-h-9 bg-surface-600 rounded-lg overflow-hidden relative">
			<!-- {#if showShareScreen}
                <div class="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-4">
                    <h1 class="h1 text-primary-300 mb-8 text-center px-4">Spread the movement</h1>
                    <InstagramShare
                        title={selectedVideo.title}
                        hookTitle={selectedVideo.hookTitle}
                        shareableImageUrl={selectedVideo.image}
                        episodeNumber={selectedVideo.id}
                        on:shareComplete={handleShareComplete}
                    />
                    <button class="mt-12 btn btn-sm variant-ghost-secondary" on:click={moveToNextVideo}>
                        <Icon icon="mdi:skip-next" class="mr-2 text-2xl" /> Skip -> Watch Next
                    </button>
                </div>
            {:else if !isPlaying} -->
			{#if !isPlaying}
				<img
					src={selectedVideo.image}
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
						src="https://youtu.be/_kUV-SWIAMQ"
						on:ended={handlePlaybackEnded}
						poster={selectedVideo.image}
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
						<img src={video.image} alt={video.title} class="object-cover w-full h-full" />
						<div class="absolute inset-0 flex items-center justify-center">
							<Icon icon="mdi:play" class="text-primary-300 text-3xl" />
						</div>
					</div>
					<div class="w-2/3 p-4">
						<h3 class="text-lg font-semibold">{video.title}</h3>
						<p class="text-sm text-primary-300">{video.hookTitle}</p>
					</div>
					{#if video.watched}
						<div class="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
							<Icon icon="mdi:check" />
						</div>
					{/if}
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
