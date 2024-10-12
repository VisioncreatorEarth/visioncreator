<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import Icon from '@iconify/svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	interface Video {
		id: string;
		title: string;
		description: string;
		poster: string;
		youtubeId: string;
	}

	const allVideos: Video[] = [
		{
			id: 'intro',
			title: 'Intro',
			description: 'The beginning of an exciting journey',
			poster: 'images/intro_poster.jpg',
			youtubeId: 'rRtBklL49gM'
		},
		{
			id: '001',
			title: '001 - "Someday" I will do ... was yesterday',
			description: 'The day I jumped and took action on the biggest decision of my life',
			poster: 'images/001_poster.png',
			youtubeId: 'K8iiYmb0r10'
		}
	];
	const reversedVideos: Video[] = [...allVideos].reverse();
	const videos: Writable<Video[]> = writable(reversedVideos);

	let selectedVideo: Video = reversedVideos[0];
	let videoPlayer: VideoPlayer;

	onMount(() => {
		const videoId = $page.url.searchParams.get('video');
		if (videoId) {
			const video = $videos.find((v) => v.id === videoId);
			if (video) {
				selectedVideo = video;
			}
		}
	});

	function handlePlaybackEnded() {
		resetVideo();
		moveToNextVideo();
	}

	function resetVideo() {
		if (videoPlayer) {
			videoPlayer.reset();
		}
	}

	function moveToNextVideo() {
		const currentIndex = $videos.findIndex((v) => v.id === selectedVideo.id);
		if (currentIndex < $videos.length - 1) {
			selectedVideo = $videos[currentIndex + 1];
		} else {
			selectedVideo = $videos[0];
		}
		updateURL(selectedVideo.id);
		resetVideo();
	}

	function selectVideo(video: Video) {
		selectedVideo = video;
		updateURL(video.id);
		resetVideo();
	}

	function updateURL(videoId: string) {
		const url = new URL(window.location.href);
		url.searchParams.set('video', videoId);
		window.history.pushState({}, '', url.toString());
	}
</script>

<div class="video-grid flex flex-col md:flex-row text-surface-50 p-4 h-full overflow-hidden">
	<div class="main-view w-full md:w-2/3 md:pr-4 mb-8 md:mb-0 overflow-y-auto">
		<h2 class="text-2xl font-bold mb-4 text-primary-400">Now Playing</h2>
		<div class="aspect-w-16 aspect-h-9 bg-surface-600 rounded-lg overflow-hidden relative mb-4">
			<VideoPlayer
				bind:this={videoPlayer}
				youtubeId={selectedVideo.youtubeId}
				posterFrame={selectedVideo.poster}
				on:videoEnded={handlePlaybackEnded}
			/>
		</div>
		<h1 class="h1 text-2xl md:text-3xl font-semibold mb-3 text-primary-200">
			{selectedVideo.title}
		</h1>
		<p class="text-base md:text-lg text-primary-100">{selectedVideo.description}</p>
	</div>
	<div class="episode-list w-full md:w-1/3 md:pl-4 flex flex-col overflow-hidden">
		<h2 class="text-2xl font-bold mb-4 text-primary-400">Episodes</h2>
		<div class="space-y-4 overflow-y-auto flex-grow">
			{#each $videos as video (video.id)}
				<button
					class="video-card bg-surface-700 rounded-lg overflow-hidden shadow-lg cursor-pointer w-full text-left relative flex"
					on:click={() => selectVideo(video)}
				>
					<div class="w-2/5 md:w-1/3 relative">
						<div class="aspect-w-16 aspect-h-9">
							<img
								src={video.poster}
								alt={video.title}
								class="absolute inset-0 object-cover w-full h-full"
							/>
							<div class="absolute inset-0 flex items-center justify-center">
								<Icon icon="mdi:play" class="text-primary-300 text-3xl" />
							</div>
						</div>
					</div>
					<div
						class="w-3/5 md:w-2/3 px-4 py-2 sm:px-5 sm:py-3 flex flex-col justify-center overflow-hidden"
					>
						<h3 class="text-sm sm:text-base font-semibold truncate">{video.title}</h3>
						<p class="text-xs sm:text-sm text-primary-300 line-clamp-2 mt-1">{video.description}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	:global(html, body) {
		height: 100%;
		overflow: hidden;
	}

	:global(#app) {
		height: 100%;
		overflow: hidden;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
