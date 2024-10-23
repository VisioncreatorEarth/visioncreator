<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean;
	export let showTabs = false;
	export let isLoginModal = false; // New prop to handle login modal styling

	const dispatch = createEventDispatcher();

	function handleClose(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			dispatch('close');
		}
	}

	function handleContentClick(event: MouseEvent) {
		event.stopPropagation();
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 bg-surface-900/50 backdrop-blur-sm"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="relative z-10 w-full bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			class:max-w-6xl={!isLoginModal}
			class:max-w-md={isLoginModal}
			on:click={handleContentClick}
		>
			<slot />
			{#if !showTabs}
				<button
					class="absolute flex items-center justify-center w-8 h-8 transition-colors rounded-full bottom-4 right-4 bg-surface-700 hover:bg-surface-800 text-tertiary-400 hover:text-tertiary-300"
					on:click={() => dispatch('close')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-4 h-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}
