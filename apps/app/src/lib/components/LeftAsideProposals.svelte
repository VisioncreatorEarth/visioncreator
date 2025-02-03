<!--
HOW THIS COMPONENT WORKS:

This is the left aside area of the proposals view that:
- Shows budget pool metrics and allocations
- Shows visioncreators counter with +/- controls
- Calculates invest and contribution pools based on visioncreators count
- Is collapsible on mobile and tablet by default
- Uses Tailwind for responsive design
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fly } from 'svelte/transition';
	import { poolMetrics, dashboardMetrics } from '$lib/stores/proposalStore';
	import type { ProposalState } from '$lib/stores/proposalStore';

	let isOpen = false;

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function adjustVisionCreators(increment: boolean) {
		$dashboardMetrics.visionCreators = increment
			? $dashboardMetrics.visionCreators + 1
			: Math.max(0, $dashboardMetrics.visionCreators - 1);
	}

	// Initialize visioncreators to 21 if not set
	$: if ($dashboardMetrics.visionCreators === 0) {
		$dashboardMetrics.visionCreators = 21;
	}

	// Monthly revenue starts at 0€
	$: monthlyRevenue = 0;

	// Calculate invest pool (visioncreators * 365€ * 75%)
	$: investPool = $dashboardMetrics.visionCreators * 365 * 0.75;

	// Contribution pool equals invest pool
	$: contributionPool = investPool;

	export let selectedState: ProposalState;
	export let onStateSelect: (state: ProposalState) => void;
	export let states: ProposalState[];
</script>

<!-- Mobile/Tablet Toggle Button (Bottom Left) -->
<button
	class="fixed z-50 p-2 transition-colors rounded-full shadow-xl bottom-6 left-4 bg-surface-800 hover:bg-surface-700 lg:hidden"
	on:click={toggleMenu}
>
	<Icon icon="mdi:menu" class="w-6 h-6 text-tertiary-300" />
</button>

<!-- Aside Container -->
<aside
	class="fixed top-0 left-0 z-40 h-screen transition-transform lg:translate-x-0 bg-surface-900 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
	class:w-64={isOpen}
	class:w-0={!isOpen}
	class:lg:w-64={true}
>
	{#if isOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)}
		<div
			class="h-full p-4 overflow-y-auto bg-surface-800/50"
			transition:fly={{ x: -100, duration: 200 }}
		>
			<div class="space-y-6">
				<!-- visioncreators Counter -->
				<div class="p-4 border rounded-lg border-surface-700/50">
					<h3 class="mb-2 text-sm font-semibold text-tertiary-200">Visioncreators</h3>
					<div class="flex items-center justify-between gap-4">
						<p class="text-3xl font-bold text-tertiary-100">{$dashboardMetrics.visionCreators}</p>
						<div class="flex gap-2">
							<button
								on:click={() => adjustVisionCreators(false)}
								class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 bg-tertiary-500/10"
							>
								<Icon icon="mdi:minus" class="w-5 h-5 text-tertiary-300" />
							</button>
							<button
								on:click={() => adjustVisionCreators(true)}
								class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 bg-tertiary-500/10"
							>
								<Icon icon="mdi:plus" class="w-5 h-5 text-tertiary-300" />
							</button>
						</div>
					</div>
				</div>

				<!-- Budget Pools Section -->
				<div class="p-4 border rounded-lg border-surface-700/50">
					<h3 class="mb-4 text-sm font-semibold text-tertiary-200">Budget Pools</h3>
					<div class="space-y-6">
						<div>
							<p class="text-3xl font-bold text-tertiary-100">{investPool}€</p>
							<p class="mt-1 text-sm text-tertiary-300">Invest Pool</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">{monthlyRevenue}€</p>
							<p class="mt-1 text-sm text-tertiary-300">Monthly Revenue</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">{contributionPool}€</p>
							<p class="mt-1 text-sm text-tertiary-300">Contribution Pool</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</aside>
