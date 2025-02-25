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
	import { onMount, tick } from 'svelte';
	
	// Remove dynamic D3 imports and replace with static rendering
	// We'll use a completely static approach that doesn't depend on D3

	// Props
	export let activeTab: string;
	export let states: string[];
	export let onStateSelect: (state: string) => void;

	// Add flags for SSR and client-side rendering
	let isBrowser = typeof window !== 'undefined';
	let isMounted = false;
	
	// Add fallback data and error states
	let apiError = false;
	
	// Fallback for API failure
	$: {
		// Check if any of the queries have failed
		if (isBrowser && 
			($orgaStatsQuery.error || $ccpQuery.error || $activeVCQuery.error || $investmentMetricsQuery.error)) {
			console.error('API Error:', {
				orgaStats: $orgaStatsQuery.error,
				ccp: $ccpQuery.error,
				activeVC: $activeVCQuery.error,
				investmentMetrics: $investmentMetricsQuery.error
			});
			apiError = true;
		}
	}
	
	onMount(() => {
		try {
			isMounted = true;
			console.log('ProposalDashboard component mounted');
		} catch (error) {
			console.error('Error during component mount:', error);
		}
	});

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
			// Use optional chaining with a default value to handle potential missing 'value' property
			return Number((price as any)?.value ?? 1.0) || 1.0;
		}
		return Number(price) || 1.0;
	})();

	// Format the total pool value from CCP data
	$: formattedPoolValue = new Intl.NumberFormat('en-US', {
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

	// Static chart data - completely independent of D3
	const staticChartData = [
		{ month: 'Sep', value: 6000 },
		{ month: 'Oct', value: 9000 },
		{ month: 'Nov', value: 13000 },
		{ month: 'Dec', value: 17000 },
		{ month: 'Jan', value: 22000 },
		{ month: 'Feb', value: 28000 }
	];
	
	// Generate more detailed data points for a smoother line
	function generateDetailedData() {
		const result = [];
		// Create 30 points between each month for a smoother curve
		for (let i = 0; i < staticChartData.length - 1; i++) {
			const startPoint = staticChartData[i];
			const endPoint = staticChartData[i + 1];
			const startValue = startPoint.value;
			const endValue = endPoint.value;
			
			// Add the start point
			result.push({
				x: i * 100,
				y: startValue,
				isMainPoint: true,
				month: startPoint.month
			});
			
			// Add intermediate points
			for (let j = 1; j < 10; j++) {
				const progress = j / 10;
				// Base interpolation between months
				const baseValue = startValue + (endValue - startValue) * progress;
				
				// Add some natural variation
				const variation = Math.sin(progress * Math.PI) * (Math.random() * 800 - 400);
				const value = baseValue + variation;
				
				result.push({
					x: i * 100 + progress * 100,
					y: value,
					isMainPoint: false
				});
			}
		}
		
		// Add the final point
		result.push({
			x: (staticChartData.length - 1) * 100,
			y: staticChartData[staticChartData.length - 1].value,
			isMainPoint: true,
			month: staticChartData[staticChartData.length - 1].month
		});
		
		return result;
	}
	
	// Pre-calculate all the static chart elements
	const chartHeight = 260; // Further increased height
	const chartWidth = 500;
	
	// Generate detailed data points
	const detailedData = generateDetailedData();
	
	// Pre-calculate the line points for main month markers
	const linePoints = detailedData.filter(point => point.isMainPoint).map(point => {
		return {
			x: point.x,
			y: chartHeight - ((point.y + 10000) / 150) // Adjusted scale for taller chart with -10000 offset
		};
	});
	
	// Pre-calculate detailed line segments for the smooth curve
	interface LineSegment {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}
	
	// Pre-calculate the line segments
	const lineSegments: LineSegment[] = [];
	for (let i = 0; i < detailedData.length - 1; i++) {
		lineSegments.push({
			x1: detailedData[i].x,
			y1: chartHeight - ((detailedData[i].y + 10000) / 150), // Adjusted scale with offset
			x2: detailedData[i + 1].x,
			y2: chartHeight - ((detailedData[i + 1].y + 10000) / 150) // Adjusted scale with offset
		});
	}
	
	// Pre-calculate the area path
	function createAreaPath() {
		let path = `M 0 ${chartHeight} L ${detailedData[0].x} ${chartHeight - ((detailedData[0].y + 10000) / 150)}`;
		
		// Add points for each data point
		for (let i = 1; i < detailedData.length; i++) {
			path += ` L ${detailedData[i].x} ${chartHeight - ((detailedData[i].y + 10000) / 150)}`;
		}
		
		// Close the path
		path += ` L ${detailedData[detailedData.length - 1].x} ${chartHeight} Z`;
		
		return path;
	}
	
	const areaPathString = createAreaPath();
	
	// Y-axis ticks with more values for the taller chart, including negative values
	const yTicks = [-10000, -5000, 0, 5000, 10000, 15000, 20000, 25000, 30000];
	
	// Handle event with proper typing
	function handleMetricsClick(event: MouseEvent) {
		toggleMetricsModal();
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
					on:click={handleMetricsClick}
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
								€{tokenEmissionPrice.toFixed(2)}
							</p>
						</div>

						<!-- POOL -->
						<div class="flex flex-col items-end w-20 sm:w-24">
							<div class="flex justify-end w-full">
								<h3 class="text-xs font-medium sm:text-sm text-tertiary-200">POOL</h3>
							</div>
							<p class="text-lg font-bold sm:text-2xl text-tertiary-100">
								{#if $ccpQuery.data}
									{formattedPoolValue}
								{:else}
									Loading…
								{/if}
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
				{#if apiError}
					<div class="p-4 bg-red-900/30 rounded-lg border border-red-500/30">
						<h3 class="text-red-300 font-medium">Connection Error</h3>
						<p class="text-red-200 text-sm mt-2">
							Unable to connect to the API. Please check your connection and try again.
						</p>
					</div>
				{/if}
				
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
								Bring in {remainingVCs} new VC{remainingVCs !== 1 ? 's' : ''} to unlock next milestone
							{:else}
								Please wait…
							{/if}
						</p>
					</div>
					
					<div class="p-4 rounded-lg bg-surface-700/30">
						<h3 class="text-sm font-medium text-tertiary-200">Current VCR Emission Price</h3>
						<p class="text-2xl font-bold text-tertiary-100">
							{#if $orgaStatsQuery.data}
								€{tokenEmissionPrice.toFixed(2)}
							{:else}
								Loading…
							{/if}
						</p>
						<p class="text-sm text-tertiary-300 mt-2">Price VCR sold for in last round</p>
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
						<p class="text-2xl font-bold text-tertiary-100">
							{#if $ccpQuery.data}
								{formattedPoolValue}
							{:else}
								Loading…
							{/if}
						</p>
						<p class="text-sm text-tertiary-300 mt-2">Combined value of EURe and VCE</p>
					</div>
				</div>

				<!-- Cashflow Chart Section -->
				<div class="p-4 rounded-lg bg-surface-700/30">
					<h3 class="text-sm font-medium text-tertiary-200 mb-3">Cashflow</h3>
					
					<!-- Static chart that doesn't depend on D3 -->
					<div class="h-80 w-full flex justify-center"> <!-- Further increased height -->
						<svg width="100%" height="100%" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet"> <!-- Increased viewBox height -->
							<g transform="translate(50, 20)">
								<!-- Static chart with hardcoded values -->
								<line x1="0" y1="0" x2="0" y2="{chartHeight}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="1.5" />
								<line x1="0" y1="{chartHeight}" x2="520" y2="{chartHeight}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="1.5" />
								
								<!-- Y-axis ticks and labels -->
								{#each yTicks as value}
									<line 
										x1="0" 
										y1="{chartHeight - ((value + 10000) / 150)}" 
										x2="520" 
										y2="{chartHeight - ((value + 10000) / 150)}" 
										stroke="#ffffff" 
										stroke-opacity="0.15" 
										stroke-dasharray="2,2"
									/>
									<text 
										x="-10" 
										y="{chartHeight - ((value + 10000) / 150)}" 
										text-anchor="end" 
										dominant-baseline="middle"
										fill="#ffffff"
										font-size="12px"
										font-weight="600"
									>
										€{value/1000}K
									</text>
								{/each}
								
								<!-- Zero line highlighted -->
								<line 
									x1="0" 
									y1="{chartHeight - ((0 + 10000) / 150)}" 
									x2="520" 
									y2="{chartHeight - ((0 + 10000) / 150)}" 
									stroke="#ffffff" 
									stroke-opacity="0.4" 
									stroke-width="1.5"
								/>
								
								<!-- Simplified X-axis -->
								{#each staticChartData as point, i}
									<text 
										x="{i * 100}" 
										y="{chartHeight + 20}" 
										text-anchor="middle" 
										fill="#ffffff" 
										font-size="14px"
										font-weight="600"
									>
										{point.month}
									</text>
								{/each}
								
								<!-- Fill area under the line -->
								<path 
									d={areaPathString}
									fill="#6366f1"
									fill-opacity="0.15"
									class="filter-glow"
								/>
								
								<!-- Detailed line segments for smoother curve -->
								{#each lineSegments as segment}
									<line 
										x1="{segment.x1}" 
										y1="{segment.y1}" 
										x2="{segment.x2}" 
										y2="{segment.y2}" 
										stroke="#6366f1" 
										stroke-width="2"
										class="filter-glow"
									/>
								{/each}
								
								<!-- Only show circles for main month points -->
								{#each linePoints as point, i}
									<circle 
										cx="{point.x}" 
										cy="{point.y}" 
										r="4" 
										fill="#ffffff"
										stroke="#6366f1"
										stroke-width="2"
										class="filter-glow"
									/>
								{/each}
							</g>
						</svg>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Add glow effect for the chart line */
	.filter-glow {
		filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.8)); /* Stronger glow */
	}

	/* Set a general stroke width for the chart */
	:global(svg line) {
		stroke-width: 1.2px;
	}
	
	/* Ensure text is visible with proper sizing */
	:global(svg text) {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		font-size: 12px;
		font-weight: 600;
		fill: #ffffff;
	}
</style>


