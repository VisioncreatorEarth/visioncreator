<script lang="ts">
	import {
		shoppingListStore,
		categories,
		categoryIcons,
		preselectedItems
	} from '$lib/agents/agentBert';
	import type { ShoppingItem } from '$lib/agents/agentBert';
	import Icon from '@iconify/svelte';

	export let slot: string | undefined = undefined;
	export let me: boolean = false;

	// Create a map of predefined item icons from preselectedItems
	const itemIcons = new Map(preselectedItems.map((item) => [item.name.toLowerCase(), item.icon]));

	function getItemIcon(item: ShoppingItem): string {
		// Try to find a predefined icon for this exact item
		const predefinedIcon = itemIcons.get(item.name.toLowerCase());
		if (predefinedIcon) {
			return predefinedIcon;
		}

		// If the item has an icon property, use it
		if (item.icon) {
			return item.icon;
		}

		// Fall back to category icon
		return categoryIcons[item.category] || categoryIcons.other;
	}

	function groupItems(items: ShoppingItem[]) {
		return Object.entries(categories)
			.map(([id, name]) => ({
				id,
				name,
				items: items.filter((item) => item.category === id)
			}))
			.filter((group) => group.items.length > 0);
	}

	$: groupedItems = groupItems($shoppingListStore);

	function removeItem(id: number) {
		shoppingListStore.update((items) => items.filter((item) => item.id !== id));
	}
</script>

<div class="relative flex flex-col w-full h-full bg-surface-50-900-token">
	<div class="flex-grow w-full p-4 overflow-y-auto card">
		<header class="card-header">
			<h2 class="mb-4 h2">Shopping List</h2>
		</header>

		<section class="flex-grow space-y-6">
			{#if $shoppingListStore.length === 0}
				<p class="text-center text-surface-500">Your shopping list is empty.</p>
			{:else}
				{#each groupedItems as group}
					<div class="space-y-2">
						<h3 class="text-lg font-semibold text-tertiary-500">{group.name}</h3>
						<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
							{#each group.items as item (item.id)}
								<button
									on:click={() => removeItem(item.id)}
									class="flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square bg-surface-200-700-token hover:bg-surface-300-600-token"
								>
									<Icon icon={getItemIcon(item)} class="w-1/2 mb-2 h-1/2" />
									<span class="overflow-hidden text-xs text-center text-ellipsis">
										{item.name}
									</span>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</section>
	</div>
</div>
