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
		videoId: string;
		poster: string;
	}

	const allVideos: Video[] = [
		{
			id: 'intro',
			title: 'Intro',
			description: 'The beginning of an exciting journey',
			videoId: 'e65bf307-0a20-4441-8c81-08e6158beae9',
			poster: 'images/intro_poster.jpg'
		},
		{
			id: '001',
			title: '001 - "Someday" I will do ... was yesterday',
			description: 'The day I jumped and took action on the biggest decision of my life',
			videoId: '98c07c4f-6bf8-4f3b-9f48-4f6d563d858f',
			poster: 'images/001_poster.png'
		},
		{
			id: '002',
			title: '002 - We Filed 136 Documents Just to Exist in Germany.',
			description:
				'Ever wondered what happens when German efficiency meets startup dreams? Join me on a 180-day adventure through a maze of paperwork, where proving your existence requires more documents than launching a spacecraft.',
			videoId: 'a9b3aa34-be53-4348-9064-d6739d9106bb',
			poster: 'images/002_poster.png'
		},
		{
			id: '003',
			title: '003 - From Chaos to Focus - How We Built Our Startup MVP in 24 Hours',
			description:
				"Ever wondered what it's like to build a startup from scratch? Join Chielo, Samuel and Yvonne as they navigate the chaotic world of MVPs (Minimum Viable Products) building the first working prototype! Watch as they code through the night, fuel up on bavarian beer, and receive an unexpected visitor that changes everything.",
			videoId: 'e124e51c-9db3-4f1c-a7ec-8894c9f793df',
			poster: 'images/003_poster.png'
		},
		{
			id: '004',
			title: '004 - Visioncreators who co-create Hominio today will co-own tomorrow',
			description:
				"We're thrilled to share the next chapter in our story - a video that reveals how Visioncreators like you aren't just users, but true co-creators and co-owners of what we're building. Get ready to see how every contribution, from testing Hominio's features to shaping our community, is part of a bigger vision where success is shared by all.",
			videoId: 'c71eea95-faad-4b50-8bab-967aca8dbc2a',
			poster: 'images/004_poster.png'
		}
	];
	const reversedVideos: Video[] = [...allVideos].reverse();
	const videos: Writable<Video[]> = writable(reversedVideos);

	let selectedVideo: Video = reversedVideos[0];
	let videoPlayer: any;

	function selectVideo(video: Video) {
		selectedVideo = video;
	}

	onMount(() => {
		const videoParam = $page.url.searchParams.get('video');
		if (videoParam) {
			const video = allVideos.find((v) => v.id === videoParam);
			if (video) {
				selectedVideo = video;
			}
		}
	});
</script>

<div class="flex overflow-hidden flex-col p-4 h-screen md:flex-row text-surface-50">
	<div class="flex flex-col w-full h-full md:w-2/3 md:pr-4 md:overflow-hidden">
		<div class="sticky top-0 z-10 px-4 pt-4 -mx-4 bg-surface-900 md:static md:p-0 md:m-0">
			<h2 class="mb-4 text-2xl font-bold text-primary-400">Now Playing</h2>
			<VideoPlayer bind:this={videoPlayer} videoId={selectedVideo.videoId} />
		</div>

		<div class="overflow-y-auto flex-1 pb-20 md:overflow-hidden">
			<div class="mt-4">
				<h1 class="text-2xl font-semibold h1 md:text-3xl text-primary-200">
					{selectedVideo.title}
				</h1>
				<p class="mt-2 text-base md:text-lg text-primary-100">{selectedVideo.description}</p>
			</div>

			<div class="mt-8 md:hidden">
				<h2 class="mb-4 text-2xl font-bold text-primary-400">Episodes</h2>
				<div class="space-y-4">
					{#each $videos as video (video.id)}
						<button
							class="flex overflow-hidden relative w-full text-left rounded-lg shadow-lg cursor-pointer video-card bg-surface-700"
							on:click={() => selectVideo(video)}
						>
							<div class="relative w-2/5">
								<div class="aspect-w-16 aspect-h-9">
									<img src={video.poster} alt={video.title} class="object-cover w-full h-full" />
									{#if video.id === selectedVideo.id}
										<div
											class="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50"
										>
											<Icon icon="mdi:play" class="text-3xl text-white" />
										</div>
									{/if}
								</div>
							</div>
							<div class="p-3 w-3/5">
								<h3 class="text-sm font-semibold line-clamp-2">{video.title}</h3>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="hidden pl-4 w-1/3 md:flex md:flex-col md:h-full episode-list">
		<h2 class="mb-4 text-2xl font-bold text-primary-400">Episodes</h2>
		<div class="overflow-y-auto flex-1 pr-2 space-y-4">
			{#each $videos as video (video.id)}
				<button
					class="flex overflow-hidden relative w-full text-left rounded-lg shadow-lg cursor-pointer video-card bg-surface-700"
					on:click={() => selectVideo(video)}
				>
					<div class="relative w-2/5">
						<div class="aspect-w-16 aspect-h-9">
							<img src={video.poster} alt={video.title} class="object-cover w-full h-full" />
							{#if video.id === selectedVideo.id}
								<div
									class="flex absolute inset-0 justify-center items-center bg-black bg-opacity-50"
								>
									<Icon icon="mdi:play" class="text-3xl text-white" />
								</div>
							{/if}
						</div>
					</div>
					<div class="p-3 w-3/5">
						<h3 class="text-sm font-semibold line-clamp-2">{video.title}</h3>
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

	.episode-list {
		scrollbar-width: thin;
		scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
	}

	.episode-list::-webkit-scrollbar {
		width: 6px;
	}

	.episode-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.episode-list::-webkit-scrollbar-thumb {
		background-color: rgba(155, 155, 155, 0.5);
		border-radius: 20px;
		border: transparent;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
