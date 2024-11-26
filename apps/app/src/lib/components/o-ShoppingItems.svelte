<script lang="ts">
	import Icon from '@iconify/svelte';

	export let items: Array<{
		id?: string;
		name: string;
		category: string;
		quantity?: number;
		unit?: string;
		icon?: string;
		is_checked?: boolean;
	}> = [];

	export let onToggle: ((item: any) => void) | undefined = undefined;

	function getItemKey(item: any, index: number, categoryIndex: number) {
		if (item.id) return item.id;
		return `${item.category}-${item.name}-${index}-${categoryIndex}-${Date.now()}`;
	}

	// Category colors with hover states and text colors
	const categoryColors = {
		Fruits: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500',
		Vegetables: 'bg-green-500/10 hover:bg-green-500/20 text-green-500',
		Dairy: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500',
		Meat: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
		Grains: 'bg-warning-500/10 hover:bg-warning-500/20 text-warning-500',
		Bakery: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500',
		Beverages: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
		Snacks: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-500',
		Household: 'bg-tertiary-500/10 hover:bg-tertiary-500/20 text-tertiary-500',
		'Personal Care': 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-500',
		Other: 'bg-gray-500/20 hover:bg-gray-500/40 text-gray-300'
	};

	const categoryOrder = [
		'Vegetables',
		'Fruits',
		'Meat',
		'Grains',
		'Bakery',
		'Beverages',
		'Dairy',
		'Snacks',
		'Personal Care',
		'Household',
		'Other'
	];

	const FALLBACK_ICONS = {
		Fruits: ['mdi:fruit-watermelon', 'mdi:food-apple', 'mdi:fruit-cherries'],
		Vegetables: ['mdi:carrot', 'mdi:food-broccoli', 'mdi:leaf'],
		Dairy: ['mdi:cheese', 'mdi:milk', 'mdi:egg'],
		Meat: ['mdi:food-steak', 'mdi:food-turkey', 'mdi:fish'],
		Bakery: ['mdi:bread-slice', 'mdi:croissant', 'mdi:cookie'],
		Beverages: ['mdi:cup', 'mdi:bottle-soda', 'mdi:coffee'],
		Snacks: ['mdi:cookie', 'mdi:food-potato', 'mdi:candy'],
		Household: ['mdi:home', 'mdi:washing-machine', 'mdi:broom'],
		Grains: ['mdi:pasta', 'mdi:rice', 'mdi:grain', 'mdi:noodles'],
		'Personal Care': ['mdi:face-man', 'mdi:toothbrush', 'mdi:lotion'],
		Other: ['mdi:shopping']
	};

	let groupedItems = [];

	$: {
		if (items) {
			// Only group items if they are not purchased (checked)
			if (!items.every((item) => item.is_checked)) {
				const grouped = items.reduce((acc, item) => {
					if (!acc[item.category]) {
						acc[item.category] = [];
					}
					acc[item.category].push(item);
					return acc;
				}, {});
				groupedItems = Object.entries(grouped).map(([category, items]) => ({
					category,
					items
				}));
			} else {
				// For purchased items, don't group, just put each item in its own "group"
				groupedItems = [{ category: '', items: items }];
			}
		} else {
			groupedItems = [];
		}
	}

	$: activeItems = items.filter((item) => !item.is_checked);
	$: purchasedItems = items.filter((item) => item.is_checked);
</script>

{#if items.length === 0}
	<div class="p-8 text-center text-surface-200">
		<Icon icon="mdi:basket" class="mx-auto mb-4 w-16 h-16 opacity-50" />
		<p>No items in this list yet</p>
		<p class="mt-2 text-sm">Click the button above to add some items</p>
	</div>
{:else}
	<div class="@container">
		<div
			class="grid grid-cols-2 @xs:grid-cols-3 @sm:grid-cols-4 @md:grid-cols-5 @lg:grid-cols-6 @xl:grid-cols-8 @2xl:grid-cols-10 gap-4"
		>
			{#each categoryOrder as category, categoryIndex}
				{#each activeItems.filter((item) => item.category === category) || [] as item, index (`${category}-${item.name}-${index}-${categoryIndex}`)}
					<button
						class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square {item.is_checked
							? 'bg-surface-700/50'
							: categoryColors[item.category || 'Other']}"
						on:click={() => onToggle && onToggle(item)}
					>
						<Icon
							icon={item.icon || FALLBACK_ICONS[item.category || 'Other'][0]}
							class="mb-2 w-1/2 h-1/2 {item.is_checked ? 'text-surface-200/60' : ''}"
						/>
						<span
							class="overflow-hidden text-xs text-center text-ellipsis {item.is_checked
								? 'text-surface-200/60'
								: ''}"
						>
							{item.name}
						</span>
						{#if item.quantity > 1 || item.unit}
							<div
								class="px-2 py-0.5 mt-1 text-xs font-medium rounded-full {item.is_checked
									? 'bg-surface-900/20'
									: 'bg-surface-900/10'}"
							>
								{item.quantity}{item.unit ? ` ${item.unit}` : ''}
							</div>
						{/if}
					</button>
				{/each}
			{/each}
		</div>

		<!-- Purchased Items Section -->
		{#if purchasedItems.length > 0}
			<div
				class="grid grid-cols-2 @xs:grid-cols-3 @sm:grid-cols-4 @md:grid-cols-5 @lg:grid-cols-6 @xl:grid-cols-8 @2xl:grid-cols-10 gap-4"
			>
				{#each purchasedItems as item (getItemKey(item))}
					<button
						class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square bg-surface-700/50"
						on:click={() => onToggle && onToggle(item)}
					>
						<Icon
							icon={item.icon || FALLBACK_ICONS[item.category || 'Other'][0]}
							class="mb-2 w-1/2 h-1/2 text-surface-200/60"
						/>
						<span class="overflow-hidden text-xs text-center text-ellipsis text-surface-200/60">
							{item.name}
						</span>
						{#if item.quantity > 1 || item.unit}
							<div class="px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-surface-900/20">
								{item.quantity}{item.unit ? ` ${item.unit}` : ''}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
