<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { futureMe } from '$lib/stores';
	import { readable } from 'svelte/store';

	const launchDate = new Date('2024-09-21T21:09:24+02:00').getTime();

	const countdown = readable(0, (set) => {
		const interval = setInterval(() => {
			const now = new Date().getTime();
			const distance = launchDate - now;
			set(Math.floor(distance / 1000));
		}, 1000);

		return () => clearInterval(interval);
	});

	onMount(() => {
		// Countdown is automatically started due to the readable store
	});

	const drawerStore = getDrawerStore();

	function openSignupModal() {
		drawerStore.open({ position: 'bottom' });
	}

	const labels = {
		nameInput: {
			placeholder: "What's your name?"
		}
	};

	onMount(() => {
		if (typeof window !== 'undefined') {
			// Add global keydown event listener
			window.addEventListener('keydown', handleKeydown);
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
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="video-container">
	<video autoplay loop muted playsinline class="background-video">
		<source src="wald.mp4" type="video/mp4" />
	</video>

	<div class="h-full overlay">
		<div class="@container h-full">
			<div class="flex flex-col items-center justify-center w-full h-full">
				{#if $countdown > 0}
					<div
						class="h1 text-4xl sm:text-6xl md:text-8xl font-bold text-white mb-4 sm:mb-8 tracking-wider opacity-75"
					>
						{Math.floor($countdown / 86400)}d {Math.floor(($countdown % 86400) / 3600)}h {Math.floor(
							($countdown % 3600) / 60
						)}m {$countdown % 60}s
					</div>
				{:else}
					<div
						class="h1 text-4xl sm:text-6xl md:text-8xl font-bold text-center text-white mb-4 sm:mb-8 tracking-wider opacity-75"
					>
						you are amazing
					</div>
				{/if}

				<div class="w-full max-w-6xl mb-4">
					<input
						bind:value={$futureMe.name}
						placeholder={labels.nameInput.placeholder}
						class="w-full px-4 py-3 @md:px-6 @md:py-4 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border-2 rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
					/>
				</div>

				<button
					type="button"
					class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
					on:click={() => drawerStore.open({ position: 'bottom' })}
				>
					Sign Up to Waitlist
				</button>
			</div>
		</div>
	</div>

	<footer class="fixed inset-x-0 bottom-0 p-4 text-xs text-center text-white">
		<button on:click={() => drawerStore.open({ position: 'bottom' })} class="mx-2">Login</button>
		<a href="/data-privacy" class="mx-2">Data Privacy</a>
		<a href="/imprint" class="mx-2">Imprint</a>
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
