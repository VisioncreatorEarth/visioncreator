<script lang="ts">
	import type { Milestone } from '$lib/milestone';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

	export let milestones: Milestone[];
	export let states: string[];
</script>

<div class="overflow-x-auto">
	<table class="table w-full table-compact">
		<thead>
			<tr>
				<th>Visioncreators</th>
				<th>Pool Amount</th>
				<th>Tokens per VC</th>
				<th>Total Tokens</th>
				<th>Token Price</th>
			</tr>
		</thead>
		<tbody>
			{#each milestones as milestone, index (milestone.value)}
				{#if states[index] === 'completed'}
					<tr class="variant-ghost-success">
						<td class="font-bold">{milestone.value.toLocaleString()}</td>
						<td>{formatCurrency(milestone.poolAmount).split('.')[0]}</td>
						<td>{milestone.tokenPerVC}</td>
						<td>{milestone.totalTokens.toLocaleString()}</td>
						<td>{formatCurrency(milestone.tokenPrice)}</td>
					</tr>
				{:else if states[index] === 'in-progress'}
					<tr class="variant-ghost-primary">
						<td class="font-bold">{milestone.value.toLocaleString()}</td>
						<td>{formatCurrency(milestone.poolAmount).split('.')[0]}</td>
						<td>{milestone.tokenPerVC}</td>
						<td>{milestone.totalTokens.toLocaleString()}</td>
						<td>{formatCurrency(milestone.tokenPrice)}</td>
					</tr>
				{:else}
					<tr class="variant-ghost-surface">
						<td>
							<Icon icon="mdi:lock" class="mr-2 text-xl" />
							{milestone.value.toLocaleString()}
						</td>
						<td>{formatCurrency(milestone.poolAmount).split('.')[0]}</td>
						<td>{milestone.tokenPerVC}</td>
						<td>{milestone.totalTokens.toLocaleString()}</td>
						<td>{formatCurrency(milestone.tokenPrice)}</td>
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
