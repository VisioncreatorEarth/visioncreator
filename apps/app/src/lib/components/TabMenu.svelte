<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let activeTab: string;
	const tabs = ['actions', 'settings'] as const;

	const dispatch = createEventDispatcher();
</script>

<div class="flex flex-col h-full">
	<div class="overflow-auto flex-grow px-4 pt-4 pb-2">
		<slot name="content" />
	</div>

	<div class="flex justify-between items-center px-4">
		<ul class="flex flex-wrap text-sm font-medium text-center">
			{#each tabs as tab}
				<li class="relative px-0.5 sm:px-1">
					<button
						class="inline-block px-2 py-2 rounded-lg transition-colors duration-200 sm:px-3 {
							activeTab === tab
								? 'bg-surface-600/60 text-surface-200'
								: 'bg-surface-600/40 text-surface-400 hover:bg-surface-600/50'
						}"
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
