<!--
HOW THIS COMPONENT WORKS:

This is the dashboard area of the proposals view that:
1. Shows key metrics about the proposal system:
   - TP: Dynamic token price based on active VCs (Fibonacci sequence)
   - Pool: Total yearly contribution calculated from active VCs
   - MRR: Monthly recurring revenue (currently fixed at €0/m)

2. Data Source:
   - Uses queryOrgaStats endpoint for real-time metrics
   - Updates automatically via SvelteQuery
   - Calculates derived values from API data
   - MRR is currently hardcoded to 0
   - Token price dynamically calculated based on active VCs

3. Features:
   - Real-time updates from API
   - Dark/light mode support via Skeleton UI
   - Company branding with logo (hidden on mobile)
   - Euro (€) currency format display
   - Responsive design for mobile and desktop
-->

<script lang="ts">
	import type { ProposalState } from '$lib/stores/proposalStore';
	import { createQuery } from '$lib/wundergraph';

	// Props
	export let activeTab: string;
	export let states: string[];
	export let onStateSelect: (state: string) => void;

	// Query organization stats
	const orgaStatsQuery = createQuery({
		operationName: 'queryOrgaStats',
		refetchInterval: 30000 // Refetch every 30 seconds
	});

	// Add CCP query
	const ccpQuery = createQuery({
		operationName: 'getCCP',
		enabled: true,
		refetchInterval: 5000 // Update every 5 seconds
	});

	// Query for the current VC count
	const activeVCQuery = createQuery({
		operationName: 'activeVC',
		enabled: true
	});
	
	// Query for the investment metrics for details like next milestone threshold
	const investmentMetricsQuery = createQuery({
		operationName: 'getInvestmentMetrics',
		enabled: true,
		refetchInterval: 5000
	});

	// Reactive values from API
	$: stats = $orgaStatsQuery.data || {
		totalActiveVCs: 0,
		totalTokens: 0,
		currentTokenPrice: 1.0
	};

	// Fixed values
	const tokenPriceIncrease = 5.7;
	const contributionIncrease = 16.32;
	const monthlyRevenue = 0; // Hardcoded MRR

	// Compute token emission price from orgaStats
	$: tokenEmissionPrice = (() => {
		const price = $orgaStatsQuery.data?.currentTokenPrice;
		if (typeof price === 'object' && price !== null) {
			return Number(price.value) || 1.0;
		}
		return Number(price) || 1.0;
	})();

	// Get CCP value from the API
	$: ccpValue = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format($ccpQuery.data?.total ?? 0);

	// Get distribution percentages from the API
	$: eurePercentage = Math.round($ccpQuery.data?.distribution?.eure ?? 0);
	$: vcePercentage = Math.round($ccpQuery.data?.distribution?.vce ?? 0);

	// Extract the current VC count from the 'activeVC' endpoint (0 if not loaded)
	$: totalVCs = $activeVCQuery.data?.totalVCs ?? 0;

	// Compute the next milestone threshold based on levels from investment metrics.
	$: nextMilestone = (() => {
		const levels = $investmentMetricsQuery.data?.levels;
		if (!levels || levels.length === 0) return 0;
		// Find the first level whose totalVCs is greater than the current totalVCs.
		for (const level of levels) {
			if (level.totalVCs > totalVCs) return level.totalVCs;
		}
		// If none found, use the highest milestone available.
		return levels[levels.length - 1].totalVCs;
	})();

	// Calculate remaining Vision Creators needed for the next milestone; if the next milestone is not yet met, subtract current VCs
	$: remainingVCs = nextMilestone > totalVCs ? nextMilestone - totalVCs : 0;

	// Add state for modal
	let isMetricsModalOpen = false;

	// Enhanced toggle function with optional force value
	function toggleMetricsModal(force?: boolean) {
		isMetricsModalOpen = force !== undefined ? force : !isMetricsModalOpen;
	}

	// Handle ESC key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isMetricsModalOpen) {
			toggleMetricsModal(false);
		}
	}
</script>

<!-- Add keydown event listener to window -->
<svelte:window on:keydown={handleKeydown} />

<div class="w-full border-b-[0.5px] bg-surface-800/50 backdrop-blur-sm border-surface-700/50">
	<div class="max-w-5xl mx-auto -mb-2.5">
		<div class="flex items-center justify-between p-1 sm:p-2">
			<!-- Company Branding -->
			<div class="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4 border-r border-surface-700/50">
				<img src="/logo.png" alt="Visioncreator Logo" class="w-6 h-6 sm:w-8 sm:h-8" />
				<div class="hidden sm:block">
					<h2 class="text-xl font-semibold text-tertiary-100">Visioncreator</h2>
					<p class="text-xs text-tertiary-300">Community Contribution Pool</p>
				</div>
			</div>

			<!-- Metrics Grid -->
			<div class="flex justify-end gap-1 sm:gap-4 pr-3">
				<!-- Add group class and click handler -->
				<div 
					class="group relative cursor-pointer"
					on:click={toggleMetricsModal}
				>
					<!-- Glow effect rectangle -->
					<div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
						transition-opacity duration-300 bg-gradient-to-r from-surface-600/40 
						to-surface-700/40 shadow-[0_0_40px_rgba(255,255,255,0.3)] 
						border border-surface-400/20"></div>
					
					<!-- Existing metrics content -->
					<div class="relative flex gap-0 p-1 sm:p-2">
						<!-- Total VCs -->
						<div class="flex flex-col items-end mr-2 w-8 sm:w-12">
							<div class="flex justify-end w-full">
								<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">VCs</h3>
							</div>
							<p class="text-lg font-bold sm:text-2xl text-tertiary-100">
								{totalVCs}
							</p>
						</div>

						<!-- TP -->
						<div class="flex flex-col items-end mr-2 w-20 sm:w-24">
							<div class="flex justify-end w-full">
								<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">TEP</h3>
							</div>
							<p class="text-lg font-bold sm:text-2xl text-tertiary-100 whitespace-nowrap">
								€{tokenEmissionPrice.toFixed(2)}<span class="text-xs font-medium sm:text-sm">/t</span>
							</p>
						</div>

						<!-- POOL -->
						<div class="flex flex-col items-end w-20 sm:w-24">
							<div class="flex justify-end w-full">
								<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">POOL</h3>
							</div>
							<p class="text-lg font-bold sm:text-2xl text-tertiary-100">
								{ccpValue}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal -->
{#if isMetricsModalOpen}
	<!-- Backdrop with click handler -->
	<div 
		class="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
		on:click={() => toggleMetricsModal(false)}
	></div>
	
	<!-- Modal content in separate layer -->
	<div 
		class="fixed inset-0 z-50 flex items-start justify-center pointer-events-none"
	>
		<div 
			class="relative w-full max-w-[640px] h-[80vh] mt-24 mx-4 bg-surface-800 
			rounded-xl border border-surface-600/50 shadow-2xl overflow-y-auto
			pointer-events-auto"
		>
			<!-- Modal header -->
			<div class="sticky top-0 bg-surface-800 p-4 border-b border-surface-600/50">
				<h2 class="text-xl font-semibold text-tertiary-100">Metrics Details</h2>
				<!-- Close button -->
				<button 
					class="absolute top-4 right-4 text-tertiary-300 hover:text-tertiary-100"
					on:click={() => toggleMetricsModal(false)}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Modal body -->
			<div class="p-4 space-y-4">
				<!-- Detailed metrics grid -->
				<div class="grid grid-cols-2 gap-4">
					<div class="p-4 rounded-lg bg-surface-700/30">
						<h3 class="text-sm font-medium text-tertiary-200">Current VCs/Next VC Milestone</h3>
						<p class="text-2xl font-bold text-tertiary-100">
							{#if $investmentMetricsQuery.data}
								{totalVCs}/{nextMilestone}
							{:else}
								Loading…
							{/if}
						</p>
						<p class="text-sm text-tertiary-300 mt-2">
							{#if $investmentMetricsQuery.data}
								{remainingVCs} more Vision Creators needed for next milestone
							{:else}
								Please wait…
							{/if}
						</p>
					</div>
					
					<div class="p-4 rounded-lg bg-surface-700/30">
						<h3 class="text-sm font-medium text-tertiary-200">Current Token Emission Price</h3>
						<p class="text-2xl font-bold text-tertiary-100">
							{#if $orgaStatsQuery.data}
								€{tokenEmissionPrice.toFixed(2)}
							{:else}
								Loading…
							{/if}
						</p>
						<p class="text-sm text-tertiary-300 mt-2">1000 Tokens sold for €2000 in last round</p>
					</div>

					<div class="p-4 rounded-lg bg-surface-700/30">
						<h3 class="text-sm font-medium text-tertiary-200">Pool Distribution</h3>
						<p class="text-2xl font-bold text-tertiary-100">
							{#if $ccpQuery.data}
								{eurePercentage}% / {vcePercentage}%
							{:else}
								Loading…
							{/if}
						</p>
						<p class="text-sm text-tertiary-300 mt-2">EURe / VCE ratio</p>
					</div>

					<div class="p-4 rounded-lg bg-surface-700/30">
						<h3 class="text-sm font-medium text-tertiary-200">Total Pool Value</h3>
						<p class="text-2xl font-bold text-tertiary-100">{ccpValue}</p>
						<p class="text-sm text-tertiary-300 mt-2">Combined value of EURe and VCE</p>
					</div>
				</div>

				<!-- New Detailed Metrics Section -->
				<div class="p-4 rounded-lg bg-surface-700/30">
					<h3 class="text-sm font-medium text-tertiary-200 mb-3">Detailed Metrics</h3>
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 1</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 2</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 3</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 4</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 5</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 6</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 7</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 8</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 9</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-tertiary-300">Metric 10</span>
							<span class="text-tertiary-100 font-medium">-</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}


