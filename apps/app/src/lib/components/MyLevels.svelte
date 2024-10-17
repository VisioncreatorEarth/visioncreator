<script lang="ts">
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

	export let personalEarnings: number;
	export let levels: { name: string; range: number[]; subUnits: number[] }[];

	$: currentLevelIndex = levels.findIndex((level) => personalEarnings < level.range[1]);
	$: currentLevelIndex = currentLevelIndex === -1 ? levels.length - 1 : currentLevelIndex;
	$: currentLevel = levels[currentLevelIndex];

	$: getProgressPercentage = (level) => {
		const [start, end] = level.range;
		if (personalEarnings >= end) return 100;
		if (personalEarnings <= start) return 0;
		return Math.floor(((personalEarnings - start) / (end - start)) * 100);
	};

	$: getCurrentSubUnitIndex = (level) => {
		return level.subUnits.findIndex((subUnit) => personalEarnings < subUnit);
	};

	$: getSubUnitState = (subUnit, levelIndex, subIndex) => {
		if (levelIndex < currentLevelIndex) return 'completed';
		if (levelIndex > currentLevelIndex) return 'future';
		const currentSubUnitIndex = getCurrentSubUnitIndex(levels[levelIndex]);
		if (subIndex < currentSubUnitIndex) return 'completed';
		if (subIndex === currentSubUnitIndex) return 'in-progress';
		return 'future';
	};

	$: getSubUnitProgress = (subUnit, index, levelSubUnits, levelStart) => {
		const start = index === 0 ? levelStart : levelSubUnits[index - 1];
		if (personalEarnings >= subUnit) return 100;
		if (personalEarnings <= start) return 0;
		return Math.floor(((personalEarnings - start) / (subUnit - start)) * 100);
	};

	function formatCurrencyWithoutCents(value: number): string {
		return formatCurrency(value).replace(/\.\d+/, '') + '/m';
	}
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
	{#each levels as level, levelIndex}
		<div class="flex flex-col space-y-2">
			{#if levelIndex < currentLevelIndex}
				<div
					class="flex-grow flex flex-col justify-center items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg variant-ghost-success"
				>
					<Icon icon="mdi:check-circle" class="text-6xl text-success-500" />
					<span class="mt-2 text-lg text-surface-200">{level.name}</span>
					<span class="mt-1 text-sm text-surface-300">Completed</span>
				</div>
			{:else}
				<div
					class="flex-grow flex flex-col justify-between items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg
					{levelIndex === currentLevelIndex ? 'variant-ghost-primary' : 'variant-ghost-surface'}"
				>
					{#if levelIndex === currentLevelIndex}
						<div
							class="absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out rounded-lg bg-success-500/30 animate-pulse"
							style="width: {getProgressPercentage(level)}%"
						/>
					{/if}
					<div class="z-10 flex flex-col items-center mt-4">
						<span class="text-2xl font-bold text-surface-50">
							Up to {formatCurrencyWithoutCents(level.range[1])}
							{#if levelIndex === levels.length - 1}+{/if}
						</span>
						<span class="mt-2 text-lg text-surface-200">{level.name}</span>
					</div>
					{#if levelIndex > currentLevelIndex}
						<Icon icon="mdi:lock" class="text-4xl text-surface-400" />
					{/if}
				</div>
				{#if levelIndex === currentLevelIndex}
					<div class="grid grid-cols-3 gap-2">
						{#each level.subUnits as subUnit, subIndex}
							{@const state = getSubUnitState(subUnit, levelIndex, subIndex)}
							<div
								class="flex flex-col justify-center items-center p-2 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[80px] rounded-lg shadow-lg
								{state === 'completed'
									? 'variant-ghost-success'
									: state === 'in-progress'
									? 'variant-ghost-primary'
									: 'variant-ghost-surface'}"
							>
								{#if state === 'in-progress'}
									<div
										class="absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out rounded-lg bg-success-500/30 animate-pulse"
										style="width: {getSubUnitProgress(
											subUnit,
											subIndex,
											level.subUnits,
											level.range[0]
										)}%"
									/>
								{/if}
								<div class="z-10 flex flex-col items-center">
									<span class="text-xl font-bold text-surface-50"
										>{formatCurrencyWithoutCents(subUnit)}</span
									>
								</div>
								{#if state === 'future'}
									<Icon icon="mdi:lock" class="text-2xl text-surface-400" />
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	{/each}
</div>
