<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	export let me;
	export let title = 'Shopping Lists';
	export let description = 'Manage your shopping lists';

	// Category colors with hover states
	const categoryColors = {
		Fruits: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500',
		Vegetables: 'bg-green-500/10 hover:bg-green-500/20 text-green-500',
		Dairy: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
		Meat: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
		Bakery: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500',
		Beverages: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500',
		Snacks: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-500',
		Household: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500',
		Grains: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500',
		'Personal Care': 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-500',
		Other: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-500'
	} as const;

	const categoryHoverColors = {
		Fruits: 'bg-orange-500/20',
		Vegetables: 'bg-green-500/20',
		Dairy: 'bg-blue-500/20',
		Meat: 'bg-red-500/20',
		Bakery: 'bg-yellow-500/20',
		Beverages: 'bg-purple-500/20',
		Snacks: 'bg-pink-500/20',
		Household: 'bg-slate-500/20',
		Grains: 'bg-amber-500/20',
		'Personal Care': 'bg-teal-500/20',
		Other: 'bg-gray-500/20'
	} as const;

	const categoryTextColors = {
		Fruits: 'text-orange-500',
		Vegetables: 'text-green-500',
		Dairy: 'text-blue-500',
		Meat: 'text-red-500',
		Bakery: 'text-yellow-500',
		Beverages: 'text-purple-500',
		Snacks: 'text-pink-500',
		Household: 'text-slate-500',
		Grains: 'text-amber-500',
		'Personal Care': 'text-teal-500',
		Other: 'text-gray-500'
	} as const;

	// Maintain consistent category order
	const categoryOrder = [
		'Fruits',
		'Vegetables',
		'Dairy',
		'Meat',
		'Bakery',
		'Beverages',
		'Snacks',
		'Household',
		'Grains',
		'Personal Care',
		'Other'
	];

	// Simplified but diverse fallback icons per category
	const FALLBACK_ICONS = {
		Fruits: ['mdi:fruit-watermelon', 'mdi:fruit-cherries', 'mdi:food-apple'],
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
	} as const;

	// Sample items for random generation
	const sampleItems = [
		{ name: 'Apples', category: 'Fruits', icon: 'mdi:food-apple', default_unit: 'kg' },
		{ name: 'Bananas', category: 'Fruits', icon: 'mdi:fruit-watermelon', default_unit: 'kg' },
		{ name: 'Milk', category: 'Dairy', icon: 'mdi:milk', default_unit: 'l' },
		{ name: 'Bread', category: 'Bakery', icon: 'mdi:bread-slice', default_unit: 'pcs' },
		{ name: 'Cheese', category: 'Dairy', icon: 'mdi:cheese', default_unit: 'kg' },
		{ name: 'Chicken', category: 'Meat', icon: 'mdi:food-turkey', default_unit: 'kg' },
		{ name: 'Tomatoes', category: 'Vegetables', icon: 'mdi:carrot', default_unit: 'kg' },
		{ name: 'Pasta', category: 'Grains', icon: 'mdi:noodles', default_unit: 'pcs' },
		{ name: 'Rice', category: 'Grains', icon: 'mdi:rice', default_unit: 'kg' },
		{ name: 'Coffee', category: 'Beverages', icon: 'mdi:coffee', default_unit: 'pcs' },
		{ name: 'Shampoo', category: 'Personal Care', icon: 'mdi:lotion', default_unit: 'pcs' },
		{ name: 'Toothpaste', category: 'Personal Care', icon: 'mdi:toothbrush', default_unit: 'pcs' }
	];

	// WunderGraph queries and mutations
	const shoppingListsQuery = createQuery({
		operationName: 'queryShoppingLists',
		liveQuery: true
	});

	const createShoppingListMutation = createMutation({
		operationName: 'createShoppingList'
	});

	const updateShoppingListItemsMutation = createMutation({
		operationName: 'updateShoppingListItems'
	});

	const toggleShoppingListItemMutation = createMutation({
		operationName: 'toggleShoppingListItem'
	});

	let newListName = '';
	let showNewListForm = false;
	let currentListId: string | null = null;

	$: currentList = $shoppingListsQuery.data?.find((list) => list.id === currentListId);
	$: groupedItems = currentList?.shopping_list_items
		? categoryOrder
				.map((category) => ({
					category,
					items: currentList!.shopping_list_items.filter(
						(item) => item.shopping_items?.category === category && !item.is_checked
					)
				}))
				.filter((group) => group.items.length > 0)
		: [];

	async function createList() {
		if (!newListName.trim()) return;

		try {
			await $createShoppingListMutation.mutateAsync({
				listName: newListName.trim()
			});

			newListName = '';
			showNewListForm = false;
			await $shoppingListsQuery.refetch();
		} catch (error) {
			console.error('Error creating list:', error);
		}
	}

	async function addRandomItems() {
		if (!currentListId) return;

		const randomItems = [...sampleItems]
			.sort(() => 0.5 - Math.random())
			.slice(0, 3)
			.map((item) => ({
				...item,
				quantity: Math.floor(Math.random() * 5) + 1
			}));

		try {
			await $updateShoppingListItemsMutation.mutateAsync({
				listId: currentListId,
				items: randomItems
			});

			await $shoppingListsQuery.refetch();
		} catch (error) {
			console.error('Error adding random items:', error);
		}
	}

	async function toggleItemChecked(itemId: string) {
		try {
			await $toggleShoppingListItemMutation.mutateAsync({
				itemId
			});

			await $shoppingListsQuery.refetch();
		} catch (error) {
			console.error('Error toggling item:', error);
		}
	}

	onMount(async () => {
		await $shoppingListsQuery.refetch();
	});
</script>

<div class="flex relative flex-col w-full h-full bg-surface-900">
	<header class="p-4 card-header">
		<h2 class="mb-2 text-2xl font-bold text-center text-white">{title}</h2>
		<p class="text-center text-surface-200">{description}</p>
	</header>

	<div class="flex overflow-hidden flex-grow w-full">
		<!-- Lists Sidebar -->
		<div class="overflow-y-auto p-4 w-80 border-r border-surface-700">
			<!-- New List Form -->
			{#if showNewListForm}
				<div class="p-4 mb-4 rounded-lg bg-surface-800">
					<form on:submit|preventDefault={createList} class="flex flex-col gap-2">
						<input
							type="text"
							bind:value={newListName}
							placeholder="List name"
							class="px-4 py-2 w-full text-lg text-white bg-white bg-opacity-20 rounded-full border transition-all duration-300 ease-in-out outline-none border-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 placeholder:text-surface-300/60"
						/>
						<div class="flex gap-2 justify-end">
							<button
								type="button"
								on:click={() => {
									showNewListForm = false;
									newListName = '';
								}}
								class="btn variant-soft"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="bg-gradient-to-br btn variant-gradient-secondary-primary"
							>
								Create List
							</button>
						</div>
					</form>
				</div>
			{:else}
				<button
					on:click={() => (showNewListForm = true)}
					class="flex gap-2 justify-center items-center mb-4 w-full bg-gradient-to-br btn variant-gradient-secondary-primary"
				>
					<Icon icon="mdi:plus" class="w-5 h-5" />
					<span>New Shopping List</span>
				</button>
			{/if}

			<!-- Lists -->
			{#if $shoppingListsQuery.data}
				<div class="space-y-2">
					{#each $shoppingListsQuery.data as list}
						<button
							class="w-full p-4 text-left transition-colors rounded-lg {currentListId === list.id
								? 'bg-surface-700'
								: 'bg-surface-800 hover:bg-surface-700'}"
							on:click={() => (currentListId = list.id)}
						>
							<h3 class="font-semibold">{list.name}</h3>
							<p class="text-sm text-surface-300">
								{list.shopping_list_items?.length || 0} items
							</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Main Content -->
		<div class="overflow-y-auto flex-1 p-4">
			{#if currentList}
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-bold">{currentList.name}</h2>
					<button
						class="bg-gradient-to-br btn variant-gradient-secondary-primary"
						on:click={addRandomItems}
					>
						Add Random Items
					</button>
				</div>

				{#if currentList.shopping_list_items?.length === 0}
					<div class="p-8 text-center text-surface-200">
						<Icon icon="mdi:basket" class="mx-auto mb-4 w-16 h-16 opacity-50" />
						<p>No items in this list yet</p>
						<p class="mt-2 text-sm">Click the button above to add some random items</p>
					</div>
				{:else}
					<div class="space-y-8">
						<!-- Unchecked Items Grid -->
						<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
							{#each currentList.shopping_list_items.filter((item) => !item.is_checked) as item (item.id)}
								<button
									class="relative flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square {categoryColors[
										item.shopping_items?.category || 'Other'
									]}"
									on:click={() => toggleItemChecked(item.id)}
								>
									<Icon
										icon={item.shopping_items?.icon ||
											FALLBACK_ICONS[item.shopping_items?.category || 'Other'][0]}
										class="mb-2 w-1/2 h-1/2"
									/>
									<span class="overflow-hidden text-xs text-center text-ellipsis">
										{item.shopping_items?.name}
									</span>
									{#if item.quantity > 1 || item.unit}
										<div
											class="px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-surface-900/10"
										>
											{item.quantity}{item.unit ? ` ${item.unit}` : ''}
										</div>
									{/if}
								</button>
							{/each}
						</div>

						<!-- Purchased Items Section -->
						{#if currentList.shopping_list_items.some((item) => item.is_checked)}
							<div class="space-y-4">
								<div class="divider divider-surface">Purchased Items</div>
								<div class="grid grid-cols-3 gap-4 opacity-60 sm:grid-cols-5 lg:grid-cols-8">
									{#each currentList.shopping_list_items.filter((item) => item.is_checked) as item (item.id)}
										<button
											class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square bg-surface-700/50"
											on:click={() => toggleItemChecked(item.id)}
										>
											<Icon
												icon={item.shopping_items?.icon ||
													FALLBACK_ICONS[item.shopping_items?.category || 'Other'][0]}
												class="mb-2 w-1/2 h-1/2 text-surface-200"
											/>
											<span
												class="overflow-hidden text-xs text-center text-ellipsis text-surface-200"
											>
												{item.shopping_items?.name}
											</span>
											{#if item.quantity > 1 || item.unit}
												<div
													class="px-2 py-0.5 mt-1 text-xs font-medium rounded-full bg-surface-900/10"
												>
													{item.quantity}{item.unit ? ` ${item.unit}` : ''}
												</div>
											{/if}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="py-12 text-center text-surface-300">
					<p class="text-lg">Select a list from the sidebar or create a new one to get started!</p>
				</div>
			{/if}
		</div>
	</div>
</div>
