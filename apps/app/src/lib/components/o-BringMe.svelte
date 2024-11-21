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
		Dairy: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500',
		Meat: 'bg-red-500/10 hover:bg-red-500/20 text-red-500',
		Grains: 'bg-warning-500/10 hover:bg-amwarningber-500/20 text-warning-500',
		Bakery: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500',
		Beverages: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500',
		Snacks: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-500',
		Household: 'bg-tertiary-500/10 hover:bg-tertiary-500/20 text-tertiary-500',
		'Personal Care': 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-500',
		Other: 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-500'
	} as const;

	// Maintain consistent category order
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

	// Simplified but diverse fallback icons per category
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
	} as const;

	// Sample items for random generation
	const sampleItems = [
		// Fruits
		{ name: 'Bananas', category: 'Fruits', icon: 'mdi:fruit-watermelon' },
		{ name: 'Apples', category: 'Fruits', icon: 'mdi:food-apple' },
		{ name: 'Oranges', category: 'Fruits', icon: 'mdi:fruit-citrus' },
		{ name: 'Strawberries', category: 'Fruits', icon: 'mdi:fruit-cherries' },
		{ name: 'Grapes', category: 'Fruits', icon: 'mdi:fruit-grapes' },
		{ name: 'Peaches', category: 'Fruits', icon: 'mdi:fruit-watermelon' },
		{ name: 'Pineapple', category: 'Fruits', icon: 'mdi:fruit-pineapple' },
		{ name: 'Mango', category: 'Fruits', icon: 'mdi:fruit-watermelon' },

		// Vegetables
		{ name: 'Broccoli', category: 'Vegetables', icon: 'mdi:sprout' },
		{ name: 'Carrots', category: 'Vegetables', icon: 'mdi:carrot' },
		{ name: 'Tomatoes', category: 'Vegetables', icon: 'mdi:fruit-cherries' },
		{ name: 'Lettuce', category: 'Vegetables', icon: 'mdi:leaf' },
		{ name: 'Cucumber', category: 'Vegetables', icon: 'mdi:sprout' },
		{ name: 'Bell Peppers', category: 'Vegetables', icon: 'mdi:sprout' },
		{ name: 'Spinach', category: 'Vegetables', icon: 'mdi:leaf' },
		{ name: 'Onions', category: 'Vegetables', icon: 'mdi:sprout' },
		{ name: 'Potatoes', category: 'Vegetables', icon: 'mdi:carrot' },
		{ name: 'Garlic', category: 'Vegetables', icon: 'mdi:sprout' },

		// Dairy
		{ name: 'Milk', category: 'Dairy', icon: 'mdi:bottle-tonic' },
		{ name: 'Cheese', category: 'Dairy', icon: 'mdi:cheese' },
		{ name: 'Yogurt', category: 'Dairy', icon: 'mdi:cup' },
		{ name: 'Butter', category: 'Dairy', icon: 'mdi:bottle-tonic' },
		{ name: 'Cream', category: 'Dairy', icon: 'mdi:cup' },
		{ name: 'Sour Cream', category: 'Dairy', icon: 'mdi:cup' },
		{ name: 'Cottage Cheese', category: 'Dairy', icon: 'mdi:cheese' },

		// Bakery
		{ name: 'Bread', category: 'Bakery', icon: 'mdi:bread-slice' },
		{ name: 'Croissant', category: 'Bakery', icon: 'mdi:bread-slice-outline' },
		{ name: 'Bagels', category: 'Bakery', icon: 'mdi:bread-slice-outline' },
		{ name: 'Muffins', category: 'Bakery', icon: 'mdi:cookie' },
		{ name: 'Baguette', category: 'Bakery', icon: 'mdi:bread-slice' },
		{ name: 'Donuts', category: 'Bakery', icon: 'mdi:cookie' },
		{ name: 'Cake', category: 'Bakery', icon: 'mdi:cake-variant' },

		// Snacks
		{ name: 'Potato Chips', category: 'Snacks', icon: 'mdi:chips' },
		{ name: 'Cookies', category: 'Snacks', icon: 'mdi:cookie' },
		{ name: 'Popcorn', category: 'Snacks', icon: 'mdi:popcorn' },
		{ name: 'Nuts', category: 'Snacks', icon: 'mdi:peanut' },
		{ name: 'Pretzels', category: 'Snacks', icon: 'mdi:pretzel' },
		{ name: 'Crackers', category: 'Snacks', icon: 'mdi:cracker' },
		{ name: 'Chocolate', category: 'Snacks', icon: 'mdi:candy' },

		// Beverages
		{ name: 'Water', category: 'Beverages', icon: 'mdi:water' },
		{ name: 'Coffee', category: 'Beverages', icon: 'mdi:coffee' },
		{ name: 'Tea', category: 'Beverages', icon: 'mdi:tea' },
		{ name: 'Juice', category: 'Beverages', icon: 'mdi:cup' },
		{ name: 'Soda', category: 'Beverages', icon: 'mdi:bottle-soda' },
		{ name: 'Beer', category: 'Beverages', icon: 'mdi:beer' },
		{ name: 'Wine', category: 'Beverages', icon: 'mdi:wine' },

		// Meat
		{ name: 'Chicken', category: 'Meat', icon: 'mdi:food-drumstick' },
		{ name: 'Beef', category: 'Meat', icon: 'mdi:food-steak' },
		{ name: 'Pork', category: 'Meat', icon: 'mdi:food-steak' },
		{ name: 'Fish', category: 'Meat', icon: 'mdi:fish' },
		{ name: 'Turkey', category: 'Meat', icon: 'mdi:food-drumstick' },
		{ name: 'Lamb', category: 'Meat', icon: 'mdi:food-steak' },
		{ name: 'Sausages', category: 'Meat', icon: 'mdi:sausage' },

		// Grains
		{ name: 'Rice', category: 'Grains', icon: 'mdi:grain' },
		{ name: 'Pasta', category: 'Grains', icon: 'mdi:noodles' },
		{ name: 'Cereal', category: 'Grains', icon: 'mdi:bowl' },
		{ name: 'Oatmeal', category: 'Grains', icon: 'mdi:bowl' },
		{ name: 'Quinoa', category: 'Grains', icon: 'mdi:grain' },
		{ name: 'Flour', category: 'Grains', icon: 'mdi:flour' },

		// Personal Care
		{ name: 'Soap', category: 'Personal Care', icon: 'mdi:hand-wash' },
		{ name: 'Shampoo', category: 'Personal Care', icon: 'mdi:shampoo' },
		{ name: 'Toothpaste', category: 'Personal Care', icon: 'mdi:toothbrush' },
		{ name: 'Deodorant', category: 'Personal Care', icon: 'mdi:spray' },
		{ name: 'Toilet Paper', category: 'Personal Care', icon: 'mdi:paper-roll' },
		{ name: 'Tissues', category: 'Personal Care', icon: 'mdi:tissue-box' },

		// Household
		{ name: 'Paper Towels', category: 'Household', icon: 'mdi:paper-roll' },
		{ name: 'Trash Bags', category: 'Household', icon: 'mdi:delete' },
		{ name: 'Dish Soap', category: 'Household', icon: 'mdi:bottle-tonic' },
		{ name: 'Laundry Detergent', category: 'Household', icon: 'mdi:washing-machine' },
		{ name: 'Sponges', category: 'Household', icon: 'mdi:spray-bottle' },
		{ name: 'Light Bulbs', category: 'Household', icon: 'mdi:lightbulb' }
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

	async function addRandomItems() {
		if (!currentListId) return;

		try {
			await $updateShoppingListItemsMutation.mutateAsync({
				listId: currentListId,
				items: sampleItems.map((item) => ({
					...item,
					quantity: 1
				}))
			});
		} catch (error) {
			console.error('Error adding random items:', error);
		}
	}

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

	async function toggleItemChecked(itemId: string, itemName: string) {
		if (!currentListId) return;

		try {
			await $toggleShoppingListItemMutation.mutateAsync({
				listId: currentListId,
				itemName
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

<div class="overflow-hidden flex-col w-full h-full h-screen bg-surface-900">
	<div class="flex overflow-hidden flex-grow w-full h-full">
		<!-- Lists Sidebar -->
		<div class="overflow-y-auto p-4 w-80 h-full border-r border-surface-700">
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
		<div class="overflow-y-auto flex-1 p-4 h-full">
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
							{#each groupedItems as group}
								{#each group.items as item (item.id)}
									<button
										class="flex relative flex-col justify-center items-center p-2 rounded-lg transition-colors duration-200 aspect-square {categoryColors[
											item.shopping_items?.category || 'Other'
										]}"
										on:click={() => toggleItemChecked(item.id, item.shopping_items?.name || '')}
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
											on:click={() => toggleItemChecked(item.id, item.shopping_items?.name || '')}
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
				<div class="h-48" />
			{:else}
				<div class="py-12 text-center text-surface-300">
					<p class="text-lg">Select a list from the sidebar or create a new one to get started!</p>
				</div>
			{/if}
		</div>
	</div>
</div>
