<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the compose functionality for proposals:
   - Displays and manages content, schema, and JSON tabs
   - Shows markdown content with preview
   - Displays JSON schema in readable format
   - Shows instance data in JSON format
   - Displays edit requests in a git-like fashion
   - Provides split view comparison for version changes

2. Features:
   - Left-aligned tab navigation between content, schema, and JSON views
   - JSON view as default display
   - Side-by-side split view for version comparison
   - Edit request tracking with version history
   - Responsive design that works in both desktop and mobile layouts
-->

<script lang="ts">
	import { marked } from 'marked';
	import { writable } from 'svelte/store';
	import { createQuery } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';

	// Props
	export let proposalId: string;

	// Create a store for the compose tab - default to JSON
	const activeComposeTab = writable<'content' | 'schema' | 'json'>('json');

	// Create query for compose data
	const composeQuery = createQuery({
		operationName: 'queryComposeProposal',
		input: { proposalId },
		enabled: true
	});

	// Store for selected edit request
	const selectedEditRequest = writable<null | {
		id: string;
		title: string;
		createdAt: string;
		author: string;
		changes: any;
		previousVersion: any;
	}>(null);

	// Mock edit requests data (replace with real data later)
	const mockEditRequests = [
		{
			id: '1',
			title: 'Update project goals',
			createdAt: '2024-02-20T10:00:00Z',
			author: 'Alice',
			changes: { content: '# Updated Goals\n\nNew project goals...' },
			previousVersion: { content: '# Goals\n\nProject goals...' }
		},
		{
			id: '2',
			title: 'Fix typos in description',
			createdAt: '2024-02-19T15:30:00Z',
			author: 'Bob',
			changes: { content: '# Description\n\nFixed content...' },
			previousVersion: { content: '# Description\n\nOriginal content...' }
		}
	];

	// Helper function to format JSON for display
	function formatJSON(json: any): string {
		return JSON.stringify(json, null, 2);
	}

	// Helper function to safely get content as string
	function getContent(content: unknown): string {
		return typeof content === 'string' ? content : '';
	}

	// Helper function to format date
	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Handle edit request selection
	function handleEditRequestSelect(editRequest: any) {
		selectedEditRequest.set(editRequest);
	}
</script>

<div class="flex flex-1 overflow-hidden bg-surface-700">
	<!-- Left Tabs -->
	<div class="flex flex-col w-40 border-r border-surface-700/50">
		<button
			class="px-6 py-3 text-sm font-medium text-left transition-colors {$activeComposeTab === 'json'
				? 'bg-surface-800 text-tertiary-100 border-l-2 border-tertiary-500'
				: 'text-tertiary-300 hover:text-tertiary-200 hover:bg-surface-700/50'}"
			on:click={() => activeComposeTab.set('json')}
		>
			JSON
		</button>
		<button
			class="px-6 py-3 text-sm font-medium text-left transition-colors {$activeComposeTab ===
			'content'
				? 'bg-surface-800 text-tertiary-100 border-l-2 border-tertiary-500'
				: 'text-tertiary-300 hover:text-tertiary-200 hover:bg-surface-700/50'}"
			on:click={() => activeComposeTab.set('content')}
		>
			Content
		</button>
		<button
			class="px-6 py-3 text-sm font-medium text-left transition-colors {$activeComposeTab ===
			'schema'
				? 'bg-surface-800 text-tertiary-100 border-l-2 border-tertiary-500'
				: 'text-tertiary-300 hover:text-tertiary-200 hover:bg-surface-700/50'}"
			on:click={() => activeComposeTab.set('schema')}
		>
			Schema
		</button>
	</div>

	<!-- Main Content Area -->
	<div class="flex flex-col flex-1 overflow-hidden bg-surface-800">
		{#if $composeQuery.isLoading}
			<div class="flex items-center justify-center flex-1 py-8">
				<p class="text-tertiary-300">Loading compose data...</p>
			</div>
		{:else if $composeQuery.error}
			<div class="flex items-center justify-center flex-1 py-8">
				<p class="text-red-400">Error loading compose data</p>
			</div>
		{:else if $composeQuery.data?.compose_data}
			{#if $selectedEditRequest}
				<!-- Split View -->
				<div class="flex flex-1 overflow-hidden" transition:fade={{ duration: 200 }}>
					<!-- Previous Version -->
					<div class="flex-1 overflow-y-auto border-r border-surface-700/50">
						<div class="flex items-center justify-between p-4 border-b border-surface-700/50">
							<h4 class="text-sm font-medium text-tertiary-100">Previous Version</h4>
							<button
								class="text-xs text-tertiary-300 hover:text-tertiary-200"
								on:click={() => selectedEditRequest.set(null)}
							>
								<Icon icon="heroicons:x-mark" class="w-4 h-4" />
							</button>
						</div>
						<pre class="p-4 text-sm font-mono text-tertiary-200 whitespace-pre-wrap">{formatJSON(
								$selectedEditRequest.previousVersion
							)}</pre>
					</div>
					<!-- New Version -->
					<div class="flex-1 overflow-y-auto">
						<div class="flex items-center justify-between p-4 border-b border-surface-700/50">
							<h4 class="text-sm font-medium text-tertiary-100">New Version</h4>
						</div>
						<pre class="p-4 text-sm font-mono text-tertiary-200 whitespace-pre-wrap">{formatJSON(
								$selectedEditRequest.changes
							)}</pre>
					</div>
				</div>
			{:else}
				<!-- Regular Content -->
				<div class="flex-1 overflow-y-auto">
					{#if $activeComposeTab === 'content'}
						{#if $composeQuery.data.compose_data.instance?.content}
							<div class="p-6 prose prose-invert max-w-none">
								{@html marked(getContent($composeQuery.data.compose_data.instance.content))}
							</div>
						{:else}
							<pre class="p-4 text-sm font-mono text-tertiary-200 whitespace-pre-wrap">{formatJSON(
									$composeQuery.data.compose_data.instance
								)}</pre>
						{/if}
					{:else if $activeComposeTab === 'schema'}
						<pre class="p-4 text-sm font-mono text-tertiary-200 whitespace-pre-wrap">{formatJSON(
								$composeQuery.data.compose_data.schema
							)}</pre>
					{:else if $activeComposeTab === 'json'}
						<pre class="p-4 text-sm font-mono text-tertiary-200 whitespace-pre-wrap">{formatJSON(
								$composeQuery.data.compose_data.instance
							)}</pre>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="flex items-center justify-center flex-1 py-8">
				<p class="text-tertiary-300">No compose data available</p>
			</div>
		{/if}
	</div>

	<!-- Right Aside: Edit Requests -->
	<div class="w-80 border-l border-surface-700/50 bg-surface-700">
		<div class="flex items-center justify-between p-4 border-b border-surface-700/50">
			<h3 class="text-sm font-medium text-tertiary-100">Edit Requests</h3>
			<button
				class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-lg bg-tertiary-500/10 hover:bg-tertiary-500/20 text-tertiary-300"
			>
				<Icon icon="heroicons:plus-small" class="w-4 h-4" />
				New Edit
			</button>
		</div>

		<!-- Edit Requests List -->
		<div class="overflow-y-auto">
			{#each mockEditRequests as editRequest (editRequest.id)}
				<button
					class="flex flex-col w-full gap-1 p-4 text-left transition-colors border-b hover:bg-surface-700/50 border-surface-700/50 {$selectedEditRequest?.id ===
					editRequest.id
						? 'bg-surface-700/50'
						: ''}"
					on:click={() => handleEditRequestSelect(editRequest)}
				>
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-tertiary-100">{editRequest.title}</span>
						<span class="text-xs text-tertiary-400">#{editRequest.id}</span>
					</div>
					<div class="flex items-center gap-2 text-xs text-tertiary-300">
						<span>{editRequest.author}</span>
						<span>•</span>
						<span>{formatDate(editRequest.createdAt)}</span>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>
