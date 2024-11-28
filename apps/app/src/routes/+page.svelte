<MicTest />

<!-- <script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { futureMe } from '$lib/stores';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

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
			window.dispatchEvent(
				new CustomEvent('openModal', {
					detail: { type: 'signup' },
					bubbles: true
				})
			);
		}
	}

	function openSignUp() {
		// Create a custom event that bubbles up through the DOM
		window.dispatchEvent(
			new CustomEvent('openModal', {
				detail: { type: 'signup' },
				bubbles: true
			})
		);
	}
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

	<div class="flex flex-col overlay">
		<div class="flex overflow-y-auto flex-col flex-grow justify-center items-center p-4">
			<div class="flex flex-col mb-4 space-y-4 w-full max-w-3xl text-center">
				<img
					src="/logo.png"
					alt="Visioncreator logo"
					class="mx-auto mb-4 w-20 opacity-70 lg:w-28"
				/>

				<div class="w-full max-w-3xl video-wrapper">
					<VideoPlayer videoId="e65bf307-0a20-4441-8c81-08e6158beae9" />
				</div>
				<p class="@sm:text-lg text-xl text-tertiary-200">
					Follow along our journey and join our waitlist now
				</p>
				<div class="flex justify-center mt-4">
					<button
						on:click={openSignUp}
						class="bg-gradient-to-br signup-btn btn variant-gradient-secondary-primary"
					>
						Sign Up Now
					</button>
				</div>
			</div>
		</div>
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
</style> -->
