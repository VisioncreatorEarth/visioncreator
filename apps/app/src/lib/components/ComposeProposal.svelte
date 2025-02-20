<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the compose functionality for proposals:
   - Displays and manages content and schema tabs
   - Shows markdown content with preview
   - Displays JSON schema in readable format
   - Handles content editing (coming soon)

2. Features:
   - Tab-based navigation between content and schema views
   - Markdown rendering for content
   - JSON formatting for schema display
   - Responsive design that works in both desktop and mobile layouts
-->

<script lang="ts">
	import { marked } from 'marked';
	import { writable } from 'svelte/store';
	import { createQuery } from '$lib/wundergraph';

	// Props
	export let proposalId: string;

	// Create a store for the compose tab
	const activeComposeTab = writable<'content' | 'schema'>('content');

	// Create query for compose data
	const composeQuery = createQuery({
		operationName: 'queryComposeProposal',
		input: { proposalId },
		enabled: true
	});

	// Helper function to format JSON for display
	function formatJSON(json: any): string {
		return JSON.stringify(json, null, 2);
	}

	// Helper function to safely get content as string
	function getContent(content: unknown): string {
		return typeof content === 'string' ? content : '';
	}
</script>

<div class="flex-1 overflow-y-auto w-full">
	<div class="flex flex-col">
		<!-- Tabs -->
		<div class="flex gap-2 px-6 pt-6 border-b border-surface-700/50">
			<button
				class="px-4 py-2 text-sm font-medium transition-colors rounded-t-lg {$activeComposeTab ===
				'content'
					? 'text-tertiary-100 bg-surface-800 border-x border-t border-surface-700/50'
					: 'text-tertiary-300 hover:text-tertiary-200'}"
				on:click={() => activeComposeTab.set('content')}
			>
				Content
			</button>
			<button
				class="px-4 py-2 text-sm font-medium transition-colors rounded-t-lg {$activeComposeTab ===
				'schema'
					? 'text-tertiary-100 bg-surface-800 border-x border-t border-surface-700/50'
					: 'text-tertiary-300 hover:text-tertiary-200'}"
				on:click={() => activeComposeTab.set('schema')}
			>
				Schema
			</button>
		</div>

		<!-- Tab Content -->
		<div class="p-6">
			{#if $composeQuery.isLoading}
				<div class="flex items-center justify-center py-8">
					<p class="text-tertiary-300">Loading compose data...</p>
				</div>
			{:else if $composeQuery.error}
				<div class="flex items-center justify-center py-8">
					<p class="text-red-400">Error loading compose data</p>
				</div>
			{:else if $composeQuery.data?.compose_data}
				{#if $activeComposeTab === 'content'}
					{#if $composeQuery.data.compose_data.instance?.content}
						<div class="prose prose-invert max-w-none">
							{@html marked(getContent($composeQuery.data.compose_data.instance.content))}
						</div>
					{:else}
						<pre
							class="p-4 text-sm font-mono rounded bg-surface-900 text-tertiary-200 whitespace-pre-wrap overflow-x-auto">{formatJSON(
								$composeQuery.data.compose_data.instance
							)}</pre>
					{/if}
				{:else if $activeComposeTab === 'schema'}
					<pre
						class="p-4 text-sm font-mono rounded bg-surface-900 text-tertiary-200 whitespace-pre-wrap overflow-x-auto">{formatJSON(
							$composeQuery.data.compose_data.schema
						)}</pre>
				{/if}
			{:else}
				<div class="flex items-center justify-center py-8">
					<p class="text-tertiary-300">No compose data available</p>
				</div>
			{/if}
		</div>
	</div>
</div>
