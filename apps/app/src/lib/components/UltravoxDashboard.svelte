<script lang="ts">
	import { onMount } from 'svelte';

	// Mock data for initial UI development
	let account = {
		freeTimeUsed: '2h 30m',
		freeTimeRemaining: '7h 30m'
	};

	let calls = [
		{
			callId: '123e4567-e89b-12d3-a456-426614174000',
			created: '2024-01-15T10:30:00Z',
			ended: '2024-01-15T10:35:00Z',
			endReason: 'hangup',
			firstSpeaker: 'FIRST_SPEAKER_AGENT',
			systemPrompt: 'You are a helpful assistant',
			voice: 'Jessica'
		}
	];

	onMount(async () => {
		// Here we'll add the actual API calls when implementing
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}

	function formatDuration(start: string, end: string) {
		const duration = new Date(end).getTime() - new Date(start).getTime();
		return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
	}
</script>

<div class="container mx-auto p-4 space-y-8">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Usage Statistics -->
		<div class="card p-4 variant-filled-surface">
			<header class="card-header">
				<h3 class="h3">Time Used</h3>
			</header>
			<section class="p-4">
				<div class="stat">
					<span class="stat-desc">Used</span>
					<span class="stat-value">{account.freeTimeUsed}</span>
				</div>
			</section>
		</div>

		<div class="card p-4 variant-filled-surface">
			<header class="card-header">
				<h3 class="h3">Time Remaining</h3>
			</header>
			<section class="p-4">
				<div class="stat">
					<span class="stat-desc">Available</span>
					<span class="stat-value">{account.freeTimeRemaining}</span>
				</div>
			</section>
		</div>
	</div>

	<!-- Calls List -->
	<div class="card variant-filled-surface">
		<header class="card-header p-4">
			<h3 class="h3">Recent Calls</h3>
		</header>
		<div class="p-4">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>ID</th>
						<th>Created</th>
						<th>Duration</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each calls as call}
						<tr>
							<td>{call.callId.slice(0, 8)}...</td>
							<td>{formatDate(call.created)}</td>
							<td>{call.ended ? formatDuration(call.created, call.ended) : 'Active'}</td>
							<td>
								<span
									class="chip {call.endReason ? 'variant-filled-error' : 'variant-filled-success'}"
								>
									{call.endReason || 'Active'}
								</span>
							</td>
							<td class="space-x-2">
								<button class="btn btn-sm variant-filled-primary">Details</button>
								{#if call.ended}
									<button class="btn btn-sm variant-filled-secondary">Recording</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style lang="postcss">
	.stat {
		@apply flex flex-col gap-2;
	}

	.stat-desc {
		@apply text-sm opacity-75;
	}

	.stat-value {
		@apply text-2xl font-bold;
	}

	:global(.dark) .card {
		@apply bg-surface-900;
	}
</style>
