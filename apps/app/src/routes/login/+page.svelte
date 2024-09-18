<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	const drawerStore = getDrawerStore();

	function openLoginDrawer() {
		drawerStore.open({ position: 'bottom', action: 'login' });
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('keydown', handleKeydown);
			}
		};
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			openLoginDrawer();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex flex-col items-center justify-center w-full h-full bg-surface-900">
	<div class="w-full max-w-3xl mb-12 p-4 text-center flex flex-col space-y-8">
		<div class="glassmorphism-card text-center p-6 @md:p-8 rounded-xl shadow-2xl backdrop-blur-sm">
			<h2 class="text-white text-2xl @md:text-3xl @lg:text-4xl font-bold mb-2">Welcome Back!</h2>
			<p class="text-lg @md:text-xl text-tertiary-300 mt-4">
				Ready to continue our journey together? Let's make some vision magic happen!
			</p>
		</div>
	</div>

	<button
		on:click={openLoginDrawer}
		class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
	>
		Login
	</button>
</div>
