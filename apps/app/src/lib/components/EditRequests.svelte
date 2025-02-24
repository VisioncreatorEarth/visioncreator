<!--
@component
EditRequests.svelte - A component for displaying and managing patch requests for composites.
This component handles:
1. Displaying pending patch requests for the currently selected composite
2. Approving or rejecting patch requests
3. Showing the changes between versions
4. Managing the patch request lifecycle
5. Displaying granular operations for each patch request

Props:
- compositeId: string - The ID of the composite to show patch requests for
- selectedRequestId?: string - Optional ID of the currently selected patch request
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
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

	// State for expanded operations
	let expandedRequestId: string | null = null;

	// Debug logging for props and query changes
	$: {
		console.log('[EditRequests] Props and State:', {
			compositeId,
			selectedRequestId,
			queryEnabled: !!compositeId
		});
	}

	// Debug logging for query results
	$: {
		if ($patchRequestsQuery.data) {
			console.log('[EditRequests] Patch Requests Query Result:', {
				compositeId,
				requestCount: $patchRequestsQuery.data.patch_requests.length,
				requests: $patchRequestsQuery.data.patch_requests.map((r) => ({
					id: r.id,
					title: r.title,
					status: r.status,
					composite_id: r.composite_id,
					operationsCount: r.operations?.length || 0,
					previousVersion: {
						id: r.previousVersion?.instance?.id,
						version: r.previousVersion?.version
					},
					changes: {
						id: r.changes?.instance?.id,
						version: r.changes?.version
					}
				}))
			});
		} else if ($patchRequestsQuery.error) {
			console.error('[EditRequests] Query Error:', $patchRequestsQuery.error);
		}
	}

	// Refetch when composite ID changes
	$: {
		if (compositeId && !$patchRequestsQuery.isLoading && $patchRequestsQuery.isFetched) {
			console.log('[EditRequests] Composite ID changed, refetching:', compositeId);
			$patchRequestsQuery.refetch();
		}
	}

	// Handle request selection with logging
	function handleRequestSelect(request: any) {
		console.log('[EditRequests] Request Selected:', {
			requestId: request.id,
			compositeId: request.composite_id,
			status: request.status
		});
		dispatch('select', { request });
	}

	// Toggle operations visibility
	function toggleOperations(requestId: string, event: MouseEvent) {
		event.stopPropagation();
		expandedRequestId = expandedRequestId === requestId ? null : requestId;
	}

	// Handle request approval with logging
	async function handleApprove(requestId: string) {
		console.log('[EditRequests] Approving Request:', { requestId });
		try {
			const result = await $updatePatchRequestMutation.mutateAsync({
				id: requestId,
				action: 'approve'
			});

			console.log('[EditRequests] Approve Result:', { result });
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
		console.log('[EditRequests] Rejecting Request:', { requestId });
		try {
			const result = await $updatePatchRequestMutation.mutateAsync({
				id: requestId,
				action: 'reject'
			});

			console.log('[EditRequests] Reject Result:', { result });
			if (result?.success) {
				await $patchRequestsQuery.refetch();
			}
		} catch (error) {
			console.error('[EditRequests] Reject Error:', error);
		}
	}

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
					class="p-4 transition-colors cursor-pointer hover:bg-surface-800 {selectedRequestId ===
					request.id
						? 'bg-surface-800'
						: ''}"
					on:click={() => handleRequestSelect(request)}
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<h4 class="text-sm font-medium truncate text-tertiary-100">{request.title}</h4>
							<p class="mt-1 text-xs text-tertiary-300">
								{request.author.name} • {formatDate(request.created_at)}
							</p>
							<div class="mt-2 space-y-1">
								<p class="text-xs text-tertiary-400">
									From: v{request.previousVersion.version || '?'}
									{#if request.previousVersion.instance?.id}
										<span class="px-1.5 py-0.5 text-xs rounded-full bg-surface-600/50">
											{request.previousVersion.instance.id.slice(0, 8)}
										</span>
									{/if}
								</p>
								<p class="text-xs text-tertiary-400">
									To: v{request.changes.version || '?'}
									{#if request.changes.instance?.id}
										<span class="px-1.5 py-0.5 text-xs rounded-full bg-surface-600/50">
											{request.changes.instance.id.slice(0, 8)}
										</span>
									{/if}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full {getStatusColor(
									request.status
								)}"
							>
								<Icon icon={getStatusIcon(request.status)} class="w-3.5 h-3.5" />
								{request.status}
							</span>
						</div>
					</div>

					<!-- Operations count and toggle button -->
					{#if request.operations && request.operations.length > 0}
						<div class="mt-2">
							<button
								class="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors rounded-lg bg-surface-700/50 hover:bg-surface-700 text-tertiary-300"
								on:click={(e) => toggleOperations(request.id, e)}
							>
								<Icon
									icon={expandedRequestId === request.id
										? 'heroicons:chevron-down'
										: 'heroicons:chevron-right'}
									class="w-3.5 h-3.5"
								/>
								{request.operations.length} operations
							</button>

							<!-- Operations list (expanded) -->
							{#if expandedRequestId === request.id}
								<div class="mt-2 overflow-hidden rounded-lg bg-surface-900/50">
									{#each request.operations as operation}
										<div class="p-2 text-xs border-b border-surface-800 last:border-0">
											<div class="flex items-center justify-between">
												<div class="flex items-center gap-1">
													<span
														class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full {getOperationColor(
															operation.operation_type
														)}"
													>
														<Icon
															icon={getOperationIcon(operation.operation_type)}
															class="w-3 h-3"
														/>
														{operation.operation_type}
													</span>
													<span class="text-tertiary-300">
														{operation.path.join('.')}
													</span>
												</div>
												<span class="text-tertiary-400 text-[10px]">
													{formatDate(operation.created_at)}
												</span>
											</div>
											{#if operation.operation_type !== 'remove'}
												<div class="mt-1 pl-5">
													{#if operation.old_value !== null && operation.old_value !== undefined}
														<div class="text-red-400">- {formatValue(operation.old_value)}</div>
													{/if}
													{#if operation.new_value !== null && operation.new_value !== undefined}
														<div class="text-green-400">+ {formatValue(operation.new_value)}</div>
													{/if}
												</div>
											{:else}
												<div class="mt-1 pl-5">
													<div class="text-red-400">- {formatValue(operation.old_value)}</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if request.status === 'pending'}
						<div class="flex items-center gap-2 mt-3">
							<button
								class="flex items-center justify-center flex-1 gap-1 px-2 py-1.5 text-xs font-medium transition-colors rounded-lg bg-green-400/10 hover:bg-green-400/20 text-green-400"
								on:click|stopPropagation={() => handleApprove(request.id)}
							>
								<Icon icon="heroicons:check" class="w-3.5 h-3.5" />
								Approve
							</button>
							<button
								class="flex items-center justify-center flex-1 gap-1 px-2 py-1.5 text-xs font-medium transition-colors rounded-lg bg-red-400/10 hover:bg-red-400/20 text-red-400"
								on:click|stopPropagation={() => handleReject(request.id)}
							>
								<Icon icon="heroicons:x-mark" class="w-3.5 h-3.5" />
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
