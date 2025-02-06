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
   - Company branding with logo
   - Euro (€) currency format display
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { dashboardMetrics } from '$lib/stores/proposalStore';
	import type { ProposalState } from '$lib/stores/proposalStore';
	import { createQuery } from '$lib/wundergraph';

	// Props
	export let activeTab: ProposalState;
	export let onStateSelect: (state: ProposalState) => void;
	export let states: ProposalState[];

	// Query organization stats
	const orgaStatsQuery = createQuery({
		operationName: 'queryOrgaStats',
		refetchInterval: 30000 // Refetch every 30 seconds
	});

	// Query admin's EURe balance
	const adminTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId: '00000000-0000-0000-0000-000000000001' },
		enabled: true,
		refetchInterval: 30000
	});

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
</script>

<div class="w-full border-b bg-surface-800/50 backdrop-blur-sm border-surface-700/50">
	<div class="max-w-5xl mx-auto">
		<div class="flex items-center justify-between p-4">
			<!-- Company Branding -->
			<div class="flex items-center gap-4 pr-6 border-r border-surface-700/50">
				<img src="/logo.png" alt="Visioncreator Logo" class="w-10 h-10" />
				<div>
					<h2 class="text-2xl font-semibold text-tertiary-100">Visioncreator</h2>
					<p class="text-sm text-tertiary-300">GmbH</p>
				</div>
			</div>

			<!-- Metrics Grid -->
			<div class="flex justify-end gap-6">
				<!-- TP -->
				<div class="flex flex-col items-end gap-1">
					<div class="flex items-center gap-2 whitespace-nowrap">
						<span
							class="px-1.5 py-0.5 text-xs font-medium rounded-full bg-success-500/10 text-success-400"
						>
							+{tokenPriceIncrease}%
						</span>
						<h3 class="text-sm font-medium text-tertiary-200">TP</h3>
					</div>
					<p class="text-2xl font-bold text-tertiary-100 whitespace-nowrap">
						€{stats.currentTokenPrice.toFixed(2)}<span class="text-sm font-medium">/t</span>
					</p>
				</div>

				<!-- MRR -->
				<div class="flex flex-col items-end gap-1">
					<div class="flex items-center gap-2 whitespace-nowrap">
						<span
							class="px-1.5 py-0.5 text-xs font-medium rounded-full bg-surface-700/50 text-surface-300"
						>
							0%
						</span>
						<h3 class="text-sm font-medium text-tertiary-200">MRR</h3>
					</div>
					<p class="text-2xl font-bold text-tertiary-100 whitespace-nowrap">
						€{monthlyRevenue}<span class="text-sm font-medium">/m</span>
					</p>
				</div>

				<!-- CCP -->
				<div class="flex flex-col items-end gap-1">
					<div class="flex items-center gap-2 whitespace-nowrap">
						<span
							class="px-1.5 py-0.5 text-xs font-medium rounded-full bg-success-500/10 text-success-400"
						>
							+{contributionIncrease}%
						</span>
						<h3 class="text-sm font-medium text-tertiary-200">CCP</h3>
					</div>
					<p class="text-2xl font-bold text-tertiary-100 whitespace-nowrap">
						€{adminEureBalance.toLocaleString()}<span class="text-sm font-medium" />
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
