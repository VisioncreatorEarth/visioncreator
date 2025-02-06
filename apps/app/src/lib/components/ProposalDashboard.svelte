<!--
HOW THIS COMPONENT WORKS:

This is the dashboard area of the proposals view that:
1. Shows key metrics about the proposal system:
   - CTP: Fixed at 24.12€ per token with 5.7% increase
   - CCP: Total yearly contribution with 16.32% increase
   - MRR: Monthly recurring revenue from all VisionCreators (neutral)

2. Calculations:
   - CCP = VCs × 365 × 0.75
   - MRR = VCs × 365
   - Updates automatically when VisionCreator count changes

3. Features:
   - Real-time updates from store subscriptions
   - Dark/light mode support via Skeleton UI
   - Company branding with logo
   - Euro (€) currency format display
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { dashboardMetrics } from '$lib/stores/proposalStore';
	import type { ProposalState } from '$lib/stores/proposalStore';

	// Props
	export let activeTab: ProposalState;
	export let onStateSelect: (state: ProposalState) => void;
	export let states: ProposalState[];

	// Subscribe to store values
	$: visionCreators = $dashboardMetrics.visionCreators;
	$: contributionPool = Math.round(visionCreators * 365 * 0.75);
	$: monthlyRevenue = Math.round(visionCreators * 365);

	// Fixed values
	const tokenPrice = 24.12;
	const tokenPriceIncrease = 5.7;
	const contributionIncrease = 16.32;
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
						€{tokenPrice.toFixed(2)}<span class="text-sm font-medium">/t</span>
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
						€0<span class="text-sm font-medium">/m</span>
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
						€{contributionPool.toLocaleString()}<span class="text-sm font-medium" />
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
