<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component displays a list of edit requests in a compact sidebar format:
   - Shows request title, author, and timestamp
   - Displays status badges with appropriate colors
   - Handles selection of requests for main view comparison
   - Provides approve/reject actions for pending requests
   - Auto-refreshes every 5 seconds

2. Features:
   - Compact card layout optimized for sidebar
   - Real-time updates with refresh interval
   - Status indicators with icons and colors
   - Selection handling for main view integration
   - Action buttons for request management
-->

<script lang="ts">
	import { createQuery } from '$lib/wundergraph';
	import { getTimeAgo } from '$lib/utils/dateUtils';
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';

	// Props
	export let proposalId: string;
	export let selectedRequestId: string | undefined = undefined;

	// Event dispatcher for selection
	const dispatch = createEventDispatcher<{
		select: { request: any };
	}>();

	// Query edit requests
	const editRequestsQuery = createQuery({
		operationName: 'queryEditRequests',
		input: { proposalId },
		enabled: true,
		refetchInterval: 5000 // Refresh every 5 seconds
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

	// Handle request selection
	function handleSelect(request: any) {
		dispatch('select', { request });
	}

	// Handle request approval
	async function handleApprove(requestId: string) {
		// TODO: Implement approval mutation
		console.log('Approving request:', requestId);
	}

	// Handle request rejection
	async function handleReject(requestId: string) {
		// TODO: Implement rejection mutation
		console.log('Rejecting request:', requestId);
	}
</script>

{#if $editRequestsQuery.isLoading}
	<div class="flex items-center justify-center p-4">
		<Icon icon="heroicons:arrow-path" class="w-5 h-5 text-tertiary-300 animate-spin" />
	</div>
{:else if $editRequestsQuery.error}
	<div class="flex items-center justify-center p-4">
		<p class="text-sm text-red-400">Failed to load edit requests</p>
	</div>
{:else if $editRequestsQuery.data?.editRequests?.length}
	<div class="divide-y divide-surface-700/50">
		{#each $editRequestsQuery.data.editRequests as request}
			<div
				class="p-4 transition-colors cursor-pointer hover:bg-surface-800 {selectedRequestId ===
				request.id
					? 'bg-surface-800'
					: ''}"
				on:click={() => handleSelect(request)}
			>
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1 min-w-0">
						<h4 class="text-sm font-medium truncate text-tertiary-100">{request.title}</h4>
						<p class="mt-1 text-xs text-tertiary-300">
							{request.author.name} • {getTimeAgo(request.createdAt)}
						</p>
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
