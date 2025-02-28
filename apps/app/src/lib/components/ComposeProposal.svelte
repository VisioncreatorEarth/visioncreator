<!--
@component
ComposeProposal.svelte - A component for displaying and managing proposal composites and their relationships.
This component handles:
1. Display of the main composite content
2. Display and management of related composites (variations, forks, etc.)
3. Editing capabilities for the main content and variations
4. Creation of new relationships between composites
5. Management of edit requests through the right aside
6. Displaying JSON diffs for edit requests
-->
<script lang="ts">
	import { marked } from 'marked';
	import { writable } from 'svelte/store';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';
	import JsonEditor from './JsonEditor.svelte';
	import PatchRequests from './PatchRequests.svelte';
	import JsonDiffViewer from './JsonDiffViewer.svelte';
	import VariationTreeItem from './VariationTreeItem.svelte';

	// Props
	export let proposalId: string;

	// Create a store for the compose tab - default to Content
	const activeComposeTab = writable<'content' | 'json' | 'diff'>('content');

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
		author: {
			name: string;
		};
		related_composites: RelatedComposite[];
	}

	interface RelatedComposite {
		id: string;
		title: string;
		description: string;
		compose_json: ComposeJson;
		compose_id: string;
		author: {
			name: string;
		};
		relationship_type: string;
		metadata: {
			created_at?: string;
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
	let selectedEditRequestId: string | undefined;
	let selectedEditRequest: any = null;
	let isCreatingVariation = false;
	let newVariationTitle = '';
	let newVariationDescription = '';
	let newVariationType: string | undefined = undefined;

	// Subscribe to query updates
	$: compose_data = $composeQuery.data?.compose_data;
	$: {
		if (compose_data) {
			// Transform main composite to match related composite interface
			const mainComposite = {
				id: compose_data.compose_id,
				title: compose_data.title,
				description: compose_data.description,
				compose_id: compose_data.compose_id,
				relationship_type: 'main',
				author: compose_data.author,
				metadata: {
					variation_type: 'main'
				}
			};

			console.log('[ComposeProposal] Compose Data Loaded:', {
				composites: [
					mainComposite,
					...compose_data.related_composites.map((rc) => ({
						id: rc.id,
						title: rc.title,
						description: rc.description,
						compose_id: rc.compose_id,
						relationship_type: rc.relationship_type,
						author: rc.author,
						metadata: rc.metadata
					}))
				],
				selectedCompositeId,
				currentComposeId
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
	function handleTabChange(tab: 'content' | 'json' | 'diff') {
		$activeComposeTab = tab;
	}

	// Handle composite selection
	function handleCompositeSelect(compositeId: string | null) {
		const targetComposite = compositeId
			? compose_data?.related_composites.find((c) => c.id === compositeId)
			: {
					id: compose_data?.compose_id,
					compose_id: compose_data?.compose_id,
					relationship_type: 'main',
					metadata: { variation_type: 'main' }
			  };

		console.log('[ComposeProposal] Composite Selected:', {
			previousId: selectedCompositeId,
			newId: compositeId,
			composite: targetComposite
				? {
						id: targetComposite.id,
						compose_id: targetComposite.compose_id,
						relationship_type: targetComposite.relationship_type,
						metadata: targetComposite.metadata || { variation_type: 'main' }
				  }
				: null
		});

		selectedCompositeId = compositeId;
		editMode = false; // Reset edit mode when switching composites
		selectedEditRequestId = undefined; // Reset edit request selection
		selectedEditRequest = null; // Reset selected edit request
		$activeComposeTab = 'content'; // Reset to content tab
	}

	// Handle edit request selection
	function handleEditRequestSelect(event: CustomEvent<{ request: any }>) {
		const request = event.detail.request;
		const targetComposite = compose_data?.related_composites.find(
			(c) => c.id === request.composite_id
		) || {
			id: compose_data?.compose_id,
			compose_id: compose_data?.compose_id,
			relationship_type: 'main'
		};

		console.log('[ComposeProposal] Edit Request Selected:', {
			requestId: request.id,
			compositeId: request.composite_id,
			currentCompositeId: selectedCompositeId || compose_data?.compose_id,
			targetComposite: {
				id: targetComposite.id,
				compose_id: targetComposite.compose_id,
				relationship_type: targetComposite.relationship_type
			},
			willSwitchComposite: request.composite_id !== compose_data?.compose_id
		});

		selectedEditRequestId = request.id;
		selectedEditRequest = request;

		// If this is a request for a related composite, select it
		if (request.composite_id !== compose_data?.compose_id) {
			console.log('[ComposeProposal] Switching to Related Composite:', {
				from: selectedCompositeId,
				to: request.composite_id,
				relationship_type: targetComposite.relationship_type
			});
			selectedCompositeId = request.composite_id;
		} else {
			console.log('[ComposeProposal] Switching to Main Composite:', {
				relationship_type: 'main'
			});
			selectedCompositeId = null;
		}

		// Switch to diff view if there are operations
		if (request.operations && request.operations.length > 0) {
			$activeComposeTab = 'diff';
		}

		// Update content based on the request
		if (request.changes?.content) {
			console.log('[ComposeProposal] Updating Edit Content:', {
				contentLength: request.changes.content.length,
				compositeType: targetComposite.relationship_type
			});
			editContent = request.changes.content;
			editMode = true;
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
	async function saveChanges(event?: CustomEvent<{ json: any }> | MouseEvent) {
		// Get the JSON to save - either from the JSON editor or create it from the content
		let jsonToSave: Record<string, any>;

		// Check if this is a JSON editor save event by checking for CustomEvent with detail property
		if (
			event &&
			event instanceof CustomEvent &&
			'detail' in event &&
			event.detail &&
			'json' in event.detail
		) {
			// This is a save event from the JSON editor
			jsonToSave = event.detail.json;
		} else {
			// This is a direct save from the edit mode
			jsonToSave = { content: editContent };

			if (!editContent) {
				console.error('Missing content for save');
				return;
			}
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
				jsonKeys: Object.keys(jsonToSave),
				contentPreview: jsonToSave.content
					? jsonToSave.content.substring(0, 50) + '...'
					: 'No content'
			});

			const result = await $editDBMutation.mutateAsync({
				id: currentComposeId,
				json: jsonToSave,
				createVariation: false
			});

			// Define a type for the expected result
			interface EditResult {
				success?: boolean;
				error?: string;
			}

			// Cast the result to the expected type
			const typedResult = result as EditResult;

			if (typedResult && typedResult.success) {
				await $composeQuery.refetch();
				editMode = false;
			}
		} catch (error) {
			console.error('Failed to save changes:', error);
		}
	}

	// Toggle variation creation modal
	function toggleVariationModal() {
		isCreatingVariation = !isCreatingVariation;
		if (isCreatingVariation) {
			// Initialize with default values
			newVariationTitle = `${
				selectedCompositeId ? selectedComposite?.title : compose_data?.title
			} Variation`;
			newVariationDescription = `Variation of ${
				selectedCompositeId ? selectedComposite?.title : compose_data?.title
			}`;
			newVariationType = undefined; // No default variation type
		}
	}

	// Create a new variation
	async function handleCreateVariation(sourceId: string) {
		console.log('Creating variation of composite:', sourceId);
		try {
			// Find the source composite data
			let sourceComposite;
			if (sourceId === compose_data?.compose_id) {
				// This is the main composite
				sourceComposite = {
					id: compose_data?.compose_id,
					title: compose_data?.title,
					compose_json: compose_data?.compose_json,
					compose_id: compose_data?.compose_id
				};
			} else {
				// This is a related composite
				sourceComposite = compose_data?.related_composites?.find((rc) => rc.id === sourceId);
			}

			if (!sourceComposite) {
				console.error('Source composite not found:', sourceId);
				return;
			}

			console.log('Source composite info:', {
				id: sourceComposite.id,
				title: sourceComposite.title
			});

			// Log the variation data we're about to create
			console.log('Creating variation with data:', {
				sourceId,
				title: newVariationTitle,
				description: newVariationDescription,
				variationType: newVariationType
			});

			// Use the editDB API with createVariation flag instead of createCompositeVariation
			const result = await $editDBMutation.mutateAsync({
				id: sourceComposite.compose_id as string,
				json: sourceComposite.compose_json,
				createVariation: true
			});

			// Define a type for the expected result
			interface EditResult {
				success?: boolean;
				compositeId?: string;
				error?: string;
			}

			// Cast the result to the expected type
			const typedResult = result as EditResult;

			if (typedResult && typedResult.success) {
				console.log('Variation created successfully:', typedResult);
				await $composeQuery.refetch();
				isCreatingVariation = false;

				// Select the newly created variation
				if (typedResult.compositeId) {
					handleCompositeSelect(typedResult.compositeId);
				}
			} else {
				console.error('Failed to create variation:', typedResult && typedResult.error);
			}
		} catch (error) {
			console.error('Error creating variation:', error);
		}
	}

	// Add a function to organize composites into a tree structure
	function organizeCompositesIntoTree(composites: RelatedComposite[]) {
		console.log('[organizeCompositesIntoTree] Organizing composites into tree:', composites.length);

		// Define a recursive type for nested composites
		type CompositeNode = RelatedComposite & { children: CompositeNode[] };

		// Create a map of all composites by ID for quick lookup
		const compositesMap = new Map<string, CompositeNode>();

		// Initialize each composite with an empty children array
		composites.forEach((composite) => {
			compositesMap.set(composite.id, { ...composite, children: [] });
			console.log(
				`[organizeCompositesIntoTree] Added composite to map: ${composite.id} (${composite.title})`
			);
		});

		// Create a root array for top-level variations (direct variations of the main composite)
		const rootVariations: CompositeNode[] = [];

		// First pass: identify parent-child relationships
		composites.forEach((composite) => {
			const compositeWithChildren = compositesMap.get(composite.id)!;

			// Check if this is a variation of another variation by looking at the relationship metadata
			const targetId =
				composite.metadata && typeof composite.metadata === 'object'
					? (composite.metadata.target_composite_id as string)
					: undefined;

			console.log(
				`[organizeCompositesIntoTree] Processing composite: ${composite.id} (${
					composite.title
				}), target: ${targetId || 'none'}`
			);

			// Skip self-referencing relationships (where target is the same as the composite id)
			if (targetId && targetId === composite.id) {
				console.log(`[organizeCompositesIntoTree] Skipping self-reference for: ${composite.id}`);
				rootVariations.push(compositeWithChildren);
				return;
			}

			if (targetId) {
				// This is a variation of another composite
				if (compositesMap.has(targetId)) {
					// This is a variation of another composite in our map
					const parent = compositesMap.get(targetId)!;
					parent.children.push(compositeWithChildren);
					console.log(`[organizeCompositesIntoTree] Added as child to: ${targetId}`);
				} else if (targetId === compose_data?.compose_id) {
					// This is a direct variation of the main composite (by compose_id)
					rootVariations.push(compositeWithChildren);
					console.log(`[organizeCompositesIntoTree] Added as root variation (by compose_id match)`);
				} else {
					// This is a direct variation of the main composite or an unknown composite
					rootVariations.push(compositeWithChildren);
					console.log(`[organizeCompositesIntoTree] Added as root variation (fallback)`);
				}
			} else {
				// No target ID found, assume it's a direct variation of the main composite
				rootVariations.push(compositeWithChildren);
				console.log(`[organizeCompositesIntoTree] Added as root variation (no target)`);
			}
		});

		// Sort variations by creation date (newest first)
		const sortByDate = (a: RelatedComposite, b: RelatedComposite) => {
			const dateA = a.metadata?.created_at ? new Date(a.metadata.created_at).getTime() : 0;
			const dateB = b.metadata?.created_at ? new Date(b.metadata.created_at).getTime() : 0;
			return dateB - dateA;
		};

		// Recursive function to sort children at all levels
		const sortChildrenRecursively = (node: CompositeNode) => {
			if (node.children && node.children.length > 0) {
				node.children.sort(sortByDate);
				node.children.forEach(sortChildrenRecursively);
			}
		};

		// Sort root variations and recursively sort all children
		rootVariations.sort(sortByDate);
		rootVariations.forEach(sortChildrenRecursively);

		// Log the tree structure for debugging
		console.log(
			`[organizeCompositesIntoTree] Final tree: ${rootVariations.length} root variations`
		);

		// Recursive function to log the tree structure
		const logTreeNode = (node: CompositeNode, depth = 0, prefix = '') => {
			const indent = '  '.repeat(depth);
			console.log(`${indent}${prefix}${node.id} (${node.title}): ${node.children.length} children`);
			node.children.forEach((child, index) => {
				logTreeNode(child, depth + 1, `${index + 1}. `);
			});
		};

		rootVariations.forEach((root, index) => {
			logTreeNode(root, 0, `${index + 1}. `);
		});

		return rootVariations;
	}

	// Organize composites into a tree structure when data changes
	$: variationTree = compose_data?.related_composites
		? organizeCompositesIntoTree(compose_data.related_composites)
		: [];
</script>

<div class="flex h-full bg-surface-800">
	<!-- Left Aside: Variations List -->
	<aside class="flex flex-col border-r w-80 border-surface-700">
		<div class="p-4 border-b border-surface-700">
			<h3 class="text-lg font-semibold text-surface-100">Composites</h3>
		</div>
		<div class="flex-1 overflow-y-auto">
			{#if compose_data}
				<div class="p-2 space-y-1">
					<!-- Current Composite -->
					<button
						class="w-full p-3 rounded-lg transition-colors text-left
							{!selectedCompositeId
							? 'bg-surface-700 border-l-4 border-primary-500'
							: 'bg-surface-900 hover:bg-surface-700'}"
						on:click={() => handleCompositeSelect(null)}
					>
						<div class="flex flex-col gap-1">
							<div class="flex items-center justify-between">
								<div class="font-medium text-surface-100">{compose_data.title}</div>
								<span class="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
									Current
								</span>
							</div>
							<div class="text-xs text-surface-400">by {compose_data.author.name}</div>
						</div>
					</button>

					<!-- Tree-structured Variations -->
					{#each variationTree as composite}
						<VariationTreeItem {composite} {selectedCompositeId} onSelect={handleCompositeSelect} />
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
			{#if selectedEditRequest && selectedEditRequest.operations && selectedEditRequest.operations.length > 0}
				<button
					class="px-6 py-3 text-sm font-medium transition-colors {$activeComposeTab === 'diff'
						? 'bg-surface-700 text-surface-100 border-b-2 border-primary-500'
						: 'text-surface-300 hover:text-surface-200 hover:bg-surface-700/50'}"
					on:click={() => handleTabChange('diff')}
				>
					Changes
					<span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
						{selectedEditRequest.operations.length}
					</span>
				</button>
			{/if}
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
				{:else if $activeComposeTab === 'diff' && selectedEditRequest}
					<div class="flex flex-col h-full">
						<div class="flex items-center justify-between mb-4">
							<div>
								<h2 class="text-xl font-semibold text-surface-100">
									{selectedEditRequest.title}
								</h2>
								<p class="mt-1 text-sm text-surface-300">
									Showing changes from {selectedEditRequest.previousVersion.snapshot_id
										? selectedEditRequest.previousVersion.snapshot_id.slice(0, 8)
										: '?'} to {selectedEditRequest.changes.snapshot_id
										? selectedEditRequest.changes.snapshot_id.slice(0, 8)
										: '?'}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<button
									class="px-4 py-2 text-sm font-medium text-purple-400 transition-colors rounded-lg bg-purple-500/10 hover:bg-purple-500/20"
									on:click={toggleVariationModal}
								>
									<Icon icon="heroicons:code-bracket-square" class="inline-block w-4 h-4 mr-1" />
									New Variation
								</button>
								{#if selectedEditRequest.status === 'pending'}
									<button
										class="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600"
										on:click={() => {
											// Dispatch the same event as the approve button in EditRequests
											const event = new CustomEvent('approve', {
												detail: { requestId: selectedEditRequest.id }
											});
											document.dispatchEvent(event);
										}}
									>
										Approve
									</button>
								{/if}
							</div>
						</div>

						<JsonDiffViewer
							baseJson={selectedEditRequest.previousVersion.instance || { content: '' }}
							operations={selectedEditRequest.operations || []}
							expanded={true}
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
										class="px-4 py-2 text-sm font-medium text-purple-400 transition-colors rounded-lg bg-purple-500/10 hover:bg-purple-500/20"
										on:click={toggleVariationModal}
									>
										<Icon icon="heroicons:code-bracket-square" class="inline-block w-4 h-4 mr-1" />
										New Variation
									</button>
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

	<!-- Right Aside: Edit Requests -->
	<aside class="flex flex-col border-l w-80 border-surface-700">
		<div class="p-4 border-b border-surface-700">
			<h3 class="text-lg font-semibold text-surface-100">Edit Requests</h3>
		</div>
		<div class="flex-1 overflow-y-auto">
			{#if compose_data}
				{#if selectedCompositeId}
					<PatchRequests
						compositeId={selectedCompositeId}
						selectedRequestId={selectedEditRequestId}
						on:select={handleEditRequestSelect}
						on:refetch={() => {
							console.log('[ComposeProposal] Refetching compose data after patch request update');
							$composeQuery.refetch();
						}}
					/>
				{:else}
					<!-- For main composite, we need to find its ID from the composites table -->
					<PatchRequests
						compositeId={'33333333-3333-3333-3333-333333333333'}
						selectedRequestId={selectedEditRequestId}
						on:select={handleEditRequestSelect}
						on:refetch={() => {
							console.log('[ComposeProposal] Refetching compose data after patch request update');
							$composeQuery.refetch();
						}}
					/>
				{/if}
			{/if}
		</div>
	</aside>
</div>

<!-- Variation Creation Modal -->
{#if isCreatingVariation}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-md p-6 rounded-lg bg-surface-800">
			<h3 class="mb-4 text-lg font-semibold text-surface-100">Create New Variation</h3>

			<div class="space-y-4">
				<div>
					<label for="variation-title" class="block mb-1 text-sm font-medium text-surface-300"
						>Title</label
					>
					<input
						id="variation-title"
						type="text"
						bind:value={newVariationTitle}
						class="w-full p-2 border rounded-lg bg-surface-900 border-surface-700 text-surface-100 focus:outline-none focus:border-primary-500"
						placeholder="Variation Title"
					/>
				</div>

				<div>
					<label for="variation-description" class="block mb-1 text-sm font-medium text-surface-300"
						>Description</label
					>
					<textarea
						id="variation-description"
						bind:value={newVariationDescription}
						class="w-full h-24 p-2 border rounded-lg bg-surface-900 border-surface-700 text-surface-100 focus:outline-none focus:border-primary-500"
						placeholder="Variation Description"
					/>
				</div>

				{#if selectedEditRequestId}
					<div class="p-3 rounded-lg bg-surface-700/50">
						<p class="text-sm text-surface-200">
							<Icon icon="heroicons:information-circle" class="inline-block w-4 h-4 mr-1" />
							This variation will include the pending changes from the selected edit request.
						</p>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex justify-end">
				<button
					class="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600"
					on:click={() => {
						const sourceId = selectedCompositeId || compose_data?.compose_id;
						if (sourceId) {
							handleCreateVariation(sourceId);
						}
					}}
					disabled={$editDBMutation.isLoading}
				>
					{$editDBMutation.isLoading ? 'Creating...' : 'Create Variation'}
				</button>
			</div>
		</div>
	</div>
{/if}

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
