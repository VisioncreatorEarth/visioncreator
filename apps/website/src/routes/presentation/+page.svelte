<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Import slides for Presentation 2.0
	import OutdatedWork from '$lib/slides/OutdatedWork.svelte';
	import RootCauses from '$lib/slides/RootCauses.svelte';
	import WhyThisMatters from '$lib/slides/WhyThisMatters.svelte';
	import CoreHumanNeeds from '$lib/slides/CoreHumanNeeds.svelte';
	import AchievingCoreNeeds from '$lib/slides/AchievingCoreNeeds.svelte';
	import IntegratedOrganization from '$lib/slides/IntegratedOrganization.svelte';
	import IntroducingVisioncreator from '$lib/slides/IntroducingVisioncreator.svelte';
	import OrganizationalPrinciples from '$lib/slides/OrganizationalPrinciples.svelte';
	import DAOConcept from '$lib/slides/DAOConcept.svelte';
	import VisioncreatorImplementation from '$lib/slides/VisioncreatorImplementation.svelte';

	// Define slide type
	type Slide = {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: any;
		title: string;
		part?: number; // Optional part indicator (1 or 2)
	};

	// Define all slides in the presentation based on new structure
	const slides: Slide[] = [
		{
			component: OutdatedWork,
			title: 'Your Story Begins',
			part: 1
		},
		{
			component: RootCauses,
			title: 'The Dilemma',
			part: 1
		},
		{
			component: WhyThisMatters,
			title: 'Quality of Life',
			part: 1
		},
		{
			component: CoreHumanNeeds,
			title: 'Core Human Needs',
			part: 1
		},
		{
			component: AchievingCoreNeeds,
			title: 'From Dream to Reality',
			part: 1
		},
		{
			component: IntegratedOrganization,
			title: 'A Better Way',
			part: 1
		},
		{
			component: IntroducingVisioncreator,
			title: 'Introducing Visioncreator',
			part: 1
		},
		{
			component: OrganizationalPrinciples,
			title: 'The Structure',
			part: 1
		},
		{
			component: DAOConcept,
			title: 'The DAO Concept',
			part: 1
		},
		{
			component: VisioncreatorImplementation,
			title: 'Real-World Implementation',
			part: 1
		}
		// CallToAction slide will be added dynamically after the page loads
	];

	let currentSlideIndex = 0;
	let slideTitle = slides[currentSlideIndex].title;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let slidePart = slides[currentSlideIndex].part;

	// Refs for each section
	let sectionRefs: HTMLElement[] = [];

	// Track which slides are visible
	let visibleSections = new Set<number>();

	// Allow fullscreen toggle
	let isFullscreen = false;

	function handleScroll(): void {
		// Update which sections are visible
		const viewportHeight = window.innerHeight;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const scrollPosition = window.scrollY;

		sectionRefs.forEach((section, index) => {
			if (!section) return;

			const rect = section.getBoundingClientRect();
			// If section is at least 50% visible
			if (rect.top < viewportHeight / 2 && rect.bottom > viewportHeight / 2) {
				visibleSections.add(index);
				// Update the current slide index
				if (index !== currentSlideIndex) {
					currentSlideIndex = index;
					slideTitle = slides[currentSlideIndex].title;
					slidePart = slides[currentSlideIndex].part;
				}
			} else {
				visibleSections.delete(index);
			}
		});
	}

	function scrollToSection(index: number): void {
		if (sectionRefs[index]) {
			sectionRefs[index].scrollIntoView({ behavior: 'smooth' });
		}
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

	function handleFullscreenChange(): void {
		isFullscreen = !!document.fullscreenElement;
	}

	// Check for URL parameters and set up event listeners
	onMount(() => {
		if (browser) {
			const urlParams = new URLSearchParams(window.location.search);
			const slideParam = urlParams.get('slide');

			if (slideParam !== null) {
				const slideIndex = parseInt(slideParam, 10);
				if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < slides.length) {
					currentSlideIndex = slideIndex;
					slideTitle = slides[currentSlideIndex].title;
					slidePart = slides[currentSlideIndex].part;

					// Wait for DOM to be ready
					setTimeout(() => {
						scrollToSection(currentSlideIndex);
					}, 100);
				}
			}

			// Set up event listeners
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			window.addEventListener('scroll', handleScroll);

			// Initialize sectionRefs
			sectionRefs = new Array(slides.length);
		}

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function goToSlide(index: number) {
		if (index >= 0 && index < slides.length) {
			currentSlideIndex = index;
			slideTitle = slides[currentSlideIndex].title;
			slidePart = slides[currentSlideIndex].part;
			scrollToSection(index);
		}
	}

	function nextSlide() {
		if (currentSlideIndex < slides.length - 1) {
			goToSlide(currentSlideIndex + 1);
		}
	}

	function prevSlide() {
		if (currentSlideIndex > 0) {
			goToSlide(currentSlideIndex - 1);
		}
	}
</script>

<svelte:head>
	<title>Visioncreator | Presentation 2.0</title>
	<meta name="description" content="Visioncreator - The Future of Work & Ownership" />
</svelte:head>

<div class="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 text-white">
	<!-- Header with logo and navigation -->
	<header
		class="fixed left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-gray-800/50 bg-gray-900/70 px-5 py-3 backdrop-blur-sm"
	>
		<div class="flex items-center">
			<!-- Visioncreator Logo -->
			<div class="logo mr-3 h-10 w-10">
				<div class="flex h-full w-full items-center justify-center">
					<div class="relative h-8 w-8 rotate-45 transform">
						<div
							class="absolute inset-0 rounded-sm bg-gradient-to-br from-green-400 to-yellow-400"
						></div>
						<div
							class="absolute right-1 top-1 h-2 w-2 -rotate-45 transform rounded-sm bg-teal-400"
						></div>
					</div>
				</div>
			</div>
			<div>
				<div class="text-xs uppercase tracking-wider text-yellow-400">
					THE FUTURE OF WORK & OWNERSHIP
				</div>
				<div class="text-xl font-bold text-yellow-400">{slideTitle}</div>
			</div>
		</div>

		<!-- Navigation controls -->
		<div class="flex items-center space-x-4">
			<button
				class="rounded-full p-2 hover:bg-gray-800/50 {currentSlideIndex === 0
					? 'cursor-not-allowed opacity-30'
					: ''}"
				on:click={prevSlide}
				disabled={currentSlideIndex === 0}
				aria-label="Previous slide"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>

			<div class="text-sm">
				{currentSlideIndex + 1} / {slides.length}
			</div>

			<button
				class="rounded-full p-2 hover:bg-gray-800/50 {currentSlideIndex === slides.length - 1
					? 'cursor-not-allowed opacity-30'
					: ''}"
				on:click={nextSlide}
				disabled={currentSlideIndex === slides.length - 1}
				aria-label="Next slide"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>

			<a href="/presentation/preview" class="rounded px-3 py-1 text-sm hover:bg-gray-800/50">
				Exit to Preview
			</a>
		</div>
	</header>

	<!-- Scrollable presentation content -->
	<main
		class="presentation relative h-full w-full overflow-y-auto overflow-x-hidden bg-slate-900 pt-16"
	>
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
						class="h-3 w-3 rounded-full transition-all duration-200 {i === currentSlideIndex
							? 'bg-yellow-400'
							: 'bg-gray-500/50 hover:bg-gray-400/70'}"
						on:click={() => goToSlide(i)}
						title={slides[i].title}
						aria-label={`Go to slide: ${slides[i].title}`}
					></button>
				{/each}
			</div>
		</div>

		<!-- Slides -->
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
		{#if currentSlideIndex === 0}
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
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

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
