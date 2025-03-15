<script lang="ts">
	export let slides: { component: any; title: string }[] = [];
	export let currentSlide = 0;

	import { onMount, createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	// Track which slides are visible
	let visibleSections = new Set<number>();

	// Allow fullscreen toggle
	let isFullscreen = false;

	// Refs for each section
	let sectionRefs: HTMLElement[] = [];

	function handleScroll(): void {
		// Update which sections are visible
		const viewportHeight = window.innerHeight;
		const scrollPosition = window.scrollY;

		sectionRefs.forEach((section, index) => {
			if (!section) return;

			const rect = section.getBoundingClientRect();
			// If section is at least 50% visible
			if (rect.top < viewportHeight / 2 && rect.bottom > viewportHeight / 2) {
				visibleSections.add(index);
				// Update the "current" slide for the navigation
				if (index !== currentSlide) {
					dispatch('goto', index);
				}
			} else {
				visibleSections.delete(index);
			}
		});
	}

	function toggleFullscreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.error(`Error attempting to enable fullscreen: ${err.message}`);
			});
			isFullscreen = true;
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
				isFullscreen = false;
			}
		}
	}

	function scrollToSection(index: number): void {
		if (sectionRefs[index]) {
			sectionRefs[index].scrollIntoView({ behavior: 'smooth' });
		}
	}

	// When currentSlide changes from outside (e.g. navigation buttons)
	$: if (currentSlide !== undefined && sectionRefs.length > 0) {
		scrollToSection(currentSlide);
	}

	// Handle fullscreen change events
	onMount(() => {
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		window.addEventListener('scroll', handleScroll);

		// Initialize sectionRefs
		sectionRefs = new Array(slides.length);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function handleFullscreenChange(): void {
		isFullscreen = !!document.fullscreenElement;
	}
</script>

<div class="presentation relative h-full w-full overflow-y-auto overflow-x-hidden bg-slate-900">
	<!-- Background gradient -->
	<div class="fixed inset-0 -z-10">
		<div
			class="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-purple-900/20 to-transparent opacity-30 blur-3xl"
		></div>
		<div
			class="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-cyan-900/20 to-transparent opacity-20 blur-3xl"
		></div>
	</div>

	<!-- Side navigation dots -->
	<div class="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 transform md:block">
		<div class="flex flex-col space-y-3">
			{#each slides as _, i}
				<button
					class="h-3 w-3 rounded-full transition-all duration-200 {i === currentSlide
						? 'bg-yellow-400'
						: 'bg-gray-500/50 hover:bg-gray-400/70'}"
					on:click={() => scrollToSection(i)}
					title={slides[i].title}
					aria-label={`Go to slide: ${slides[i].title}`}
				></button>
			{/each}
		</div>
	</div>

	<!-- Scrollable content -->
	<div class="min-h-screen">
		{#each slides as slide, i}
			<section
				bind:this={sectionRefs[i]}
				class="min-h-screen w-full py-16 {i !== slides.length - 1
					? 'border-b border-slate-800/50'
					: ''}"
				id="section-{i}"
			>
				<svelte:component this={slide.component} />
			</section>
		{/each}
	</div>

	<!-- Fullscreen toggle button -->
	<button
		class="fixed bottom-4 right-4 z-50 rounded-full bg-slate-800/50 p-3 text-slate-400 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/80 hover:text-slate-100"
		on:click={toggleFullscreen}
		title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
		aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
	>
		{#if isFullscreen}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><path
					d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"
				></path></svg
			>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg
			>
		{/if}
	</button>

	<!-- Scroll down indicator for first screen -->
	{#if currentSlide === 0}
		<div
			class="fixed bottom-8 left-1/2 z-40 hidden -translate-x-1/2 transform animate-bounce md:block"
		>
			<div class="flex flex-col items-center">
				<span class="mb-2 text-sm text-gray-400">Scroll Down</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-yellow-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					/>
				</svg>
			</div>
		</div>
	{/if}
</div>

<style>
	.presentation {
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
		scroll-behavior: smooth;
	}

	/* For browsers that support it, enable snap scrolling */
	@supports (scroll-snap-type: y mandatory) {
		.presentation {
			scroll-snap-type: y mandatory;
			height: 100vh;
			overflow-y: scroll;
		}

		section {
			scroll-snap-align: start;
			scroll-snap-stop: always;
		}
	}
</style>
