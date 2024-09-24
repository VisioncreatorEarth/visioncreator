<script lang="ts">
	export let personalVCs: number;

	const levels = [
		{ name: 'Novice', range: [0, 3], subUnits: [1, 2, 3] },
		{ name: 'Supporter', range: [4, 13], subUnits: [5, 8, 13] },
		{ name: 'Advocate', range: [14, 55], subUnits: [21, 34, 55] },
		{ name: 'Visionary', range: [56, 233], subUnits: [89, 144, 233] }
	];

	$: currentLevelIndex = levels.findIndex((level) => personalVCs < level.range[1]);
	$: currentLevelIndex = currentLevelIndex === -1 ? levels.length - 1 : currentLevelIndex;
	$: currentLevel = levels[currentLevelIndex];

	$: getProgressPercentage = (level) => {
		const [start, end] = level.range;
		if (personalVCs >= end) return 100;
		if (personalVCs <= start) return 0;
		return Math.floor(((personalVCs - start) / (end - start)) * 100);
	};

	$: getCurrentSubUnitIndex = (level) => {
		return level.subUnits.findIndex((subUnit) => personalVCs < subUnit);
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
		if (personalVCs >= subUnit) return 100;
		if (personalVCs <= start) return 0;
		return Math.floor(((personalVCs - start) / (subUnit - start)) * 100);
	};
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
	{#each levels as level, levelIndex}
		<div class="flex flex-col space-y-2">
			{#if levelIndex < currentLevelIndex}
				<div
					class="flex-grow flex flex-col justify-center items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg variant-ghost-success"
				>
					<Icon icon="mdi:check-circle" class="text-6xl text-success-500" />
					<span class="text-lg mt-2 text-surface-200">{level.name}</span>
					<span class="text-sm mt-1 text-surface-300">Completed</span>
				</div>
			{:else}
				<div
					class="flex-grow flex flex-col justify-between items-center p-4 transition-all duration-200 hover:scale-105 relative overflow-hidden min-h-[140px] rounded-lg shadow-lg
					{levelIndex === currentLevelIndex ? 'variant-ghost-primary' : 'variant-ghost-surface'}"
				>
					{#if levelIndex === currentLevelIndex}
						<div
							class="w-full h-full absolute top-0 left-0 bg-success-500/30 rounded-lg transition-all duration-300 ease-in-out animate-pulse"
							style="width: {getProgressPercentage(level)}%"
						/>
					{/if}
					<div class="flex flex-col items-center z-10 mt-4">
						<span class="text-2xl font-bold text-surface-50">
							{level.range[0] + 1}-{level.range[1]} VCs
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
										class="w-full h-full absolute top-0 left-0 bg-success-500/30 rounded-lg transition-all duration-300 ease-in-out animate-pulse"
										style="width: {getSubUnitProgress(
											subUnit,
											subIndex,
											level.subUnits,
											level.range[0]
										)}%"
									/>
								{/if}
								<div class="flex flex-col items-center z-10">
									<span class="text-xl font-bold text-surface-50">{subUnit}</span>
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
