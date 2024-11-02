<script>
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	function customEase(t) {
		return 0.4 * t + 0.6 * t * t;
	}

	let progress = tweened(0, {
		duration: 26666,
		easing: customEase
	});

	let fibonacciNumbers = [0, 1];
	while (fibonacciNumbers[fibonacciNumbers.length - 1] < 1e9) {
		fibonacciNumbers.push(
			fibonacciNumbers[fibonacciNumbers.length - 1] + fibonacciNumbers[fibonacciNumbers.length - 2]
		);
	}

	let currentFib = fibonacciNumbers[0];
	$: euroPool = currentFib * 30;

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

	const mainSize = 880;
	const goldenRatio = 1.618033988749895;

	function getPosition(i) {
		const angle = i * goldenRatio * Math.PI * 2;
		const distance = Math.pow(i / (fibonacciNumbers.length - 1), 0.5) * (mainSize / 2 - 44);
		return {
			x: mainSize / 2 + Math.cos(angle) * distance,
			y: mainSize / 2 + Math.sin(angle) * distance
		};
	}

	function getNodeSize(fib) {
		return Math.max(8, Math.min(40, Math.log(fib + 1) * 4));
	}
</script>

<div class="flex items-center justify-center h-screen bg-surface-900 overflow-hidden">
	<div
		class="relative bg-surface-800 rounded-full shadow-2xl flex items-center justify-center overflow-hidden"
		style="width: {mainSize}px; height: {mainSize}px;"
	>
		{#each fibonacciNumbers as fib, i}
			{#if $progress > i / fibonacciNumbers.length}
				{@const pos = getPosition(i)}
				{@const size = getNodeSize(fib)}
				<div
					class="absolute rounded-full bg-primary-500 animate-pulse"
					style="
						left: {pos.x}px;
						top: {pos.y}px;
						width: {size}px;
						height: {size}px;
						transition: all 0.5s ease-out;
						opacity: {$progress};
					"
				/>
			{/if}
		{/each}

		<svg class="absolute inset-0 w-full h-full pointer-events-none">
			{#each fibonacciNumbers as _, i}
				{#if i > 0 && $progress > i / fibonacciNumbers.length}
					{@const pos1 = getPosition(i - 1)}
					{@const pos2 = getPosition(i)}
					<line
						x1={pos1.x}
						y1={pos1.y}
						x2={pos2.x}
						y2={pos2.y}
						stroke="rgba(167, 139, 250, 0.3)"
						stroke-width="1"
					/>
				{/if}
			{/each}
		</svg>

		<div class="text-center z-10 flex flex-col items-center">
			<span class="text-8xl font-bold text-primary-300 opacity-70 mb-8">
				{currentFib.toLocaleString()}
			</span>
			<span class="text-3xl text-primary-200 opacity-60">
				€{euroPool.toLocaleString()} Pool
			</span>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(body) {
		@apply bg-surface-900;
	}
</style>
