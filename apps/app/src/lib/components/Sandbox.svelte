<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

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

	const sandboxUpdateMutation = createMutation({
		operationName: 'sandboxUpdate'
	});

	let selectedSandboxId: string | null = null;
	let iframeUrl: string | null = null;

	const defaultCode = `<script>
  let count = 0;
<\/script>

<main class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Hello from SvelteKit!</h1>
  
  <button 
    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    on:click={() => count++}
  >
    Count is {count}
  </button>
</main>`;

	let code = defaultCode;

	async function runSandbox() {
		try {
			console.log('🚀 Starting SvelteKit sandbox...');
			const response = await $sandboxStartMutation.mutateAsync({});
			console.log('✨ Sandbox response:', response);
			
			if (response.success && response.url) {
				selectedSandboxId = response.id;
				iframeUrl = response.url;
				console.log('🎯 Selected sandbox:', selectedSandboxId);
				console.log('🌐 Set iframe URL to:', iframeUrl);
			} else {
				console.error('❌ Missing URL in sandbox response:', response);
			}
		} catch (error) {
			console.error('❌ Error starting sandbox:', error);
		}
	}

	function selectSandbox(sandboxId: string, url: string) {
		console.log('🔄 Switching to sandbox:', sandboxId, 'with URL:', url);
		selectedSandboxId = sandboxId;
		iframeUrl = url;
	}

	async function stopSandbox(sandboxId: string) {
		try {
			console.log('🛑 Stopping sandbox:', sandboxId);
			const response = await $sandboxStopMutation.mutateAsync({
				sandboxId
			});
			
			if (response.success) {
				console.log('✅ Successfully stopped sandbox:', sandboxId);
				if (selectedSandboxId === sandboxId) {
					selectedSandboxId = null;
					iframeUrl = null;
				}
				await $sandboxListQuery.refetch();
			} else {
				console.error('❌ Failed to stop sandbox:', response.error);
			}
		} catch (error) {
			console.error('❌ Error stopping sandbox:', error);
		}
	}

	async function updateSandbox() {
		if (!selectedSandboxId) return;

		try {
			console.log('📝 Updating sandbox code...');
			const response = await $sandboxUpdateMutation.mutateAsync({
				sandboxId: selectedSandboxId,
				code
			});

			if (response.success) {
				console.log('✨ Code updated successfully');
			} else {
				console.error('❌ Failed to update code:', response.error);
			}
		} catch (error) {
			console.error('❌ Error updating sandbox:', error);
		}
	}

	onMount(() => {
		$sandboxListQuery.refetch();
	});
</script>

<div class="grid grid-cols-[1fr_1fr] gap-4 p-4 bg-surface-800 rounded-lg h-[calc(100vh-2rem)]">
	<!-- Left side: Sandbox list and Code Editor -->
	<div class="grid grid-cols-[300px_1fr] gap-4">
		<!-- Left column: Sandbox Controls and List -->
		<div class="flex flex-col gap-4">
			<!-- Sandbox Controls -->
			<div class="flex flex-col gap-2">
				<button
					class="w-full btn variant-filled"
					on:click={runSandbox}
					disabled={$sandboxStartMutation.isLoading}
				>
					{$sandboxStartMutation.isLoading ? 'Starting...' : 'Start SvelteKit Sandbox'}
				</button>
			</div>

			<!-- Running Sandboxes List -->
			{#if $sandboxListQuery.isSuccess && $sandboxListQuery.data?.sandboxes?.length > 0}
				<div class="flex flex-col gap-2">
					<h3 class="text-lg font-semibold text-surface-50">Running Sandboxes:</h3>
					{#each $sandboxListQuery.data.sandboxes as sandbox}
						{#if sandbox.url}
							<button
								class="flex flex-col gap-2 p-3 rounded-md border transition-colors cursor-pointer
									{sandbox.id === selectedSandboxId 
										? 'bg-surface-700 border-surface-500' 
										: 'bg-surface-900 border-surface-700 hover:bg-surface-800'}"
								on:click={() => selectSandbox(sandbox.id, sandbox.url)}
							>
								<div class="flex items-center justify-between">
									<span class="text-sm truncate {sandbox.id === selectedSandboxId ? 'text-surface-50' : 'text-surface-200'}">
										{sandbox.id}
									</span>
									<button
										class="btn btn-sm variant-soft-error"
										on:click={(e) => {
											e.stopPropagation();
											stopSandbox(sandbox.id);
										}}
										disabled={$sandboxStopMutation.isLoading}
									>
										Stop
									</button>
								</div>
								{#if sandbox.id === selectedSandboxId}
									<span class="text-xs text-success-400">Currently Displayed</span>
								{/if}
							</button>
						{/if}
					{/each}
				</div>
			{:else if $sandboxListQuery.isLoading}
				<p class="text-surface-400">Loading sandboxes...</p>
			{:else if $sandboxListQuery.error}
				<p class="text-error-400">Error: {$sandboxListQuery.error.message}</p>
			{:else}
				<p class="text-surface-400">No active sandboxes</p>
			{/if}
		</div>

		<!-- Right column: Code Editor -->
		<div class="flex flex-col gap-2">
			<h3 class="text-lg font-semibold text-surface-50">Code Editor</h3>
			<textarea
				bind:value={code}
				class="flex-1 p-4 font-mono text-sm bg-surface-900 border border-surface-700 rounded-md resize-none"
				spellcheck="false"
			/>
			<button
				class="w-full btn variant-soft-primary"
				on:click={updateSandbox}
				disabled={!selectedSandboxId || $sandboxUpdateMutation.isLoading}
			>
				{$sandboxUpdateMutation.isLoading ? 'Updating...' : 'Update Sandbox'}
			</button>
		</div>
	</div>

	<!-- Right side: Sandbox Display -->
	<div class="flex flex-col gap-4 relative">
		<div class="flex-1 rounded-md border bg-surface-900 border-surface-700 overflow-hidden min-h-[600px]">
			{#if iframeUrl}
				<div class="absolute top-2 right-2 z-10 bg-surface-800 p-2 rounded-md text-xs opacity-50 hover:opacity-100 transition-opacity">
					{iframeUrl}
				</div>
				<iframe
					title="SvelteKit Sandbox"
					src={iframeUrl}
					class="w-full h-full border-none"
					sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
					on:load={() => console.log('🎉 iframe loaded')}
					on:error={(e) => console.error('❌ iframe error:', e)}
				/>
			{:else}
				<div class="flex items-center justify-center h-full text-surface-400">
					<p>Start a sandbox to see the content here</p>
				</div>
			{/if}
		</div>
	</div>
</div>
