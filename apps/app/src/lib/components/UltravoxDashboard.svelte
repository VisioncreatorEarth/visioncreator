<script lang="ts">
	import { createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	const timeUsageQuery = createQuery({
		operationName: 'queryCallsAndTimeStats',
		enabled: true,
		liveQuery: true
	});

	type Voice = {
		voiceId: string;
		name: string;
		description: string;
		previewUrl: string | null;
		language: string;
	};

	function formatTimestamp(timestamp: string) {
		return new Date(timestamp).toLocaleString();
	}

	function calculateDuration(start: string, end: string | null) {
		const startTime = new Date(start).getTime();
		const endTime = end ? new Date(end).getTime() : Date.now();
		const duration = Math.floor((endTime - startTime) / 1000);
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function formatDuration(minutes: number) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	}
</script>

<div class="flex h-screen">
	<main class="overflow-y-auto flex-1 bg-surface-900">
		<div class="p-6 space-y-6">
			{#if $timeUsageQuery.isLoading}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="p-6 rounded-lg animate-pulse bg-surface-800">
						<div class="mb-4 w-1/3 h-6 rounded bg-surface-700" />
						<div class="space-y-3">
							<div class="w-3/4 h-4 rounded bg-surface-700" />
							<div class="w-1/2 h-4 rounded bg-surface-700" />
						</div>
					</div>
					<div class="p-6 rounded-lg animate-pulse bg-surface-800">
						<div class="mb-4 w-1/3 h-6 rounded bg-surface-700" />
						<div class="space-y-3">
							<div class="w-3/4 h-4 rounded bg-surface-700" />
							<div class="w-1/2 h-4 rounded bg-surface-700" />
						</div>
					</div>
				</div>
			{:else if $timeUsageQuery.data}
				<!-- Stats Overview -->
				<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Total Calls</h3>
						<div class="text-3xl font-bold text-white">
							{$timeUsageQuery.data.totalCalls}
						</div>
					</div>

					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Total Minutes</h3>
						<div class="text-3xl font-bold text-white">
							{$timeUsageQuery.data.totalMinutes}
						</div>
					</div>

					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Total Cost</h3>
						<div class="text-3xl font-bold text-white">
							${$timeUsageQuery.data.totalCost}
						</div>
					</div>
				</div>

				<div class="p-6 rounded-lg bg-surface-800 md:col-span-2">
					<h3 class="mb-4 text-lg font-semibold text-white">Call History</h3>
					<div class="space-y-3">
						{#each $timeUsageQuery.data.calls ?? [] as call}
							<div class="p-3 rounded bg-surface-700/50">
								<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3">
										<span
											class="inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap w-fit {call.ended
												? 'bg-success-500/10 text-success-500'
												: 'bg-warning-900/50 text-warning-200'}"
										>
											{call.ended ? `Ended (${call.endReason || 'Unknown'})` : 'Active'}
										</span>
										<div class="flex items-center gap-2 text-sm">
											<span class="text-surface-200">
												by {call.userName}
											</span>
											<span class="text-surface-100">
												{calculateDuration(call.created, call.ended)}
											</span>
										</div>
									</div>
									<span class="text-xs text-surface-300">{formatTimestamp(call.created)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	:global(html) {
		background-color: rgb(var(--color-surface-900));
	}
</style>
