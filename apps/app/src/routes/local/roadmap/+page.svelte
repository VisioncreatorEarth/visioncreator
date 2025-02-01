<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Milestone, User } from '$lib/milestone';
	import { fibonacciSequence, randomUsers } from '$lib/milestone';
	import PersonalCampaign from '$lib/components/PersonalCampaign.svelte';
	import MilestoneGrid from '$lib/components/MilestoneGrid.svelte';
	import MilestoneTable from '$lib/components/MilestoneTable.svelte';

	// Adjust grid columns for better display of more milestones
	let gridColumns = 5;
	let visioncreators = writable(0);
	let personalVCs = writable(0);
	let personalEarnings = writable(0);
	let currentView = writable('grid');

	// Token per VC values from the spreadsheet
	const tokenPerVCValues = [
		1000, 1000, 1000, 25, 20, 18, 12.5, 9.62, 7.14, 5.88, 4.55, 3.57, 2.66, 1.94, 1.39, 0.98, 0.69,
		0.48, 0.33, 0.23, 0.33, 0.24, 0.17, 0.12, 0.09, 0.06, 0.04, 0.03, 0.02, 0.02
	];

	// Total tokens for each milestone
	const totalTokensValues = [
		26300, 27600, 28900, 28965, 29043, 29160, 29290, 29453, 29648, 29908, 30233, 30645, 31143,
		31730, 32411, 33190, 34075, 35072, 36189, 37435, 40341, 43702, 47594, 52104, 57340, 63430,
		70530, 78828, 88553, 99984
	];

	// Token price for each milestone
	const tokenPriceValues = [
		1.0, 1.0, 1.0, 14.6, 18.25, 20.28, 29.2, 37.96, 51.1, 62.05, 80.3, 102.33, 137.21, 188.33,
		262.83, 371.33, 529.47, 760.29, 1097.65, 1591.31, 1104.86, 1545.07, 2159.45, 3014.71, 4202.02,
		5845.44, 8113.09, 11231.84, 15506.54, 21345.03
	];

	const fibonacciMilestones: Milestone[] = [];

	fibonacciSequence.forEach((value, index) => {
		fibonacciMilestones.push({
			value,
			poolAmount: Math.round(value * 365), // Round to remove decimal places
			tokenPerVC: tokenPerVCValues[index],
			totalTokens: totalTokensValues[index],
			tokenPrice: tokenPriceValues[index],
			provisionPercentage: 0,
			startupFund: 0,
			platformFeeAmount: 0,
			vcPool: 0
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

	function handlePersonalSimulation({ detail }: { detail: { amount: number } }) {
		const { amount } = detail;
		visioncreators.update((value) => value + amount);
		personalVCs.update((value) => value + amount);
		updatePersonalEarnings();

		// Add "myself" to recent users with a unique identifier
		personalInspirationsCount += amount;
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
		personalEarnings.set($personalVCs);
	}

	$: {
		updatePersonalEarnings();
	}

	$: currentEarnPerInspiration = 1; // Simplified to 1:1 ratio
</script>

<main class="flex w-screen h-screen overflow-hidden bg-surface-900 text-surface-50">
	<div class="flex-grow p-4 overflow-auto">
		<div id="pinme">
			<PersonalCampaign
				personalVCs={$personalVCs}
				personalEarnings={$personalEarnings}
				{currentEarnPerInspiration}
				on:simulate={handlePersonalSimulation}
				on:reset={resetGlobalVC}
				on:random={handleGlobalVCChange}
			/>

			<div class="mb-4">
				<button
					class="btn btn-sm variant-ghost-secondary"
					on:click={() => currentView.update((v) => (v === 'grid' ? 'table' : 'grid'))}
				>
					Switch to {$currentView === 'grid' ? 'Table' : 'Grid'} View
				</button>
			</div>
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
</main>
