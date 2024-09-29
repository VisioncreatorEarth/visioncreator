<script lang="ts">
	import { getContext } from 'svelte';

	export let stepperState;
	export let currentField;
	export let stepStateName = '';

	const cHeader = 'flex items-center mt-4';
	const cHeaderStep = 'transition-all duration-300';
	const active = 'variant-filled-tertiary';
	const badge = 'variant-ghost-tertiary';

	// Context
	const stepTerm = getContext('stepTerm') || 'Step';

	// Reactive
	$: classesHeader = `${cHeader}`;
	$: classesHeaderStep = `${cHeaderStep}`;
	$: classesBadge = (step) => (isActive(step) ? active : badge);

	// Computed
	$: isActive = (step) => step === $currentField;
	$: isDone = (step) => step < $currentField;
	$: total = $stepperState.total;
</script>

<!-- Header -->
{#if total}
	<header class="stepper-header {classesHeader}">
		<div class="flex items-center">
			{#each Array(total) as _, step}
				{#if isActive(step) || isDone(step)}
					<div class="stepper-header-step {classesHeaderStep} mr-2">
						<span class="badge {classesBadge(step)}">
							{isActive(step) ? stepStateName : `${step + 1}`}
						</span>
					</div>
				{/if}
			{/each}
		</div>
		<div class="flex items-center ml-auto">
			{#each Array(total) as _, step}
				{#if !isActive(step) && !isDone(step)}
					<div class="stepper-header-step {classesHeaderStep} ml-2">
						<span class="badge {classesBadge(step)}">
							{step + 1}
						</span>
					</div>
				{/if}
			{/each}
		</div>
	</header>
{/if}

<style>
	.stepper-header {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}
</style>
