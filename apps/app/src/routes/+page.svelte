<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { futureMe } from '$lib/stores';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';

	const drawerStore = getDrawerStore();
	let videoElement: HTMLVideoElement;
	let contentWrapper: HTMLDivElement;

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
			window.addEventListener('resize', setViewportHeight);
			if (videoElement) {
				videoElement.load();
			}
			setViewportHeight();
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('keydown', handleKeydown);
				window.removeEventListener('resize', setViewportHeight);
			}
		};
	});

	function setViewportHeight() {
		if (contentWrapper) {
			contentWrapper.style.height = `${window.innerHeight}px`;
		}
	}

	$: {
		const urlParams = $page.url.searchParams;
		const urlVisionId = urlParams.get('visionid');

		if (typeof window !== 'undefined' && urlVisionId) {
			futureMe.update((current) => ({
				...current,
				visionid: urlVisionId
			}));
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			drawerStore.open({ position: 'bottom' });
		}
	}

	function openSignUpDrawer() {
		drawerStore.open({ position: 'bottom', action: 'signup' });
	}

	const introVideoUrl = 'https://youtu.be/rRtBklL49gM';
	const introPosterFrame = 'introposter.jpg';
</script>

<svelte:window on:keydown={handleKeydown} />
<div bind:this={contentWrapper} class="content-wrapper">
	<video
		bind:this={videoElement}
		autoplay
		loop
		muted
		playsinline
		class="background-video"
		poster="wald-first-frame.jpg"
	>
		<source src="wald.mp4" type="video/mp4" />
	</video>

	<div class="overlay flex flex-col">
		<div class="flex-grow flex flex-col justify-center items-center p-4 overflow-y-auto">
			<div class="w-full max-w-3xl text-center flex flex-col space-y-4 mb-4">
				<img
					src="/logo.png"
					alt="Visioncreator logo"
					class="w-20 lg:w-28 mx-auto mb-4 opacity-70"
				/>

				<div class="w-full max-w-3xl video-wrapper">
					<VideoPlayer youtubeId="rRtBklL49gM" posterFrame={introPosterFrame} />
				</div>
				<p class="@sm:text-lg text-xl text-tertiary-200">
					Follow along our journey and join our waitlist now
				</p>
				<div class="flex justify-center mt-4">
					<button
						on:click={openSignUpDrawer}
						class="signup-btn btn bg-gradient-to-br variant-gradient-secondary-primary"
					>
						Sign Up Now
					</button>
				</div>
			</div>
		</div>
		<footer class="py-2 @sm:py-2 text-white">
			<div class="flex justify-between items-center px-4 @sm:px-4">
				<div class="flex space-x-2 @sm:space-x-4">
					<a href="/en/privacy-policy" class="text-2xs @sm:text-xs">Privacy Policy - Datenschutz</a>
					<a href="/en/imprint" class="text-2xs @sm:text-xs">Site Notice - Impressum</a>
				</div>
				<button
					class="btn btn-sm variant-ghost-tertiary text-xs"
					on:click={() => drawerStore.open({ position: 'bottom', action: 'login' })}
				>
					Login
				</button>
			</div>
		</footer>
	</div>
</div>

<style>
	:global(body) {
		background-color: rgba(24, 25, 73, 1); /* Match the start color of your gradient */
	}

	.content-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}

	.background-video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(to top, rgba(24, 25, 73, 0.7), rgba(210, 220, 180, 0.3));
		display: flex;
		flex-direction: column;
	}

	.video-wrapper {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		max-height: 50vh;
	}

	.video-wrapper :global(media-player) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	@media (max-height: 700px) {
		.video-wrapper {
			max-height: 40vh;
		}
	}
</style>
