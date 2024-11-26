<script lang="ts">
	import { createQuery } from '$lib/wundergraph';

	const timeUsageQuery = createQuery({
		operationName: 'queryCallsAndTimeStats',
		enabled: true,
		liveQuery: true
	});

	function calculateDuration(start: string, end?: string): string {
		if (!end) return 'Active';
		const startTime = new Date(start).getTime();
		const endTime = new Date(end).getTime();
		const durationMs = endTime - startTime;
		const seconds = Math.floor(durationMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	function formatDuration(duration: string): string {
		const seconds = parseFloat(duration.replace('s', ''));
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
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
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Time Used</h3>
						<div class="text-3xl font-bold text-white">
							{formatDuration($timeUsageQuery.data.timeUsed)}
						</div>
					</div>
					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Time Remaining</h3>
						<div class="text-3xl font-bold text-white">
							{formatDuration($timeUsageQuery.data.timeRemaining)}
						</div>
					</div>
				</div>

				<div class="p-6 rounded-lg bg-surface-800 md:col-span-2">
					<h3 class="mb-4 text-lg font-semibold text-white">Call History</h3>
					<div class="space-y-4">
						{#each $timeUsageQuery.data.calls ?? [] as call}
							<div class="p-4 rounded bg-surface-700/50">
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-3">
										<span
											class="px-2 py-1 text-xs rounded-full {call.ended
												? 'bg-teal-500/10 text-teal-500'
												: 'bg-green-900/50 text-green-200'}"
										>
											{call.ended ? `Ended (${call.endReason || 'Unknown'})` : 'Active'}
										</span>
										<span class="text-sm text-surface-200">
											{call.voice === 'b0e6b5c1-3100-44d5-8578-9015aa3023ae' ? 'jessica' : call.voice}
										</span>
										<span class="text-sm text-surface-100">
											Duration: {calculateDuration(call.created, call.ended)}
										</span>
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
