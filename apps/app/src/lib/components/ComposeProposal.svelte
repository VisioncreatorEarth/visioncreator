<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the compose functionality for proposals:
   - Displays and manages content, JSON, and variations tabs
   - Shows markdown content with preview
   - Shows instance data in JSON format with editing capabilities
   - Shows list of variations with their content
   - Provides split view comparison for edit requests with highlighted changes
   - Handles edit request approvals and rejections

2. Features:
   - Left-aligned tab navigation between content, JSON, and variations views
   - JSON view as default display with editing support
   - Side-by-side split view for version comparison with diff highlighting
   - Edit request tracking with version history
   - Responsive design that works in both desktop and mobile layouts
-->

<script lang="ts">
	import { marked } from 'marked';
	import { writable } from 'svelte/store';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';
	import EditRequests from './EditRequests.svelte';
	import JsonEditor from './JsonEditor.svelte';
	import type { Change } from 'diff';
	import { diffWords, diffJson } from 'diff';

	// Props
	export let proposalId: string;

	// Create a store for the compose tab - default to JSON
	const activeComposeTab = writable<'content' | 'json' | 'variations'>('json');

	// Add TypeScript interfaces to match backend
	interface ComposeJson {
		[key: string]: unknown;
		content?: string;
		schema?: string;
	}

	interface ComposeData {
		title: string;
		description: string;
		compose_json: ComposeJson;
		variations_json: ComposeJson[];
		compose_id: string;
	}

	interface CompositeData {
		id: string;
		title: string;
		description: string;
		compose_id: string;
		variations: string[];
	}

	interface ProposalWithComposite {
		compose: CompositeData;
	}

	// Create query for compose data with proper typing
	const composeQuery = createQuery<{ compose_data: ComposeData | null }>({
		operationName: 'queryComposeProposal',
		input: { proposalId },
		enabled: true
	});

	// Create query for edit requests
	const editRequestsQuery = createQuery({
		operationName: 'queryEditRequests',
		input: { proposalId },
		enabled: true
	});

	// Create mutation for editing
	const editDBMutation = createMutation({
		operationName: 'editDB'
	});

	// State for editing with proper typing
	let editedJson: ComposeJson | null = null;
	let hasChanges = false;

	// Store for selected edit request
	let selectedRequest: any = null;

	// Store for selected variation
	let selectedVariation: any = null;

	// Helper function to format JSON for display
	function formatJSON(json: any): string {
		return JSON.stringify(json, null, 2);
	}

	// Helper function to safely get content as string
	function getContent(content: unknown): string {
		return typeof content === 'string' ? content : '';
	}

	// Helper function to safely get variations array with proper typing
	function getVariations(data: { compose_data: ComposeData | null } | undefined): ComposeJson[] {
		if (!data?.compose_data?.variations_json) {
			return [];
		}
		return Array.isArray(data.compose_data.variations_json)
			? data.compose_data.variations_json
			: [];
	}

	// Helper function to compute and highlight diffs
	function computeDiff(oldStr: string, newStr: string): { html: string; hasChanges: boolean } {
		const changes = diffWords(oldStr, newStr);
		let html = '';
		let hasChanges = false;

		changes.forEach((part: Change) => {
			const color = part.added
				? 'bg-green-400/20 text-green-300'
				: part.removed
				? 'bg-red-400/20 text-red-300'
				: '';

			if (part.added || part.removed) {
				hasChanges = true;
				html += `<span class="px-1 rounded ${color}">${part.value}</span>`;
			} else {
				html += part.value;
			}
		});

		return { html, hasChanges };
	}

	// Helper function to compute JSON diff with better formatting
	function computeJsonDiff(oldJson: any, newJson: any): { html: string; hasChanges: boolean } {
		const changes = diffJson(oldJson, newJson);
		let html = '';
		let hasChanges = false;
		let indentLevel = 0;
		const indentSize = 2;

		changes.forEach((part: Change) => {
			const lines = part.value.split('\n');
			const color = part.added
				? 'bg-green-400/20 text-green-300'
				: part.removed
				? 'bg-red-400/20 text-red-300'
				: '';

			if (part.added || part.removed) {
				hasChanges = true;
			}

			lines.forEach((line: string, i: number) => {
				// Handle indentation
				if (line.includes('}') || line.includes(']')) {
					indentLevel--;
				}

				const indent = ' '.repeat(Math.max(0, indentLevel * indentSize));
				const formattedLine = indent + line.trim();

				if (formattedLine.length > 0) {
					if (part.added || part.removed) {
						html += `<span class="block px-1 rounded ${color}">${formattedLine}</span>`;
					} else {
						html += `<span class="block">${formattedLine}</span>`;
					}
					if (i < lines.length - 1) {
						html += '\n';
					}
				}

				// Adjust indent level for next line
				if (line.includes('{') || line.includes('[')) {
					indentLevel++;
				}
			});
		});

		return { html, hasChanges };
	}

	// Handle edit request selection
	function handleRequestSelect({ detail }: CustomEvent<{ request: any }>) {
		selectedRequest = detail.request;
		selectedVariation = null;
		activeComposeTab.set('json'); // Switch to JSON view when selecting an edit request
	}

	// Handle variation selection
	function handleVariationSelect(variation: any) {
		selectedVariation = variation;
		selectedRequest = null;
	}

	// Update the JsonEditor handlers with proper typing
	function handleJsonEditorSave(event: CustomEvent<{ json: ComposeJson }>) {
		console.log('[ComposeProposal] JsonEditor save event:', event.detail);
		try {
			if (!$composeQuery.data?.compose_data?.compose_json) {
				console.error('[ComposeProposal] No compose JSON available');
				return;
			}

			// Get the original JSON structure
			const originalJson = $composeQuery.data.compose_data.compose_json;
			console.log('[ComposeProposal] Original JSON structure:', originalJson);

			// Create a new JSON object that preserves all fields
			editedJson = {
				...originalJson,
				// Only update content and schema, preserve all other fields
				content: event.detail.json.content || originalJson.content,
				schema: event.detail.json.schema || originalJson.schema,
				// Preserve these important fields if they exist
				version: originalJson.version,
				prev: originalJson.prev,
				author: originalJson.author,
				created_at: originalJson.created_at,
				variation: originalJson.variation,
				title: originalJson.title,
				description: originalJson.description
			};

			console.log('[ComposeProposal] Prepared editedJson with all fields:', editedJson);
			saveChanges();
		} catch (error) {
			console.error('[ComposeProposal] Error in handleJsonEditorSave:', error);
		}
	}

	function handleJsonEditorChange(event: CustomEvent<{ json: ComposeJson; isValid: boolean }>) {
		console.log('[ComposeProposal] JsonEditor change event:', event.detail);
		try {
			if (event.detail.isValid && $composeQuery.data?.compose_data?.compose_json) {
				// Get the original JSON structure
				const originalJson = $composeQuery.data.compose_data.compose_json;
				console.log('[ComposeProposal] Original JSON structure:', originalJson);

				// Create a new JSON object that preserves all fields
				editedJson = {
					...originalJson,
					// Only update content and schema, preserve all other fields
					content: event.detail.json.content || originalJson.content,
					schema: event.detail.json.schema || originalJson.schema,
					// Preserve these important fields if they exist
					version: originalJson.version,
					prev: originalJson.prev,
					author: originalJson.author,
					created_at: originalJson.created_at,
					variation: originalJson.variation,
					title: originalJson.title,
					description: originalJson.description
				};

				console.log('[ComposeProposal] Updated editedJson with all fields:', editedJson);
				hasChanges = true;
			}
		} catch (error) {
			console.error('[ComposeProposal] Error in handleJsonEditorChange:', error);
		}
	}

	// Save changes function aligned with backend types
	async function saveChanges() {
		console.log('[ComposeProposal] Starting saveChanges...');
		console.log('[ComposeProposal] Current compose data:', $composeQuery.data?.compose_data);
		console.log('[ComposeProposal] Edited JSON:', editedJson);

		if (!editedJson || !$composeQuery.data?.compose_data) {
			console.error('[ComposeProposal] Missing required data:', {
				editedJson: !!editedJson,
				composeData: !!$composeQuery.data?.compose_data
			});
			return;
		}

		try {
			const compose_id = $composeQuery.data.compose_data.compose_id;

			if (!compose_id) {
				console.error('[ComposeProposal] No compose_id found');
				return;
			}

			// Get the original JSON structure to ensure we preserve all fields
			const originalJson = $composeQuery.data.compose_data.compose_json;

			// Create the final JSON structure for saving
			const saveJson = {
				content: editedJson.content,
				schema: editedJson.schema || originalJson.schema
			};

			console.log('[ComposeProposal] Attempting to save changes:', {
				id: compose_id,
				json: saveJson
			});

			// Use editDB to update the content
			const result = await $editDBMutation.mutateAsync({
				id: compose_id,
				json: saveJson
			});

			console.log('[ComposeProposal] Save result:', result);

			if (result?.success) {
				console.log('[ComposeProposal] Save successful, refetching data...');
				await Promise.all([$composeQuery.refetch(), $editRequestsQuery.refetch()]);
				editedJson = null;
				hasChanges = false;
			} else {
				console.error('[ComposeProposal] Failed to save changes:', result?.details);
				const errorMessage = Array.isArray(result?.details)
					? result.details.map((d) => `${d.field}: ${d.message}`).join(', ')
					: result?.details || 'Unknown error occurred';
				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error('[ComposeProposal] Error in saveChanges:', error);
			throw error;
		}
	}

	// Compute diffs based on request type
	$: diffResult = selectedRequest
		? selectedRequest.changes.content
			? computeDiff(
					getContent(selectedRequest.previousVersion.content),
					getContent(selectedRequest.changes.content)
			  )
			: computeJsonDiff(selectedRequest.previousVersion.instance, selectedRequest.changes.instance)
		: { html: '', hasChanges: false };
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
			'variations'
				? 'bg-surface-800 text-tertiary-100 border-l-2 border-tertiary-500'
				: 'text-tertiary-300 hover:text-tertiary-200 hover:bg-surface-700/50'}"
			on:click={() => activeComposeTab.set('variations')}
		>
			Variations ({getVariations($composeQuery.data).length})
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
			{#if selectedRequest}
				<!-- Split View for Edit Requests -->
				<div class="grid flex-1 grid-cols-2 divide-x divide-surface-700/50">
					<!-- Previous Version -->
					<div class="overflow-hidden">
						<div class="flex items-center justify-between p-4 border-b border-surface-700/50">
							<h4 class="text-sm font-medium text-tertiary-100">Previous Version</h4>
							<button
								class="p-1 transition-colors rounded-lg hover:bg-surface-700/50"
								on:click={() => (selectedRequest = null)}
							>
								<Icon icon="heroicons:x-mark" class="w-4 h-4 text-tertiary-300" />
							</button>
						</div>
						<div class="p-4 overflow-y-auto">
							<pre class="font-mono text-sm whitespace-pre-wrap text-tertiary-200">{formatJSON(
									selectedRequest.previousVersion.content ||
										selectedRequest.previousVersion.instance
								)}</pre>
						</div>
					</div>

					<!-- New Version with Diff Highlighting -->
					<div class="overflow-hidden">
						<div class="p-4 border-b border-surface-700/50">
							<div class="flex items-center justify-between">
								<h4 class="text-sm font-medium text-tertiary-100">New Version</h4>
								<div class="flex items-center gap-4">
									<div class="flex items-center gap-2">
										<span class="inline-block w-3 h-3 rounded bg-green-400/20" />
										<span class="text-xs text-tertiary-300">Added</span>
									</div>
									<div class="flex items-center gap-2">
										<span class="inline-block w-3 h-3 rounded bg-red-400/20" />
										<span class="text-xs text-tertiary-300">Removed</span>
									</div>
								</div>
							</div>
						</div>
						<div class="p-4 overflow-y-auto">
							<pre
								class="font-mono text-sm whitespace-pre-wrap text-tertiary-200">{@html diffResult.html}</pre>
						</div>
					</div>
				</div>
			{:else if selectedVariation}
				<!-- Split View for Variations -->
				<div class="grid flex-1 grid-cols-2 divide-x divide-surface-700/50">
					<!-- Main Version -->
					<div class="overflow-hidden">
						<div class="flex items-center justify-between p-4 border-b border-surface-700/50">
							<h4 class="text-sm font-medium text-tertiary-100">Main Version</h4>
							<button
								class="p-1 transition-colors rounded-lg hover:bg-surface-700/50"
								on:click={() => (selectedVariation = null)}
							>
								<Icon icon="heroicons:x-mark" class="w-4 h-4 text-tertiary-300" />
							</button>
						</div>
						<div class="p-4 overflow-y-auto">
							{#if $composeQuery.data.compose_data.compose_json?.content}
								<div class="prose prose-invert max-w-none">
									{@html marked(getContent($composeQuery.data.compose_data.compose_json.content))}
								</div>
							{:else}
								<pre class="font-mono text-sm whitespace-pre-wrap text-tertiary-200">{formatJSON(
										$composeQuery.data.compose_data.compose_json
									)}</pre>
							{/if}
						</div>
					</div>

					<!-- Variation with Diff Highlighting -->
					<div class="overflow-hidden">
						<div class="p-4 border-b border-surface-700/50">
							<h4 class="text-sm font-medium text-tertiary-100">Variation</h4>
						</div>
						<div class="p-4 overflow-y-auto">
							{#if selectedVariation.content}
								<div class="prose prose-invert max-w-none">
									{@html marked(getContent(selectedVariation.content))}
								</div>
							{:else}
								<pre class="font-mono text-sm whitespace-pre-wrap text-tertiary-200">{formatJSON(
										selectedVariation
									)}</pre>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<!-- Regular Content -->
				<div class="flex-1 overflow-y-auto">
					{#if $activeComposeTab === 'content'}
						{#if $composeQuery.data.compose_data.compose_json?.content}
							<div class="p-6 prose prose-invert max-w-none">
								{@html marked(getContent($composeQuery.data.compose_data.compose_json.content))}
							</div>
						{:else}
							<pre class="p-4 font-mono text-sm whitespace-pre-wrap text-tertiary-200">{formatJSON(
									$composeQuery.data.compose_data.compose_json
								)}</pre>
						{/if}
					{:else if $activeComposeTab === 'json'}
						<div class="flex flex-col h-full">
							<div class="flex-1 overflow-y-auto">
								<JsonEditor
									json={$composeQuery.data.compose_data.compose_json}
									on:save={handleJsonEditorSave}
									on:change={handleJsonEditorChange}
								/>
							</div>
						</div>
					{:else if $activeComposeTab === 'variations'}
						<div class="p-4 space-y-4">
							<h3 class="text-lg font-medium text-tertiary-100">Available Variations</h3>
							<div class="space-y-2">
								{#each getVariations($composeQuery.data) as variation}
									<button
										class="w-full p-4 text-left transition-colors rounded-lg bg-surface-700/50 hover:bg-surface-700"
										on:click={() => handleVariationSelect(variation)}
									>
										<div class="flex items-center justify-between">
											<div>
												<h4 class="text-sm font-medium text-tertiary-100">
													{@html variation.content
														? marked(variation.content.split('\n')[0].replace('#', '').trim())
														: 'Untitled Variation'}
												</h4>
												{#if variation.content}
													<p class="mt-1 text-sm text-tertiary-300">
														{variation.content.split('\n').slice(1, 2).join(' ').slice(0, 100)}...
													</p>
												{/if}
											</div>
											<Icon icon="heroicons:chevron-right" class="w-5 h-5 text-tertiary-300" />
										</div>
									</button>
								{:else}
									<div class="p-4 text-center rounded-lg text-tertiary-300 bg-surface-700/50">
										No variations available
									</div>
								{/each}
							</div>
						</div>
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
	<div class="border-l w-80 border-surface-700">
		<div class="flex items-center justify-between p-4 border-b border-surface-700/50">
			<h3 class="text-sm font-medium text-tertiary-100">Patch Requests</h3>
		</div>

		<!-- Edit Requests List -->
		<div class="overflow-y-auto">
			<EditRequests
				{proposalId}
				selectedRequestId={selectedRequest?.id}
				on:select={handleRequestSelect}
			/>
		</div>
	</div>
</div>
