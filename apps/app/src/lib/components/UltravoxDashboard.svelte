<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';

	// Create the query with proper store syntax
	const timeUsageQuery = createQuery({
		operationName: 'queryCallsAndTimeStats',
		enabled: true,
		liveQuery: true
	});

	const clearUltravoxCallsMutation = createMutation({
		operationName: 'clearUltravoxCalls'
	});

	// Filter state
	let statusFilter: 'all' | 'active' | 'ended' = 'all';
	let sortDirection: 'asc' | 'desc' = 'desc';

	// Computed calls with filtering and sorting
	$: filteredCalls =
		$timeUsageQuery.data?.calls
			?.filter((call) => {
				if (statusFilter === 'all') return true;
				if (statusFilter === 'active') return !call.ended;
				if (statusFilter === 'ended') return !!call.ended;
				return true;
			})
			.sort((a, b) => {
				const dateA = new Date(a.created).getTime();
				const dateB = new Date(b.created).getTime();
				return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
			}) ?? [];

	// Delete call function
	let selectedCalls: string[] = [];

	async function deleteCall(callId: string) {
		if (!callId) {
			console.error('No call ID provided');
			return;
		}
		console.log('Attempting to delete call with ID:', callId, 'Type:', typeof callId);
		try {
			const response = await $clearUltravoxCallsMutation.mutateAsync({
				input: {
					ultravoxCallIds: [callId]
				}
			});

			if (response.error) {
				throw new Error(response.error.message);
			}

			if (response.data?.errors?.length > 0) {
				throw new Error(response.data.errors[0].error);
			}

			// Refresh the calls list
			await $timeUsageQuery.refetch();
		} catch (error) {
			console.error('Failed to delete call:', error);
		}
	}

	async function deleteSelectedCalls() {
		if (selectedCalls.length === 0) {
			console.error('No calls selected');
			return;
		}

		console.log(
			'Attempting to delete selected calls:',
			selectedCalls,
			'Types:',
			selectedCalls.map((id) => typeof id)
		);
		try {
			const response = await $clearUltravoxCallsMutation.mutateAsync({
				input: {
					ultravoxCallIds: selectedCalls
				}
			});

			if (response.error) {
				throw new Error(response.error.message);
			}

			if (response.data?.errors?.length > 0) {
				throw new Error(response.data.errors[0].error);
			}

			// Clear selection and refresh
			selectedCalls = [];
			await $timeUsageQuery.refetch();
		} catch (error) {
			console.error('Failed to delete selected calls:', error);
		}
	}

	function formatDuration(duration: string): string {
		const seconds = parseFloat(duration.replace('s', ''));
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		if (minutes > 0) {
			return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
		}
		return `${remainingSeconds.toString().padStart(2, '0')}s`;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	function calculateDuration(start: string, end?: string): string {
		if (!end) return 'Active';
		const startTime = new Date(start).getTime();
		const endTime = new Date(end).getTime();
		const durationMs = endTime - startTime;
		const seconds = Math.floor(durationMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return minutes > 0
			? `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`
			: `${remainingSeconds.toString().padStart(2, '0')}s`;
	}
</script>

<div class="p-4 space-y-8 h-screen">
	{#if $timeUsageQuery.isLoading}
		<div class="flex justify-center items-center p-8">
			<div class="w-8 h-8 rounded-full border-b-2 animate-spin border-primary-500" />
		</div>
	{:else if $timeUsageQuery.error}
		<div class="p-4 card variant-filled-error" role="alert">
			<strong class="font-bold">Error:</strong>
			<span class="block sm:inline">{$timeUsageQuery.error.message}</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 h-ful">
			<div class="p-6 card variant-filled-surface">
				<header class="card-header">
					<h3 class="h3">Time Used</h3>
				</header>
				<section class="p-4">
					<div class="stat">
						<span class="stat-desc">Used</span>
						<span class="stat-value text-primary-500">
							{formatDuration($timeUsageQuery.data?.timeUsed)}
						</span>
					</div>
				</section>
			</div>
			<div class="p-6 card variant-filled-surface">
				<header class="card-header">
					<h3 class="h3">Time Remaining</h3>
				</header>
				<section class="p-4">
					<div class="stat">
						<span class="stat-desc">Available</span>
						<span class="stat-value text-secondary-500">
							{formatDuration($timeUsageQuery.data?.timeRemaining)}
						</span>
					</div>
				</section>
			</div>
		</div>

		<div class="h-full card variant-filled-surface">
			<header class="flex justify-between items-center p-4 border-b card-header border-surface-600">
				<h2 class="h2">Call History</h2>
				<div class="flex gap-4">
					<select bind:value={statusFilter} class="select variant-soft">
						<option value="all">All Calls</option>
						<option value="active">Active Calls</option>
						<option value="ended">Ended Calls</option>
					</select>
					<select bind:value={sortDirection} class="select variant-soft">
						<option value="desc">Newest First</option>
						<option value="asc">Oldest First</option>
					</select>
					{#if selectedCalls.length > 0}
						<button class="btn variant-filled-error" on:click={deleteSelectedCalls}>
							Delete Selected ({selectedCalls.length})
						</button>
					{/if}
				</div>
			</header>

			{#if !filteredCalls.length}
				<div class="p-6 text-center">
					<p class="text-surface-300">No calls found matching the selected filters</p>
				</div>
			{:else}
				<div class="overflow-y-auto h-full table-container">
					<table class="table table-hover">
						<thead>
							<tr>
								<th>
									<label>
										<input
											type="checkbox"
											class="checkbox"
											checked={selectedCalls.length === filteredCalls.length}
											on:change={(e) => {
												if (e.target.checked) {
													selectedCalls = filteredCalls.map((call) => call.callId);
												} else {
													selectedCalls = [];
												}
											}}
										/>
									</label>
								</th>
								<th>Call ID</th>
								<th>Created</th>
								<th>Duration</th>
								<th>Status</th>
								<th>First Speaker</th>
								<th>Voice</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredCalls as call}
								<tr class="hover:variant-soft-surface">
									<td>
										<label>
											<input
												type="checkbox"
												class="checkbox"
												checked={selectedCalls.includes(call.callId)}
												on:change={(e) => {
													console.log(
														'Checkbox changed for call:',
														call.callId,
														'Type:',
														typeof call.callId
													);
													if (e.target.checked) {
														selectedCalls = [...selectedCalls, call.callId];
													} else {
														selectedCalls = selectedCalls.filter((id) => id !== call.callId);
													}
													console.log('Selected calls after change:', selectedCalls);
												}}
											/>
										</label>
									</td>
									<td>{call.callId}</td>
									<td>{formatDate(call.created)}</td>
									<td>{calculateDuration(call.created, call.ended)}</td>
									<td>
										{#if call.ended}
											<span class="chip variant-filled-error">
												Ended ({call.endReason || 'Unknown'})
											</span>
										{:else}
											<span class="chip variant-filled-success"> Active </span>
										{/if}
									</td>
									<td>{call.firstSpeaker}</td>
									<td>{call.voice}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	.stat {
		@apply flex flex-col gap-2;
	}

	.stat-desc {
		@apply text-sm text-surface-300;
	}

	.stat-value {
		@apply text-2xl font-bold;
	}

	:global(.dark) .card {
		@apply bg-surface-900;
	}

	.table-container {
		@apply overflow-x-auto;
	}

	.table {
		@apply w-full;
	}

	.table th {
		@apply text-left text-xs font-medium text-surface-300 uppercase tracking-wider p-4 bg-surface-800;
	}

	.table td {
		@apply p-4 text-surface-100 border-t border-surface-700;
	}

	.select {
		@apply text-surface-100 bg-surface-800 border-surface-700;
	}
</style>
