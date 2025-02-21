<!--
@component
EditRequests.svelte - A component for displaying and managing patch requests for composites.
This component handles:
1. Displaying pending patch requests for the currently selected composite
2. Approving or rejecting patch requests
3. Showing the changes between versions
4. Managing the patch request lifecycle

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
	}>();

	// Create queries and mutations
	$: patchRequestsQuery = createQuery({
		operationName: 'queryPatchRequests' as const,
		input: { compositeIds: [compositeId] },
		enabled: !!compositeId
	});

	const updatePatchRequestMutation = createMutation({
		operationName: 'updateEditRequest' as const
	});

	// Debug logging
	$: {
		if ($patchRequestsQuery.data) {
			console.log('Patch requests loaded for composite:', {
				compositeId,
				requests: $patchRequestsQuery.data.patch_requests.map((r) => ({
					id: r.id,
					title: r.title,
					status: r.status,
					composite_id: r.composite_id
				}))
			});
		}
	}

	// Handle request selection
	function handleRequestSelect(request: any) {
		dispatch('select', { request });
	}

	// Handle request approval
	async function handleApprove(requestId: string) {
		try {
			const result = await $updatePatchRequestMutation.mutateAsync({
				id: requestId,
				action: 'approve'
			});

			if (result?.success) {
				await $patchRequestsQuery.refetch();
			}
		} catch (error) {
			console.error('Failed to approve request:', error);
		}
	}

	// Handle request rejection
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
			console.error('Failed to reject request:', error);
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

	// Get status styles
	function getStatusStyles(status: string): string {
		switch (status.toLowerCase()) {
			case 'approved':
				return 'bg-green-900/20 text-green-400';
			case 'rejected':
				return 'bg-red-900/20 text-red-400';
			default:
				return 'bg-yellow-900/20 text-yellow-400';
		}
	}
</script>

<div class="flex flex-col h-full">
	{#if !compositeId}
		<div class="flex items-center justify-center flex-1">
			<div class="text-surface-300">Select a composite to view patch requests</div>
		</div>
	{:else if $patchRequestsQuery.isLoading}
		<div class="flex items-center justify-center flex-1">
			<div class="text-surface-300">Loading...</div>
		</div>
	{:else if $patchRequestsQuery.error}
		<div class="flex items-center justify-center flex-1">
			<div class="text-red-400">Error loading patch requests</div>
		</div>
	{:else if $patchRequestsQuery.data?.patch_requests?.length}
		<div class="flex flex-col gap-4 p-4">
			{#each $patchRequestsQuery.data.patch_requests as request}
				<div
					class="relative flex flex-col gap-3 p-4 transition-all duration-200 rounded-xl bg-surface-900/50 hover:bg-surface-800/50 {selectedRequestId ===
					request.id
						? 'ring-2 ring-primary-500/50'
						: ''}"
					role="button"
					on:click={() => handleRequestSelect(request)}
				>
					<!-- Label -->
					<div class="absolute left-4 -top-3">
						<span class="px-2 py-1 text-xs font-medium rounded-md bg-surface-800 text-surface-300">
							Edit
						</span>
					</div>

					<!-- Header -->
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<h4 class="text-lg font-medium text-surface-50">{request.title}</h4>
							<p class="text-sm text-surface-400">
								by {request.author.name} • {formatDate(request.created_at)}
							</p>
						</div>
						<div>
							{#if request.status === 'pending'}
								<div class="flex gap-2">
									<button
										class="p-2 text-green-400 transition-colors rounded-lg bg-green-900/20 hover:bg-green-900/40"
										on:click|stopPropagation={() => handleApprove(request.id)}
									>
										<Icon icon="mdi:check" class="w-4 h-4" />
									</button>
									<button
										class="p-2 text-red-400 transition-colors rounded-lg bg-red-900/20 hover:bg-red-900/40"
										on:click|stopPropagation={() => handleReject(request.id)}
									>
										<Icon icon="mdi:close" class="w-4 h-4" />
									</button>
								</div>
							{:else}
								<span
									class="px-3 py-1 text-sm font-medium rounded-full {getStatusStyles(
										request.status
									)}"
								>
									{request.status}
								</span>
							{/if}
						</div>
					</div>

					<!-- Description -->
					{#if request.description}
						<p class="text-sm text-surface-300">{request.description}</p>
					{/if}

					<!-- Version Info -->
					<div class="flex flex-col gap-2 p-3 rounded-lg bg-surface-800/50">
						<div class="flex items-center gap-2 text-sm text-surface-300">
							<span class="text-surface-400">From:</span>
							<span class="px-2 py-0.5 rounded-md bg-surface-700">
								v{request.previousVersion.version || '?'}
							</span>
							{#if request.previousVersion.instance?.id}
								<span class="px-2 py-0.5 font-mono text-xs rounded-md bg-surface-700/50">
									{request.previousVersion.instance.id.substring(0, 8)}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-2 text-sm text-surface-300">
							<span class="text-surface-400">To:</span>
							<span class="px-2 py-0.5 rounded-md bg-surface-700">
								v{request.changes.version || '?'}
							</span>
							{#if request.changes.instance?.id}
								<span class="px-2 py-0.5 font-mono text-xs rounded-md bg-surface-700/50">
									{request.changes.instance.id.substring(0, 8)}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center flex-1 gap-3 p-8">
			<Icon icon="mdi:file-document-edit-outline" class="w-12 h-12 text-surface-600" />
			<p class="text-surface-400">No patch requests for this composite</p>
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
