<script lang="ts">
	import { shoppingListStore, categories, categoryIcons, itemIconMap } from '$lib/agents/agentBert';
	import type { ShoppingItem } from '$lib/agents/agentBert';
	import Icon from '@iconify/svelte';

	export let slot: string | undefined = undefined;
	export let me: boolean = false;

	// Default fallback icon that's guaranteed to exist
	const FALLBACK_ICON = 'mdi:shopping';

	// Updated category colors with matching text/icon colors
	const categoryColors = {
		fruits: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500',
		vegetables: 'bg-green-500/10 hover:bg-green-500/20 text-green-500',
		dairy: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
		meat: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
		bakery: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500',
		beverages: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500',
		snacks: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-500',
		household: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500',
		other: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-500'
	} as const;

	function getItemIcon(item: ShoppingItem): string {
		try {
			const normalizedName = item.name.toLowerCase().trim();

			// 1. Try exact match in itemIconMap
			if (itemIconMap[normalizedName]) {
				return itemIconMap[normalizedName];
			}

			// 2. Try singular/plural variant
			const alternateForm = normalizedName.endsWith('s')
				? normalizedName.slice(0, -1)
				: normalizedName + 's';
			if (itemIconMap[alternateForm]) {
				return itemIconMap[alternateForm];
			}

			// 3. Use category icon
			if (categoryIcons[item.category]) {
				return categoryIcons[item.category];
			}

			// 4. Use item's own icon if it exists
			if (item.icon && typeof item.icon === 'string') {
				return item.icon;
			}

			// 5. Final fallback
			return FALLBACK_ICON;
		} catch (error) {
			console.warn(`Icon lookup failed for ${item.name}:`, error);
			return FALLBACK_ICON;
		}
	}

	// Modified groupItems to maintain order
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
	<header class="card-header">
		<h2 class="mb-4 text-center h2">Shopping List</h2>
	</header>
	<div class="flex-grow w-full p-4 overflow-y-auto card">
		<section class="flex-grow">
			{#if $shoppingListStore.length === 0}
				<p class="text-center text-surface-500">Your shopping list is empty.</p>
			{:else}
				<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
					{#each groupedItems as group}
						{#each group.items as item (item.id)}
							<button
								on:click={() => removeItem(item.id)}
								class="relative flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square {categoryColors[
									item.category
								]}"
							>
								<!-- Icon with matching category color -->
								<Icon icon={getItemIcon(item)} class="w-1/2 mb-2 h-1/2" fallback={FALLBACK_ICON} />

								<!-- Item Name with matching category color -->
								<span class="overflow-hidden text-xs text-center text-ellipsis">
									{item.name}
								</span>
							</button>
						{/each}
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>
