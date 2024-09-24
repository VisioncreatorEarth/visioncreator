<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Milestone } from '$lib/milestone';
	import { formatCurrency, getProgressPercentage } from '$lib/milestone';

	export let milestone: Milestone;
	export let state: string;
	export let visioncreators: number;
	export let previousValue: number;

	let showDetails = false;
</script>

{#if state === 'completed'}
	<div
		class="bg-success-500/30 flex flex-col justify-center items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg"
	>
		<span class="text-3xl font-bold text-surface-50">{milestone.value.toLocaleString()}</span>
	</div>
{:else if state === 'in-progress'}
	<div
		class="card bg-warning-500 flex flex-col justify-between items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg"
	>
		<div
			class="w-full h-full absolute top-0 left-0 bg-success-500/30 rounded-lg transition-all duration-300 ease-in-out animate-pulse"
			style="width: {Math.max(
				1,
				getProgressPercentage(milestone.value, previousValue, visioncreators)
			)}%"
		/>

		<div class="flex flex-col items-center z-10 mt-4">
			<span class="text-2xl font-bold text-surface-50"
				>{(milestone.value - visioncreators).toLocaleString()} left</span
			>
			<span class="text-xs text-center mt-1 text-surface-200">
				earn <span class="text-success-500"
					>+{formatCurrency((milestone.vcPool || 0) / milestone.value)}/m</span
				> <br />per invite
			</span>
		</div>
	</div>
{:else}
	<div
		class="card bg-surface-700/30 flex flex-col justify-center items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg cursor-pointer"
		on:click={() => (showDetails = !showDetails)}
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				showDetails = !showDetails;
			}
		}}
		tabindex="0"
		role="button"
		aria-expanded={showDetails ? 'true' : 'false'}
	>
		{#if !showDetails}
			<div class="flex flex-col items-center">
				<Icon icon="mdi:lock" class="text-4xl mb-2 text-surface-400" />
				<span class="text-2xl font-bold text-surface-400">{milestone.value.toLocaleString()}</span>
				<span class="text-xs text-center mt-1 text-surface-400">
					earn {formatCurrency((milestone.vcPool || 0) / milestone.value)}/m <br />per invite
				</span>
			</div>
		{:else}
			<div class="flex flex-col items-center w-full">
				<span class="text-xs mt-1 text-surface-400"
					>Total pool: {formatCurrency(milestone.poolAmount).split('.')[0]}</span
				>
				<span class="text-xs mt-1 text-surface-400"
					>Platform fee: {formatCurrency(milestone.platformFeeAmount || 0).split('.')[0]}</span
				>
				<span class="text-xs mt-1 text-surface-400"
					>Startup fund: {formatCurrency(milestone.startupFund || 0).split('.')[0]}</span
				>
				<span class="text-xs mt-1 text-surface-400"
					>VC pool: {formatCurrency(milestone.vcPool || 0).split('.')[0]}</span
				>
				<span class="text-xs mt-1 text-surface-400"
					>VC percentage: {milestone.provisionPercentage.toFixed(2)}%</span
				>
			</div>
		{/if}
	</div>
{/if}
