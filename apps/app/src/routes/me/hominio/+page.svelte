<script lang="ts">
	import { browser } from '$app/environment';
	import { dev } from '$app/environment';

	let Preview;

	if (browser && dev) {
		import('$lib/Preview.svelte').then((module) => {
			Preview = module.default;
		});
	}
</script>

<main class="w-screen h-screen">
	{#if dev && Preview}
		<svelte:component this={Preview} />
	{:else}
		<p>Preview is only available in development mode.</p>
	{/if}
</main>
