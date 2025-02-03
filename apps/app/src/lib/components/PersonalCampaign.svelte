<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';
	import { fibonacciSequence } from '$lib/milestone';
	import { onMount } from 'svelte';

	export let personalVCs: number;

	const CURRENT_VCS = 21; // Hardcoded current VCs
	const INVESTMENT_AMOUNT = 365; // Hardcoded investment amount in EUR
	const dispatch = createEventDispatcher();

	// Token data arrays from milestone data
	const tokenPrices = [
		1.0, 1.0, 1.0, 14.6, 18.25, 20.28, 29.2, 37.96, 51.1, 56.41, 62.73, 85.67, 116.97, 159.71,
		218.08, 297.77, 406.58, 555.16, 758.03, 1035.04, 1384.08, 1850.81, 2474.94, 3309.53, 4425.57,
		5917.95, 7913.59, 10582.2, 14150.71, 18922.59
	];

	const tokenPerVCValues = [
		365.0, 365.0, 365.0, 25.0, 20.0, 18.0, 12.5, 9.62, 7.14, 6.47, 5.82, 4.26, 3.12, 2.29, 1.67,
		1.23, 0.9, 0.66, 0.48, 0.353, 0.264, 0.197, 0.147, 0.11, 0.082, 0.062, 0.046, 0.034, 0.026,
		0.019
	];

	const totalTokens = [
		25475, 25949, 26424, 26489, 26567, 26684, 26814, 26976, 27171, 27457, 27873, 28366, 28950,
		29642, 30463, 31435, 32587, 33952, 35569, 37486, 39805, 42611, 46007, 50115, 55087, 61102,
		68381, 77188, 87845, 100740
	];

	// Get initial token details at milestone 21 (index 6 in the arrays)
	const initialTokensPerVC = tokenPerVCValues[6]; // Token amount at milestone 21
	const initialTokenPrice = tokenPrices[6]; // Token price at milestone 21
	const myTokens = initialTokensPerVC; // Tokens received for investment

	// Calculate milestone checkpoints (middle points between milestones)
	const milestoneCheckpoints = fibonacciSequence.map((value, index) => {
		if (index === fibonacciSequence.length - 1) return value;
		const nextValue = fibonacciSequence[index + 1];
		return Math.floor((value + nextValue) / 2);
	});

	// Initialize with current VCs
	let currentCheckpointIndex = milestoneCheckpoints.findIndex(
		(checkpoint) => checkpoint >= CURRENT_VCS
	);
	if (currentCheckpointIndex === -1) currentCheckpointIndex = 0;

	// Set initial VCs on mount
	onMount(() => {
		simulateVCs(CURRENT_VCS);
	});

	function moveToCheckpoint(direction: 'prev' | 'next') {
		if (direction === 'prev' && currentCheckpointIndex > 0) {
			currentCheckpointIndex--;
		} else if (direction === 'next' && currentCheckpointIndex < milestoneCheckpoints.length - 1) {
			currentCheckpointIndex++;
		}
		const targetAmount = Math.max(CURRENT_VCS, milestoneCheckpoints[currentCheckpointIndex]);
		simulateVCs(targetAmount);
	}

	function simulateVCs(amount: number) {
		const targetAmount = Math.max(CURRENT_VCS, amount);
		dispatch('simulate', { amount: targetAmount - personalVCs });
	}

	function handleSliderChange(event: Event) {
		const value = parseInt((event.target as HTMLInputElement).value);
		currentCheckpointIndex = value;
		const targetAmount = Math.max(CURRENT_VCS, milestoneCheckpoints[value]);
		simulateVCs(targetAmount);
	}

	// Get milestone index for a given VC count
	function getMilestoneIndex(vcs: number): number {
		const index = fibonacciSequence.findIndex((milestone) => milestone >= vcs);
		return index === -1 ? fibonacciSequence.length - 1 : index;
	}

	// Calculate current value based on simulated milestone's token price
	function getCurrentTokenPrice(vcs: number): number {
		if (vcs <= CURRENT_VCS) return initialTokenPrice;
		const milestoneIndex = getMilestoneIndex(vcs);
		return tokenPrices[milestoneIndex];
	}

	$: currentTokenPrice = getCurrentTokenPrice(personalVCs);
	$: currentValue = myTokens * currentTokenPrice;
	$: valueIncrease = currentValue - INVESTMENT_AMOUNT;
	$: valueIncreasePercentage = ((currentValue - INVESTMENT_AMOUNT) / INVESTMENT_AMOUNT) * 100;
</script>

<div class="p-4 card bg-surface-800">
	<div class="flex flex-col space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<h2 class="h2">Campaign Simulator</h2>
				<div class="badge variant-filled-primary">
					Current VCs: {CURRENT_VCS}
				</div>
			</div>
			<button class="btn btn-sm variant-ghost-error" on:click={() => dispatch('reset')}>
				Reset
			</button>
		</div>

		<div class="flex items-center space-x-4">
			<button
				class="btn btn-icon variant-ghost-primary"
				on:click={() => moveToCheckpoint('prev')}
				disabled={currentCheckpointIndex === 0 ||
					milestoneCheckpoints[currentCheckpointIndex - 1] < CURRENT_VCS}
			>
				<Icon icon="mdi:chevron-left" class="text-2xl" />
			</button>

			<div class="flex-grow">
				<input
					type="range"
					min="0"
					max={milestoneCheckpoints.length - 1}
					bind:value={currentCheckpointIndex}
					on:input={handleSliderChange}
					class="w-full"
				/>
				<div class="mt-2 text-center">
					<span class="text-sm">Simulated VCs: {personalVCs.toLocaleString()}</span>
					<span class="text-xs text-surface-400">
						(Next checkpoint: {milestoneCheckpoints[currentCheckpointIndex + 1]?.toLocaleString() ??
							'Max'})
					</span>
				</div>
			</div>

			<button
				class="btn btn-icon variant-ghost-primary"
				on:click={() => moveToCheckpoint('next')}
				disabled={currentCheckpointIndex === milestoneCheckpoints.length - 1}
			>
				<Icon icon="mdi:chevron-right" class="text-2xl" />
			</button>
		</div>
	</div>
</div>

<div class="p-4 mt-4 card bg-surface-800">
	<div class="flex flex-col space-y-4">
		<h3 class="h3">Your Investment Stats</h3>

		<div class="grid grid-cols-2 gap-4">
			<div class="p-4 text-center rounded-lg bg-surface-700">
				<div class="text-sm text-surface-400">Initial Investment</div>
				<div class="text-lg font-bold">{formatCurrency(INVESTMENT_AMOUNT)}</div>
				<div class="mt-1 text-xs text-surface-400">Tokens: {myTokens}</div>
				<div class="text-xs text-surface-400">Price: {formatCurrency(initialTokenPrice)}/token</div>
			</div>

			<div class="p-4 text-center rounded-lg bg-surface-700">
				<div class="text-sm text-surface-400">Simulated Value</div>
				<div class="text-lg font-bold">{formatCurrency(currentValue)}</div>
				<div class="mt-1 text-xs text-success-400">
					+{formatCurrency(valueIncrease)} ({valueIncreasePercentage.toFixed(1)}%)
				</div>
				<div class="text-xs text-surface-400">Price: {formatCurrency(currentTokenPrice)}/token</div>
			</div>
		</div>
	</div>
</div>

<style>
	input[type='range'] {
		@apply w-full h-2 rounded-lg appearance-none cursor-pointer bg-surface-600;
	}

	input[type='range']::-webkit-slider-thumb {
		@apply appearance-none w-6 h-6 rounded-full bg-primary-500 cursor-pointer;
	}

	input[type='range']::-moz-range-thumb {
		@apply w-6 h-6 rounded-full bg-primary-500 cursor-pointer;
	}
</style>
