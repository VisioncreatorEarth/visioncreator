<script lang="ts">
	import { writable } from 'svelte/store';

	let currentLevel = writable(2);

	const BASE_INCOME = 30; // €/month/user
	const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

	const levels = [
		{ name: 'Novice', habit: 'Daily Social Share', frequency: 'Daily', percentage: 1 },
		{ name: 'Beginner', habit: 'Invite a Friend', frequency: 'Weekly', percentage: 2 },
		{
			name: 'Supporter',
			habit: 'Engage in Community Discussion',
			frequency: 'Daily',
			percentage: 3
		},
		{
			name: 'Contributor',
			habit: 'Create Promotional Content',
			frequency: 'Weekly',
			percentage: 4
		},
		{ name: 'Networker', habit: 'Organize Local Meetup', frequency: 'Monthly', percentage: 5 },
		{ name: 'Creator', habit: 'Produce Testimonial Video', frequency: 'Monthly', percentage: 7 },
		{
			name: 'Advocate',
			habit: 'Represent at Industry Event',
			frequency: 'Quarterly',
			percentage: 9
		},
		{
			name: 'Influencer',
			habit: 'Host Webinar for Prospects',
			frequency: 'Monthly',
			percentage: 11
		},
		{ name: 'Ambassador', habit: 'Secure Media Coverage', frequency: 'Quarterly', percentage: 13 },
		{
			name: 'Partner',
			habit: 'Initiate Strategic Partnership',
			frequency: 'Quarterly',
			percentage: 16
		},
		{ name: 'Leader', habit: 'Develop Affiliate Program', frequency: 'Once', percentage: 19 },
		{
			name: 'Visionary',
			habit: 'Launch Viral Marketing Campaign',
			frequency: 'Bi-annually',
			percentage: 22
		},
		{
			name: 'Luminary',
			habit: 'Keynote at Major Conference',
			frequency: 'Annually',
			percentage: 25
		},
		{ name: 'Titan', habit: 'Establish Industry Alliance', frequency: 'Annually', percentage: 28 },
		{ name: 'Legend', habit: 'Create Global Movement', frequency: 'Once', percentage: 30 }
	];

	function incrementLevel() {
		$currentLevel = Math.min($currentLevel + 1, levels.length - 1);
	}

	function decrementLevel() {
		$currentLevel = Math.max($currentLevel - 1, 0);
	}

	function calculateIncomePotential(inspiredHumans: number, percentage: number): number {
		return (inspiredHumans * BASE_INCOME * percentage) / 100;
	}
</script>

<div class="w-full h-screen bg-surface-900 overflow-y-auto">
	<div
		class="w-full max-w-6xl mx-auto p-4 text-center flex flex-col items-center justify-start space-y-6 min-h-full py-8"
	>
		<h2 class="text-3xl font-bold text-primary-300">VisionCreator Growth Journey</h2>

		<div class="flex justify-center space-x-4 my-6">
			<button
				on:click={decrementLevel}
				class="btn variant-filled-primary"
				disabled={$currentLevel === 0}
			>
				Previous Level
			</button>
			<button
				on:click={incrementLevel}
				class="btn variant-filled-primary"
				disabled={$currentLevel === levels.length - 1}
			>
				Next Level
			</button>
		</div>

		<div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each levels as level, index}
				<div
					class="card p-4 {index <= $currentLevel
						? 'variant-filled-secondary'
						: 'variant-ghost-surface'}"
				>
					<header class="card-header flex justify-between items-center">
						<h3 class="text-xl font-semibold">Level {index + 1}</h3>
						<span class="badge variant-filled-primary">
							{fibonacci[index]} Inspired
						</span>
					</header>
					<section class="p-4 flex flex-col items-center justify-center h-40">
						<p class="text-2xl font-bold text-primary-300 mb-2">
							{calculateIncomePotential(fibonacci[index], level.percentage).toFixed(2)} €/month
						</p>
						{#if index <= $currentLevel}
							<p class="text-lg">{level.habit}</p>
							<p class="text-sm text-secondary-300 mb-2">{level.frequency}</p>
							<p class="text-lg">Percentage: {level.percentage}%</p>
						{:else}
							<Icon icon="mdi:lock" width="32" height="32" class="text-secondary-300 mb-2" />
							<p class="text-lg">{level.name}</p>
							<p class="text-sm text-secondary-300">Unlock to reveal habit</p>
						{/if}
					</section>
				</div>
			{/each}
		</div>
	</div>
</div>
