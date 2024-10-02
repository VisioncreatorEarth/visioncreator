<script lang="ts">
	import type { VideoMilestone } from '$lib/videomilestones';

	export let milestone: VideoMilestone;
	export let progress: number;

	$: state = progress === 1 ? 'completed' : progress > 0 ? 'in-progress' : 'locked';
</script>

<div
	class="absolute rounded-full transition-all duration-300 ease-in-out flex items-center justify-center"
	class:bg-surface-700={state === 'locked'}
	class:bg-primary-500={state === 'in-progress'}
	class:bg-success-500={state === 'completed'}
	style="
		left: {milestone.x}%;
		top: {milestone.y}%;
		width: {milestone.size}px;
		height: {milestone.size}px;
		transform: translate(-50%, -50%) scale({0.5 + progress * 0.5});
		opacity: {0.5 + progress * 0.5};
	"
>
	<div class="absolute inset-0 flex flex-col items-center justify-center text-surface-50">
		<div class="text-xs md:text-sm font-semibold">{milestone.value}</div>
		<div class="text-xxs md:text-xs">
			{#if state === 'locked'}
				🔒
			{:else if state === 'in-progress'}
				⏳
			{:else}
				✓
			{/if}
		</div>
	</div>
</div>
