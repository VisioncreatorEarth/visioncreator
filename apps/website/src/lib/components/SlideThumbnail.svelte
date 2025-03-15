<script lang="ts">
	export let title: string = '';
	export let index: number = 0;
	export const slideType: string = 'default';

	// Determine background gradient based on slide index and type
	let bgGradient = '';
	if (index === 0) {
		bgGradient = 'from-purple-400 to-indigo-600 border-purple-500'; // HumanQuestion
	} else if (index === 1) {
		bgGradient = 'from-blue-400 to-purple-500 border-blue-500'; // AutonomyAnswer
	} else if (index === 2) {
		bgGradient = 'from-red-400 to-orange-500 border-red-500'; // DailyProblem
	} else if (index === 3) {
		bgGradient = 'from-orange-400 to-amber-500 border-orange-500'; // WorkChoices
	} else if (index === 4) {
		bgGradient = 'from-emerald-400 to-teal-500 border-emerald-500'; // HelloEarth
	} else if (index === 5) {
		bgGradient = 'from-teal-400 to-cyan-500 border-teal-500'; // BetterSolution
	} else if (index === 6) {
		bgGradient = 'from-blue-400 to-indigo-500 border-blue-500'; // FreedomDimensions
	} else if (index === 7) {
		bgGradient = 'from-indigo-400 to-violet-500 border-indigo-500'; // DAOIntro
	} else if (index === 8) {
		bgGradient = 'from-violet-400 to-purple-500 border-violet-500'; // DAOExplained
	} else if (index === 9) {
		bgGradient = 'from-purple-400 to-fuchsia-500 border-purple-500'; // DAOExamples
	} else if (index === 10) {
		bgGradient = 'from-fuchsia-400 to-pink-500 border-fuchsia-500'; // TokenSystem
	} else if (index === 11) {
		bgGradient = 'from-pink-400 to-rose-500 border-pink-500'; // VisionCreatorPool
	} else if (index === 12) {
		bgGradient = 'from-rose-400 to-red-500 border-rose-500'; // MoneyFlows
	} else if (index === 13) {
		bgGradient = 'from-amber-400 to-yellow-500 border-amber-500'; // ProposalSystem
	} else if (index === 14) {
		bgGradient = 'from-yellow-400 to-lime-500 border-yellow-500'; // AutonomousLife
	} else if (index === 15) {
		bgGradient = 'from-lime-400 to-green-500 border-lime-500'; // PathToFreedom
	} else if (index === 16) {
		bgGradient = 'from-green-400 to-emerald-500 border-green-500'; // ReclaimWork
	} else {
		bgGradient = 'from-slate-400 to-slate-600 border-slate-500'; // Default
	}
</script>

<div class="slide-thumbnail relative overflow-hidden rounded-lg bg-slate-800 shadow-lg">
	<div class="flex aspect-video items-center justify-center overflow-hidden bg-slate-700">
		<div class="absolute inset-0 bg-gradient-to-br opacity-20 {bgGradient}"></div>

		<!-- Different layout for each slide type -->
		{#if index === 0}
			<!-- Human question slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Question</div>
				<div class="text-sm font-medium text-white">The Human Question</div>
			</div>
		{:else if index === 1}
			<!-- Autonomy answer slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Answer</div>
				<div class="text-sm font-bold text-white">AUTONOMY</div>
			</div>
		{:else if index === 2}
			<!-- Daily Problem slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Problem</div>
				<div class="text-sm font-medium text-white">What's Wrong With Our Work?</div>
			</div>
		{:else if index === 3}
			<!-- Work Choices slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Choice</div>
				<div class="text-sm font-medium text-white">A Forced Choice</div>
			</div>
		{:else if index === 4}
			<!-- Hello Earth slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Welcome</div>
				<div class="text-sm font-bold text-white">
					Freedom to Create,<br />Right to Own
				</div>
			</div>
		{:else if index === 5}
			<!-- Better Solution slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Solution</div>
				<div class="text-sm font-medium text-white">We Have a Better Solution</div>
			</div>
		{:else if index === 6}
			<!-- Freedom Dimensions slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Dimensions</div>
				<div class="text-sm font-medium text-white">Five Dimensions of Freedom</div>
			</div>
		{:else if index === 7}
			<!-- DAO Intro slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Ownership</div>
				<div class="text-sm font-medium text-white">Own What You Help Build</div>
			</div>
		{:else if index === 8}
			<!-- DAO Explained slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">DAO</div>
				<div class="text-sm font-medium text-white">What is a DAO?</div>
			</div>
		{:else if index === 9}
			<!-- DAO Examples slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Examples</div>
				<div class="text-sm font-medium text-white">DAOs in Action</div>
			</div>
		{:else if index === 10}
			<!-- Token System slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Tokens</div>
				<div class="text-sm font-medium text-white">VCR Token System</div>
			</div>
		{:else if index === 11}
			<!-- VisionCreator Pool slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Funding</div>
				<div class="text-sm font-bold text-white">75% Community Pool</div>
			</div>
		{:else if index === 12}
			<!-- Money Flows slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Flow</div>
				<div class="text-sm font-medium text-white">How The Money Flows</div>
			</div>
		{:else if index === 13}
			<!-- Proposal System slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Governance</div>
				<div class="text-sm font-medium text-white">Your Voice, Your Vote</div>
			</div>
		{:else if index === 14}
			<!-- Autonomous Life slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Journey</div>
				<div class="text-sm font-medium text-white">What Your Journey Could Look Like</div>
			</div>
		{:else if index === 15}
			<!-- Path to Freedom slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Path</div>
				<div class="text-sm font-medium text-white">5-Step Journey to Freedom</div>
			</div>
		{:else if index === 16}
			<!-- Reclaim Work slide -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">Reclaim</div>
				<div class="text-sm font-medium text-white">Your Work, Your Life</div>
			</div>
		{:else}
			<!-- Generic slide layout with text only -->
			<div class="relative z-10 px-4 text-center">
				<div class="mb-1 text-xs uppercase tracking-wider text-slate-400">
					{title.split(' ')[0]}
				</div>
				<div class="text-sm font-medium text-white">{title}</div>
			</div>
		{/if}

		<!-- Slide number -->
		<div
			class="absolute bottom-2 right-2 rounded-full bg-black/20 px-2 py-1 text-xs font-bold text-white/50"
		>
			{index + 1}
		</div>
	</div>

	<div class="p-3">
		<h3 class="truncate text-sm font-medium text-slate-200" {title}>{title}</h3>
	</div>
</div>

<style>
	.slide-thumbnail {
		transition: all 0.2s ease-in-out;
	}

	.slide-thumbnail:hover {
		transform: translateY(-4px);
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
	}
</style>
