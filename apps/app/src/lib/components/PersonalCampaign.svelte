<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

	export let personalVCs: number;
	export let personalEarnings: number;
	export let currentEarnPerInspiration: number;

	const dispatch = createEventDispatcher();

	function simulateInspiration() {
		dispatch('simulate');
	}

	$: nextPotentialEarnings = personalEarnings + currentEarnPerInspiration;
</script>

<div class="bg-surface-800 p-4 rounded-xl mb-4 shadow-lg">
	<h2 class="text-2xl font-bold mb-4 text-center text-primary-300">Your VisionCreator Dashboard</h2>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div
			class="md:col-span-2 bg-surface-700 p-4 rounded-xl shadow-md flex flex-col items-center justify-center"
		>
			<Icon icon="mdi:currency-eur" class="text-4xl mb-2 text-secondary-300" />
			<h3 class="text-xl font-semibold mb-2">Earnings</h3>
			<div class="flex items-center justify-center w-full">
				<div class="text-center flex-1">
					<p class="text-sm mb-1">Current</p>
					<p class="text-2xl font-bold text-primary-300">{formatCurrency(personalEarnings)}/m</p>
				</div>
				<Icon icon="mdi:arrow-right" class="text-3xl mx-2 text-secondary-300" />
				<div class="text-center flex-1">
					<p class="text-sm mb-1">Next Inspiration</p>
					<p class="text-2xl font-bold text-success-300">
						{formatCurrency(nextPotentialEarnings)}/m
					</p>
					<p class="text-xs text-success-500">
						+{formatCurrency(currentEarnPerInspiration)}
					</p>
				</div>
			</div>
		</div>
		<div class="bg-surface-700 p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
			<Icon icon="mdi:account-group" class="text-4xl mb-2 text-secondary-300" />
			<h3 class="text-xl font-semibold mb-2">Inspirations</h3>
			<p class="text-3xl font-bold text-primary-300">{personalVCs}</p>
		</div>
	</div>
	<div class="mt-4 text-center">
		<button on:click={simulateInspiration} class="btn btn-sm variant-ghost-primary">
			<Icon icon="mdi:plus" class="mr-1" />
			Add 1 Inspiration
		</button>
	</div>
</div>
