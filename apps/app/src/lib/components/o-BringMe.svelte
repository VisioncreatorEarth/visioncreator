<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import OShoppingItems from './o-ShoppingItems.svelte';

	export let me;
	export let title = 'Shopping List';
	export let description = 'Manage your shopping list';

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
		{ name: 'Croissant', category: 'Bakery', icon: 'mdi:food-croissant' },
		{ name: 'Bagels', category: 'Bakery', icon: 'mdi:food-croissant' },
		{ name: 'Muffins', category: 'Bakery', icon: 'mdi:cookie' },
		{ name: 'Baguette', category: 'Bakery', icon: 'mdi:bread-slice' },
		{ name: 'Donuts', category: 'Bakery', icon: 'game-icons:donut' },
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
	const shoppingListQuery = createQuery({
		operationName: 'queryMyShoppingList',
		liveQuery: true
	});

	const addRandomItemsMutation = createMutation({
		operationName: 'addRandomItemsToShoppingList'
	});

	const toggleItemMutation = createMutation({
		operationName: 'addItemsToShoppingList'
	});

	// Handle adding random items
	const addRandomItems = async () => {
		try {
			await $addRandomItemsMutation.mutateAsync();
		} catch (error) {
			console.error('Error adding random items:', error);
		}
	};

	// Handle toggling items
	const handleToggleItem = async (item: any) => {
		try {
			await $toggleItemMutation.mutateAsync({
				action: 'remove',
				items: [{
					name: item.name,
					category: item.category
				}]
			});
			await $shoppingListQuery.refetch();
		} catch (error) {
			console.error('Error toggling item:', error);
		}
	};

	$: items =
		$shoppingListQuery.data?.shopping_list_items?.map((item) => ({
			id: item.id,
			name: item.shopping_items?.name,
			category: item.shopping_items?.category,
			quantity: item.quantity,
			unit: item.unit,
			icon: item.shopping_items?.icon,
			is_checked: item.is_checked
		})) || [];
</script>

<div class="overflow-hidden flex-col w-full h-full h-screen bg-surface-900">
	<div class="flex overflow-hidden flex-grow w-full h-full">
		<!-- Main Content -->
		<div class="overflow-y-auto flex-1 p-4 h-full">
			{#if $shoppingListQuery.isLoading}
				<div class="py-12 text-center text-surface-300">
					<p class="text-lg">Loading shopping list...</p>
				</div>
			{:else if $shoppingListQuery.error}
				<div class="py-12 text-center text-surface-300">
					<p class="text-lg text-error-500">
						Error loading shopping list: {$shoppingListQuery.error.message}
					</p>
					<button class="mt-4 btn variant-filled" on:click={() => $shoppingListQuery.refetch()}>
						Try Again
					</button>
				</div>
			{:else if $shoppingListQuery.data}
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-bold">Shopping List</h2>
					<button
						class="bg-gradient-to-br btn variant-gradient-secondary-primary"
						on:click={() => addRandomItems()}
					>
						Add Random Items
					</button>
				</div>

				{#if !$shoppingListQuery.data.shopping_list_items?.length}
					<div class="p-8 text-center text-surface-200">
						<Icon icon="mdi:basket" class="mx-auto mb-4 w-16 h-16 opacity-50" />
						<p>No items in this list yet</p>
						<p class="mt-2 text-sm">Click the button above to add some random items</p>
					</div>
				{:else}
					<OShoppingItems {items} onToggle={handleToggleItem} />
				{/if}
				<div class="h-48" />
			{/if}
		</div>
	</div>
</div>
