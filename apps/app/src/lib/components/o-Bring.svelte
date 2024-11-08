<script lang="ts">
	import { shoppingListStore, categories, categoryIcons } from '$lib/agents/agentBert';
	import type { ShoppingItem } from '$lib/agents/agentBert';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let slot: string | undefined = undefined;
	export let me: boolean = false;

	// Category colors with hover states
	const categoryColors = {
		fruits: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500',
		vegetables: 'bg-green-500/10 hover:bg-green-500/20 text-green-500',
		dairy: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
		meat: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
		bakery: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500',
		beverages: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500',
		snacks: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-500',
		household: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500',
		grains: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500',
		other: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-500'
	} as const;

	// Simplified but diverse fallback icons per category
	const FALLBACK_ICONS = {
		fruits: ['mdi:fruit-watermelon', 'mdi:fruit-cherries', 'mdi:food-apple'],
		vegetables: ['mdi:carrot', 'mdi:food-broccoli', 'mdi:leaf'],
		dairy: ['mdi:cheese', 'mdi:milk', 'mdi:egg'],
		meat: ['mdi:food-steak', 'mdi:food-turkey', 'mdi:fish'],
		bakery: ['mdi:bread-slice', 'mdi:croissant', 'mdi:cookie'],
		beverages: ['mdi:cup', 'mdi:bottle-soda', 'mdi:coffee'],
		snacks: ['mdi:cookie', 'mdi:food-potato', 'mdi:candy'],
		household: ['mdi:home', 'mdi:washing-machine', 'mdi:broom'],
		grains: ['mdi:pasta', 'mdi:rice', 'mdi:grain', 'mdi:noodles'],
		other: ['mdi:shopping']
	} as const;

	// Final guaranteed fallback per category
	const GUARANTEED_ICONS = {
		fruits: 'mdi:fruit-watermelon',
		vegetables: 'mdi:carrot',
		dairy: 'mdi:milk',
		meat: 'mdi:food-steak',
		bakery: 'mdi:bread-slice',
		beverages: 'mdi:cup',
		snacks: 'mdi:cookie',
		household: 'mdi:home',
		grains: 'mdi:pasta',
		other: 'mdi:shopping'
	} as const;

	// Store validated icons
	const iconCache = new Map<number, string>();
	const iconValidationCache = new Map<string, boolean>();

	// Quick synchronous check if icon is in validation cache
	function isIconCached(icon: string): boolean {
		return iconValidationCache.get(icon) ?? false;
	}

	// Validate icon and cache result
	async function validateIcon(icon: string): Promise<boolean> {
		if (iconValidationCache.has(icon)) {
			return iconValidationCache.get(icon)!;
		}

		try {
			const { loadIcon } = await import('@iconify/svelte');
			await loadIcon(icon);
			iconValidationCache.set(icon, true);
			return true;
		} catch {
			iconValidationCache.set(icon, false);
			return false;
		}
	}

	// Get the best icon for an item
	async function getValidIcon(item: ShoppingItem): Promise<string> {
		// 1. Try AI-provided icon first
		if (item.icon) {
			const isValid = await validateIcon(item.icon);
			if (isValid) return item.icon;
		}

		const category = item.category;
		const itemName = item.name.toLowerCase();

		// 2. Try category-specific fallbacks
		const fallbacks = FALLBACK_ICONS[category];
		for (const icon of fallbacks) {
			const isValid = await validateIcon(icon);
			if (isValid) {
				// Store this valid icon to avoid future checks
				iconValidationCache.set(icon, true);
				return icon;
			}
		}

		// 3. Final guaranteed fallback
		return GUARANTEED_ICONS[category];
	}

	// Enhanced handleIcon with immediate fallback
	function handleIcon(item: ShoppingItem): string {
		if (iconCache.has(item.id)) {
			return iconCache.get(item.id)!;
		}

		// Start with AI icon if available, otherwise use first fallback
		const initialIcon = item.icon || FALLBACK_ICONS[item.category][0];
		iconCache.set(item.id, initialIcon);

		// Validate and update cache asynchronously
		getValidIcon(item).then((validIcon) => {
			if (validIcon !== initialIcon) {
				iconCache.set(item.id, validIcon);
			}
		});

		return initialIcon;
	}

	// Pre-validate common icons on mount
	onMount(async () => {
		// Pre-validate all fallback icons
		for (const category of Object.keys(FALLBACK_ICONS)) {
			for (const icon of FALLBACK_ICONS[category]) {
				await validateIcon(icon);
			}
		}

		// Then handle current items
		$shoppingListStore.forEach((item) => {
			if (!iconCache.has(item.id)) {
				handleIcon(item);
			}
		});
	});

	function removeItem(id: number) {
		shoppingListStore.update((items) => items.filter((item) => item.id !== id));
	}

	$: groupedItems = Object.entries(categories)
		.map(([id, name]) => ({
			id,
			name,
			items: $shoppingListStore.filter((item) => item.category === id)
		}))
		.filter((group) => group.items.length > 0);
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
								<Icon
									icon={handleIcon(item)}
									class="w-1/2 mb-2 h-1/2"
									fallback={FALLBACK_ICONS[item.category][0]}
								/>
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
