<script lang="ts">
	import { bringListStore } from '$lib/agents/bringAgent';
	import { onMount } from 'svelte';

	// Remove any unused props
	export let slot: string | undefined = undefined;

	interface ShoppingItem {
		id: number;
		name: string;
		icon: string;
	}

	const preselectedItems = [
		{ name: 'Apfel', icon: 'mdi:fruit-apple' },
		{ name: 'Banane', icon: 'mdi:fruit-banana' },
		{ name: 'Brot', icon: 'mdi:bread-slice' },
		{ name: 'Karotte', icon: 'mdi:carrot' },
		{ name: 'Käse', icon: 'mdi:cheese' },
		{ name: 'Ei', icon: 'mdi:egg' },
		{ name: 'Fisch', icon: 'mdi:fish' },
		{ name: 'Milch', icon: 'mdi:bottle-soda' },
		{ name: 'Tomate', icon: 'mdi:fruit-tomato' },
		{ name: 'Hühnchen', icon: 'mdi:food-drumstick' },
		{ name: 'Kartoffel', icon: 'mdi:potato' },
		{ name: 'Zwiebel', icon: 'mdi:onion' },
		{ name: 'Knoblauch', icon: 'mdi:garlic' },
		{ name: 'Küchentücher', icon: 'mdi:paper-roll' },
		{ name: 'Toilettenpapier', icon: 'mdi:toilet-paper' },
		{ name: 'Shampoo', icon: 'mdi:shampoo' },
		{ name: 'Zahnpasta', icon: 'mdi:toothpaste' },
		{ name: 'Kaffeebohnen', icon: 'mdi:coffee' },
		{ name: 'Tee', icon: 'mdi:tea' },
		{ name: 'Wein', icon: 'mdi:wine' }
	];

	$: shoppingList = bringListStore;

	let newItemName = '';
	let showDropdown = false;

	function addItem(name: string, icon: string = '') {
		if (name.trim()) {
			shoppingList.update((items) => [
				...items,
				{
					id: Date.now(),
					name: name.trim(),
					icon: icon
				}
			]);
			newItemName = '';
			showDropdown = false;
		}
	}

	function removeItem(id: number) {
		shoppingList.update((items) => items.filter((item) => item.id !== id));
	}

	$: filteredItems = preselectedItems.filter((item) =>
		item.name.toLowerCase().includes(newItemName.toLowerCase())
	);
</script>

<div class="relative flex flex-col w-full h-full bg-surface-50-900-token">
	<div class="flex-grow w-full p-4 overflow-y-auto card">
		<header class="card-header">
			<h2 class="mb-4 h2">Einkaufsliste</h2>
		</header>

		<section class="flex-grow">
			<div class="grid grid-cols-3 gap-4 mb-4 sm:grid-cols-5 lg:grid-cols-8">
				{#each $shoppingList as item (item.id)}
					<button
						on:click={() => removeItem(item.id)}
						class="flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square bg-surface-200-700-token hover:bg-surface-300-600-token"
					>
						<Icon icon={item.icon} class="w-1/2 mb-2 h-1/2" />
						<span class="overflow-hidden text-xs text-center text-ellipsis">{item.name}</span>
					</button>
				{/each}
			</div>

			{#if $shoppingList.length === 0}
				<p class="text-center text-surface-500">Ihre Einkaufsliste ist leer.</p>
			{/if}
		</section>
	</div>

	<div class="relative z-30 p-4 bg-surface-100-800-token">
		<div class="relative">
			<div class="input-group input-group-divider grid-cols-[1fr_auto]">
				<input
					bind:value={newItemName}
					on:focus={() => (showDropdown = true)}
					on:blur={() => setTimeout(() => (showDropdown = false), 200)}
					placeholder="Neuer Artikel"
					class="input"
				/>
				<button on:click={() => addItem(newItemName)} class="btn variant-filled-primary">+</button>
			</div>
			{#if showDropdown && filteredItems.length > 0}
				<div
					class="absolute left-0 right-0 z-20 grid w-full grid-cols-3 gap-2 p-2 mb-2 overflow-y-auto card bottom-full max-h-64 sm:grid-cols-5 lg:grid-cols-8 bg-surface-100-800-token"
				>
					{#each filteredItems as item}
						<button
							class="flex flex-col items-center justify-center p-2 transition-colors duration-200 rounded-lg aspect-square bg-surface-200-700-token hover:bg-surface-300-600-token"
							on:click={() => addItem(item.name, item.icon)}
						>
							<Icon icon={item.icon} class="w-1/2 mb-1 h-1/2" />
							<span class="overflow-hidden text-xs text-center text-ellipsis">{item.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if showDropdown}
		<div
			class="absolute inset-0 z-10 bg-black/30 backdrop-blur-sm"
			on:click={() => (showDropdown = false)}
		/>
	{/if}
</div>
