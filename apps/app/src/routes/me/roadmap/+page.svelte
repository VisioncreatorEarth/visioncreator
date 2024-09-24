<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Milestone, User } from '$lib/milestone';
	import { fibonacciSequence, randomUsers, formatCurrency } from '$lib/milestone';
	import MilestoneGrid from '$lib/components/MilestoneGrid.svelte';
	import MilestoneTable from '$lib/components/MilestoneTable.svelte';
	import PersonalCampaign from '$lib/components/PersonalCampaign.svelte';
	import MilestoneRecentUsers from '$lib/components/MilestoneRecentUsers.svelte';

	let gridColumns = 6;
	let visioncreators = writable(0);
	let personalVCs = writable(0);
	let personalEarnings = writable(0);
	let currentView = writable('grid');

	const startProvision = 70;
	const endProvision = 20;
	const platformFee = 20;

	const fibonacciMilestones: Milestone[] = [];

	fibonacciSequence.forEach((value, index) => {
		const poolAmount = value * 30;

		const provisionPercentage =
			startProvision -
			(startProvision - endProvision) *
				(1 - Math.exp((-4 * index) / (fibonacciSequence.length - 1)));

		const platformFeeAmount = (poolAmount * platformFee) / 100;
		const remainingPool = poolAmount - platformFeeAmount;
		const vcPool = (remainingPool * provisionPercentage) / 100;
		const startupFund = remainingPool - vcPool;

		fibonacciMilestones.push({
			value,
			poolAmount,
			provisionPercentage,
			startupFund,
			platformFeeAmount,
			vcPool
		});
	});

	$: states = fibonacciMilestones.map((milestone, index) => {
		if (milestone.value <= $visioncreators) return 'completed';
		if (
			milestone.value > $visioncreators &&
			fibonacciMilestones[index - 1]?.value <= $visioncreators
		)
			return 'in-progress';
		return 'open';
	});

	let recentUsers: User[] = [];
	let userCounter = 0;
	let personalInspirationsCount = 0;

	function addRandomUser() {
		const randomIndex = Math.floor(Math.random() * randomUsers.length);
		const newUser = {
			...randomUsers[randomIndex],
			identifier: `${randomUsers[randomIndex].identifier}_${userCounter}`,
			timestamp: new Date(),
			earnings: Math.floor(Math.random() * 100) + 1
		};
		userCounter++;
		recentUsers = [newUser, ...recentUsers.slice(0, 18)];
	}

	function handleGlobalVCChange() {
		const newInvites = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 10
		visioncreators.update((value) => value + newInvites);
		for (let i = 0; i < newInvites; i++) {
			addRandomUser();
		}
	}

	function resetGlobalVC() {
		visioncreators.set(0);
		personalVCs.set(0);
		personalEarnings.set(0);
		recentUsers = [];
		personalInspirationsCount = 0;
	}

	function handlePersonalSimulation() {
		visioncreators.update((value) => value + 1);
		personalVCs.update((value) => value + 1);
		updatePersonalEarnings();

		// Add "myself" to recent users with a unique identifier
		personalInspirationsCount++;
		recentUsers = [
			{
				name: 'Myself',
				identifier: `myself_${personalInspirationsCount}`,
				timestamp: new Date(),
				earnings: $personalEarnings
			},
			...recentUsers.slice(0, 18)
		];
	}

	function updatePersonalEarnings() {
		const currentMilestoneIndex = fibonacciMilestones.findIndex((m) => m.value > $visioncreators);
		const currentMilestone =
			fibonacciMilestones[currentMilestoneIndex - 1] || fibonacciMilestones[0];
		const earnPerInvite = currentMilestone ? currentMilestone.vcPool / currentMilestone.value : 0;
		personalEarnings.set(earnPerInvite * $personalVCs);
	}

	$: {
		updatePersonalEarnings();
	}

	$: currentEarnPerInspiration = (() => {
		const currentMilestoneIndex = fibonacciMilestones.findIndex((m) => m.value > $visioncreators);
		const nextMilestone =
			fibonacciMilestones[currentMilestoneIndex] || fibonacciMilestones[currentMilestoneIndex];
		return nextMilestone ? nextMilestone.vcPool / nextMilestone.value : 0;
	})();
</script>

<main class="flex w-screen h-screen bg-surface-900 text-surface-50 overflow-hidden">
	<div class="flex-grow overflow-auto p-4">
		<PersonalCampaign
			personalVCs={$personalVCs}
			personalEarnings={$personalEarnings}
			{currentEarnPerInspiration}
			on:simulate={() => handlePersonalSimulation()}
		/>

		<div class="mb-4">
			<button
				class="btn btn-sm variant-ghost-secondary"
				on:click={() => currentView.update((v) => (v === 'grid' ? 'table' : 'grid'))}
			>
				Switch to {$currentView === 'grid' ? 'Table' : 'Grid'} View
			</button>
		</div>

		{#if $currentView === 'grid'}
			<MilestoneGrid
				milestones={fibonacciMilestones}
				{states}
				visioncreators={$visioncreators}
				{gridColumns}
			/>
		{:else}
			<MilestoneTable milestones={fibonacciMilestones} {states} />
		{/if}
	</div>
	<aside class="w-64 bg-surface-800 flex flex-col p-4">
		<MilestoneRecentUsers {recentUsers} />
		<div class="mt-4">
			<div class="grid grid-cols-2 gap-2 w-full">
				<button on:click={resetGlobalVC} class="btn btn-sm variant-ghost-error"> Reset </button>
				<button on:click={handleGlobalVCChange} class="btn btn-sm variant-ghost-primary">
					+Random
				</button>
			</div>
		</div>
	</aside>
</main>
