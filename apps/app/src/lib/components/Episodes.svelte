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
		},
		{
			id: '002',
			title: '002 - We Filed 136 Documents Just to Exist in Germany.',
			description:
				'Ever wondered what happens when German efficiency meets startup dreams? Join me on a 180-day adventure through a maze of paperwork, where proving your existence requires more documents than launching a spacecraft.',
			poster: 'images/002_poster.png',
			youtubeId: 'QMo2eV_aKDY'
		},
		{
			id: '003',
			title: '003 - From Chaos to Focus - How We Built Our Startup MVP in 24 Hours',
			description:
				"Ever wondered what it's like to build a startup from scratch? Join Chielo, Samuel and Yvonne as they navigate the chaotic world of MVPs (Minimum Viable Products) building the first working prototype! Watch as they code through the night, fuel up on bavarian beer, and receive an unexpected visitor that changes everything.",
			poster: 'images/003_poster.png',
			youtubeId: 'VZFCBFkkjZk'
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

<div class="flex flex-col h-full p-4 overflow-hidden video-grid md:flex-row text-surface-50">
	<div class="w-full mb-8 overflow-y-auto main-view md:w-2/3 md:pr-4 md:mb-0">
		<h2 class="mb-4 text-2xl font-bold text-primary-400">Now Playing</h2>
		<div class="relative mb-4 overflow-hidden rounded-lg aspect-w-16 aspect-h-9 bg-surface-600">
			<VideoPlayer
				bind:this={videoPlayer}
				youtubeId={selectedVideo.youtubeId}
				posterFrame={selectedVideo.poster}
				on:videoEnded={handlePlaybackEnded}
			/>
		</div>
		<h1 class="mb-3 text-2xl font-semibold h1 md:text-3xl text-primary-200">
			{selectedVideo.title}
		</h1>
		<p class="text-base md:text-lg text-primary-100">{selectedVideo.description}</p>
	</div>
	<div class="flex flex-col w-full overflow-hidden episode-list md:w-1/3 md:pl-4">
		<h2 class="mb-4 text-2xl font-bold text-primary-400">Episodes</h2>
		<div class="flex-grow space-y-4 overflow-y-auto">
			{#each $videos as video (video.id)}
				<button
					class="relative flex w-full overflow-hidden text-left rounded-lg shadow-lg cursor-pointer video-card bg-surface-700"
					on:click={() => selectVideo(video)}
				>
					<div class="relative w-2/5 md:w-1/3">
						<div class="aspect-w-16 aspect-h-9">
							<img
								src={video.poster}
								alt={video.title}
								class="absolute inset-0 object-cover w-full h-full"
							/>
							<div class="absolute inset-0 flex items-center justify-center">
								<Icon icon="mdi:play" class="text-3xl text-primary-300" />
							</div>
						</div>
					</div>
					<div
						class="flex flex-col justify-center w-3/5 px-4 py-2 overflow-hidden md:w-2/3 sm:px-5 sm:py-3"
					>
						<h3 class="text-sm font-semibold truncate sm:text-base">{video.title}</h3>
						<p class="mt-1 text-xs sm:text-sm text-primary-300 line-clamp-2">{video.description}</p>
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
