<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let activeTab: string;
	const tabs = ['actions', 'settings', 'legal'] as const;

	const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col h-full">
	<div class="flex-grow p-4 overflow-auto">
		<slot name="content" />
	</div>

	<div class="flex items-center justify-between p-2 border-t border-surface-500">
		<ul class="flex flex-wrap text-sm font-medium text-center sm:text-md">
			{#each tabs as tab}
				<li class="relative px-0.5 sm:px-1">
					<button
						class="inline-block px-2 py-2 transition-colors duration-200 rounded-lg sm:px-3"
						class:text-primary-500={activeTab === tab}
						class:text-tertiary-400={activeTab !== tab}
						on:click={() => dispatch('setActiveTab', tab)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
					{#if activeTab === tab}
						<div
							class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-0.5 bg-primary-500 rounded-full"
						/>
					{/if}
				</li>
			{/each}
		</ul>
		<button
			class="p-2 text-tertiary-400 hover:text-tertiary-300"
			on:click={() => dispatch('close')}
		>
			<svg class="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	</div>
</div>
