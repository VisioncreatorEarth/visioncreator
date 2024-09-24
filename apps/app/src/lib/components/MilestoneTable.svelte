<script lang="ts">
	import type { Milestone } from '$lib/milestone';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

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
				{#if states[index] === 'completed'}
					<tr class="variant-ghost-success">
						<td class="font-bold">{milestone.value.toLocaleString()}</td>
						<td>{formatCurrency(milestone.poolAmount)}</td>
						<td>
							{formatCurrency(milestone.vcPool || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.vcPool || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{formatCurrency(milestone.startupFund || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.startupFund || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{formatCurrency(milestone.platformFeeAmount || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.platformFeeAmount || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{calculateEarnPerInvite(milestone.vcPool || 0, milestone.value)}
						</td>
					</tr>
				{:else if states[index] === 'in-progress'}
					<tr class="variant-ghost-primary">
						<td class="font-bold">{milestone.value.toLocaleString()}</td>
						<td>{formatCurrency(milestone.poolAmount)}</td>
						<td>
							{formatCurrency(milestone.vcPool || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.vcPool || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{formatCurrency(milestone.startupFund || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.startupFund || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{formatCurrency(milestone.platformFeeAmount || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.platformFeeAmount || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{calculateEarnPerInvite(milestone.vcPool || 0, milestone.value)}
						</td>
					</tr>
				{:else}
					<tr class="variant-ghost-surface">
						<td>
							<Icon icon="mdi:lock" class="text-xl mr-2" />
							{milestone.value.toLocaleString()}
						</td>
						<td>{formatCurrency(milestone.poolAmount)}</td>
						<td>
							{formatCurrency(milestone.vcPool || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.vcPool || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{formatCurrency(milestone.startupFund || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.startupFund || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{formatCurrency(milestone.platformFeeAmount || 0)}
							<br />
							<span class="text-xs">
								({calculatePercentage(milestone.platformFeeAmount || 0, milestone.poolAmount)})
							</span>
						</td>
						<td>
							{calculateEarnPerInvite(milestone.vcPool || 0, milestone.value)}
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table {
		@apply w-full text-sm text-left;
	}

	.table thead {
		@apply text-xs uppercase bg-surface-800;
	}

	.table th,
	.table td {
		@apply px-6 py-3;
	}

	.table tbody tr {
		@apply border-b border-surface-600;
	}

	.table tbody tr:hover {
		@apply bg-surface-600;
	}

	.variant-ghost-success {
		@apply bg-success-500/30 text-surface-50;
	}

	.variant-ghost-primary {
		@apply bg-primary-500/30 text-surface-50;
	}

	.variant-ghost-surface {
		@apply bg-surface-700/30 text-surface-50;
	}
</style>
