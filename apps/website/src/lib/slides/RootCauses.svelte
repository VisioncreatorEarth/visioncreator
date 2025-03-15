<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let visible = false;

	onMount(() => {
		setTimeout(() => {
			visible = true;
		}, 300);
	});
</script>

<div class="slide-content flex h-full flex-col items-center justify-center bg-[#0a192f] p-4 md:p-8">
	<div class="mx-auto w-full max-w-5xl">
		<!-- Minimal Header with Strong Visual Impact -->
		<div class="mb-6 text-center">
			<h2 class="mb-3 text-5xl font-bold md:text-6xl lg:text-7xl">
				<span class="text-white">The </span>
				<span class="text-[#f0b429]">False Choice</span>
			</h2>

			{#if visible}
				<div class="mx-auto mb-8" in:fade={{ duration: 400 }}>
					<p class="text-xl font-medium tracking-wide text-[#64ffda] md:text-2xl">
						Neither option leads to fulfillment
					</p>
				</div>
			{/if}
		</div>

		{#if visible}
			<!-- Main Visual Component - The Fork in the Road -->
			<div class="relative mb-10 h-16 w-full overflow-hidden md:h-24">
				<!-- Central Dividing Line -->
				<div
					class="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 transform bg-gradient-to-r from-red-500 via-white to-amber-500"
				></div>

				<!-- Starting Point -->
				<div
					class="absolute left-1/2 top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white"
				></div>

				<!-- "YOU ARE HERE" Label -->
				<div class="absolute left-1/2 top-0 -translate-x-1/2 transform text-sm text-white">
					YOU ARE HERE
				</div>
			</div>
		{/if}

		{#if visible}
			<!-- Two Paths - Clean Visual Comparison -->
			<div class="mb-10 grid grid-cols-1 gap-10 md:grid-cols-2">
				<!-- Left Path - Employee -->
				<div class="flex h-full flex-col" in:fade={{ duration: 400, delay: 100 }}>
					<div
						class="flex-grow rounded-xl border border-red-900/20 bg-gradient-to-br from-red-900/20 to-red-950/30 p-6"
					>
						<h3 class="mb-4 border-b border-gray-700/50 pb-3 text-2xl font-bold text-white">
							Work Under Direction
						</h3>

						<ul class="space-y-4 text-gray-200">
							<li class="flex items-start">
								<span class="mr-3 text-lg font-bold text-red-400">→</span>
								<span
									>Create value for <span class="font-medium text-red-400">someone else</span></span
								>
							</li>
							<li class="flex items-start">
								<span class="mr-3 text-lg font-bold text-red-400">→</span>
								<span>Follow <span class="font-medium text-red-400">others' directions</span></span>
							</li>
							<li class="flex items-start">
								<span class="mr-3 text-lg font-bold text-red-400">→</span>
								<span
									><span class="font-medium text-red-400">Limited</span> potential realization</span
								>
							</li>
						</ul>
					</div>

					<div class="mt-3 text-center text-lg text-red-300">"Building someone else's dream"</div>
				</div>

				<!-- Right Path - Founder -->
				<div class="flex h-full flex-col" in:fade={{ duration: 400, delay: 200 }}>
					<div
						class="flex-grow rounded-xl border border-amber-900/20 bg-gradient-to-br from-amber-900/20 to-amber-950/30 p-6"
					>
						<h3 class="mb-4 border-b border-gray-700/50 pb-3 text-2xl font-bold text-white">
							Run Your Own Enterprise
						</h3>

						<ul class="space-y-4 text-gray-200">
							<li class="flex items-start">
								<span class="mr-3 text-lg font-bold text-amber-400">→</span>
								<span
									>Shoulder <span class="font-medium text-amber-400">overwhelming</span> responsibility</span
								>
							</li>
							<li class="flex items-start">
								<span class="mr-3 text-lg font-bold text-amber-400">→</span>
								<span
									>Life <span class="font-medium text-amber-400">revolves around</span> business</span
								>
							</li>
							<li class="flex items-start">
								<span class="mr-3 text-lg font-bold text-amber-400">→</span>
								<span
									><span class="font-medium text-amber-400">Constant</span> administrative burden</span
								>
							</li>
						</ul>
					</div>

					<div class="mt-3 text-center text-lg text-amber-300">"Drowning in responsibilities"</div>
				</div>
			</div>
		{/if}

		{#if visible}
			<!-- Key Insight -->
			<div class="mb-8 text-center" in:fade={{ duration: 400, delay: 300 }}>
				<div class="inline-block rounded-lg border-2 border-[#64ffda]/30 bg-[#0a192f] px-8 py-4">
					<p class="text-2xl text-white md:text-3xl">
						You need a <span class="font-bold text-[#f0b429]">new model</span> where you
						<span class="font-bold text-[#64ffda]">own what you create</span>
					</p>
				</div>
			</div>
		{/if}

		{#if visible}
			<!-- Bottom Quote for Transition -->
			<div class="mt-8 text-center opacity-80" in:fade={{ duration: 400, delay: 350 }}>
				<p class="text-xl italic text-gray-400">
					"The traditional work paradigm is broken at both ends of the spectrum."
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.slide-content {
		min-height: calc(100vh - 80px);
	}
</style>
