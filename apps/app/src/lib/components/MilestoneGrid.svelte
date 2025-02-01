<script lang="ts">
	import MilestoneCard from './MilestoneCard.svelte';
	import type { Milestone } from '$lib/milestone';

	export let milestones: Milestone[];
	export let states: string[];
	export let visioncreators: number;
	export let gridColumns: number;
</script>

<div class="flex flex-col w-full">
	<div
		class="box-border grid w-full gap-4"
		style="grid-template-columns: repeat({gridColumns}, 1fr);"
	>
		{#each milestones as milestone, index (milestone.value)}
			<MilestoneCard
				{milestone}
				state={states[index]}
				{visioncreators}
				previousValue={milestones[index - 1]?.value || 0}
			/>
		{/each}
	</div>
	<!-- Spacer for better visibility of last items when scrolling -->
	<div class="h-32" />
</div>
