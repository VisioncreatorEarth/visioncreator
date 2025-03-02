<!--
@component
CompositesAndMerge.svelte - A component for displaying and managing composites with drag and drop merging.
This component handles:
1. Display of the main composite and related composites (variations, forks, etc.)
2. Archiving functionality
3. Drag and drop merging between composites
-->
<script lang="ts">
	import { createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';
	import Avatar from './Avatar.svelte';
	import { createEventDispatcher } from 'svelte';

	// Component props
	export let compose_data: any; // The main composite data
	export let formattedComposites: any[] = []; // All related composites formatted for display
	export let selectedCompositeId: string | null = null; // Currently selected composite ID
	export let rootCompositeId: string | null = null; // ID of the root composite

	// State variables
	let showArchivedComposites = true; // Toggle for showing archived composites
	let isArchiving = false; // Flag for archiving operation in progress

	// Drag and drop state for composite merging
	let draggedCompositeId: string | null = null;
	let dragOverCompositeId: string | null = null;
	let isDragging = false;

	// Create the archive toggle mutation
	const toggleArchiveMutation = createMutation({
		operationName: 'toggleCompositeArchive'
	});

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

	// Define the archive toggle result type
	interface ArchiveToggleResult {
		success: boolean;
		message?: string;
		error?: string;
		details?: string;
		changed?: boolean;
	}

	// Split composites into active and archived lists
	$: activeComposites = formattedComposites.filter((c) => !c.is_archived);
	$: archivedComposites = formattedComposites.filter((c) => c.is_archived);

	// Check if main composite is archived
	$: isMainCompositeArchived = compose_data?.is_archived === true;

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

	// Function to toggle archive status of a composite
	async function toggleArchiveStatus(event: Event, compositeId: string, currentStatus: boolean) {
		event.stopPropagation(); // Prevent selecting the composite when clicking the archive button

		isArchiving = true;

		try {
			// Use the dedicated archive toggle mutation
			const result = (await $toggleArchiveMutation.mutateAsync({
				compositeId: compositeId,
				archive: !currentStatus
			})) as ArchiveToggleResult;

			if (result && result.success) {
				dispatch('refetch');
				toastSuccess(currentStatus ? 'Composite unarchived' : 'Composite archived');
			} else {
				toastError('Failed to update archive status');
			}
		} catch (error) {
			console.error('Error archiving/unarchiving composite:', error);
			toastError('Error updating archive status');
		} finally {
			isArchiving = false;
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
										<button
											class="p-1 transition-opacity rounded-full opacity-0 group-hover:opacity-100 hover:bg-surface-700"
											on:click={(e) => toggleArchiveStatus(e, compose_data.compose_id, false)}
											disabled={isArchiving}
											title="Archive"
										>
											<Icon
												icon="heroicons:archive-box"
												class="w-4 h-4 text-surface-400 hover:text-surface-200"
											/>
										</button>
									</div>
								</div>
								<div class="text-xs font-medium text-surface-300">
									by {compose_data.author.name}
								</div>
							</div>
						</div>
					</button>
				{/if}

				<!-- Flat list of all non-archived variations -->
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

										<!-- Archive button -->
										<button
											class="p-1 transition-opacity rounded-full opacity-0 group-hover:opacity-100 hover:bg-surface-700"
											on:click={(e) => toggleArchiveStatus(e, composite.id, false)}
											disabled={isArchiving}
											title="Archive"
										>
											<Icon
												icon="heroicons:archive-box"
												class="w-4 h-4 text-surface-400 hover:text-surface-200"
											/>
										</button>
									</div>
								</div>
								<div class="text-xs font-medium text-surface-300">
									by {composite.author?.name || 'Unknown'}
								</div>
							</div>
						</div>
					</button>
				{/each}

				<!-- Archived section toggle button -->
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
				{/if}

				<!-- Archived composites section -->
				{#if showArchivedComposites}
					<div class="pl-2 mt-1 space-y-1 border-l-2 border-surface-700">
						<!-- Main composite if archived -->
						{#if isMainCompositeArchived}
							<button
								class="w-full p-3 rounded-lg transition-colors text-left group
									{!selectedCompositeId
									? 'bg-surface-700/60 border-l-4 border-primary-500/60'
									: 'bg-surface-900/60 hover:bg-surface-700/60'}
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
											<div class="flex flex-col items-end">
												<span
													class="px-2 py-0.5 text-xs rounded-full bg-primary-500/10 text-primary-400 mb-1"
												>
													Latest
												</span>

												<!-- Unarchive button -->
												<button
													class="p-1 transition-opacity rounded-full opacity-0 group-hover:opacity-100 hover:bg-surface-700"
													on:click={(e) => toggleArchiveStatus(e, compose_data.compose_id, true)}
													disabled={isArchiving}
													title="Unarchive"
												>
													<Icon
														icon="heroicons:archive-box-arrow-down"
														class="w-4 h-4 text-surface-400 hover:text-surface-200"
													/>
												</button>
											</div>
										</div>
										<div class="text-xs font-medium text-surface-400">
											by {compose_data.author.name}
										</div>
									</div>
								</div>
							</button>
						{/if}

						<!-- Archived variations -->
						{#each archivedComposites as composite}
							<button
								class="group w-full p-3 rounded-lg transition-colors text-left bg-opacity-60
									{selectedCompositeId === composite.id
									? 'bg-surface-700/60 border-l-4 border-primary-500/60'
									: 'bg-surface-900/60 hover:bg-surface-700/60'}
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

											<div class="flex flex-col items-end">
												<span
													class="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 mb-1"
												>
													{composite.metadata?.variation_type ||
														composite.relationship_type ||
														'variation'}
												</span>

												<!-- Unarchive button -->
												<button
													class="p-1 transition-opacity rounded-full opacity-0 group-hover:opacity-100 hover:bg-surface-700"
													on:click={(e) => toggleArchiveStatus(e, composite.id, true)}
													disabled={isArchiving}
													title="Unarchive"
												>
													<Icon
														icon="heroicons:archive-box-arrow-down"
														class="w-4 h-4 text-surface-400 hover:text-surface-200"
													/>
												</button>
											</div>
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
