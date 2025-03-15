<script>
	import { onMount } from 'svelte';

	let revealed = false;

	onMount(() => {
		setTimeout(() => {
			revealed = true;
		}, 400);
	});
</script>

<div class="slide-content flex h-full flex-col items-center justify-center p-8">
	<div class="mx-auto w-full max-w-5xl">
		<!-- Main heading -->
		<div
			class="mb-12 transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<p class="mb-6 text-2xl text-emerald-300 md:text-3xl">Product Details</p>
			<h2 class="mb-8 text-4xl font-bold text-white md:text-5xl">Hominio AI - Part 3</h2>
		</div>

		<!-- Placeholder content - will be replaced with actual content -->
		<div class="text-center text-lg text-gray-400">
			<p class="mb-4">This slide will explore specific details of the Hominio AI tool (Part 3).</p>
			<p class="mb-4">Content will be developed as the product details are finalized.</p>
			<div class="mx-auto mt-8 max-w-md rounded-lg border border-dashed border-gray-700 p-8">
				<p class="text-gray-500">Placeholder for product screenshots, diagrams, or demos</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Add any slide-specific styles here */
</style>
