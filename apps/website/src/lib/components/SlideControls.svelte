<script lang="ts">
	export let currentSlide = 1;
	export let totalSlides = 1;
	export let onNext = () => {};
	export let onPrev = () => {};
	export let onGoToSlide = (index: number) => {};

	let isControlsOpen = false;

	function toggleControls() {
		isControlsOpen = !isControlsOpen;
	}
</script>

<div
	class="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center"
>
	<div class="flex flex-col items-center">
		<!-- Navigation Controls -->
		<div
			class="pointer-events-auto mb-4 flex items-center gap-4 {isControlsOpen
				? 'opacity-100'
				: 'opacity-0'} transition-opacity duration-300"
		>
			<!-- Previous button -->
			<button
				class="rounded-full bg-slate-800/70 p-3 text-slate-300 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
				on:click={onPrev}
				disabled={currentSlide <= 1}
				aria-label="Go to previous slide"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg
				>
			</button>

			<!-- Slide counter -->
			<div class="rounded-full bg-slate-800/70 px-4 py-2 text-slate-300 backdrop-blur-sm">
				{currentSlide} / {totalSlides}
			</div>

			<!-- Next button -->
			<button
				class="rounded-full bg-slate-800/70 p-3 text-slate-300 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
				on:click={onNext}
				disabled={currentSlide >= totalSlides}
				aria-label="Go to next slide"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg
				>
			</button>

			<!-- Slide thumbnails -->
			<div
				class="absolute bottom-16 left-1/2 flex -translate-x-1/2 transform gap-2 rounded-lg bg-slate-800/50 p-2 backdrop-blur-sm {isControlsOpen
					? 'translate-y-0 opacity-100'
					: 'translate-y-4 opacity-0'} transition-all duration-300"
			>
				{#each Array(totalSlides) as _, i}
					<button
						class="h-2 w-2 rounded-full {currentSlide === i + 1
							? 'bg-cyan-400'
							: 'bg-slate-500'} transition-all hover:bg-cyan-300"
						on:click={() => onGoToSlide(i)}
						title={`Go to slide ${i + 1}`}
						aria-label={`Go to slide ${i + 1}`}
					></button>
				{/each}
			</div>
		</div>

		<!-- Toggle button -->
		<button
			class="pointer-events-auto mb-6 rounded-full bg-slate-800/50 p-3 text-slate-400 backdrop-blur-sm transition-all duration-300 hover:bg-slate-800 hover:text-cyan-400"
			on:click={toggleControls}
			aria-label={isControlsOpen ? 'Hide slide controls' : 'Show slide controls'}
		>
			{#if isControlsOpen}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg
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
					stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
				>
			{/if}
		</button>
	</div>
</div>
