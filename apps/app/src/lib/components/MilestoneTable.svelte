<script lang="ts">
	import type { Milestone } from '$lib/milestone';
	import { formatCurrency } from '$lib/milestone';

	export let milestones: Milestone[];
	export let states: string[];

	function calculatePercentage(value: number, total: number): string {
		return ((value / total) * 100).toFixed(2) + '%';
	}

	function calculateEarnPerInvite(vcPool: number, value: number): string {
		return formatCurrency((vcPool || 0) / value) + '/m';
	}
</script>

<div class="overflow-x-auto">
	<table class="table table-compact w-full">
		<thead>
			<tr>
				<th>Milestone</th>
				<th>Pool Amount</th>
				<th>VC Pool</th>
				<th>Startup Fund</th>
				<th>Platform Fee</th>
				<th>Earn Per Invite</th>
			</tr>
		</thead>
		<tbody>
			{#each milestones as milestone, index (milestone.value)}
				<tr class={states[index]}>
					<td>{milestone.value.toLocaleString()}</td>
					<td>{formatCurrency(milestone.poolAmount)}</td>
					<td>
						{formatCurrency(milestone.vcPool || 0)}
						<br />
						<span class="text-xs text-surface-400">
							({calculatePercentage(milestone.vcPool || 0, milestone.poolAmount)})
						</span>
					</td>
					<td>
						{formatCurrency(milestone.startupFund || 0)}
						<br />
						<span class="text-xs text-surface-400">
							({calculatePercentage(milestone.startupFund || 0, milestone.poolAmount)})
						</span>
					</td>
					<td>
						{formatCurrency(milestone.platformFeeAmount || 0)}
						<br />
						<span class="text-xs text-surface-400">
							({calculatePercentage(milestone.platformFeeAmount || 0, milestone.poolAmount)})
						</span>
					</td>
					<td>
						{calculateEarnPerInvite(milestone.vcPool || 0, milestone.value)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table {
		@apply w-full text-sm text-left text-surface-200;
	}

	.table thead {
		@apply text-xs text-surface-400 uppercase bg-surface-800;
	}

	.table th,
	.table td {
		@apply px-6 py-3;
	}

	.table tbody tr {
		@apply border-b bg-surface-700 border-surface-600;
	}

	.table tbody tr:hover {
		@apply bg-surface-600;
	}

	.table tbody tr.completed {
		@apply bg-success-500/30;
	}

	.table tbody tr.in-progress {
		@apply bg-warning-500;
	}
</style>
