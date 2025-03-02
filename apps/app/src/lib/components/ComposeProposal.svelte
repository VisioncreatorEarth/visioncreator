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
	import CompositesAndMerge from './CompositesAndMerge.svelte';

	// Props
	export let proposalId: string;

	// DOM references
	let contentEditableRef: HTMLElement;

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
		id: string;
		title: string;
		description: string | null;
		compose_id: string;
		compose_json: ComposeJson;
		schema_id: string | null;
		is_archived: boolean;
		author: {
			id: string;
			name: string;
		};
		related_composites: RelatedComposite[];
		patch_requests: PatchRequest[];
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
		is_archived: boolean;
		metadata: {
			created_at?: string;
			variation_type?: string;
			description?: string;
			[key: string]: unknown;
		};
	}

	interface PatchRequest {
		id: string;
		composite_id: string;
		operation_type: string;
		status: string;
		metadata: any;
		operations: any[];
		created_at: string;
		author: {
			id: string;
			name: string;
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
	let hasChanges = false;
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
	let contentBeforeEdit = ''; // Store original content for comparison
	let isSubmitting = false; // Track submission state

	// Toast notification functionality
	let toastMessage = '';
	let toastType: 'success' | 'error' | 'info' = 'info';
	let toastVisible = false;
	let toastTimeout: number | null = null;

	// State for showing/hiding archived composites section
	let showArchivedComposites = true;

	// State to track if a composite is being archived
	let isArchiving = false;

	// Helper functions for operations display
	// Helper function to get operation type icon
	function getOperationIcon(type: string): string {
		switch (type.toLowerCase()) {
			case 'add':
				return 'heroicons:plus-circle';
			case 'remove':
				return 'heroicons:minus-circle';
			case 'replace':
				return 'heroicons:arrow-path';
			case 'move':
				return 'heroicons:arrows-right-left';
			case 'copy':
				return 'heroicons:document-duplicate';
			default:
				return 'heroicons:question-mark-circle';
		}
	}

	// Helper function to get operation type color
	function getOperationColor(type: string): string {
		switch (type.toLowerCase()) {
			case 'add':
				return 'text-green-400 bg-green-400/10';
			case 'remove':
				return 'text-red-400 bg-red-400/10';
			case 'replace':
				return 'text-blue-400 bg-blue-400/10';
			case 'move':
				return 'text-purple-400 bg-purple-400/10';
			case 'copy':
				return 'text-yellow-400 bg-yellow-400/10';
			default:
				return 'text-gray-400 bg-gray-400/10';
		}
	}

	// Format date for display
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
						createdAt: composite.metadata?.created_at || '',
						is_archived: composite.is_archived
					};
				})
				.sort((a, b) => {
					// Sort by creation date (newest first)
					const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					return dateB - dateA;
				})
		: [];

	// Split composites into active and archived lists
	$: activeComposites = formattedComposites.filter((c) => !c.is_archived);
	$: archivedComposites = formattedComposites.filter((c) => c.is_archived);

	// Check if main composite is archived
	$: isMainCompositeArchived = compose_data?.is_archived === true;

	// Get current user name from the query
	$: currentUser = $userQuery.data;

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
		// If we have unsaved changes, confirm the user wants to switch tabs
		if (hasChanges) {
			if (!confirm('You have unsaved changes. Are you sure you want to switch tabs?')) {
				return;
			}
			hasChanges = false;
		}

		$activeComposeTab = tab;

		// If we're switching to content or JSON tab, prepare for possible editing
		if (tab === 'content') {
			editContent = selectedCompositeId ? selectedComposite?.compose_json?.content || '' : content;
			contentBeforeEdit = editContent;
		} else if (tab === 'json') {
			const currentJson = selectedCompositeId
				? selectedComposite?.compose_json
				: compose_data?.compose_json;
			editContent = JSON.stringify(currentJson, null, 2);
			contentBeforeEdit = editContent;
		}
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

		// Always switch to diff view when a patch request is selected
		$activeComposeTab = 'diff';

		// Update content based on the request
		if (request.changes?.content) {
			editContent = request.changes.content;
			editMode = true;
		}
	}

	// Check if content has been modified
	function checkForChanges(newContent: string) {
		hasChanges = newContent !== contentBeforeEdit;
	}

	// Set up editor for markdown with proper styling
	function setupMarkdownEditor() {
		if (contentEditableRef) {
			const currentContent = selectedCompositeId
				? selectedComposite?.compose_json?.content || ''
				: content;

			// Store the initial content for comparison
			contentBeforeEdit = currentContent;
			editContent = currentContent;

			// Set initial content
			contentEditableRef.innerText = currentContent;

			// Apply basic styling
			contentEditableRef.style.whiteSpace = 'pre-wrap';
			contentEditableRef.style.fontFamily = 'monospace';
		}
	}

	// Handle content changes in the markdown editor
	function handleContentInput(e: Event) {
		if (contentEditableRef) {
			// Get the plain text content
			editContent = contentEditableRef.innerText;
			checkForChanges(editContent);
		}
	}

	// Cancel editing and revert changes
	function cancelEditing() {
		editContent = contentBeforeEdit;
		hasChanges = false;

		// Reset editors
		if (contentEditableRef && $activeComposeTab === 'content') {
			contentEditableRef.innerText = contentBeforeEdit;
		}
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

			if ($activeComposeTab === 'json') {
				if (hasChanges) {
					// In edit mode, parse the full JSON from textarea
					try {
						// Parse the JSON from the editor - keep everything as is
						jsonToSave = JSON.parse(editContent);
					} catch (error) {
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
				} else {
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
					toastError('Content cannot be empty');
					isSubmitting = false;
					return;
				}
			}

			if (!currentComposeId) {
				toastError('Missing compose ID');
				isSubmitting = false;
				return;
			}

			// Get the composite ID - for selected composites use selectedCompositeId,
			// for root composite use rootCompositeId from our query
			const compositeIdToUse = selectedCompositeId || rootCompositeId;

			// Pass both the content ID (currentComposeId) and the composite ID - making sure compositeId is a string
			const result = await $editDBMutation.mutateAsync({
				id: currentComposeId,
				compositeId: compositeIdToUse || undefined,
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

			if (typedResult && typedResult.success) {
				await $composeQuery.refetch();
				hasChanges = false;
				contentBeforeEdit = editContent;
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
			}
		} catch (error) {
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

	<!-- Left Aside: Composite List Component -->
	<CompositesAndMerge
		{compose_data}
		{formattedComposites}
		{selectedCompositeId}
		{rootCompositeId}
		on:select={({ detail }) => handleCompositeSelect(detail.compositeId)}
		on:refetch={() => $composeQuery.refetch()}
		on:toast={({ detail }) => showToast(detail.message, detail.type)}
	/>

	<!-- Main Content Area -->
	<main class="flex flex-col flex-1 overflow-auto">
		<!-- Tab Navigation -->
		<nav class="flex items-center justify-between border-b border-surface-700">
			{#if selectedEditRequest}
				<!-- When patch request is selected, show merged title with operations count -->
				<div class="flex items-center px-6 py-3 text-sm font-medium">
					<span class="text-surface-100">Viewing Patch Request Operations</span>
					<span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
						{(selectedEditRequest.operations && selectedEditRequest.operations.length) || 0}
					</span>
				</div>
				<button
					class="flex items-center gap-1 px-4 py-2 mr-4 text-sm font-medium transition-colors rounded-lg text-surface-300 hover:text-surface-100 hover:bg-surface-700/50"
					on:click={() => {
						selectedEditRequest = null;
						selectedEditRequestId = undefined;
						$activeComposeTab = 'content';
					}}
				>
					<Icon icon="heroicons:x-mark" class="w-4 h-4" />
					<span>Close</span>
				</button>
			{:else}
				<!-- Normal tab navigation when no patch request is selected -->
				<div class="flex">
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
						</button>
					{/if}
				</div>

				<!-- Action buttons aligned to the right -->
				<div class="flex items-center gap-2 px-4">
					<button
						class="p-1.5 text-sm font-medium text-purple-400 transition-colors rounded-lg bg-purple-500/10 hover:bg-purple-500/20 flex items-center gap-1"
						on:click={toggleVariationModal}
					>
						<Icon icon="heroicons:code-bracket-square" class="w-4 h-4" />
						<span>New Variation</span>
					</button>
				</div>
			{/if}
		</nav>

		<!-- Content Area -->
		<div class="p-0 overflow-hidden h-[calc(100vh-3.5rem)]">
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
					<div class="flex flex-col h-full p-6">
						<div class="flex items-center justify-end mb-4">
							{#if hasChanges}
								<div class="flex items-center gap-2">
									<button
										class="px-4 py-2 text-sm rounded-lg bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600"
										on:click={cancelEditing}
									>
										Cancel
									</button>
									<button
										class="px-4 py-2 text-sm text-white rounded-lg bg-success-500 hover:bg-success-600"
										on:click={saveChanges}
									>
										Save Changes
									</button>
								</div>
							{/if}
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

						<!-- JSON editor with direct inline editing -->
						<div class="w-full h-[calc(100vh-12rem)] overflow-y-auto">
							<JsonEditor
								json={selectedComposite?.compose_json || compose_data?.compose_json}
								on:save={saveChanges}
								readOnly={false}
								on:change={(event) => {
									if (event.detail && event.detail.json) {
										// Use the direct JSON data instead of string conversion
										const newJson = event.detail.json;
										const oldJson = selectedComposite?.compose_json || compose_data?.compose_json;
										// Check if JSON has changed
										hasChanges = JSON.stringify(newJson) !== JSON.stringify(oldJson);
										if (hasChanges) {
											editContent = JSON.stringify(newJson, null, 2);
										}
									}
								}}
							/>
						</div>
					</div>
				{:else if $activeComposeTab === 'schema'}
					<div class="flex flex-col h-full p-6">
						{#if compose_data?.schema_data}
							<div class="flex flex-col flex-grow">
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
					<div class="flex flex-col h-full overflow-hidden">
						<!-- Conflict notification -->
						{#if selectedEditRequest?.metadata?.op_conflicts && selectedEditRequest.metadata.op_conflicts.length > 0}
							<div
								class="sticky top-0 z-20 flex items-center px-4 py-2 border-b bg-yellow-900/80 border-yellow-500/50 backdrop-blur-sm"
							>
								<Icon icon="heroicons:exclamation-triangle" class="w-4 h-4 mr-2 text-yellow-400" />
								<span class="text-xs text-yellow-300">
									This merge has {selectedEditRequest.metadata.op_conflicts.length} conflict{selectedEditRequest
										.metadata.op_conflicts.length === 1
										? ''
										: 's'}.
									<span class="font-medium">Scroll down to view conflict details.</span>
								</span>
							</div>
						{/if}

						<!-- Operations List Header -->
						{#if !selectedEditRequest}
							<div
								class="flex items-center justify-between px-6 py-3 border-b border-surface-700 bg-surface-800"
							>
								<h3 class="text-lg font-medium text-surface-100">
									Operations
									<span
										class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300"
									>
										{(selectedEditRequest.operations && selectedEditRequest.operations.length) || 0}
									</span>
								</h3>
							</div>
						{/if}

						<!-- Operations Content -->
						{#if selectedEditRequest.operations && selectedEditRequest.operations.length > 0}
							<div class="h-[calc(100vh-7rem)] overflow-y-auto">
								<!-- Column Headers -->
								<div
									class="sticky top-0 z-10 px-4 py-2 font-medium border-b bg-surface-800 border-surface-700"
								>
									<div class="grid grid-cols-12 gap-4">
										<span class="col-span-3 text-xs text-surface-300">Metadata</span>
										<span class="col-span-9 text-xs text-surface-300">Changes</span>
									</div>
								</div>

								<!-- Operations List -->
								<div class="divide-y divide-surface-700/50">
									{#each selectedEditRequest.operations as operation}
										<div class="px-4 py-3 transition-colors hover:bg-surface-800/70">
											<div class="grid grid-cols-12 gap-4">
												<!-- Metadata column (left side) -->
												<div
													class="flex flex-col col-span-3 gap-2 pr-2 border-r border-surface-700/50"
												>
													<!-- Operation type -->
													<span
														class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm {getOperationColor(
															operation.operation_type
														)}"
													>
														<Icon
															icon={getOperationIcon(operation.operation_type)}
															class="w-3 h-3"
														/>
														{operation.operation_type}
													</span>

													<!-- Path -->
													<div class="text-xs break-words text-tertiary-300">
														<span class="text-2xs text-surface-400">Path:</span>
														<div class="overflow-y-auto font-mono max-h-24">
															{#each operation.path as segment, index}
																<div class="flex items-center">
																	{#if index > 0}
																		<span class="inline-block" style="width: {index * 12}px" />
																		<span class="mr-1 text-surface-400">└─</span>
																	{/if}
																	<span class="break-all whitespace-normal">{segment}</span>
																</div>
															{/each}
														</div>
													</div>

													<!-- Timestamp -->
													<div class="text-2xs text-tertiary-400">
														{formatDate(operation.created_at)}
													</div>

													<!-- Merge metadata if any -->
													{#if operation.metadata?.merge_source_id || operation.metadata?.ancestor_id}
														<div class="flex flex-col gap-1 mt-1">
															{#if operation.metadata.merge_source_id}
																<span
																	class="inline-flex items-center px-1.5 py-0.5 text-2xs rounded-md bg-surface-700/70 text-tertiary-300 backdrop-blur-sm"
																>
																	<Icon
																		icon="heroicons:document-arrow-up"
																		class="w-2.5 h-2.5 mr-1"
																	/>
																	Src: {operation.metadata.merge_source_id.slice(0, 8)}
																</span>
															{/if}
															{#if operation.metadata.ancestor_id}
																<span
																	class="inline-flex items-center px-1.5 py-0.5 text-2xs rounded-md bg-surface-700/70 text-tertiary-300 backdrop-blur-sm"
																>
																	<Icon
																		icon="heroicons:document-arrow-down"
																		class="w-2.5 h-2.5 mr-1"
																	/>
																	Anc: {operation.metadata.ancestor_id.slice(0, 8)}
																</span>
															{/if}
														</div>
													{/if}
												</div>

												<!-- Main content column (right side) -->
												<div class="col-span-9">
													{#if operation.operation_type === 'add'}
														<div
															class="pl-2 font-mono text-xs text-green-200 break-words whitespace-pre-wrap border-l-2 border-green-500/50"
														>
															+ {typeof operation.new_value === 'object'
																? JSON.stringify(operation.new_value, null, 2)
																: operation.new_value}
														</div>
													{:else if operation.operation_type === 'remove'}
														<div
															class="pl-2 font-mono text-xs text-red-200 break-words whitespace-pre-wrap border-l-2 border-red-500/50"
														>
															- {typeof operation.old_value === 'object'
																? JSON.stringify(operation.old_value, null, 2)
																: operation.old_value}
														</div>
													{:else}
														<div class="font-mono text-xs break-words whitespace-pre-wrap">
															{#if operation.old_value !== null && operation.old_value !== undefined}
																<div class="pl-2 mb-2 text-red-200 border-l-2 border-red-500/50">
																	- {typeof operation.old_value === 'object'
																		? JSON.stringify(operation.old_value, null, 2)
																		: operation.old_value}
																</div>
															{/if}
															{#if operation.new_value !== null && operation.new_value !== undefined}
																<div class="pl-2 text-green-200 border-l-2 border-green-500/50">
																	+ {typeof operation.new_value === 'object'
																		? JSON.stringify(operation.new_value, null, 2)
																		: operation.new_value}
																</div>
															{/if}
														</div>
													{/if}
												</div>
											</div>
										</div>
									{/each}

									<!-- Display Conflicts inline with operations -->
									{#if selectedEditRequest?.metadata?.op_conflicts && selectedEditRequest.metadata.op_conflicts.length > 0}
										<div class="px-4 py-2 bg-yellow-900/20 border-y border-yellow-500/30">
											<div class="flex items-center">
												<Icon
													icon="heroicons:exclamation-triangle"
													class="w-4 h-4 mr-2 text-yellow-400"
												/>
												<h3 class="text-xs font-medium text-yellow-300">
													Merge Conflicts ({selectedEditRequest.metadata.op_conflicts.length})
												</h3>
											</div>
										</div>

										{#each selectedEditRequest.metadata.op_conflicts as conflict, i}
											<div
												class="px-4 py-3 transition-colors hover:bg-surface-800/70 bg-yellow-900/5"
											>
												<div class="grid grid-cols-12 gap-4">
													<!-- Metadata column (left side) -->
													<div
														class="flex flex-col col-span-3 gap-2 pr-2 border-r border-yellow-500/30"
													>
														<!-- Conflict badge -->
														<span
															class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm text-yellow-400 bg-yellow-400/10"
														>
															<Icon icon="heroicons:exclamation-triangle" class="w-3 h-3" />
															conflict
														</span>

														<!-- Path -->
														<div class="text-xs text-yellow-300 break-words">
															<span class="text-yellow-400 text-2xs">Path:</span>
															<div class="overflow-y-auto font-mono max-h-24">
																{#if Array.isArray(conflict.path)}
																	{#each conflict.path as segment, index}
																		<div class="flex items-center">
																			{#if index > 0}
																				<span class="inline-block" style="width: {index * 12}px" />
																				<span class="mr-1 text-yellow-400">└─</span>
																			{/if}
																			<span class="break-all whitespace-normal">{segment}</span>
																		</div>
																	{/each}
																{:else}
																	<div class="break-all whitespace-normal">{conflict.path}</div>
																{/if}
															</div>
														</div>

														<!-- Resolution -->
														<div class="flex items-center mt-1">
															<Icon
																icon="heroicons:check-circle"
																class="w-3.5 h-3.5 mr-1 text-yellow-300"
															/>
															<span class="text-yellow-300 text-2xs">
																Resolution: {conflict.resolution || 'target'} value used
															</span>
														</div>
													</div>

													<!-- Main content column (right side) -->
													<div class="col-span-9">
														<div class="grid grid-cols-2 gap-4">
															<div>
																<div class="mb-1 text-yellow-300 uppercase text-2xs">
																	Source Value:
																</div>
																<div
																	class="p-2 pl-2 overflow-auto font-mono text-xs text-red-200 whitespace-pre-wrap border-l-2 rounded bg-surface-800/70 max-h-40 border-red-500/50"
																>
																	- {typeof conflict.source_value === 'object'
																		? JSON.stringify(conflict.source_value, null, 2)
																		: conflict.source_value}
																</div>
															</div>
															<div>
																<div class="mb-1 text-yellow-300 uppercase text-2xs">
																	Target Value:
																</div>
																<div
																	class="p-2 pl-2 overflow-auto font-mono text-xs text-green-200 whitespace-pre-wrap border-l-2 rounded bg-surface-800/70 max-h-40 border-green-500/50"
																>
																	+ {typeof conflict.target_value === 'object'
																		? JSON.stringify(conflict.target_value, null, 2)
																		: conflict.target_value}
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										{/each}
									{/if}
								</div>
							</div>
						{:else}
							<div class="h-[calc(100vh-7rem)] flex items-center justify-center">
								<div class="max-w-md p-6 text-center rounded-lg bg-surface-800/50">
									<Icon
										icon="heroicons:document-text"
										class="w-10 h-10 mx-auto mb-3 text-tertiary-400"
									/>
									<p class="mb-1 text-tertiary-300">No operations found in this patch request</p>
									<p class="text-xs text-tertiary-400">
										This patch request doesn't contain any changes to review.
									</p>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex flex-col h-full p-6">
						<div class="flex items-center justify-end mb-4">
							{#if hasChanges}
								<div class="flex items-center gap-2">
									<button
										class="px-4 py-2 text-sm rounded-lg bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600"
										on:click={cancelEditing}
									>
										Cancel
									</button>
									<button
										class="px-4 py-2 text-sm text-white rounded-lg bg-success-500 hover:bg-success-600"
										on:click={saveChanges}
									>
										Save Changes
									</button>
								</div>
							{/if}
						</div>

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

							<!-- Content editor with direct inline editing -->
							<div class="w-full h-[calc(100vh-12rem)] overflow-y-auto">
								{#if hasChanges}
									<!-- Show markdown editor with styled appearance -->
									<div
										bind:this={contentEditableRef}
										contenteditable={true}
										class="w-full h-full p-4 font-mono whitespace-pre-wrap border rounded-lg bg-surface-850 border-surface-700 focus:outline-none focus:border-primary-500 text-surface-100"
										on:input={handleContentInput}
									/>
								{:else}
									<!-- Show formatted content with click-to-edit capability -->
									<div
										class="p-4 prose transition-colors rounded-lg prose-invert max-w-none cursor-text hover:bg-surface-700/20"
										on:click={() => {
											hasChanges = true;
											setTimeout(() => {
												setupMarkdownEditor();
												if (contentEditableRef) {
													contentEditableRef.focus();
												}
											}, 0);
										}}
									>
										{@html selectedComposite ? formattedSelectedContent : formattedContent}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{:else}
				<div class="flex items-center justify-center h-full">
					<div class="text-surface-300">No data available</div>
				</div>
			{/if}
		</div>
	</main>

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

	/* Improved drag and drop styling */
	button[draggable='true'] {
		cursor: grab;
		transition: all 0.2s ease;
		position: relative;
	}

	button[draggable='true']:active {
		cursor: grabbing;
		transform: rotate(1deg) scale(0.99);
	}

	/* Add drag indicator */
	.drag-over {
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3) !important;
		background-color: rgba(59, 130, 246, 0.1) !important;
		transform: scale(1.02);
		transition: all 0.2s ease;
	}

	/* Better drag over indicator */
	button.ring-2 {
		transition: all 0.3s ease;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3);
	}
</style>
