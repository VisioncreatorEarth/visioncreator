<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { futureMe } from '$lib/stores';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import { readable } from 'svelte/store';

	let contentWrapper: HTMLDivElement;

	// Launch date: January 21st, 2025, 19:00 CET
	const launchDate = new Date('2025-01-21T19:00:00+01:00').getTime();

	const countdown = readable(0, (set) => {
		const interval = setInterval(() => {
			const now = new Date().getTime();
			const distance = launchDate - now;
			set(Math.max(0, Math.floor(distance / 1000)));
		}, 1000);

		return () => clearInterval(interval);
	});

	$: days = Math.floor($countdown / 86400);
	$: hours = Math.floor(($countdown % 86400) / 3600);
	$: minutes = Math.floor(($countdown % 3600) / 60);
	$: seconds = $countdown % 60;

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
			window.addEventListener('resize', setViewportHeight);
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
		window.dispatchEvent(
			new CustomEvent('openModal', {
				detail: { type: 'signup' },
				bubbles: true
			})
		);
	}
</script>

<div bind:this={contentWrapper} class="@container fixed inset-0 overflow-hidden">
	<div class="relative w-full h-full">
		<!-- Background Image -->
		<div
			class="absolute inset-0 bg-center bg-no-repeat bg-cover"
			style="background-image: url('/dashboard.jpg');"
		>
			<div class="absolute inset-0 bg-black/20" />
		</div>

		<!-- Grid Layout -->
		<div class="relative grid h-full grid-rows-[auto_1fr_auto]">
			<div class="z-10 pt-6 pb-4 text-center">
				<img src="/logo.png" alt="Visioncreator logo" class="mx-auto w-20 opacity-80" />
				<!-- Countdown -->
				<div class="mt-4 text-center">
					<h2 class="mb-4 text-base text-tertiary-300 sm:text-lg md:text-2xl">Launching BETA in</h2>
					<h1 class="text-3xl font-bold text-white sm:text-5xl">
						{days}d {hours.toString().padStart(2, '0')}h {minutes.toString().padStart(2, '0')}m {seconds
							.toString()
							.padStart(2, '0')}s
					</h1>
				</div>
			</div>
			<div class="flex overflow-hidden z-10 items-center w-full h-full">
				<div class="p-4 mx-auto w-full max-w-screen-md">
					<div class="relative w-full h-full aspect-[16/9] max-h-full">
						<div class="absolute inset-0">
							<VideoPlayer videoId="8fee2d57-e3c3-4580-bd11-ae828d86978d" />
						</div>
					</div>
				</div>
			</div>
			<div class="flex z-10 justify-center items-center mt-4 mb-16">
				<button
					on:click={openSignUp}
					class="bg-gradient-to-br signup-btn btn btn-lg variant-gradient-secondary-primary"
				>
					Sign Up To Waitlist
				</button>
			</div>
		</div>
	</div>
</div>

<footer class="fixed bottom-0 right-0 py-2 @sm:py-2 text-white z-40">
	<div class="px-4 @sm:px-4">
		<a
			href="https://www.spacex.com"
			target="_blank"
			rel="noopener noreferrer"
			class="transition-colors text-2xs text-tertiary-500/80 hover:text-tertiary-500"
		>
			Image by SpaceX
		</a>
	</div>
</footer>

<style>
	:global(body) {
		background-color: rgba(24, 25, 73, 1);
	}
</style>
