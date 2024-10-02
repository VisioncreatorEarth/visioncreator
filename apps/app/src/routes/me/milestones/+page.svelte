<script>
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';

	function customEase(t) {
		return 0.4 * t + 0.6 * t * t;
	}

	let progress = tweened(0, {
		duration: 20000,
		easing: customEase
	});

	let fibonacciNumbers = [0, 1];
	while (fibonacciNumbers[fibonacciNumbers.length - 1] < 1e9) {
		fibonacciNumbers.push(
			fibonacciNumbers[fibonacciNumbers.length - 1] + fibonacciNumbers[fibonacciNumbers.length - 2]
		);
	}

	let currentFib = fibonacciNumbers[0];

	$: {
		let index = Math.min(
			fibonacciNumbers.length - 1,
			Math.floor($progress * fibonacciNumbers.length)
		);
		currentFib = fibonacciNumbers[index];
	}

	onMount(() => {
		progress.set(1);
	});

	const mainSize = 480; // Significantly larger size
</script>

<div class="flex items-center justify-center h-screen">
	<div
		class="bg-primary-500 dark:bg-primary-700 rounded-3xl shadow-2xl flex items-center justify-center"
		style="width: {mainSize}px; height: {mainSize}px;"
	>
		<span class="text-8xl font-bold text-white text-center">{currentFib.toLocaleString()}</span>
	</div>
</div>

<style lang="postcss">
	:global(body) {
		@apply bg-surface-50-900-token;
	}
</style>
