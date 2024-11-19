<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { onMount } from 'svelte';

	let selectedView: any = null;
	let editedConfig: string = '';
	let showNewViewForm = false;
	let newViewName = '';
	let editError: string | null = null;
	let showEditor = false;

	const viewsQuery = createQuery({
		operationName: 'queryMyViews'
	});

	const composeMutation = createMutation({
		operationName: 'composeView'
	});

	const updateMutation = createMutation({
		operationName: 'updateView'
	});

	$: views = $viewsQuery.data?.views || [];
	$: if (selectedView && (!editedConfig || editedConfig === '')) {
		editedConfig = JSON.stringify(selectedView, null, 2);
	}

	onMount(() => {
		$viewsQuery.refetch();
	});

	function handleViewSelect(view: any) {
		selectedView = view;
		editedConfig = JSON.stringify(view, null, 2);
		editError = null;
	}

	function handleConfigEdit(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		try {
			const parsed = JSON.parse(textarea.value);
			editedConfig = textarea.value;
			editError = null;
		} catch (error) {
			editError = 'Invalid JSON format';
		}
	}

	async function handleNewView() {
		try {
			const result = await $composeMutation.mutateAsync({
				name: newViewName ? newViewName : undefined
			});

			if (result) {
				await $viewsQuery.refetch();
				newViewName = '';
				showNewViewForm = false;
			}
		} catch (error) {
			console.error('Error creating view:', error);
		}
	}

	async function handleUpdateView() {
		if (!selectedView || !editedConfig) return;

		try {
			const updatedConfig = JSON.parse(editedConfig);
			const result = await $updateMutation.mutateAsync({
				id: updatedConfig.metadata.id,
				name: updatedConfig.metadata.name,
				description: updatedConfig.metadata.description,
				render: updatedConfig.render,
				stateMachine: updatedConfig.stateMachine,
				customConfig: updatedConfig.customConfig,
				isActive: updatedConfig.metadata.isActive
			});

			if (result) {
				await $viewsQuery.refetch();
				selectedView = result;
				editedConfig = JSON.stringify(result, null, 2);
				editError = null;
			}
		} catch (error) {
			console.error('Error updating view:', error);
			editError = 'Failed to update view';
		}
	}
</script>

<div class="flex h-screen overflow-hidden">
	<!-- Left sidebar - Views List -->
	<aside class="flex-shrink-0 w-[200px] border-r border-surface-600 bg-surface-900 p-4 space-y-4">
		<div class="flex justify-between items-center">
			<h2 class="text-xl font-bold">Views</h2>
			<button class="btn btn-sm variant-ghost-secondary" on:click={() => (showNewViewForm = true)}>
				New
			</button>
		</div>

		{#if showNewViewForm}
			<div class="p-3 rounded-lg border bg-surface-800 border-border">
				<form on:submit|preventDefault={handleNewView} class="space-y-3">
					<div>
						<input
							type="text"
							placeholder="View name (optional)"
							bind:value={newViewName}
							class="px-2 py-1.5 w-full text-sm rounded-md border bg-surface-900 border-border"
						/>
					</div>
					<div class="flex gap-2 justify-end">
						<button
							type="button"
							class="btn btn-sm variant-ghost-secondary"
							on:click={() => (showNewViewForm = false)}
						>
							Cancel
						</button>
						<button type="submit" class="btn btn-sm variant-ghost-secondary"> Create </button>
					</div>
				</form>
			</div>
		{/if}

		<div class="space-y-1 w-full">
			{#each views as view}
				<button
					class="w-full p-2 text-left rounded-lg hover:bg-surface-800 transition-colors {selectedView
						?.metadata.id === view.metadata.id
						? 'bg-surface-800'
						: ''}"
					on:click={() => handleViewSelect(view)}
				>
					<div class="text-sm font-medium">{view.metadata.name}</div>
					<div class="text-xs text-muted-foreground">v{view.metadata.version}</div>
				</button>
			{/each}
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-hidden">
		{#if selectedView}
			<ComposeView view={selectedView} />
		{:else}
			<div class="flex justify-center items-center h-full text-muted-foreground">
				Select a view to display
			</div>
		{/if}
	</main>

	<!-- Editor Toggle Button -->
	<button
		class="fixed right-0 top-1/2 z-10 p-2 rounded-l-lg shadow-lg transition-colors -translate-y-1/2 bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white"
		on:click={() => (showEditor = !showEditor)}
	>
		<Icon icon={showEditor ? 'mdi:chevron-right' : 'mdi:chevron-left'} class="w-5 h-5" />
	</button>

	<!-- Right sidebar - Code Editor -->
	{#if selectedView && showEditor}
		<aside class="flex-shrink-0 w-[300px] border-l border-surface-600 bg-surface-900 p-4 space-y-4">
			<div class="flex justify-between items-center">
				<h2 class="text-xl font-bold">Edit View</h2>
				<button
					class="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					on:click={handleUpdateView}
					disabled={!!editError}
				>
					Save
				</button>
			</div>
			{#if editError}
				<div class="p-2 text-sm text-red-500 rounded-lg bg-red-500/10">
					{editError}
				</div>
			{/if}
			<div class="flex flex-col w-full h-full">
				<textarea
					bind:value={editedConfig}
					on:input={handleConfigEdit}
					class="w-full h-full font-mono text-sm p-3 bg-surface-900 border border-border rounded-lg {editError
						? 'border-red-500'
						: ''}"
					spellcheck="false"
				/>
			</div>
		</aside>
	{/if}
</div>
