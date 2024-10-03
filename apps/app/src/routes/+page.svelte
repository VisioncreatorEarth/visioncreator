<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { futureMe } from '$lib/stores';
	import { dev } from '$app/environment';

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
			<div class="flex flex-col items-center justify-center w-full h-full pb-16">
				<div class="w-full max-w-3xl p-4 text-center flex flex-col space-y-4">
					<div class="text-center p-6 @md:p-8 rounded-xl">
						<img
							src="/logo.png"
							alt="Visioncreator logo"
							class="w-20 @3xl:w-32 mx-auto mb-6 opacity-70"
						/>
						<h2
							class="lowercase text-tertiary-300 text-2xl @md:text-3xl @lg:text-4xl font-bold mb-2"
						>
							Coming Soon
						</h2>
					</div>
					<Countdown large={true} />
					{#if dev}
						<p class="text-lg @md:text-xl text-tertiary-200">
							sign up to our waitlist and join our exciting journey
						</p>
						<div class="w-full space-y-4">
							<input
								bind:value={$futureMe.name}
								placeholder="Enter your first name, future Visioncreator"
								class="max-w-xl w-full px-4 py-3 @md:px-6 @md:py-4 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border-2 rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
							/>
							<button
								on:click={() => drawerStore.open({ position: 'bottom' })}
								class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
							>
								Sign Up Now
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
	<footer class="fixed inset-x-0 bottom-0 py-2 @sm:py-4 text-white">
		<div class="flex justify-between @sm:justify-center items-center px-2 @sm:px-0">
			<div class="flex space-x-2 @sm:space-x-4 pl-2">
				<a href="/en/privacy-policy" class="text-2xs @sm:text-xs">Privacy Policy - Datenschutz</a>
				<a href="/en/imprint" class="text-2xs @sm:text-xs">Site Notice - Impressum</a>
			</div>
			<div class="relative">
				{#if dev}
					<button
						class="badge variant-ghost-tertiary text-2xs @sm:text-xs ml-2 @sm:ml-4 absolute bottom-0 right-0"
						on:click={() => drawerStore.open({ position: 'bottom', action: 'login' })}
					>
						Login
					</button>
				{/if}
				<div
					class="p-4 -mb-2 -mr-2"
					on:click={() => drawerStore.open({ position: 'bottom', action: 'login' })}
				/>
			</div>
		</div>
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

	input::placeholder {
		color: #d1d5db;
	}

	input:focus {
		outline: none;
		box-shadow: 0 0 0 1px theme('colors.primary.500');
	}
</style>
