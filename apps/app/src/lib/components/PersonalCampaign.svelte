<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatCurrency } from '$lib/milestone';
	import Icon from '@iconify/svelte';

	export let personalVCs: number;
	export let personalEarnings: number;
	export let currentEarnPerInspiration: number;

	const dispatch = createEventDispatcher();

	function simulateInspiration(amount: number) {
		dispatch('simulate', { amount });
	}

	function handleReset() {
		dispatch('reset');
	}

	function handleRandomInspiration() {
		dispatch('random');
	}

	$: nextPotentialEarnings = personalEarnings + currentEarnPerInspiration;
</script>

<div class="p-4 mb-4 shadow-lg bg-surface-800 rounded-xl">
	<h2 class="mb-4 text-2xl font-bold text-center text-primary-300">Your VisionCreator Dashboard</h2>
	<!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div
			class="flex flex-col items-center justify-center p-4 shadow-md md:col-span-2 bg-surface-700 rounded-xl"
		>
			<h3 class="mb-2 text-xl font-semibold">Earnings</h3>
			<div class="flex items-center justify-center w-full">
				<div class="flex-1 text-center">
					<p class="mb-1 text-sm">Current Earnings</p>
					<p class="text-2xl font-bold text-primary-300">{formatCurrency(personalEarnings)}/m</p>
				</div>
				<Icon icon="mdi:arrow-right" class="mx-2 text-3xl text-secondary-300" />
				<div class="flex-1 text-center">
					<p class="mb-1 text-sm">Next Inspiration</p>
					<p class="text-2xl font-bold text-success-300">
						{formatCurrency(nextPotentialEarnings)}/m
					</p>
					<p class="text-xs text-success-500">
						+{formatCurrency(currentEarnPerInspiration)}
					</p>
				</div>
			</div>
		</div>
		<div class="flex flex-col items-center justify-center p-4 shadow-md bg-surface-700 rounded-xl">
			<h3 class="mb-2 text-xl font-semibold">Inspirations</h3>
			<p class="text-3xl font-bold text-primary-300">{personalVCs}</p>
		</div>
	</div>

	<div class="mt-6">
		<h3 class="mb-4 text-xl font-semibold text-center">VisionCreator Levels</h3>
		<VisioncreatorLevels {personalVCs} />
	</div> -->

	<div class="mt-6 text-center">
		<div class="flex flex-wrap justify-center gap-4">
			<button on:click={() => simulateInspiration(1)} class="btn btn-sm variant-ghost-primary">
				<Icon icon="mdi:plus" class="mr-2" />
				+1 VC
			</button>
			<button on:click={() => simulateInspiration(8)} class="btn btn-sm variant-ghost-secondary">
				<Icon icon="mdi:plus" class="mr-2" />
				+8 VCs
			</button>
			<button on:click={() => simulateInspiration(21)} class="btn btn-sm variant-ghost-tertiary">
				<Icon icon="mdi:plus" class="mr-2" />
				+21 VCs
			</button>
			<button on:click={handleRandomInspiration} class="btn btn-sm variant-ghost-primary">
				<Icon icon="mdi:dice-multiple" class="mr-2" />
				+Random VCs
			</button>
			<button on:click={handleReset} class="btn btn-sm variant-ghost-error">
				<Icon icon="mdi:refresh" class="mr-2" />
				Reset
			</button>
		</div>
	</div>
</div>
