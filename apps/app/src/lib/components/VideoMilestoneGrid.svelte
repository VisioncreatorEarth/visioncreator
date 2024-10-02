<script lang="ts">
	import type { VideoMilestone } from '$lib/videomilestones';
	import VideoMilestoneCard from './VideoMilestoneCard.svelte';

	export let milestones: VideoMilestone[];
	export let progress: number;

	function calculateMilestoneProgress(index: number, totalMilestones: number): number {
		const startDelay = 0.2; // 20% of the animation is delayed start
		const milestoneProgress = (index + 1) / totalMilestones;
		const adjustedProgress = (progress - startDelay) / (1 - startDelay);
		return Math.max(0, Math.min(1, (adjustedProgress - milestoneProgress) * totalMilestones));
	}
</script>

<div class="relative w-full h-full" style="aspect-ratio: 1 / 1;">
	{#each milestones as milestone, index (milestone.value)}
		<VideoMilestoneCard
			{milestone}
			progress={calculateMilestoneProgress(index, milestones.length)}
		/>
	{/each}
</div>
