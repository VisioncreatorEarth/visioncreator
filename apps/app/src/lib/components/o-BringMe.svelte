<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	export let title = 'Shopping Lists';
	export let description = 'Manage your shopping lists';

	// WunderGraph queries
	const shoppingListsQuery = createQuery({
		operationName: 'queryShoppingLists'
	});

	const createShoppingListMutation = createMutation({
		operationName: 'createShoppingList'
	});

	let newListName = '';
	let showNewListForm = false;
	let currentListId: string | null = null;

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

	onMount(async () => {
		await $shoppingListsQuery.refetch();
	});
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold">{title}</h2>
		<p class="text-gray-600">{description}</p>
	</div>

	<!-- Main Content -->
	<div class="flex flex-1 gap-4">
		<!-- Sidebar -->
		<div class="p-4 w-64 bg-gray-50 rounded-lg">
			<div class="flex justify-between items-center mb-4">
				<h3 class="font-semibold">Lists</h3>
				<button class="text-blue-500 hover:text-blue-600" on:click={() => (showNewListForm = true)}>
					+
				</button>
			</div>

			{#if showNewListForm}
				<form on:submit|preventDefault={createList} class="mb-4">
					<input
						type="text"
						bind:value={newListName}
						placeholder="List name"
						class="p-2 mb-2 w-full rounded border"
					/>
					<div class="flex gap-2">
						<button type="submit" class="flex-1 btn variant-filled-primary">Create</button>
						<button
							type="button"
							class="flex-1 btn variant-filled-surface"
							on:click={() => (showNewListForm = false)}
						>
							Cancel
						</button>
					</div>
				</form>
			{/if}

			{#if $shoppingListsQuery.isSuccess}
				<div class="space-y-2">
					{#each $shoppingListsQuery.data as list}
						<button
							class="w-full p-2 text-left rounded hover:bg-gray-100 {list.id === currentListId
								? 'bg-gray-100'
								: ''}"
							on:click={() => {
								currentListId = list.id;
							}}
						>
							{list.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Main Area -->
		<div class="flex-1 bg-white rounded-lg shadow">
			<div class="flex justify-center items-center h-full">
				<p class="text-center text-gray-500">Select or create a shopping list to get started</p>
			</div>
		</div>
	</div>
</div>

<style>
	.spinner {
		border: 4px solid #f3f3f3;
		border-top: 4px solid #3498db;
		border-radius: 50%;
		width: 30px;
		height: 30px;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
