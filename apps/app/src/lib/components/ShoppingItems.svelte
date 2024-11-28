<script lang="ts">
	import Icon from '@iconify/svelte';
	import { loadIcon } from '@iconify/svelte';
	import { onMount } from 'svelte';

	const CATEGORY_ICONS = {
		Vegetables: 'mdi:food-broccoli',
		Fruits: 'mdi:fruit-watermelon',
		Meat: 'mdi:food-steak',
		Grains: 'mdi:grain',
		Bakery: 'mdi:baguette',
		Beverages: 'mdi:bottle-soda',
		Dairy: 'mdi:cheese',
		Snacks: 'mdi:cookie',
		'Personal Care': 'mdi:toothbrush',
		Household: 'mdi:spray-bottle',
		Other: 'mdi:basket'
	};

	// Keep track of validated icons
	const validatedIcons = new Set<string>();

	// Validate and cache icon existence
	async function validateIcon(iconName: string): Promise<boolean> {
		if (validatedIcons.has(iconName)) {
			return true;
		}

		try {
			const iconData = await loadIcon(iconName);
			if (iconData) {
				validatedIcons.add(iconName);
				return true;
			}
		} catch (error) {
			return false;
		}
		return false;
	}

	// Function to get icon for an item with validation
	async function getValidIcon(item: any): Promise<string> {
		// First try the item's custom icon if it exists
		if (item.icon) {
			const isValid = await validateIcon(item.icon);
			if (isValid) {
				return item.icon;
			}
		}

		// Then try the category default icon
		const categoryIcon = CATEGORY_ICONS[item.category];
		if (categoryIcon) {
			const isValid = await validateIcon(categoryIcon);
			if (isValid) {
				return categoryIcon;
			}
		}

		// Finally, use the "Other" category icon as ultimate fallback
		return CATEGORY_ICONS.Other;
	}

	// Reactive statement to handle icon validation
	let iconPromises = new Map<string, Promise<string>>();

	$: {
		// Update icon promises whenever items change
		items.forEach((item) => {
			const key = `${item.category}-${item.name}-${item.icon || ''}`;
			if (!iconPromises.has(key)) {
				iconPromises.set(key, getValidIcon(item));
			}
		});
	}

	// Preload all category icons on mount
	onMount(async () => {
		await Promise.all(Object.values(CATEGORY_ICONS).map((icon) => validateIcon(icon)));
	});

	// Function to get icon for an item
	function getIcon(item: any) {
		return CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
	}

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

	const categoryColors = {
		Vegetables: 'bg-green-500/10 hover:bg-green-500/20 text-green-500',
		Fruits: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500',
		Meat: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
		Grains: 'bg-warning-500/10 hover:bg-warning-500/20 text-warning-500',
		Bakery: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500',
		Beverages: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
		Dairy: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500',
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
			class="grid grid-cols-3 @sm:grid-cols-4 @md:grid-cols-5 @lg:grid-cols-6 @xl:grid-cols-8 @2xl:grid-cols-10 gap-4"
		>
			{#each categoryOrder as category, categoryIndex}
				{#each activeItems.filter((item) => item.category === category) || [] as item, index (`${category}-${item.name}-${index}-${categoryIndex}`)}
					{#await iconPromises.get(`${item.category}-${item.name}-${item.icon || ''}`) || getValidIcon(item) then validIcon}
						<button
							class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square {item.is_checked
								? 'bg-surface-700/50'
								: categoryColors[item.category || 'Other']}"
							on:click={() => onToggle && onToggle(item)}
						>
							<Icon icon={validIcon} class="mb-2 w-1/2 h-1/2" />
							<span class="overflow-hidden text-xs font-semibold text-center text-ellipsis">
								{item.name}
							</span>
							{#if item.quantity > 1 || item.unit}
								<div class="px-2 font-medium rounded-full text-2xs">
									{item.quantity}{item.unit ? ` ${item.unit}` : ''}
								</div>
							{/if}
						</button>
					{:catch}
						<button
							class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square {item.is_checked
								? 'bg-surface-700/50'
								: categoryColors[item.category || 'Other']}"
							on:click={() => onToggle && onToggle(item)}
						>
							<Icon icon={CATEGORY_ICONS.Other} class="mb-2 w-1/2 h-1/2" />
							<span class="overflow-hidden text-xs font-semibold text-center text-ellipsis">
								{item.name}
							</span>
							{#if item.quantity > 1 || item.unit}
								<div class="px-2 font-medium rounded-full text-2xs">
									{item.quantity}{item.unit ? ` ${item.unit}` : ''}
								</div>
							{/if}
						</button>
					{/await}
				{/each}
			{/each}

			{#if purchasedItems.length > 0}
				{#each purchasedItems as item (getItemKey(item))}
					{#await iconPromises.get(getItemKey(item)) || getValidIcon(item) then validIcon}
						<button
							class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square bg-surface-700/50"
							on:click={() => onToggle && onToggle(item)}
						>
							<Icon icon={validIcon} class="mb-2 w-1/2 h-1/2 text-surface-200/60" />
							<span
								class="overflow-hidden text-xs font-semibold text-center text-ellipsis text-surface-200/60"
							>
								{item.name}
							</span>
							{#if item.quantity > 1 || item.unit}
								<div
									class="px-2 font-medium rounded-full text-2xs bg-surface-900/20 text-surface-200/60"
								>
									{item.quantity}{item.unit ? ` ${item.unit}` : ''}
								</div>
							{/if}
						</button>
					{:catch}
						<button
							class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square bg-surface-700/50"
							on:click={() => onToggle && onToggle(item)}
						>
							<Icon icon={CATEGORY_ICONS.Other} class="mb-2 w-1/2 h-1/2 text-surface-200/60" />
							<span
								class="overflow-hidden text-xs font-semibold text-center text-ellipsis text-surface-200/60"
							>
								{item.name}
							</span>
							{#if item.quantity > 1 || item.unit}
								<div
									class="px-2 font-medium rounded-full text-2xs bg-surface-900/20 text-surface-200/60"
								>
									{item.quantity}{item.unit ? ` ${item.unit}` : ''}
								</div>
							{/if}
						</button>
					{/await}
				{/each}
			{/if}
		</div>
	</div>
{/if}
