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
	import MergeDialog from './MergeDialog.svelte';
	import Avatar from './Avatar.svelte';

	// Props
	export let proposalId: string;

	// Create a store for the compose tab - default to Content
	const activeComposeTab = writable<'content' | 'json' | 'diff' | 'schema'>('content');

	// Get current user data
	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

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
		schema_id?: string;
		schema_data?: any;
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
	let validationErrors: Array<{
		path: string;
		message: string;
		keyword: string;
		params: any;
	}> | null = null;
	let isSubmitting = false;

	// Toast notification functionality
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' = 'info';
	let toastVisible = false;
	let toastTimeout: number | null = null;

	// State management for merge dialog
	let showMergeDialog = false;

	// Format composites for display in a flat list
	$: formattedComposites = compose_data?.related_composites
		? compose_data.related_composites
				.map((composite) => {
					// Extract relationship type from metadata or relationship field
					const relationshipType =
						composite.metadata?.variation_type || composite.relationship_type || 'variation';

					// Create a formatted display item for each composite
					return {
						...composite,
						displayTitle: `${composite.title} (${relationshipType})`,
						authorName: composite.author?.name || 'Unknown',
						createdAt: composite.metadata?.created_at || ''
					};
				})
				.sort((a, b) => {
					// Sort by creation date (newest first)
					const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					return dateB - dateA;
				})
		: [];

	// Get current user name from the query
	$: currentUser = $userQuery.data;

	// State for showing/hiding archived composites section
	let showArchivedComposites = false;

	function showToast(
		message: string,
		type: 'success' | 'error' | 'info' = 'info',
		duration = 3000
	) {
		if (toastTimeout) clearTimeout(toastTimeout);

		toastMessage = message;
		toastType = type;
		toastVisible = true;

		toastTimeout = window.setTimeout(() => {
			toastVisible = false;
		}, duration);
	}

	function toastSuccess(message: string) {
		showToast(message, 'success');
	}

	function toastError(message: string) {
		showToast(message, 'error');
	}

	// Subscribe to query updates
	$: compose_data = $composeQuery.data?.compose_data;

	// Get the ID of the root composite from the query results
	$: rootCompositeId = $composeQuery.data?.root_composite_id || null;

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
		}
	}
	$: content = compose_data?.compose_json?.content || '';
	$: selectedComposite = compose_data?.related_composites?.find(
		(c) => c.id === selectedCompositeId
	);

	// Format markdown content
	$: formattedContent = content ? marked(content) : '';
	$: formattedSelectedContent = selectedComposite?.compose_json?.content
		? marked(selectedComposite.compose_json.content)
		: '';

	// Get the current composite's content ID for editing
	$: currentComposeId = selectedCompositeId
		? selectedComposite?.compose_id // Use compose_id for sister composites
		: compose_data?.compose_id; // Use compose_id for main composite

	// Handle tab changes
	function handleTabChange(tab: 'content' | 'json' | 'diff' | 'schema') {
		// If we're in edit mode, confirm the user wants to switch tabs
		if (editMode) {
			if (!confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
				return;
			}
			editMode = false;
		}

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

		selectedEditRequestId = request.id;
		selectedEditRequest = request;

		// If this is a request for a related composite, select it
		if (request.composite_id !== compose_data?.compose_id) {
			selectedCompositeId = request.composite_id;
		} else {
			selectedCompositeId = null;
		}

		// Switch to diff view if there are operations
		if (request.operations && request.operations.length > 0) {
			$activeComposeTab = 'diff';
		}

		// Update content based on the request
		if (request.changes?.content) {
			editContent = request.changes.content;
			editMode = true;
		}
	}

	// Handle edit mode toggle
	function toggleEditMode() {
		if (!editMode) {
			// Set initial content based on whether we're editing the main composite or a variation
			if ($activeComposeTab === 'json') {
				// For JSON tab, initialize with the full JSON structure
				const currentJson = selectedCompositeId
					? selectedComposite?.compose_json
					: compose_data?.compose_json;

				// Convert the full JSON structure to a formatted JSON string for editing
				editContent = JSON.stringify(currentJson, null, 2);
			} else {
				// For content tab, initialize with the content field
				editContent = selectedCompositeId
					? selectedComposite?.compose_json?.content || ''
					: content;
			}
		}
		editMode = !editMode;
	}

	// Handle content save
	async function saveChanges(event?: CustomEvent<{ json: any }> | MouseEvent) {
		// Reset validation errors
		validationErrors = null;
		isSubmitting = true;

		try {
			let jsonToSave: Record<string, any>;

			// Get current content structure for reference
			const currentJson = selectedCompositeId
				? { ...selectedComposite?.compose_json }
				: { ...compose_data?.compose_json };

			// Get the current composite ID
			const currentSelectedCompositeId = selectedCompositeId || compose_data?.compose_id;

			console.log('Current tab:', $activeComposeTab);
			console.log('Edit mode:', editMode);
			console.log('Current content structure:', currentJson);
			console.log('Current composite ID:', selectedCompositeId);
			console.log('Current compose ID (content):', currentComposeId);

			if ($activeComposeTab === 'json') {
				if (editMode) {
					// In edit mode, parse the full JSON from textarea
					try {
						// Parse the JSON from the editor - keep everything as is
						jsonToSave = JSON.parse(editContent);
						console.log('Full JSON parsed from editor:', jsonToSave);
					} catch (error) {
						console.error('Invalid JSON format:', error);
						toastError('Invalid JSON format. Please check your syntax.');
						isSubmitting = false;
						return;
					}
				} else if (
					event &&
					event instanceof CustomEvent &&
					'detail' in event &&
					event.detail &&
					'json' in event.detail
				) {
					// From JsonEditor component - use the full JSON object as is
					jsonToSave = event.detail.json;
					console.log('Full JSON from editor component:', jsonToSave);
				} else {
					console.error('Unexpected save event in JSON mode');
					toastError('Unexpected save event');
					isSubmitting = false;
					return;
				}
			} else {
				// For content tab, update just the content field while preserving other fields
				jsonToSave = {
					...currentJson,
					content: editContent
				};

				if (!editContent) {
					console.error('Missing content for save');
					toastError('Content cannot be empty');
					isSubmitting = false;
					return;
				}

				console.log('Content tab - JSON to save (preserving structure):', jsonToSave);
			}

			if (!currentComposeId) {
				console.error('Missing compose ID for save:', {
					selectedCompositeId,
					selectedCompose: selectedComposite?.compose_id,
					mainCompose: compose_data?.compose_id
				});
				toastError('Missing compose ID');
				isSubmitting = false;
				return;
			}

			console.log('Saving with composite ID:', selectedCompositeId || rootCompositeId);
			console.log('JSON to save (raw):', jsonToSave);

			// Get the composite ID - for selected composites use selectedCompositeId,
			// for root composite use rootCompositeId from our query
			const compositeIdToUse = selectedCompositeId || rootCompositeId;

			// Pass both the content ID (currentComposeId) and the composite ID
			const result = await $editDBMutation.mutateAsync({
				id: currentComposeId,
				compositeId: compositeIdToUse,
				json: jsonToSave,
				createVariation: false
			});

			// Define a type for the expected result
			interface EditResult {
				success?: boolean;
				error?: string;
				details?: {
					message?: string;
					errors?: Array<{
						path: string;
						message: string;
						keyword: string;
						params: any;
					}>;
				};
			}

			// Cast the result to the expected type
			const typedResult = result as EditResult;
			console.log('Save result:', typedResult);

			if (typedResult && typedResult.success) {
				await $composeQuery.refetch();
				editMode = false;
				toastSuccess('Content saved successfully');
			} else {
				// Enhanced error handling for validation failures
				if (typedResult.details?.errors) {
					validationErrors = typedResult.details.errors;

					// Show more specific error message for common validation issues
					if (validationErrors.some((e) => e.keyword === 'additionalProperties')) {
						const invalidProps = validationErrors
							.filter((e) => e.keyword === 'additionalProperties' && e.params?.additionalProperty)
							.map((e) => e.params.additionalProperty)
							.join(', ');

						toastError(`Schema validation failed: Properties not allowed: ${invalidProps}`);
					} else if (validationErrors.some((e) => e.keyword === 'required')) {
						const missingProps = validationErrors
							.filter((e) => e.keyword === 'required' && e.params?.missingProperty)
							.map((e) => e.params.missingProperty)
							.join(', ');

						toastError(`Schema validation failed: Missing required properties: ${missingProps}`);
					} else {
						toastError('Validation failed. Please check the form for errors.');
					}
				} else if (typedResult.error) {
					// Handle specific database errors with more user-friendly messages
					if (typedResult.error.includes('query returned more than one row')) {
						toastError(
							'Database error: Multiple records found with the same ID. Please contact support.'
						);
					} else {
						toastError(typedResult.error);
					}
				} else {
					toastError('An unknown error occurred while saving');
				}
				console.error('Failed to save changes:', typedResult);
			}
		} catch (error) {
			console.error('Exception during save:', error);
			toastError('An error occurred while saving');
		} finally {
			isSubmitting = false;
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

			// Create a modified JSON that includes metadata for the title and description
			const modifiedJson = {
				...sourceComposite.compose_json,
				__variation_metadata: {
					title: newVariationTitle,
					description: newVariationDescription,
					type: newVariationType
				}
			};

			// Use the editDB API with createVariation flag instead of createCompositeVariation
			const result = await $editDBMutation.mutateAsync({
				id: sourceComposite.compose_id as string,
				json: modifiedJson,
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

	// Handle opening the merge dialog
	function handleOpenMergeDialog() {
		showMergeDialog = true;
	}

	// Handle closing the merge dialog
	function handleCloseMergeDialog() {
		showMergeDialog = false;
	}

	// Handle merge completion
	function handleMergeComplete(event: CustomEvent<{ patchRequestId: string }>) {
		const patchRequestId = event.detail.patchRequestId;
		console.log('[ComposeProposal] Merge completed, patch request created:', patchRequestId);

		// Close the dialog
		showMergeDialog = false;

		// Refetch data to show the updated state
		$composeQuery.refetch();
	}
</script>

<div class="flex h-full bg-surface-800">
	<!-- Toast notification -->
	{#if toastVisible}
		<div class="fixed z-50 max-w-sm top-4 right-4">
			<div
				class="p-4 rounded-lg shadow-lg transition-all transform translate-y-0 opacity-100 flex items-center gap-3
				{toastType === 'success'
					? 'bg-green-800 text-green-100'
					: toastType === 'error'
					? 'bg-red-800 text-red-100'
					: 'bg-blue-800 text-blue-100'}"
			>
				<span class="text-lg">
					{#if toastType === 'success'}
						<Icon icon="mdi:check-circle" />
					{:else if toastType === 'error'}
						<Icon icon="mdi:alert-circle" />
					{:else}
						<Icon icon="mdi:information" />
					{/if}
				</span>
				<p>{toastMessage}</p>
				<button
					class="ml-auto text-lg transition-opacity opacity-70 hover:opacity-100"
					on:click={() => (toastVisible = false)}
				>
					<Icon icon="mdi:close" />
				</button>
			</div>
		</div>
	{/if}

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
						<div class="flex items-start gap-3">
							<!-- Author Avatar -->
							<Avatar
								me={{
									data: { seed: compose_data.author.name },
									design: { highlight: !selectedCompositeId },
									size: '2xs'
								}}
							/>

							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between">
									<div class="font-medium text-surface-100 truncate max-w-[150px]">
										{compose_data.title}
									</div>
									<span class="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
										Latest
									</span>
								</div>
								<div class="text-xs font-medium text-surface-300">
									by {compose_data.author.name}
								</div>
							</div>
						</div>
					</button>

					<!-- Flat list of all non-archived variations -->
					{#each formattedComposites as composite}
						<button
							class="w-full p-3 rounded-lg transition-colors text-left
								{selectedCompositeId === composite.id
								? 'bg-surface-700 border-l-4 border-primary-500'
								: 'bg-surface-900 hover:bg-surface-700'}"
							on:click={() => handleCompositeSelect(composite.id)}
						>
							<div class="flex items-start gap-3">
								<!-- Author Avatar -->
								<Avatar
									me={{
										data: { seed: composite.author?.name || 'Unknown' },
										design: { highlight: selectedCompositeId === composite.id },
										size: '2xs'
									}}
								/>

								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between">
										<div class="font-medium text-surface-100 truncate max-w-[150px]">
											{composite.title}
										</div>

										<!-- Single unified tag with blue color -->
										<span class="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300">
											{composite.metadata?.variation_type ||
												composite.relationship_type ||
												'variation'}
										</span>
									</div>
									<div class="text-xs font-medium text-surface-300">
										by {composite.author?.name || 'Unknown'}
									</div>
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
			<button
				class="px-6 py-3 text-sm font-medium transition-colors {$activeComposeTab === 'schema'
					? 'bg-surface-700 text-surface-100 border-b-2 border-primary-500'
					: 'text-surface-300 hover:text-surface-200 hover:bg-surface-700/50'}"
				on:click={() => handleTabChange('schema')}
			>
				Schema
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
		<div class="p-6 overflow-y-auto h-[calc(100vh-3.5rem)]">
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

						{#if validationErrors && validationErrors.length > 0}
							<div class="p-4 mb-4 border rounded-md border-red-500/30 bg-red-900/20">
								<h3 class="mb-2 font-medium text-red-400">Validation Errors</h3>
								<ul class="space-y-1 text-sm list-disc list-inside">
									{#each validationErrors as error}
										<li class="text-red-300">
											<span class="font-mono bg-red-900/30 px-1 py-0.5 rounded"
												>{error.path || 'root'}</span
											>:
											{error.message}
											{#if error.keyword === 'additionalProperties' && error.params.additionalProperty}
												- <span class="font-mono">{error.params.additionalProperty}</span> is not allowed
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if editMode}
							<textarea
								bind:value={editContent}
								class="w-full h-[calc(100vh-12rem)] p-4 border rounded-lg bg-surface-900 border-surface-700 focus:outline-none focus:border-primary-500 text-surface-100 font-mono"
								placeholder="Enter JSON content..."
							/>
						{:else}
							<JsonEditor
								json={selectedComposite?.compose_json || compose_data?.compose_json}
								on:save={saveChanges}
								readOnly={false}
							/>
						{/if}
					</div>
				{:else if $activeComposeTab === 'schema'}
					<div class="flex flex-col h-full">
						<div class="flex items-center justify-between mb-4">
							<div>
								<h2 class="text-xl font-semibold text-surface-100">Schema Definition</h2>
								{#if compose_data?.schema_id}
									<p class="mt-1 text-sm text-surface-300">
										Schema ID: <span class="font-mono">{compose_data.schema_id}</span>
									</p>
								{/if}
							</div>
						</div>

						{#if compose_data?.schema_data}
							<div class="flex flex-col flex-grow gap-4">
								<div class="p-3 rounded-lg bg-surface-700/50">
									<p class="text-sm text-surface-200">
										<Icon icon="heroicons:information-circle" class="inline-block w-4 h-4 mr-1" />
										This is the schema that defines the structure and validation rules for this content.
										Content must conform to this schema to be valid.
									</p>
								</div>

								<div class="flex-grow schema-view">
									<JsonEditor json={compose_data.schema_data} readOnly={true} />
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-center p-8 rounded-lg bg-surface-700/30">
								<p class="text-surface-400">No schema available for this content</p>
							</div>
						{/if}
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
										class="px-4 py-2 text-sm font-medium text-green-400 transition-colors rounded-lg bg-green-500/10 hover:bg-green-500/20"
										on:click={handleOpenMergeDialog}
									>
										<Icon icon="heroicons:code-bracket-merge" class="inline-block w-4 h-4 mr-1" />
										Merge
									</button>
									<button
										class="px-4 py-2 text-sm font-medium text-purple-400 transition-colors rounded-lg bg-purple-500/10 hover:bg-purple-500/20"
										on:click={toggleVariationModal}
									>
										<Icon icon="heroicons:code-bracket-square" class="inline-block w-4 h-4 mr-1" />
										New Variation
									</button>
									<button
										class="px-4 py-2 text-sm font-medium transition-colors rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20"
										on:click={() => {
											// Check if the user is the author of the proposal
											const isAuthor = currentUser?.name === compose_data?.author?.name;
											// Allow editing for all users for now
											toggleEditMode();
										}}
									>
										Edit
									</button>
								{/if}
							</div>
						</div>

						{#if editMode}
							<div class="flex flex-col gap-4">
								{#if validationErrors && validationErrors.length > 0}
									<div class="p-4 mb-4 border rounded-md border-red-500/30 bg-red-900/20">
										<h3 class="mb-2 font-medium text-red-400">Validation Errors</h3>
										<ul class="space-y-1 text-sm list-disc list-inside">
											{#each validationErrors as error}
												<li class="text-red-300">
													<span class="font-mono bg-red-900/30 px-1 py-0.5 rounded"
														>{error.path || 'root'}</span
													>:
													{error.message}
												</li>
											{/each}
										</ul>
									</div>
								{/if}
								<textarea
									bind:value={editContent}
									class="w-full h-[calc(100vh-12rem)] p-4 border rounded-lg bg-surface-900 border-surface-700 focus:outline-none focus:border-primary-500 text-surface-100"
									placeholder="Enter markdown content..."
								/>
							</div>
						{:else}
							<div class="overflow-y-auto prose prose-invert max-w-none">
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
			<h3 class="text-lg font-semibold text-surface-100">Patch Requests</h3>
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
						compositeId={compose_data?.compose_id}
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
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-surface-100">Create New Variation</h3>
				<button
					class="p-1 rounded-full text-tertiary-400 hover:text-tertiary-100 hover:bg-surface-700"
					on:click={toggleVariationModal}
				>
					<Icon icon="heroicons:x-mark" class="w-5 h-5" />
				</button>
			</div>

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

			<div class="flex justify-end gap-2 mt-6">
				<button
					class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-surface-300 bg-surface-700 hover:bg-surface-600"
					on:click={toggleVariationModal}
				>
					Cancel
				</button>
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

<!-- Merge Dialog -->
{#if showMergeDialog && compose_data}
	<MergeDialog
		targetCompositeId={selectedCompositeId || compose_data.compose_id || ''}
		open={showMergeDialog}
		on:close={handleCloseMergeDialog}
		on:mergeComplete={handleMergeComplete}
	/>
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

	/* Ensure content area has sufficient height */
	:global(.schema-view) {
		min-height: calc(100vh - 20rem);
		display: flex;
		flex-direction: column;
	}
</style>
