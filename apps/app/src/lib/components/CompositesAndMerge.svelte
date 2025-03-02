<!--
@component
CompositesAndMerge.svelte - A component for displaying and managing composites with drag and drop merging.
This component handles:
1. Display of the main composite and related composites (variations, forks, etc.)
2. Drag and drop merging between composites
3. Display of archived composites in a collapsible section
-->
<script lang="ts">
	import { createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';
	import Avatar from './Avatar.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	// Component props
	export let compose_data: any; // The main composite data
	export let formattedComposites: any[] = []; // All related composites formatted for display
	export let selectedCompositeId: string | null = null; // Currently selected composite ID
	export let rootCompositeId: string | null = null; // ID of the root composite

	// Component state
	let showArchivedComposites = false; // Closed by default
	let draggedCompositeId: string | null = null;
	let dragOverCompositeId: string | null = null;
	let isDragging = false;

	// Create the threeWayMergeMutation so it can be used with store syntax
	const threeWayMergeMutation = createMutation({
		operationName: 'threeWayMerge'
	});

	// Event dispatcher for communicating with parent
	const dispatch = createEventDispatcher<{
		select: { compositeId: string | null };
		refetch: void;
		toast: { message: string; type: 'success' | 'error' | 'info' };
	}>();

	// Define the merge result type
	interface MergeResult {
		success: boolean;
		message?: string;
		error?: string;
		details?: string;
		patchRequestId?: string;
		conflicts_detected?: number;
		isDragAndDrop?: boolean;
		op_conflicts?: any[];
	}

	// Initialize component
	onMount(() => {
		console.log('CompositesAndMerge component mounted');
		console.log('Initial compose_data:', compose_data);
		console.log('Initial formattedComposites:', formattedComposites);

		// Force check for archived items on mount
		let initialArchivedCount = formattedComposites.filter((c) => c.is_archived).length;
		console.log(`Found ${initialArchivedCount} archived items on mount`);

		if (initialArchivedCount > 0) {
			// Auto-show archived section only if there are many items (more than 3)
			// Otherwise keep it closed by default
			showArchivedComposites = initialArchivedCount > 3;
		}
	});

	// Split composites into active and archived lists
	$: activeComposites = formattedComposites.filter((c) => c.is_archived !== true);
	$: archivedComposites = formattedComposites.filter((c) => c.is_archived === true);

	// Check if main composite is archived
	$: mainComposite = compose_data?.id
		? { id: compose_data.id, is_archived: compose_data.is_archived === true }
		: null;
	$: isMainCompositeArchived = mainComposite?.is_archived === true;

	// Add debug logs to track archive data
	$: {
		console.log('CompositesAndMerge - formattedComposites:', formattedComposites);
		console.log('CompositesAndMerge - activeComposites:', activeComposites);
		console.log('CompositesAndMerge - archivedComposites:', archivedComposites);
		console.log('CompositesAndMerge - isMainCompositeArchived:', isMainCompositeArchived);

		if (archivedComposites.length > 0) {
			console.log('!!! FOUND ARCHIVED ITEMS !!!', archivedComposites);
		}

		if (isMainCompositeArchived) {
			console.log('!!! MAIN COMPOSITE IS ARCHIVED !!!', mainComposite);
		}
	}

	// Handle composite selection
	function handleCompositeSelect(compositeId: string | null) {
		dispatch('select', { compositeId });
	}

	// Toast helper functions (dispatches to parent)
	function toastSuccess(message: string) {
		dispatch('toast', { message, type: 'success' });
	}

	function toastError(message: string) {
		dispatch('toast', { message, type: 'error' });
	}

	function toastInfo(message: string) {
		dispatch('toast', { message, type: 'info' });
	}

	// Handle drag start for composite merging
	function handleDragStart(event: DragEvent, compositeId: string) {
		if (!event.dataTransfer) return;

		isDragging = true;
		draggedCompositeId = compositeId;

		// Set data for the drag operation
		event.dataTransfer.setData('text/plain', compositeId);
		event.dataTransfer.effectAllowed = 'move';

		// Add a dragging class to the element for styling
		const element = event.currentTarget as HTMLElement;
		if (element) {
			element.classList.add('opacity-50');

			// Create a better drag image by cloning the element
			// This will not work in all browsers, but adds a nicer effect where supported
			try {
				const clone = element.cloneNode(true) as HTMLElement;
				clone.style.transform = 'rotate(2deg)';
				clone.style.width = `${element.offsetWidth}px`;
				clone.style.height = 'auto';
				clone.style.opacity = '0.8';
				clone.style.position = 'absolute';
				clone.style.top = '-1000px';
				clone.style.backgroundColor = 'rgba(30, 64, 175, 0.2)';
				clone.style.border = '2px solid rgba(59, 130, 246, 0.5)';
				clone.style.borderRadius = '8px';
				clone.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
				document.body.appendChild(clone);

				// Set the drag image and offset
				event.dataTransfer.setDragImage(clone, 20, 20);

				// Clean up after a short delay
				setTimeout(() => {
					document.body.removeChild(clone);
				}, 100);
			} catch (err) {
				// Fallback to default drag image if custom one fails
				console.warn('Failed to create custom drag image:', err);
			}
		}
	}

	// Handle drag end
	function handleDragEnd(event: DragEvent) {
		isDragging = false;
		draggedCompositeId = null;
		dragOverCompositeId = null;

		// Remove the dragging class
		const element = event.currentTarget as HTMLElement;
		if (element) element.classList.remove('opacity-50');
	}

	// Handle drag over
	function handleDragOver(event: DragEvent, compositeId: string) {
		// Prevent default to allow drop
		event.preventDefault();

		// Skip if we're dragging over the same item
		if (draggedCompositeId === compositeId) return;

		dragOverCompositeId = compositeId;

		// Set the drop effect
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	// Handle drag leave
	function handleDragLeave() {
		dragOverCompositeId = null;
	}

	// Handle drop for merging composites
	async function handleDrop(event: DragEvent, targetCompositeId: string) {
		event.preventDefault();

		// Reset drag states
		isDragging = false;
		dragOverCompositeId = null;

		// Get the dragged composite ID
		const sourceCompositeId = draggedCompositeId;
		draggedCompositeId = null;

		// Skip if either ID is missing or if they're the same
		if (!sourceCompositeId || !targetCompositeId || sourceCompositeId === targetCompositeId) {
			return;
		}

		try {
			// Execute the mutation using the store reference with $ prefix
			const result = (await $threeWayMergeMutation.mutateAsync({
				sourceCompositeId,
				targetCompositeId,
				isDragAndDrop: true // Explicitly mark this as a drag and drop operation
			})) as MergeResult;

			if (result?.success) {
				// Show success toast
				toastSuccess('Merge request created successfully');

				// If a patch request was created, handle it
				if (result.patchRequestId) {
					// Request parent to refetch data
					dispatch('refetch');

					// Show more detailed message if conflicts were detected
					if (result.conflicts_detected && result.conflicts_detected > 0) {
						toastInfo(`Merge created with ${result.conflicts_detected} conflicts to resolve`);
					}
				}
			} else {
				// Show error toast
				toastError(result?.error || 'An unknown error occurred during merge');
			}
		} catch (err: any) {
			const errorMessage = err?.message || 'An unexpected error occurred';
			toastError(errorMessage);
		}
	}
</script>

<aside class="flex flex-col border-r w-80 border-surface-700">
	<div class="p-4 border-b border-surface-700">
		<h3 class="text-lg font-semibold text-surface-100">Composites</h3>
		<p class="mt-1 text-xs text-surface-300">
			<Icon icon="heroicons:information-circle" class="inline w-3 h-3 mr-1" />
			Drag a variation and drop it onto another to merge
		</p>
	</div>
	<div class="flex-1 overflow-y-auto">
		{#if compose_data}
			<div class="p-2 space-y-1">
				<!-- Current Composite -->
				{#if !isMainCompositeArchived}
					<button
						class="w-full p-3 rounded-lg transition-colors text-left group
							{!selectedCompositeId
							? 'bg-surface-700 border-l-4 border-primary-500'
							: 'bg-surface-900 hover:bg-surface-700'}
							{dragOverCompositeId === compose_data.compose_id ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}"
						on:click={() => handleCompositeSelect(null)}
						on:dragover={(e) => handleDragOver(e, compose_data.compose_id)}
						on:dragleave={handleDragLeave}
						on:drop={(e) => handleDrop(e, compose_data.compose_id)}
					>
						<div class="flex items-start gap-3">
							<!-- Author Avatar -->
							<Avatar
								me={{
									data: { seed: compose_data.author.name },
									design: {
										highlight: !selectedCompositeId
									},
									size: '2xs'
								}}
							/>

							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between">
									<div class="font-medium text-surface-100 truncate max-w-[150px]">
										{compose_data.title}
									</div>
									<div class="flex items-center">
										<span
											class="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300 mr-2"
										>
											Latest
										</span>
									</div>
								</div>
								<div class="text-xs font-medium text-surface-300">
									by {compose_data.author.name}
								</div>
							</div>
						</div>
					</button>
				{/if}

				<!-- Active composites -->
				{#each activeComposites as composite}
					<button
						class="group w-full p-3 rounded-lg transition-colors text-left
							{selectedCompositeId === composite.id
							? 'bg-surface-700 border-l-4 border-primary-500'
							: 'bg-surface-900 hover:bg-surface-700'}
							{dragOverCompositeId === composite.id ? 'ring-2 ring-blue-500 bg-blue-500/20' : ''}"
						on:click={() => handleCompositeSelect(composite.id)}
						draggable={true}
						on:dragstart={(e) => handleDragStart(e, composite.id)}
						on:dragend={handleDragEnd}
						on:dragover={(e) => handleDragOver(e, composite.id)}
						on:dragleave={handleDragLeave}
						on:drop={(e) => handleDrop(e, composite.id)}
					>
						<div class="relative flex items-start gap-3">
							<!-- Author Avatar -->
							<Avatar
								me={{
									data: { seed: composite.author?.name || 'Unknown' },
									design: {
										highlight: selectedCompositeId === composite.id
									},
									size: '2xs'
								}}
							/>

							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between">
									<div class="font-medium text-surface-100 truncate max-w-[150px]">
										{composite.title}
									</div>

									<div class="flex flex-col items-end">
										<!-- Single unified tag with blue color -->
										<span
											class="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 mb-1"
										>
											{composite.metadata?.variation_type ||
												composite.relationship_type ||
												'variation'}
										</span>
									</div>
								</div>
								<div class="text-xs font-medium text-surface-300">
									by {composite.author?.name || 'Unknown'}
								</div>
							</div>
						</div>
					</button>
				{/each}

				<!-- Archived section toggle button - Only show if there are archived items -->
				{#if archivedComposites.length > 0 || isMainCompositeArchived}
					<button
						class="flex items-center justify-between w-full px-3 py-2 mt-2 transition-colors rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800"
						on:click={() => (showArchivedComposites = !showArchivedComposites)}
					>
						<div class="flex items-center">
							<Icon icon="heroicons:archive-box" class="w-4 h-4 mr-2" />
							<span class="text-sm"
								>Archived ({archivedComposites.length + (isMainCompositeArchived ? 1 : 0)})</span
							>
						</div>
						<Icon
							icon={showArchivedComposites ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
							class="w-4 h-4"
						/>
					</button>

					<!-- Archived items in a collapsible section -->
					{#if showArchivedComposites}
						<div class="pl-2 mt-1 space-y-1 border-l-2 border-surface-700">
							<!-- Main composite if archived -->
							{#if isMainCompositeArchived}
								<button
									class="w-full p-3 rounded-lg transition-colors text-left group bg-surface-900/60 hover:bg-surface-800/60
										{!selectedCompositeId ? 'border-l-4 border-primary-500/60' : ''}
										{dragOverCompositeId === compose_data.compose_id ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}"
									on:click={() => handleCompositeSelect(null)}
									on:dragover={(e) => handleDragOver(e, compose_data.compose_id)}
									on:dragleave={handleDragLeave}
									on:drop={(e) => handleDrop(e, compose_data.compose_id)}
								>
									<div class="flex items-start gap-3">
										<Avatar
											me={{
												data: { seed: compose_data.author.name },
												design: {
													highlight: !selectedCompositeId
												},
												size: '2xs'
											}}
										/>

										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<div class="font-medium text-surface-300 truncate max-w-[150px]">
													{compose_data.title}
													<span class="text-xs text-surface-400">(archived)</span>
												</div>
												<span
													class="px-2 py-0.5 text-xs rounded-full bg-primary-500/10 text-primary-400"
												>
													Latest
												</span>
											</div>
											<div class="text-xs font-medium text-surface-400">
												by {compose_data.author.name}
											</div>
										</div>
									</div>
								</button>
							{/if}

							<!-- Archived composites -->
							{#each archivedComposites as composite}
								<button
									class="group w-full p-3 rounded-lg transition-colors text-left bg-surface-900/60 hover:bg-surface-800/60
										{selectedCompositeId === composite.id ? 'border-l-4 border-primary-500/60' : ''}
										{dragOverCompositeId === composite.id ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}"
									on:click={() => handleCompositeSelect(composite.id)}
									draggable={true}
									on:dragstart={(e) => handleDragStart(e, composite.id)}
									on:dragend={handleDragEnd}
									on:dragover={(e) => handleDragOver(e, composite.id)}
									on:dragleave={handleDragLeave}
									on:drop={(e) => handleDrop(e, composite.id)}
								>
									<div class="relative flex items-start gap-3">
										<Avatar
											me={{
												data: { seed: composite.author?.name || 'Unknown' },
												design: {
													highlight: selectedCompositeId === composite.id
												},
												size: '2xs'
											}}
										/>

										<div class="flex-1 min-w-0">
											<div class="flex items-center justify-between">
												<div class="font-medium text-surface-300 truncate max-w-[150px]">
													{composite.title} <span class="text-xs text-surface-400">(archived)</span>
												</div>
												<span class="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">
													{composite.metadata?.variation_type ||
														composite.relationship_type ||
														'variation'}
												</span>
											</div>
											<div class="text-xs font-medium text-surface-400">
												by {composite.author?.name || 'Unknown'}
											</div>
										</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</aside>

<!-- Drag overlay that appears when dragging -->
{#if isDragging}
	<div class="fixed inset-0 z-40 pointer-events-none">
		<div class="absolute inset-x-0 top-0 p-2 text-center text-white shadow-lg bg-blue-500/80">
			<p class="flex items-center justify-center gap-2 text-sm font-medium">
				<Icon icon="heroicons:arrow-path" class="w-4 h-4" />
				Drop on a composite to merge changes
			</p>
		</div>
	</div>
{/if}

<style>
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
