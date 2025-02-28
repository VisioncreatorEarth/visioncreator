<!--
@component
MergeDialog.svelte - A modal dialog for merging two composites using three-way merge.
This component handles:
1. Selecting source composite to merge from
2. Initiating a three-way merge process
3. Displaying the results including detected/resolved conflicts

Props:
- targetCompositeId: string - The ID of the composite to merge into (target)
- open: boolean - Whether the dialog is open
- onClose: () => void - Callback when the dialog is closed
-->

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';

	// Props
	export let targetCompositeId: string;
	export let open: boolean = false;

	// Event dispatch
	const dispatch = createEventDispatcher<{
		close: void;
		mergeComplete: { patchRequestId: string };
	}>();

	// Local state
	let selectedSourceId: string = '';
	let loading: boolean = false;
	let error: string | null = null;
	let mergeResult: any = null;
	let filteredCandidates: any[] = [];

	// Get merge candidates
	const mergeCandidatesQuery = createQuery({
		operationName: 'findMergeCandidates',
		input: { compositeId: targetCompositeId },
		enabled: !!targetCompositeId && open
	});

	// Filter candidates to ensure we don't include the current composite
	$: {
		if ($mergeCandidatesQuery.data?.candidates) {
			// Log for debugging
			console.log('[MergeDialog] Target ID:', targetCompositeId);
			console.log('[MergeDialog] All candidates:', $mergeCandidatesQuery.data.candidates);

			// Filter out the current composite - convert to string to ensure proper comparison
			filteredCandidates = $mergeCandidatesQuery.data.candidates.filter(
				(c) => String(c.composite_id) !== String(targetCompositeId)
			);

			console.log('[MergeDialog] Filtered candidates:', filteredCandidates);
		} else {
			filteredCandidates = [];
		}
	}

	// Three-way merge mutation
	const threeWayMergeMutation = createMutation({
		operationName: 'threeWayMerge'
	});

	// Reset state when the dialog opens
	$: if (open) {
		selectedSourceId = '';
		loading = false;
		error = null;
		mergeResult = null;
		if (targetCompositeId) {
			$mergeCandidatesQuery.refetch();
		}
	}

	// Handle select change - simplify to just get the value directly
	function handleSelectSource(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		console.log('[MergeDialog] Selected source ID:', value);
		selectedSourceId = value;
	}

	// Handle close
	function handleClose() {
		dispatch('close');
	}

	// Handle merge
	async function handleMerge() {
		if (!selectedSourceId || !targetCompositeId) {
			error = 'Please select a source composite to merge from';
			return;
		}

		// Double-check we're not trying to merge with self
		if (selectedSourceId === targetCompositeId) {
			error = 'Cannot merge a composite with itself';
			return;
		}

		try {
			loading = true;
			error = null;

			console.log(
				'[MergeDialog] Merging source:',
				selectedSourceId,
				'into target:',
				targetCompositeId
			);

			const result = await $threeWayMergeMutation.mutateAsync({
				sourceCompositeId: selectedSourceId,
				targetCompositeId: targetCompositeId
			});

			if (result?.success) {
				mergeResult = result;
				// If a patch request was created, emit the event
				if (result.patchRequestId) {
					dispatch('mergeComplete', { patchRequestId: result.patchRequestId });
				}
			} else {
				error = result?.error || 'An unknown error occurred during merge';
			}
		} catch (err: any) {
			error = err?.message || 'An unexpected error occurred';
			console.error('[MergeDialog] Error:', err);
		} finally {
			loading = false;
		}
	}

	// Format candidate data for display
	function formatCandidateName(candidate: any): string {
		const relationshipInfo = candidate.relationship_type ? ` (${candidate.relationship_type})` : '';
		return `${candidate.title}${relationshipInfo} - by ${candidate.author_name}`;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		on:click|self={handleClose}
		role="dialog"
		aria-modal="true"
	>
		<!-- Dialog content -->
		<div
			class="w-full max-w-md p-6 mx-4 rounded-lg shadow-lg bg-surface-800"
			on:click|stopPropagation
		>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-medium text-tertiary-100">Merge Changes</h3>
				<button
					class="p-1 rounded-full text-tertiary-400 hover:text-tertiary-100 hover:bg-surface-700"
					on:click={handleClose}
				>
					<Icon icon="heroicons:x-mark" class="w-5 h-5" />
				</button>
			</div>

			{#if mergeResult}
				<!-- Success result -->
				<div class="p-4 mb-4 rounded-lg bg-green-400/10">
					<h4 class="flex items-center text-sm font-medium text-green-400">
						<Icon icon="heroicons:check-circle" class="w-5 h-5 mr-2" />
						Merge completed successfully
					</h4>
					<p class="mt-2 text-sm text-tertiary-300">
						A patch request has been created with the merged changes.
					</p>
					{#if mergeResult.conflicts_detected > 0}
						<div class="mt-2 p-2 rounded bg-yellow-400/10 text-yellow-400 text-xs">
							<p>
								{mergeResult.conflicts_detected} conflicts were detected and automatically resolved.
							</p>
						</div>
					{:else}
						<div class="mt-2 p-2 rounded bg-green-400/10 text-green-400 text-xs">
							<p>No conflicts were detected during the merge.</p>
						</div>
					{/if}
					{#if mergeResult.ancestorId}
						<div class="mt-2 text-xs text-tertiary-400">
							Used common ancestor: {mergeResult.ancestorId.slice(0, 8)}...
						</div>
					{:else}
						<div class="mt-2 text-xs text-tertiary-400">
							No common ancestor found. Used simple merge strategy.
						</div>
					{/if}
				</div>

				<div class="flex justify-end mt-4">
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-tertiary-100 hover:bg-primary-600"
						on:click={handleClose}
					>
						Close
					</button>
				</div>
			{:else}
				<!-- Select source form -->
				<p class="mb-4 text-sm text-tertiary-300">
					Select a source composite to merge changes from into the current composite.
				</p>

				{#if error}
					<div class="p-3 mb-4 text-sm rounded-lg bg-red-400/10 text-red-400">
						{error}
					</div>
				{/if}

				<div class="mb-4">
					<label for="source-composite" class="block mb-2 text-sm font-medium text-tertiary-200">
						Source Composite
					</label>
					{#if $mergeCandidatesQuery.isLoading}
						<div class="flex items-center justify-center p-4">
							<Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin text-tertiary-300" />
						</div>
					{:else if $mergeCandidatesQuery.error}
						<div class="p-3 text-sm rounded-lg bg-red-400/10 text-red-400">
							Failed to load merge candidates
						</div>
					{:else if filteredCandidates.length > 0}
						<select
							id="source-composite"
							class="w-full p-2 text-sm rounded-lg bg-surface-700 text-tertiary-200 border border-surface-600 focus:ring-1 focus:ring-primary-500"
							value={selectedSourceId}
							on:change={handleSelectSource}
						>
							<option value="">Select a source composite...</option>
							{#each filteredCandidates as candidate}
								<option value={candidate.composite_id}>
									{formatCandidateName(candidate)}
								</option>
							{/each}
						</select>

						<!-- Debug info - shows what's selected -->
						<div class="mt-2 text-xs text-tertiary-400">
							Selected: {selectedSourceId || 'None'}
						</div>
					{:else if $mergeCandidatesQuery.data?.candidates?.length > 0}
						<div class="p-3 text-sm rounded-lg bg-yellow-400/10 text-yellow-400">
							All found candidates were filtered out (including the current composite)
						</div>
					{:else}
						<div class="p-3 text-sm rounded-lg bg-yellow-400/10 text-yellow-400">
							No merge candidates found
						</div>
					{/if}
				</div>

				<div class="flex justify-end gap-2 mt-4">
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg bg-surface-700 text-tertiary-200 hover:bg-surface-600"
						on:click={handleClose}
					>
						Cancel
					</button>
					<button
						class="px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-tertiary-100 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
						on:click={handleMerge}
						disabled={!selectedSourceId || loading}
					>
						{#if loading}
							<Icon icon="heroicons:arrow-path" class="inline w-4 h-4 mr-1 animate-spin" />
							Merging...
						{:else}
							Merge
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
