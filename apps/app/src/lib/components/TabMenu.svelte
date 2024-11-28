<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let activeTab: string;
	const tabs = ['actions', 'settings'] as const;

	const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col h-full">
	<div class="overflow-auto flex-grow p-4">
		<slot name="content" />
	</div>

	<div class="flex justify-between items-center p-2 pr-16 border-t border-surface-500">
		<ul class="flex flex-wrap text-sm font-medium text-center">
			{#each tabs as tab}
				<li class="relative px-0.5 sm:px-1">
					<button
						class="inline-block px-2 py-2 rounded-lg transition-colors duration-200 sm:px-3"
						class:text-primary-500={activeTab === tab}
						class:text-tertiary-400={activeTab !== tab}
						on:click={() => dispatch('setActiveTab', tab)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
					{#if activeTab === tab}
						<div
							class="absolute bottom-0 left-1/2 w-1/4 h-0.5 rounded-full -translate-x-1/2 bg-primary-500"
						/>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</div>
