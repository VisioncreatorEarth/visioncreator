<script lang="ts">
	import { readable } from 'svelte/store';
	// Hardcoded launch date
	const launchDate = new Date('2024-09-21T21:09:24+02:00').getTime();

	export let large = false;

	const countdown = readable(0, (set) => {
		const interval = setInterval(() => {
			const now = new Date().getTime();
			const distance = launchDate - now;
			set(Math.floor(distance / 1000));
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

{#if $countdown > 0}
	<div
		class={`h1 text-tertiary-400 ${
			large ? 'text-4xl sm:text-6xl md:text-8xl' : 'text-2xl sm:text-3xl md:text-4xl'
		} font-bold text-white tracking-wider opacity-75`}
	>
		{Math.floor($countdown / 86400)}d {Math.floor(($countdown % 86400) / 3600)}h {Math.floor(
			($countdown % 3600) / 60
		)}m {$countdown % 60}s
	</div>
{:else}
	<div
		class={`h1 text-tertiary-400 ${
			large ? 'text-4xl sm:text-6xl md:text-8xl' : 'text-2xl sm:text-3xl md:text-4xl'
		} font-bold text-center text-white tracking-wider opacity-75`}
	>
		your life is about to change
	</div>
{/if}
