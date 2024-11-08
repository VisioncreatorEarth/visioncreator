<script lang="ts">
	import { shoppingListStore, categories, categoryIcons, itemIconMap } from '$lib/agents/agentBert';
	import type { ShoppingItem } from '$lib/agents/agentBert';
	import Icon from '@iconify/svelte';

	export let slot: string | undefined = undefined;
	export let me: boolean = false;

	// Default fallback icon that's guaranteed to exist
	const FALLBACK_ICON = 'mdi:shopping';

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
				<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8 auto-rows-auto">
					{#each groupedItems as group, groupIndex}
						<!-- Items flow continuously -->
						{#each group.items as item, itemIndex (item.id)}
							<!-- Category separator -->
							{#if itemIndex === 0}
								<div class="flex items-center justify-center h-full">
									{#if groupIndex > 0}
										<div class="flex flex-col items-center justify-center mx-3">
											<div class="w-px h-8 bg-surface-200-700-token" />
											<span
												class="text-sm font-semibold text-tertiary-500 px-3 py-1.5 my-1 rounded-full bg-surface-100-800-token whitespace-nowrap"
											>
												{group.name}
											</span>
											<div class="w-px h-8 bg-surface-200-700-token" />
										</div>
									{:else}
										<span
											class="text-sm font-semibold text-tertiary-500 px-3 py-1.5 rounded-full bg-surface-100-800-token whitespace-nowrap"
										>
											{group.name}
										</span>
									{/if}
								</div>
							{/if}

							<button
								on:click={() => removeItem(item.id)}
								class="flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square bg-surface-200-700-token hover:bg-surface-300-600-token"
							>
								<Icon icon={getItemIcon(item)} class="w-1/2 mb-2 h-1/2" fallback={FALLBACK_ICON} />
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
