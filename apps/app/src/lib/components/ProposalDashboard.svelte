<!--
HOW THIS COMPONENT WORKS:

This is the dashboard area of the proposals view that:
1. Shows key metrics about the proposal system:
   - TP: Dynamic token price based on active VCs (Fibonacci sequence)
   - CCP: Total yearly contribution calculated from active VCs
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

	// Query admin's EURe balance and VCE balance
	const adminTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId: '00000000-0000-0000-0000-000000000001' },
		enabled: true,
		refetchInterval: 30000
	});

	// Add CCP query
	const ccpQuery = createQuery({
		operationName: 'getCCP',
		enabled: true,
		refetchInterval: 5000 // Update every 5 seconds
	});

	// Get total VCs from investment metrics
	const investmentMetricsQuery = createQuery({
		operationName: 'getInvestmentMetrics',
		enabled: true,
		refetchInterval: 5000
	});

	// Declare variables before using them in reactive statements
	let eurePercentage = 0;
	let vcePercentage = 0;

	// Reactive values from API
	$: stats = $orgaStatsQuery.data || {
		totalActiveVCs: 0,
		totalTokens: 0,
		currentTokenPrice: 1.0
	};

	// Get admin's EURe balance
	$: adminEureBalance = $adminTokensQuery.data?.balances?.EURe?.balance || 0;

	// Fixed values
	const tokenPriceIncrease = 5.7;
	const contributionIncrease = 16.32;
	const monthlyRevenue = 0; // Hardcoded MRR

	// Get current token price from orgaStats
	$: currentTokenPrice = $orgaStatsQuery.data?.currentTokenPrice || 1.0;

	// Calculate CCP using admin's total VCE (staked + unstaked) * token price + EURe
	$: ccpValue = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(
		($adminTokensQuery.data?.balances?.EURe?.balance || 0) +
			(($adminTokensQuery.data?.balances?.VCE?.balance || 0) +
				($adminTokensQuery.data?.balances?.VCE?.staked_balance || 0)) *
				currentTokenPrice
	);

	// Format distribution percentages based on actual values
	$: {
		const eureAmount = $adminTokensQuery.data?.balances?.EURe?.balance || 0;
		const totalVceAmount =
			($adminTokensQuery.data?.balances?.VCE?.balance || 0) +
			($adminTokensQuery.data?.balances?.VCE?.staked_balance || 0);
		const vceInEure = totalVceAmount * currentTokenPrice;
		const total = eureAmount + vceInEure;

		eurePercentage = total > 0 ? Math.round((eureAmount / total) * 100) : 0;
		vcePercentage = total > 0 ? Math.round((vceInEure / total) * 100) : 0;
	}

	// Reactive value for total VCs
	$: totalVCs = $investmentMetricsQuery.data?.totalVCs || 0;
</script>

<div class="w-full border-b bg-surface-800/50 backdrop-blur-sm border-surface-700/50">
	<div class="max-w-5xl mx-auto">
		<div class="flex items-center justify-between p-4">
			<!-- Company Branding -->
			<div class="flex items-center gap-4 pr-6 border-r border-surface-700/50">
				<img src="/logo.png" alt="Visioncreator Logo" class="w-9 h-9 sm:w-10 sm:h-10" />
				<div class="hidden sm:block">
					<h2 class="text-2xl font-semibold text-tertiary-100">Visioncreator</h2>
					<p class="text-sm text-tertiary-300">GmbH</p>
				</div>
			</div>

			<!-- Metrics Grid -->
			<div class="flex justify-end gap-3 sm:gap-6">
				<!-- Total VCs -->
				<div class="flex flex-col items-end gap-0.5 sm:gap-1">
					<div class="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
						<!-- Add invisible placeholder to match height of other metrics with badges -->
						<span class="invisible px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs">000</span>
						<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">VCs</h3>
					</div>
					<p class="text-lg font-bold sm:text-2xl text-tertiary-100">
						{totalVCs}
					</p>
				</div>

				<!-- TP -->
				<div class="flex flex-col items-end gap-0.5 sm:gap-1">
					<div class="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
						<span
							class="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-success-500/10 text-success-400"
						>
							+{tokenPriceIncrease}%
						</span>
						<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">TP</h3>
					</div>
					<p class="text-lg font-bold sm:text-2xl text-tertiary-100 whitespace-nowrap">
						€{stats.currentTokenPrice.toFixed(2)}<span class="text-xs font-medium sm:text-sm"
							>/t</span
						>
					</p>
				</div>

				<!-- MRR -->
				<div class="flex flex-col items-end gap-0.5 sm:gap-1">
					<div class="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
						<span
							class="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-surface-700/50 text-surface-300"
						>
							0%
						</span>
						<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">MRR</h3>
					</div>
					<p class="text-lg font-bold sm:text-2xl text-tertiary-100 whitespace-nowrap">
						€{monthlyRevenue}<span class="text-xs font-medium sm:text-sm">/m</span>
					</p>
				</div>

				<!-- CCP -->
				<div class="flex flex-col items-end gap-0.5 sm:gap-1">
					<div class="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
						<span
							class="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-secondary-500/10 text-secondaryw-400"
						>
							{eurePercentage}% / {vcePercentage}%
						</span>
						<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">CCP</h3>
					</div>
					<p class="text-lg font-bold sm:text-2xl text-tertiary-100 whitespace-nowrap">
						{ccpValue}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
