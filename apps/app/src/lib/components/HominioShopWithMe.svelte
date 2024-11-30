<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';

	export let me;

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

	const addItemsMutation = createMutation({
		operationName: 'addItemsToShoppingList'
	});

	const toggleItemMutation = createMutation({
		operationName: 'addItemsToShoppingList'
	});

	// Handle toggling items
	const handleToggleItem = async (item: any) => {
		try {
			await $toggleItemMutation.mutateAsync({
				action: item.is_checked ? 'add' : 'remove',
				items: [
					{
						name: item.name,
						category: item.category
					}
				]
			});
			await $shoppingListQuery.refetch();
		} catch (error) {
			console.error('Error toggling item:', error);
		}
	};

	let purchasedItems: any[] = [];

	$: items =
		$shoppingListQuery.data?.shopping_list_items?.map((item) => ({
			id: item.id,
			name: item.shopping_items?.name,
			category: item.shopping_items?.category,
			quantity: item.quantity,
			unit: item.unit,
			icon: item.shopping_items?.icon,
			is_checked: item.is_checked,
			last_modified: new Date(item.updated_at).getTime()
		})) || [];

	$: activeItems = items.filter((item) => !item.is_checked);
	$: purchasedItems = items
		.filter((item) => item.is_checked)
		.sort((a, b) => b.last_modified - a.last_modified);
</script>

<div class="relative h-screen bg-surface-900">
	<!-- Scrollable Content - Full height and starts from top -->
	<div class="overflow-y-auto absolute inset-0">
		<div class="mx-auto space-y-8 max-w-6xl">
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
				<!-- Active Items Section -->
				<div class="p-4 pt-20 rounded-2xl bg-surface-800">
					{#if !activeItems.length}
						<div class="p-8 text-center text-surface-200">
							<Icon icon="mdi:basket" class="mx-auto mb-4 w-16 h-16 opacity-50" />
							<p>No items in your shopping list yet</p>
							<p class="mt-2 text-sm text-primary-300">
								Long press the Hominio Logo Button at the bottom to start talking to Hominio and ask
								her to add Items to your shopping list. <br />Keep the button pressed as long as you
								want to have a conversation or Hominio is working on your requests.
							</p>
						</div>
					{:else}
						<ShoppingItems items={activeItems} onToggle={handleToggleItem} />
					{/if}
				</div>

				<!-- Purchased Items Section -->
				{#if purchasedItems.length}
					<div class="p-4 rounded-2xl bg-surface-800">
						<ShoppingItems items={purchasedItems} onToggle={handleToggleItem} />
					</div>
				{/if}
				<div class="h-20" />
			{/if}
		</div>
	</div>

	<!-- Fixed Header with Fade - Overlays the content -->
	<div class="absolute top-0 right-0 left-0 z-10">
		<div
			class="absolute inset-0 h-20 bg-gradient-to-b to-transparent pointer-events-none from-surface-900 via-surface-900/95"
		/>
		<div class="px-4 mx-auto max-w-6xl">
			<div class="flex relative justify-center p-4">
				<div class="inline-block px-6 py-2 rounded-2xl bg-surface-800">
					<h1
						class="text-xl @xs:text-2xl @sm:text-2xl @md:text-2xl @lg:text-3xl @xl:text-4xl text-center text-surface-300 h3 font-bold whitespace-nowrap"
					>
						Hominio ShopWithMe
					</h1>
				</div>
			</div>
		</div>
	</div>
</div>
