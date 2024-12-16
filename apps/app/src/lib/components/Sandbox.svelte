<script lang="ts">
	import { createMutation } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	let code = 'print("Hello from sandbox!")';

	const sandboxMutation = createMutation({
		operationName: 'sandboxExample'
	});

	async function runCode() {
		try {
			console.log('🎯 Running code in sandbox...');
			const response = await $sandboxMutation.mutateAsync({
				code
			});
			console.log('✨ Sandbox response:', response);
		} catch (error) {
			console.error('❌ Error running code:', error);
		}
	}

	onMount(() => {
		// Initialize any required resources
	});
</script>

<div class="grid grid-cols-2 gap-4 p-4 bg-surface-800 rounded-lg h-[calc(100vh-2rem)]">
	<!-- Left side: Code Editor -->
	<div class="space-y-4">
		<div class="space-y-2">
			<label for="code" class="block font-medium text-surface-50">Code:</label>
			<textarea
				id="code"
				bind:value={code}
				class="p-2 w-full h-[calc(100vh-12rem)] font-mono bg-surface-900 text-surface-50 rounded-md border-surface-700 border"
				placeholder="Enter your Python code here..."
			/>
		</div>

		<button
			class="btn variant-filled w-full"
			on:click={runCode}
			disabled={$sandboxMutation.isLoading}
		>
			{$sandboxMutation.isLoading ? 'Running...' : 'Run Code'}
		</button>
	</div>

	<!-- Right side: Output -->
	<div class="space-y-4">
		{#if $sandboxMutation.data?.output}
			<div class="space-y-2">
				<h2 class="font-medium text-surface-50">Output:</h2>
				<pre class="p-4 h-[calc(100vh-12rem)] overflow-auto whitespace-pre-wrap bg-surface-900 text-surface-50 rounded-md border-surface-700 border">{$sandboxMutation.data.output}</pre>
			</div>
		{/if}

		{#if $sandboxMutation.data?.error || $sandboxMutation.error}
			<div class="space-y-2">
				<h2 class="font-medium text-error-500">Error:</h2>
				<pre class="p-4 whitespace-pre-wrap bg-error-500/20 rounded-md border-error-500/30 border">
					{$sandboxMutation.data?.error || $sandboxMutation.error?.message || 'Unknown error'}
				</pre>
			</div>
		{/if}
	</div>
</div>
