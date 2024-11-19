<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	export let me;
	export let title = 'Shopping Lists';
	export let description = 'Manage your shopping lists';

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

	const categoryHoverColors = {
		fruits: 'bg-orange-500/20',
		vegetables: 'bg-green-500/20',
		dairy: 'bg-blue-500/20',
		meat: 'bg-red-500/20',
		bakery: 'bg-yellow-500/20',
		beverages: 'bg-purple-500/20',
		snacks: 'bg-pink-500/20',
		household: 'bg-slate-500/20',
		grains: 'bg-amber-500/20',
		other: 'bg-gray-500/20'
	} as const;

	const categoryTextColors = {
		fruits: 'text-orange-500',
		vegetables: 'text-green-500',
		dairy: 'text-blue-500',
		meat: 'text-red-500',
		bakery: 'text-yellow-500',
		beverages: 'text-purple-500',
		snacks: 'text-pink-500',
		household: 'text-slate-500',
		grains: 'text-amber-500',
		other: 'text-gray-500'
	} as const;

	// Maintain consistent category order
	const categoryOrder = [
		'fruits',
		'vegetables',
		'dairy',
		'meat',
		'bakery',
		'beverages',
		'snacks',
		'household',
		'grains',
		'other'
	];

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

	// Sample items for random generation
	const sampleItems = [
		{ name: 'Apples', category: 'fruits', icon: 'mdi:food-apple', default_unit: 'kg' },
		{ name: 'Bananas', category: 'fruits', icon: 'mdi:food-apple', default_unit: 'kg' },
		{ name: 'Milk', category: 'dairy', icon: 'mdi:cup', default_unit: 'l' },
		{ name: 'Bread', category: 'bakery', icon: 'mdi:bread-slice', default_unit: 'pcs' },
		{ name: 'Cheese', category: 'dairy', icon: 'mdi:cheese', default_unit: 'kg' },
		{ name: 'Chicken', category: 'meat', icon: 'mdi:food-turkey', default_unit: 'kg' },
		{ name: 'Tomatoes', category: 'vegetables', icon: 'mdi:food', default_unit: 'kg' },
		{ name: 'Pasta', category: 'grains', icon: 'mdi:noodles', default_unit: 'pcs' },
		{ name: 'Rice', category: 'grains', icon: 'mdi:rice', default_unit: 'kg' },
		{ name: 'Coffee', category: 'beverages', icon: 'mdi:coffee', default_unit: 'pcs' }
	];

	// WunderGraph queries and mutations
	const shoppingListsQuery = createQuery({
		operationName: 'queryShoppingLists'
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
									class="relative flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square {categoryColors[item.shopping_items?.category || 'other']}"
									on:click={() => toggleItemChecked(item.id)}
								>
									<Icon
										icon={item.shopping_items?.icon ||
											FALLBACK_ICONS[item.shopping_items?.category || 'other'][0]}
										class="w-1/2 mb-2 h-1/2"
									/>
									<span class="overflow-hidden text-xs text-center text-ellipsis">
										{item.shopping_items?.name}
									</span>
									{#if item.quantity > 1 || item.unit}
										<div class="mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-900/10">
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
											class="relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 aspect-square bg-surface-700/50"
											on:click={() => toggleItemChecked(item.id)}
										>
											<Icon
												icon={item.shopping_items?.icon ||
													FALLBACK_ICONS[item.shopping_items?.category || 'other'][0]}
												class="w-1/2 mb-2 h-1/2 text-surface-200"
											/>
											<span class="overflow-hidden text-xs text-center text-ellipsis text-surface-200">
												{item.shopping_items?.name}
											</span>
											{#if item.quantity > 1 || item.unit}
												<div class="mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-900/10">
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
