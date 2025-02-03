<script lang="ts">
	import type { Milestone } from '$lib/milestone';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

	export let milestones: Milestone[];
	export let states: string[];

	const CURRENT_VCS = 21; // Hardcoded current VCs

	const treasuryShares = [
		85.55, 81.52, 77.85, 77.68, 77.47, 77.16, 76.82, 76.39, 75.89, 75.23, 74.42, 73.42, 72.25,
		70.91, 69.42, 67.79, 66.03, 64.15, 62.17, 60.1, 55.78, 51.48, 47.28, 43.18, 39.24, 35.47, 31.9,
		28.54, 25.41, 22.5
	];

	function calculateCommunityPool(poolAmount: number): string {
		return formatCurrency(poolAmount * 0.75).split('.')[0];
	}

	function getPhaseClass(milestone: Milestone, state: string): string {
		const baseClass =
			state === 'completed'
				? 'variant-ghost-success'
				: state === 'in-progress'
				? 'variant-ghost-primary'
				: 'variant-ghost-surface';

		const phaseClass = milestone.value <= 89 ? 'phase-one' : '';
		const currentClass = milestone.value === CURRENT_VCS ? 'current-milestone' : '';

		return `${baseClass} ${phaseClass} ${currentClass}`.trim();
	}
</script>

<div class="overflow-x-auto">
	<table class="table w-full table-compact">
		<thead>
			<tr>
				<th>Visioncreators</th>
				<th>Pool Amount</th>
				<th>Community Pool</th>
				<th>Tokens per VC</th>
				<th>Total Tokens</th>
				<th>Token Price</th>
				<th>Treasury Share</th>
			</tr>
		</thead>
		<tbody>
			{#each milestones as milestone, index (milestone.value)}
				{#if states[index] === 'completed'}
					<tr class={getPhaseClass(milestone, 'completed')}>
						<td class="font-bold">{milestone.value.toLocaleString()}</td>
						<td colspan="6" class="text-center">
							{#if milestone.value === CURRENT_VCS}
								Current Milestone ✓
							{:else}
								✓ Milestone Reached
							{/if}
						</td>
					</tr>
				{:else if states[index] === 'in-progress'}
					<tr class={getPhaseClass(milestone, 'in-progress')}>
						<td class="font-bold">{milestone.value.toLocaleString()}</td>
						<td>{formatCurrency(milestone.poolAmount).split('.')[0]}</td>
						<td>{calculateCommunityPool(milestone.poolAmount)}</td>
						<td>{milestone.tokenPerVC}</td>
						<td>{milestone.totalTokens.toLocaleString()}</td>
						<td>{formatCurrency(milestone.tokenPrice)}</td>
						<td>{treasuryShares[index]}%</td>
					</tr>
				{:else}
					<tr class={getPhaseClass(milestone, 'open')}>
						<td>
							<Icon icon="mdi:lock" class="mr-2 text-xl" />
							{milestone.value.toLocaleString()}
						</td>
						<td>{formatCurrency(milestone.poolAmount).split('.')[0]}</td>
						<td>{calculateCommunityPool(milestone.poolAmount)}</td>
						<td>{milestone.tokenPerVC}</td>
						<td>{milestone.totalTokens.toLocaleString()}</td>
						<td>{formatCurrency(milestone.tokenPrice)}</td>
						<td>{treasuryShares[index]}%</td>
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

	.phase-one {
		@apply bg-opacity-40;
	}

	.current-milestone {
		@apply ring-2 ring-primary-500 ring-inset;
	}
</style>
