<script lang="ts">
	import { writable } from 'svelte/store';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';
	import MyLevels from './MyLevels.svelte';

	let personalInspirations = writable(0);
	let totalMonthlyIncome = writable(0);
	let nextMilestoneIncome = writable(10);

	const fibonacciSequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

	const levels = [
		{ name: 'Tribeman', range: [0, 30], subUnits: [10, 20, 30] },
		{ name: 'Distributor', range: [31, 130], subUnits: [50, 80, 130] },
		{ name: 'Creator', range: [131, 550], subUnits: [210, 340, 550] },
		{ name: 'Owner', range: [551, 2330], subUnits: [890, 1440, 2330] }
	];

	function incrementInspirations() {
		personalInspirations.update((n) => n + 1);
		updateIncome();
	}

	function decrementInspirations() {
		personalInspirations.update((n) => Math.max(0, n - 1));
		updateIncome();
	}

	function updateIncome() {
		totalMonthlyIncome.set($personalInspirations * 10);
		const nextFiboIndex = fibonacciSequence.findIndex((fibo) => fibo > $personalInspirations);
		const nextFiboGoal =
			fibonacciSequence[nextFiboIndex] || fibonacciSequence[fibonacciSequence.length - 1];
		nextMilestoneIncome.set(nextFiboGoal * 10);
	}

	$: potentialIncomeIncrease = $nextMilestoneIncome - $totalMonthlyIncome;

	function formatCurrencyWithoutCents(value: number): string {
		return formatCurrency(value).replace(/\.\d+/, '') + '/m';
	}

	$: {
		updateIncome();
	}
</script>

<div class="p-4 mb-4 shadow-lg bg-surface-800 rounded-xl">
	<h2 class="mb-4 text-2xl font-bold text-center text-primary-300">Your VisionCreator Journey</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div
			class="flex flex-col items-center justify-center p-4 shadow-md md:col-span-2 bg-surface-700 rounded-xl"
		>
			<h3 class="mb-2 text-xl font-semibold">Monthly Income</h3>
			<div class="flex items-center justify-center w-full">
				<div class="flex-1 text-center">
					<p class="mb-1 text-sm">Current Income</p>
					<p class="text-2xl font-bold text-primary-300">
						{formatCurrencyWithoutCents($totalMonthlyIncome)}
					</p>
				</div>
				<Icon icon="mdi:arrow-right" class="mx-2 text-3xl text-secondary-300" />
				<div class="flex-1 text-center">
					<p class="mb-1 text-sm">Next Milestone</p>
					<p class="text-2xl font-bold text-success-300">
						{formatCurrencyWithoutCents($nextMilestoneIncome)}
					</p>
				</div>
			</div>
		</div>
		<div class="flex flex-col items-center justify-center p-4 shadow-md bg-surface-700 rounded-xl">
			<h3 class="mb-2 text-xl font-semibold">Inspirations</h3>
			<p class="text-3xl font-bold text-primary-300">{$personalInspirations}</p>
		</div>
	</div>

	<div class="mt-6">
		<h3 class="mb-4 text-xl font-semibold text-center">My Levels</h3>
		<MyLevels personalEarnings={$totalMonthlyIncome} {levels} />
	</div>

	<div class="mt-6 text-center">
		<div class="flex justify-center space-x-4">
			<button on:click={decrementInspirations} class="btn btn-sm variant-ghost-warning">
				<Icon icon="mdi:minus" class="mr-2" />
				-1 Inspiration
			</button>
			<button on:click={incrementInspirations} class="btn btn-sm variant-ghost-primary">
				<Icon icon="mdi:plus" class="mr-2" />
				+1 Inspiration
			</button>
		</div>
	</div>
</div>
