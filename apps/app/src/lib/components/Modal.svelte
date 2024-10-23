<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean;
	export let showTabs = false;

	const dispatch = createEventDispatcher();

	function handleClose(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			dispatch('close');
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 bg-surface-900/50 backdrop-blur-sm"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog"
		aria-modal="true"
		transition:fade
	>
		<div
			class="relative z-10 w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			on:click|stopPropagation
		>
			<slot />
		</div>
	</div>
{/if}
