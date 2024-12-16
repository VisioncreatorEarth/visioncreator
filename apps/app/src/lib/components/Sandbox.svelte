<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	let code = 'print("Hello from sandbox!")';

	const sandboxStartMutation = createMutation({
		operationName: 'sandboxStart'
	});

	const sandboxListQuery = createQuery({
		operationName: 'sandboxList',
		liveQuery: true
	});

	const sandboxStopMutation = createMutation({
		operationName: 'sandboxStop'
	});

	async function runCode() {
		try {
			console.log('🎯 Running code in sandbox...');
			const response = await $sandboxStartMutation.mutateAsync({
				code
			});
			console.log('✨ Sandbox response:', response);
		} catch (error) {
			console.error('❌ Error running code:', error);
		}
	}

	async function stopSandbox(sandboxId: string) {
		if (!sandboxId) {
			console.error('❌ No sandbox ID provided');
			return;
		}
		try {
			console.log('🛑 Stopping sandbox:', sandboxId);
			const response = await $sandboxStopMutation.mutateAsync({
				sandboxId
			});
			console.log('✨ Stop sandbox response:', response);
			// Refresh the sandboxes list
			await $sandboxListQuery.refetch();
		} catch (error) {
			console.error('❌ Error stopping sandbox:', error);
		}
	}

	onMount(() => {
		// Initialize any required resources
	});
</script>

<div class="grid grid-cols-2 gap-4 p-4 bg-surface-800 rounded-lg h-[calc(100vh-2rem)]">
	<div class="flex gap-4 h-full">
		<div class="flex flex-col w-64 h-full">
			<h2 class="mb-2 font-medium text-surface-50">Active Sandboxes:</h2>
			<div class="overflow-auto flex-1 p-2 rounded-md border bg-surface-900/50 border-surface-700">
				{#if $sandboxListQuery.isLoading}
					<p class="text-surface-400">Loading sandboxes...</p>
				{:else if $sandboxListQuery.error}
					<p class="text-error-400">Error loading sandboxes: {$sandboxListQuery.error.message}</p>
				{:else if $sandboxListQuery.data?.sandboxes?.length === 0}
					<p class="text-surface-400">No active sandboxes</p>
				{:else}
					<div class="space-y-2">
						{#each $sandboxListQuery.data?.sandboxes || [] as sandbox}
							{#if sandbox && sandbox.id}
								<div class="p-2 rounded-md border bg-surface-900 border-surface-700">
									<p class="text-xs truncate">ID: {sandbox.id}</p>
									<p class="text-xs">Status: {sandbox.status || 'unknown'}</p>
									<p class="text-xs">Created: {new Date(sandbox.createdAt).toLocaleString()}</p>
									<button
										class="mt-2 w-full btn btn-sm variant-soft-error"
										on:click={() => stopSandbox(sandbox.id)}
										disabled={$sandboxStopMutation.isLoading}
									>
										{$sandboxStopMutation.isLoading ? 'Stopping...' : 'Stop Sandbox'}
									</button>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
		<div class="flex flex-col flex-1 h-full">
			<label for="code" class="block mb-2 font-medium text-surface-50">Code:</label>
			<textarea
				id="code"
				bind:value={code}
				class="flex-1 p-2 mb-2 w-full font-mono rounded-md border bg-surface-900 text-surface-50 border-surface-700"
				placeholder="Enter your Python code here..."
			/>
			<button
				class="w-full btn variant-filled"
				on:click={runCode}
				disabled={$sandboxStartMutation.isLoading}
			>
				{$sandboxStartMutation.isLoading ? 'Running...' : 'Run Code'}
			</button>
		</div>
	</div>

	<div class="flex flex-col h-full">
		<h2 class="mb-2 font-medium text-surface-50">Output:</h2>
		<div class="overflow-hidden flex-1 rounded-md border bg-surface-900 border-surface-700">
			{#if $sandboxStartMutation.data?.output}
				<pre class="overflow-auto p-4 h-full whitespace-pre-wrap">{$sandboxStartMutation.data
						.output}</pre>
			{:else if $sandboxStartMutation.data?.error || $sandboxStartMutation.error}
				<pre class="p-4 whitespace-pre-wrap text-error-400">
					{$sandboxStartMutation.data?.error || $sandboxStartMutation.error?.message || 'No output'}
				</pre>
			{:else}
				<p class="p-4 text-surface-400">Run your code to see output here</p>
			{/if}
		</div>
	</div>
</div>
