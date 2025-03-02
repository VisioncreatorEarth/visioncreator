<!--
@component
PatchRequests.svelte - A component for displaying and managing patch requests for composites.
This component handles:
1. Displaying pending patch requests for the currently selected composite
2. Approving or rejecting patch requests (only for authors of the composite)
3. Showing the changes between versions
4. Managing the patch request lifecycle
5. Displaying granular operations for each patch request with CRDT support
6. Showing merge information for CRDT-based merges

Props:
- compositeId: string - The ID of the composite to show patch requests for
- selectedRequestId?: string - Optional ID of the currently selected patch request
-->

<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Icon from '@iconify/svelte';

	// Props
	export let compositeId: string;
	export let selectedRequestId: string | undefined = undefined;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		select: { request: any };
		refetch: void;
	}>();

	// Get current user data
	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

	// Create queries and mutations
	$: patchRequestsQuery = createQuery({
		operationName: 'queryPatchRequests' as const,
		input: { compositeIds: [compositeId] },
		enabled: !!compositeId,
		refetchInterval: 5000 // Refresh every 5 seconds
	});

	const updatePatchRequestMutation = createMutation({
		operationName: 'updateEditRequest' as const
	});

	// Get current user ID
	$: userId = $userQuery.data?.id;

	// Refetch when composite ID changes
	$: {
		if (compositeId && !$patchRequestsQuery.isLoading && $patchRequestsQuery.isFetched) {
			$patchRequestsQuery.refetch();
		}
	}

	// Handle request selection with logging
	function handleRequestSelect(request: any) {
		dispatch('select', { request });
	}

	// Handle request approval with logging
	async function handleApprove(requestId: string) {
		try {
			const result = await $updatePatchRequestMutation.mutateAsync({
				id: requestId,
				action: 'approve'
			});

			if (result?.success) {
				// Immediately refetch both queries to update UI
				await Promise.all([
					$patchRequestsQuery.refetch(),
					// Emit an event to notify parent to refetch compose data
					dispatch('refetch')
				]);
			}
		} catch (error) {
			console.error('[EditRequests] Approve Error:', error);
		}
	}

	// Handle request rejection with logging
	async function handleReject(requestId: string) {
		try {
			const result = await $updatePatchRequestMutation.mutateAsync({
				id: requestId,
				action: 'reject'
			});

			if (result?.success) {
				await $patchRequestsQuery.refetch();
			}
		} catch (error) {
			console.error('[EditRequests] Reject Error:', error);
		}
	}

	// Listen for approve events from the diff view
	function handleExternalApprove(event: CustomEvent<{ requestId: string }>) {
		const { requestId } = event.detail;
		handleApprove(requestId);
	}

	// Add and remove event listeners
	onMount(() => {
		document.addEventListener('approve', handleExternalApprove as EventListener);
	});

	onDestroy(() => {
		document.removeEventListener('approve', handleExternalApprove as EventListener);
	});

	// Helper function to get status color
	function getStatusColor(status: string): string {
		switch (status.toLowerCase()) {
			case 'approved':
				return 'text-green-400 bg-green-400/10';
			case 'rejected':
				return 'text-red-400 bg-red-400/10';
			default:
				return 'text-yellow-400 bg-yellow-400/10';
		}
	}

	// Helper function to get status icon
	function getStatusIcon(status: string): string {
		switch (status.toLowerCase()) {
			case 'approved':
				return 'heroicons:check-circle';
			case 'rejected':
				return 'heroicons:x-circle';
			default:
				return 'heroicons:clock';
		}
	}

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

	// Helper function to get operation type badge for merge operations
	function getOperationTypeBadge(request: any): { color: string; icon: string; text: string } {
		if (request.operation_type === 'branch') {
			return {
				color: 'text-green-400 bg-green-400/10',
				icon: 'heroicons:git-branch',
				text: 'Branch'
			};
		} else if (
			request.operation_type === 'merge' ||
			request.metadata?.merge_strategy === 'three_way'
		) {
			return {
				color: 'text-blue-400 bg-blue-400/10',
				icon: 'heroicons:arrow-path',
				text: request.metadata?.merge_strategy === 'three_way' ? '3W Merge' : 'Simple Merge'
			};
		} else {
			return {
				color: 'text-tertiary-400 bg-tertiary-400/10',
				icon: 'heroicons:pencil-square',
				text: 'Edit'
			};
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

	// Format value for display
	function formatValue(value: any): string {
		if (value === null || value === undefined) return 'null';
		if (typeof value === 'object') return JSON.stringify(value).substring(0, 30) + '...';
		if (typeof value === 'string') {
			// For long strings, truncate
			return value.length > 30 ? value.substring(0, 30) + '...' : value;
		}
		return String(value);
	}

	// Check if the current user is the author of the composite
	function isAuthor(request: any): boolean {
		// Get the composite author from the request
		const compositeAuthor = request.composite_author;
		return userId === compositeAuthor;
	}

	// Helper function to determine if a request uses CRDT
	function isCRDTEnabled(request: any): boolean {
		return request.metadata?.crdt_enabled === true;
	}
</script>

<div class="flex flex-col h-full">
	{#if !compositeId}
		<div class="flex items-center justify-center flex-1">
			<div class="text-surface-300">Select a composite to view patch requests</div>
		</div>
	{:else if $patchRequestsQuery.isLoading}
		<div class="flex items-center justify-center p-4">
			<Icon icon="heroicons:arrow-path" class="w-5 h-5 text-tertiary-300 animate-spin" />
		</div>
	{:else if $patchRequestsQuery.error}
		<div class="flex items-center justify-center p-4">
			<p class="text-sm text-red-400">Failed to load edit requests</p>
		</div>
	{:else if $patchRequestsQuery.data?.patch_requests?.length}
		<div class="divide-y divide-surface-700/50">
			{#each $patchRequestsQuery.data.patch_requests as request}
				<div
					class="p-4 {request.status === 'pending' && isAuthor(request)
						? 'pb-14'
						: ''} relative transition-colors border-b cursor-pointer border-surface-700 hover:bg-surface-700 {selectedRequestId ===
					request.id
						? 'bg-surface-700 border-l-4 border-primary-500'
						: ''}"
					on:click={() => handleRequestSelect(request)}
				>
					<div class="flex flex-col">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-1 flex items-center gap-2">
									{#if request.operation_type === 'branch' || request.metadata?.branch_name}
										<span
											class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-400"
										>
											<Icon icon="heroicons:git-branch" class="w-3.5 h-3.5" />
											Branch
										</span>
									{:else if request.operation_type === 'merge' || request.metadata?.merge_strategy}
										<span
											class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400"
										>
											<Icon icon="heroicons:code-bracket-square" class="w-3.5 h-3.5" />
											{request.metadata?.merge_strategy === 'three_way' ? '3W Merge' : 'Merge'}
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-tertiary-500/10 text-tertiary-400"
										>
											<Icon icon="heroicons:pencil-square" class="w-3.5 h-3.5" />
											Edit
										</span>
									{/if}

									{#if request.operations && request.operations.length > 0}
										{#each ['add', 'remove', 'replace', 'move', 'copy'] as opType}
											{@const opCount = request.operations.filter(
												(op) => op.operation_type === opType
											).length}
											{#if opCount > 0}
												<span
													class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full {getOperationColor(
														opType
													)}"
												>
													<Icon icon={getOperationIcon(opType)} class="w-3.5 h-3.5" />
													{opCount}
												</span>
											{/if}
										{/each}
									{:else}
										<span
											class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-600/60 text-surface-300"
										>
											<Icon icon="heroicons:document-text" class="w-3.5 h-3.5" />
											0
										</span>
									{/if}
								</div>
							</div>

							<div>
								{#if request.status === 'approved'}
									<span
										class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-400"
									>
										<Icon icon="heroicons:check-circle" class="w-3.5 h-3.5" />
										approved
									</span>
								{:else if request.status === 'rejected'}
									<span
										class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400"
									>
										<Icon icon="heroicons:x-circle" class="w-3.5 h-3.5" />
										rejected
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-surface-600/80 text-surface-300"
									>
										<Icon icon="heroicons:clock" class="w-3.5 h-3.5" />
										pending
									</span>
								{/if}
							</div>
						</div>

						<div class="flex justify-between mt-1">
							<div class="text-xs text-surface-300">
								{request.author.name || 'Unknown'}
							</div>
							<div class="text-xs text-surface-400">{formatDate(request.created_at)}</div>
						</div>
					</div>

					<!-- Approve/reject buttons if pending and user is author -->
					{#if request.status === 'pending' && isAuthor(request)}
						<div
							class="absolute left-0 right-0 bottom-0 flex w-full"
							style="margin-left: -1px; margin-right: -1px; width: calc(100% + 2px);"
						>
							<button
								class="flex-1 flex items-center justify-center h-10 text-xs font-medium bg-green-500/5 text-green-400 hover:bg-green-500/15 border-r border-surface-700"
								on:click|stopPropagation={() => handleApprove(request.id)}
							>
								<Icon icon="heroicons:check-circle" class="w-4 h-4 mr-1" />
								Approve
							</button>
							<button
								class="flex-1 flex items-center justify-center h-10 text-xs font-medium bg-red-500/5 text-red-400 hover:bg-red-500/15"
								on:click|stopPropagation={() => handleReject(request.id)}
							>
								<Icon icon="heroicons:x-circle" class="w-4 h-4 mr-1" />
								Reject
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center p-8 text-center">
			<Icon icon="heroicons:document-text" class="w-8 h-8 text-tertiary-300" />
			<p class="mt-2 text-sm text-tertiary-300">No edit requests yet</p>
		</div>
	{/if}
</div>

<style>
	/* Add smooth transitions */
	:global(.transition-all) {
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
