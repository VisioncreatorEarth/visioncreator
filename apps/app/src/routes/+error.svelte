<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let ready = false;

	onMount(() => {
		ready = true;
	});
</script>

<svelte:head>
	<title>404 - Oops! Vision Lost | Visioncreator</title>
</svelte:head>

{#if ready}
	<div
		class="pt-20 flex items-center justify-center min-h-screen bg-surface-900 text-tertiary-300 p-4"
	>
		<div class="w-full max-w-4xl text-center" in:fly={{ y: 50, duration: 500 }}>
			<h1 class="text-9xl font-bold text-primary-500 mb-4">404</h1>
			<p class="text-4xl mb-8">Whoops! Vision Temporarily Misplaced</p>
			<p class="text-xl mb-12">
				Looks like our crystal ball is on the fritz! The page you're seeking has apparently decided
				to take an unscheduled vacation. Maybe it's off creating its own vision somewhere?
			</p>
			<div class="flex justify-center items-center mb-16">
				<Icon icon="mdi:crystal-ball" width="120" height="120" class="text-secondary-500" />
			</div>
			<p class="text-lg mb-8">
				Don't worry, our team of visionary wizards is already on the case. In the meantime, why not
				head back to our home page and explore some other mind-bending ideas?
			</p>
			<a href="/" class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-xl">
				Beam Me Back, Scotty!
			</a>
		</div>
	</div>
{/if}
