<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { futureMe } from '$lib/stores';

	const drawerStore = getDrawerStore();

	// const labels = {
	// 	nameInput: {
	// 		placeholder: "What's your name?"
	// 	}
	// };

	let videoElement: HTMLVideoElement;

	onMount(() => {
		if (typeof window !== 'undefined') {
			// Add global keydown event listener
			window.addEventListener('keydown', handleKeydown);

			// Load video after everything else
			if (videoElement) {
				videoElement.load();
			}
		}

		// Clean up the event listener when the component is destroyed
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('keydown', handleKeydown);
			}
		};
	});

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

	function openDrawer(isLogin: boolean) {
		drawerStore.open({ position: 'bottom', meta: { isLogin } });
	}
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="video-container">
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

	<div class="h-full overlay">
		<div class="@container h-full">
			<div class="flex flex-col items-center justify-center w-full h-full">
				<div class="w-full max-w-3xl mb-12 p-4 text-center flex flex-col space-y-8">
					<div
						class="glassmorphism-card text-center p-6 @md:p-8 rounded-xl shadow-2xl backdrop-blur-sm"
					>
						<h2 class="text-white text-2xl @md:text-3xl @lg:text-4xl font-bold mb-2">
							Coming Soon.
						</h2>
					</div>
					<Countdown large={true} />
					<!-- <p class="text-lg @md:text-xl text-white">
						Sign up for our weekly Visionletter. Join our journey and share it for a chance to
						receive 1 of 21 exclusive, once-in-a-lifetime pioneer suprises.
					</p> -->
					<!-- <div class="w-full">
						<input
							bind:value={$futureMe.name}
							placeholder="Your first name"
							class="w-full px-4 py-3 @md:px-6 @md:py-4 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border-2 rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
						/>
					</div> -->
				</div>

				<!-- <button
					on:click={() => drawerStore.open({ position: 'bottom', action: 'signup' })}
					class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
				>
					Visionletter Sign Up
				</button> -->
			</div>
		</div>
	</div>

	<footer class="fixed inset-x-0 bottom-0 p-4 text-xs text-center text-white">
		<!-- <button on:click={() => drawerStore.open({ position: 'bottom', action: 'login' })} class="mx-1"
			>Login</button
		> -->
		<a href="/en/privacy-policy" class="mx-1">Datenschutz - Privacy Policy</a>
		<a href="/en/imprint" class="mx-1">Impressum - Legal</a>
	</footer>
</div>

<style>
	.video-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		padding: 0;
		margin: 0;
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
		background: linear-gradient(to top, rgba(24, 25, 73, 0.842), rgba(230, 209, 74, 0.142));
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	/* input::placeholder {
		color: #d1d5db;
	}

	input:focus {
		outline: none;
		box-shadow: 0 0 0 1px theme('colors.primary.500');
	} */
</style>
