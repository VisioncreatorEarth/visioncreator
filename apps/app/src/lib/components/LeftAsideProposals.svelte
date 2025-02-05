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
	import { activeSidePanel } from '$lib/stores/sidePanelStore';

	function toggleMenu() {
		if ($activeSidePanel === 'left') {
			activeSidePanel.close();
		} else {
			activeSidePanel.openLeft();
		}
	}

	$: isOpen = $activeSidePanel === 'left';

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

<!-- Mobile Toggle Button -->
<button
	class="fixed z-50 p-2 transition-colors rounded-full shadow-xl bottom-6 left-4 bg-surface-800 hover:bg-surface-700 lg:hidden"
	on:click={toggleMenu}
>
	<Icon icon={isOpen ? 'mdi:close' : 'mdi:menu'} class="w-6 h-6 text-tertiary-300" />
</button>

<!-- Overlay when menu is open on mobile/tablet -->
{#if isOpen && typeof window !== 'undefined' && window.innerWidth < 1024}
	<div
		class="fixed inset-0 z-40 bg-surface-800/50 backdrop-blur-sm"
		on:click={() => activeSidePanel.close()}
		transition:fly={{ duration: 200, opacity: 0 }}
	/>
{/if}

<!-- Aside Container -->
<div
	class="aside-panel left-0 z-50 transition-transform duration-200 border-r {isOpen
		? 'translate-x-0'
		: '-translate-x-full'} {typeof window !== 'undefined' && window.innerWidth >= 1024
		? 'lg:translate-x-0 lg:w-64'
		: 'w-[280px]'}"
>
	<div class="flex flex-col h-full overflow-hidden bg-surface-900/95 backdrop-blur-sm">
		<!-- Main Content Area -->
		<div class="flex-1 overflow-y-auto">
			<div class="p-6 space-y-6">
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

		<!-- Close Button at Bottom -->
		{#if typeof window !== 'undefined' && window.innerWidth < 1024}
			<div class="p-4 border-t border-surface-700/50">
				<button
					class="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors rounded-lg hover:bg-surface-800"
					on:click={() => activeSidePanel.close()}
				>
					<Icon icon="mdi:close" class="w-5 h-5 text-tertiary-300" />
					<span class="text-sm font-medium text-tertiary-300">Close Menu</span>
				</button>
			</div>
		{/if}
	</div>
</div>
