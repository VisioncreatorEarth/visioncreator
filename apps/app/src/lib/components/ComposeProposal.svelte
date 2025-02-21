<!--
@component
ComposeProposal.svelte - A component for displaying and managing proposal composites and their relationships.
This component handles:
1. Display of the main composite content
2. Display and management of related composites (variations, forks, etc.)
3. Editing capabilities for the main content and variations
4. Creation of new relationships between composites
-->
<script lang="ts">
	import { marked } from 'marked';
	import { writable } from 'svelte/store';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';
	import JsonEditor from './JsonEditor.svelte';

	// Props
	export let proposalId: string;

	// Create a store for the compose tab - default to Content
	const activeComposeTab = writable<'content' | 'json'>('content');

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
		compose_id: string;
		related_composites: RelatedComposite[];
	}

	interface RelatedComposite {
		id: string;
		title: string;
		description: string;
		compose_json: ComposeJson;
		compose_id: string;
		relationship_type: string;
		metadata: {
			created_at: string;
			variation_type?: string;
			description?: string;
			[key: string]: unknown;
		};
	}

	// Create queries and mutations
	const composeQuery = createQuery({
		operationName: 'queryComposeProposal',
		input: { proposalId },
		enabled: true
	});

	const editDBMutation = createMutation({
		operationName: 'editDB'
	});

	// State management
	let editMode = false;
	let editContent = '';
	let selectedCompositeId: string | null = null;

	// Subscribe to query updates
	$: compose_data = $composeQuery.data?.compose_data;
	$: {
		if (compose_data) {
			console.log('Compose data loaded:', {
				mainComposite: {
					id: compose_data.compose_id,
					title: compose_data.title
				},
				relatedComposites: compose_data.related_composites.map((rc) => ({
					id: rc.id,
					compose_id: rc.compose_id,
					title: rc.title
				}))
			});
		}
	}
	$: content = compose_data?.compose_json?.content || '';
	$: selectedComposite = compose_data?.related_composites?.find(
		(c) => c.id === selectedCompositeId
	);
	$: {
		if (selectedComposite) {
			console.log('Selected composite details:', {
				id: selectedComposite.id,
				compose_id: selectedComposite.compose_id,
				title: selectedComposite.title,
				content: selectedComposite.compose_json?.content?.substring(0, 50) + '...'
			});
		}
	}

	// Format markdown content
	$: formattedContent = content ? marked(content) : '';
	$: formattedSelectedContent = selectedComposite?.compose_json?.content
		? marked(selectedComposite.compose_json.content)
		: '';

	// Get the current composite's content ID for editing
	$: currentComposeId = selectedCompositeId
		? selectedComposite?.compose_id // Use compose_id for sister composites
		: compose_data?.compose_id; // Use compose_id for main composite

	$: {
		console.log('Current compose ID:', {
			currentComposeId,
			selectedCompositeId,
			isMainComposite: !selectedCompositeId
		});
	}

	// Handle tab changes
	function handleTabChange(tab: 'content' | 'json') {
		$activeComposeTab = tab;
	}

	// Handle composite selection
	function handleCompositeSelect(compositeId: string | null) {
		selectedCompositeId = compositeId;
		editMode = false; // Reset edit mode when switching composites

		// Debug log
		if (compositeId) {
			const composite = compose_data?.related_composites?.find((c) => c.id === compositeId);
			console.log('Selected composite:', {
				id: composite?.id,
				compose_id: composite?.compose_id,
				title: composite?.title
			});
		}
	}

	// Format relationship type for display
	function formatRelationshipType(type: string): string {
		return type.startsWith('target_')
			? type.replace('target_', '').replace(/_/g, ' ') + ' of'
			: type.replace(/_/g, ' ');
	}

	// Custom date formatting function
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return 'just now';
		const diffInMinutes = Math.floor(diffInSeconds / 60);
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h ago`;
		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 30) return `${diffInDays}d ago`;
		const diffInMonths = Math.floor(diffInDays / 30);
		if (diffInMonths < 12) return `${diffInMonths}mo ago`;
		const diffInYears = Math.floor(diffInMonths / 12);
		return `${diffInYears}y ago`;
	}

	// Handle edit mode toggle
	function toggleEditMode() {
		if (!editMode) {
			// Set initial content based on whether we're editing the main composite or a variation
			editContent = selectedCompositeId ? selectedComposite?.compose_json?.content || '' : content;
		}
		editMode = !editMode;
	}

	// Handle content save
	async function saveChanges() {
		if (!editContent) {
			console.error('Missing content for save');
			return;
		}

		if (!currentComposeId) {
			console.error('Missing compose ID for save:', {
				selectedCompositeId,
				selectedCompose: selectedComposite?.compose_id,
				mainCompose: compose_data?.compose_id
			});
			return;
		}

		try {
			console.log('Saving changes for composite:', {
				id: currentComposeId,
				isVariation: !!selectedCompositeId,
				content: editContent.substring(0, 50) + '...' // Log first 50 chars for debugging
			});

			const result = await $editDBMutation.mutateAsync({
				id: currentComposeId,
				json: { content: editContent }
			});

			if (result?.success) {
				await $composeQuery.refetch();
				editMode = false;
			}
		} catch (error) {
			console.error('Failed to save changes:', error);
		}
	}
</script>

<div class="flex h-full bg-surface-800">
	<!-- Left Aside: Variations List -->
	<aside class="flex flex-col border-r w-80 border-surface-700">
		<div class="p-4 border-b border-surface-700">
			<h3 class="text-lg font-semibold text-surface-100">Composites</h3>
		</div>
		<div class="flex-1 overflow-y-auto">
			{#if compose_data}
				<div class="p-4 space-y-2">
					<!-- Current Composite -->
					<button
						class="w-full p-4 rounded-lg transition-colors text-left
							{!selectedCompositeId
							? 'bg-surface-700 border-l-4 border-primary-500'
							: 'bg-surface-900 hover:bg-surface-700'}"
						on:click={() => handleCompositeSelect(null)}
					>
						<div class="space-y-2">
							<div class="font-medium text-surface-100">{compose_data.title}</div>
							<div class="text-sm text-surface-300">{compose_data.description}</div>
							<div class="flex flex-wrap gap-2">
								<span class="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-300">
									Current
								</span>
							</div>
						</div>
					</button>

					<!-- Related Composites -->
					{#each compose_data.related_composites || [] as composite}
						<button
							class="w-full p-4 rounded-lg transition-colors text-left
								{selectedCompositeId === composite.id
								? 'bg-surface-700 border-l-4 border-primary-500'
								: 'bg-surface-900 hover:bg-surface-700'}"
							on:click={() => handleCompositeSelect(composite.id)}
						>
							<div class="space-y-2">
								<div class="font-medium text-surface-100">{composite.title}</div>
								<div class="text-sm text-surface-300">{composite.description}</div>
								<div class="flex flex-wrap gap-2">
									<span class="px-2 py-1 text-xs rounded-full bg-surface-700 text-surface-200">
										{formatRelationshipType(composite.relationship_type)}
									</span>
									{#if composite.metadata.variation_type}
										<span class="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-300">
											{composite.metadata.variation_type}
										</span>
									{/if}
								</div>
								<div class="text-xs text-surface-400">
									Created {formatDate(composite.metadata.created_at)}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main Content Area -->
	<div class="flex-1">
		<!-- Tab Navigation -->
		<nav class="flex border-b border-surface-700">
			<button
				class="px-6 py-3 text-sm font-medium transition-colors {$activeComposeTab === 'content'
					? 'bg-surface-700 text-surface-100 border-b-2 border-primary-500'
					: 'text-surface-300 hover:text-surface-200 hover:bg-surface-700/50'}"
				on:click={() => handleTabChange('content')}
			>
				Content
			</button>
			<button
				class="px-6 py-3 text-sm font-medium transition-colors {$activeComposeTab === 'json'
					? 'bg-surface-700 text-surface-100 border-b-2 border-primary-500'
					: 'text-surface-300 hover:text-surface-200 hover:bg-surface-700/50'}"
				on:click={() => handleTabChange('json')}
			>
				JSON
			</button>
		</nav>

		<!-- Content Area -->
		<div class="p-6 overflow-y-auto">
			{#if $composeQuery.isLoading}
				<div class="flex items-center justify-center h-full">
					<div class="text-surface-300">Loading...</div>
				</div>
			{:else if $composeQuery.error}
				<div class="flex items-center justify-center h-full">
					<div class="text-red-400">Error loading data</div>
				</div>
			{:else if compose_data}
				{#if $activeComposeTab === 'json'}
					<div class="flex flex-col h-full">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-xl font-semibold text-surface-100">
								{selectedComposite?.title || compose_data.title}
							</h2>
						</div>
						<JsonEditor
							json={selectedComposite?.compose_json || compose_data.compose_json}
							on:save={saveChanges}
						/>
					</div>
				{:else}
					<div class="flex flex-col h-full">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-xl font-semibold text-surface-100">
								{selectedComposite?.title || compose_data.title}
							</h2>
							<div class="flex items-center gap-2">
								{#if editMode}
									<button
										class="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600"
										on:click={saveChanges}
									>
										Save
									</button>
									<button
										class="px-4 py-2 text-sm font-medium text-red-400 transition-colors rounded-lg bg-red-500/10 hover:bg-red-500/20"
										on:click={toggleEditMode}
									>
										Cancel
									</button>
								{:else}
									<button
										class="px-4 py-2 text-sm font-medium transition-colors rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20"
										on:click={toggleEditMode}
									>
										Edit
									</button>
								{/if}
							</div>
						</div>

						{#if editMode}
							<div class="flex flex-col gap-4">
								<textarea
									bind:value={editContent}
									class="w-full h-[calc(100vh-12rem)] p-4 border rounded-lg bg-surface-900 border-surface-700 focus:outline-none focus:border-primary-500 text-surface-100"
									placeholder="Enter markdown content..."
								/>
							</div>
						{:else}
							<div class="prose prose-invert max-w-none">
								{@html selectedComposite ? formattedSelectedContent : formattedContent}
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<div class="flex items-center justify-center h-full">
					<div class="text-surface-300">No data available</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(.prose) {
		@apply text-surface-200;
	}
	:global(.prose h1, .prose h2, .prose h3, .prose h4) {
		@apply text-surface-100;
	}
	:global(.prose a) {
		@apply text-primary-500;
	}
	:global(.prose strong) {
		@apply text-surface-100;
	}
	:global(.prose ul, .prose ol) {
		@apply text-surface-200;
	}
	:global(.prose blockquote) {
		@apply border-l-4 border-surface-700 text-surface-300;
	}
	:global(.prose code) {
		@apply bg-surface-900 text-surface-200 px-1 rounded;
	}
	:global(.prose pre) {
		@apply bg-surface-900;
	}
	:global(.prose pre code) {
		@apply bg-transparent;
	}
</style>
