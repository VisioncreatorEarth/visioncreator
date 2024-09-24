<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

	export let personalVCs: number;
	export let personalEarnings: number;
	export let currentEarnPerInspiration: number;

	const dispatch = createEventDispatcher();

	function simulateInspiration() {
		dispatch('simulate');
	}

	$: nextPotentialEarnings = personalEarnings + currentEarnPerInspiration;

	const levels = [
		{ name: 'Novice', range: [1, 3], subUnits: [1, 2, 3] },
		{ name: 'Supporter', range: [5, 13], subUnits: [5, 8, 13] },
		{ name: 'Advocate', range: [21, 55], subUnits: [21, 34, 55] },
		{ name: 'Visionary', range: [89, Infinity], subUnits: [89, 144, 233] }
	];

	$: currentLevelIndex = levels.findIndex((level) => personalVCs < level.range[1]);
	$: currentLevelIndex = currentLevelIndex === -1 ? levels.length - 1 : currentLevelIndex;
	$: currentLevel = levels[currentLevelIndex];

	$: getProgressPercentage = (level) => {
		const [start, end] = level.range;
		if (personalVCs >= end) return 100;
		if (personalVCs < start) return 0;
		return Math.floor(((personalVCs - start) / (end - start)) * 100);
	};

	$: getCurrentSubUnitIndex = (level) => {
		return level.subUnits.findIndex((subUnit) => personalVCs < subUnit) - 1;
	};

	$: getSubUnitState = (subUnit, levelIndex, subIndex) => {
		if (levelIndex < currentLevelIndex) return 'completed';
		if (levelIndex > currentLevelIndex) return 'future';
		const currentSubUnitIndex = getCurrentSubUnitIndex(currentLevel);
		if (subIndex < currentSubUnitIndex) return 'completed';
		if (subIndex === currentSubUnitIndex) return 'in-progress';
		return 'future';
	};

	$: getSubUnitProgress = (subUnit, index, levelSubUnits) => {
		if (index === 0) {
			return Math.min(
				100,
				Math.floor(((personalVCs - levelSubUnits[index]) / (subUnit - levelSubUnits[index])) * 100)
			);
		} else {
			return Math.min(
				100,
				Math.floor(
					((personalVCs - levelSubUnits[index - 1]) / (subUnit - levelSubUnits[index - 1])) * 100
				)
			);
		}
	};
</script>

<div class="bg-surface-800 p-4 rounded-xl mb-4 shadow-lg">
	<h2 class="text-2xl font-bold mb-4 text-center text-primary-300">Your VisionCreator Dashboard</h2>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div
			class="md:col-span-2 bg-surface-700 p-4 rounded-xl shadow-md flex flex-col items-center justify-center"
		>
			<h3 class="text-xl font-semibold mb-2">Earnings</h3>
			<div class="flex items-center justify-center w-full">
				<div class="text-center flex-1">
					<p class="text-sm mb-1">Current Earnings</p>
					<p class="text-2xl font-bold text-primary-300">{formatCurrency(personalEarnings)}/m</p>
				</div>
				<Icon icon="mdi:arrow-right" class="text-3xl mx-2 text-secondary-300" />
				<div class="text-center flex-1">
					<p class="text-sm mb-1">Next Inspiration</p>
					<p class="text-2xl font-bold text-success-300">
						{formatCurrency(nextPotentialEarnings)}/m
					</p>
					<p class="text-xs text-success-500">
						+{formatCurrency(currentEarnPerInspiration)}
					</p>
				</div>
			</div>
		</div>
		<div class="bg-surface-700 p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
			<h3 class="text-xl font-semibold mb-2">Inspirations</h3>
			<p class="text-3xl font-bold text-primary-300">{personalVCs}</p>
		</div>
	</div>
	<div class="mt-6">
		<h3 class="text-xl font-semibold mb-4 text-center">VisionCreator Levels</h3>
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			{#each levels as level, levelIndex}
				<div class="flex flex-col space-y-2">
					<div
						class="flex-grow flex flex-col justify-between items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg
						{levelIndex < currentLevelIndex
							? 'variant-ghost-success'
							: levelIndex === currentLevelIndex
							? 'variant-ghost-primary'
							: 'variant-ghost-surface'}"
					>
						{#if levelIndex === currentLevelIndex}
							<div
								class="w-full h-full absolute top-0 left-0 bg-success-500/30 rounded-lg transition-all duration-300 ease-in-out animate-pulse"
								style="width: {getProgressPercentage(level)}%"
							/>
						{/if}
						<div class="flex flex-col items-center z-10 mt-4">
							<span class="text-2xl font-bold text-surface-50">
								{level.range[0]}-{level.range[1] === Infinity ? '∞' : level.range[1]} VCs
							</span>
							<span class="text-lg mt-2 text-surface-200">{level.name}</span>
							{#if levelIndex === currentLevelIndex}
								<span class="text-sm mt-2 text-surface-300">
									{Math.max(0, level.range[1] - personalVCs)} VCs to next level
								</span>
							{/if}
						</div>
						{#if levelIndex > currentLevelIndex}
							<Icon icon="mdi:lock" class="text-4xl text-surface-400" />
						{/if}
					</div>
					<div class="grid grid-cols-3 gap-2">
						{#each level.subUnits as subUnit, subIndex}
							{@const state = getSubUnitState(subUnit, levelIndex, subIndex)}
							<div
								class="flex flex-col justify-between items-center p-2 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[80px] rounded-lg shadow-lg
								{state === 'completed'
									? 'variant-ghost-success'
									: state === 'in-progress'
									? 'variant-ghost-primary'
									: 'variant-ghost-surface'}"
							>
								{#if state === 'in-progress'}
									<div
										class="w-full h-full absolute top-0 left-0 bg-success-500/30 rounded-lg transition-all duration-300 ease-in-out animate-pulse"
										style="width: {getSubUnitProgress(subUnit, subIndex, level.subUnits)}%"
									/>
								{/if}
								<div class="flex flex-col items-center z-10">
									<span class="text-xl font-bold text-surface-50">{subUnit}</span>
									<span class="text-xs mt-1 text-surface-200">VCs</span>
								</div>
								{#if state === 'future'}
									<Icon icon="mdi:lock" class="text-2xl text-surface-400" />
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-6 text-center">
		<button on:click={simulateInspiration} class="btn btn-lg variant-filled-primary">
			<Icon icon="mdi:plus" class="mr-2 text-2xl" />
			Add 1 Inspiration
		</button>
	</div>
</div>
