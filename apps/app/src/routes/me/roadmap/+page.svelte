<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Milestone, User } from '$lib/milestone';
	import { fibonacciSequence, randomUsers } from '$lib/milestone';

	let gridColumns = 6;
	let visioncreators = writable(0);
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

	function addRandomUser() {
		const randomIndex = Math.floor(Math.random() * randomUsers.length);
		const newUser = {
			...randomUsers[randomIndex],
			identifier: `${randomUsers[randomIndex].identifier}_${userCounter}`,
			timestamp: new Date(),
			earnings: Math.floor(Math.random() * 100) + 1
		};
		userCounter++;
		recentUsers = [newUser, ...recentUsers].slice(0, 20);
	}

	function removeRandomUser() {
		if (recentUsers.length > 0) {
			const randomIndex = Math.floor(Math.random() * recentUsers.length);
			recentUsers = recentUsers.filter((_, index) => index !== randomIndex);
		}
	}

	function handleVCChange(change: number) {
		visioncreators.update((value) => Math.max(0, value + change));
		if (change > 0) {
			addRandomUser();
		} else if (change < 0 && recentUsers.length > 0) {
			removeRandomUser();
		}
	}
</script>

<main class="flex w-screen h-screen bg-surface-900 text-surface-50 overflow-hidden">
	<div class="flex-grow overflow-auto p-4">
		<div class="mb-4">
			<button
				class="btn variant-filled-primary"
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
				{#each [1] as value}
					<button
						on:click={() => handleVCChange(-value)}
						class="btn variant-filled-surface text-sm py-1"
					>
						-{value}
					</button>
					<button
						on:click={() => handleVCChange(value)}
						class="btn variant-filled-surface text-sm py-1"
					>
						+{value}
					</button>
				{/each}
			</div>
		</div>
	</aside>
</main>
