<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import Papa from 'papaparse';
  import { browser } from '$app/environment';
  
  // Import visualization components
  import TokenDistribution from './components/TokenDistribution.svelte';
  import InvestmentData from './components/InvestmentData.svelte';
  import RoundComparison from './components/RoundComparison.svelte';
  
  // Stores for state management
  const tokenData = writable<TokenDataPoint[]>([]);
  const selectedRound = writable(1);
  const selectedView = writable('summary');
  const isLoading = writable(true);
  
  // Create a derived store for the current round data
  const currentRoundData = derived(
    [tokenData, selectedRound],
    ([$tokenData, $selectedRound]) => {
      if ($tokenData.length === 0) return null;
      return $tokenData.find(d => d.round === $selectedRound) || $tokenData[0];
    }
  );
  
  // Interface for our data
  interface TokenDataPoint {
    round: number;
    totalVCs: number;
    newVCs: number;
    investRound: number;
    totalInvestSum: number;
    tokenEmissionPrice: number;
    tokenPerVC: number;
    tokenEmittedInRound: number;
    totalShares: number;
    communityTokenPool: number;
    investmentPool: number;
    adminPool: number;
    totalPoolValue: number;
    description?: string;
  }
  
  // Function to generate mock data instead of parsing CSV
  function generateMockData() {
    isLoading.set(true);
    
    // Generate 10 rounds of mock data
    const mockData: TokenDataPoint[] = [];
    
    for (let i = 1; i <= 10; i++) {
      // Growth factors - each round gets bigger
      const growthFactor = 1 + (i * 0.15);
      const priceGrowthFactor = 1 + (i * 0.1);
      
      // Base values for round 1
      const baseVCs = 15;
      const baseInvestment = 5475; // 15 VCs * 365€
      const baseTokenPrice = 1;
      const baseTokenPerVC = 365;
      
      // Calculate values with growth
      const totalVCs = Math.round(baseVCs * Math.pow(growthFactor, i - 1));
      const newVCs = i === 1 ? totalVCs : Math.round(totalVCs - (baseVCs * Math.pow(growthFactor, i - 2)));
      const investRound = newVCs * 365;
      const totalInvestSum = totalVCs * 365;
      const tokenEmissionPrice = baseTokenPrice * Math.pow(priceGrowthFactor, i - 1);
      const tokenPerVC = baseTokenPerVC;
      const tokenEmittedInRound = newVCs * tokenPerVC;
      const totalShares = totalVCs * tokenPerVC;
      
      // Pool values
      const communityTokenPool = Math.round(totalShares * 0.5); // 50% of tokens go to community pool
      const investmentPool = totalInvestSum * 0.75; // 75% of investments
      const adminPool = totalInvestSum * 0.25; // 25% of investments
      const totalPoolValue = investmentPool + adminPool;
      
      // Description based on round
      let description = "";
      if (i === 1) description = "Initial Launch";
      else if (i === 4) description = "Token Expansion";
      else if (i === 7) description = "Scaling Phase";
      else if (i === 10) description = "Growth Acceleration";
      
      mockData.push({
        round: i,
        totalVCs,
        newVCs,
        investRound,
        totalInvestSum,
        tokenEmissionPrice,
        tokenPerVC,
        tokenEmittedInRound,
        totalShares,
        communityTokenPool,
        investmentPool,
        adminPool,
        totalPoolValue,
        description
      });
    }
    
    console.log('Generated mock data:', mockData);
    tokenData.set(mockData);
    isLoading.set(false);
  }
  
  // Format currency values
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }
  
  // Format large numbers (tokens, shares)
  function formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toFixed(0);
    }
  }
  
  // Handle round selection
  function selectRound(round: number) {
    selectedRound.set(round);
  }
  
  // Handle view selection
  function selectView(view: string) {
    selectedView.set(view);
  }
  
  // Initialize on mount
  onMount(() => {
    if (browser) {
      // Use mock data instead of CSV
      generateMockData();
    }
  });
</script>

<svelte:head>
  <title>Token Emission Dashboard</title>
  <meta name="description" content="Visioncreator Token Emission Data Visualization">
</svelte:head>

<main class="min-h-screen bg-surface-900 text-tertiary-300 font-base">
  <div class="container mx-auto px-4 py-8 max-w-5xl">
    <h1 class="text-3xl md:text-4xl font-bold text-tertiary-300 mb-4 font-heading">Token Emission Dashboard</h1>
    
    {#if $isLoading}
      <div class="flex justify-center items-center py-20">
        <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-4">Loading token emission data...</span>
      </div>
    {:else}
      <!-- Main Layout: Sidebar + Content -->
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Sidebar with round selection -->
        <aside class="md:w-56 flex-shrink-0 bg-surface-800 rounded-lg p-4 max-h-[500px] overflow-y-auto">
          <h2 class="text-xl font-semibold mb-4 text-tertiary-300">Investment Rounds</h2>
          <div class="space-y-2">
            {#each $tokenData as round}
              <button 
                class="w-full text-left p-2 rounded-md transition-colors flex items-center justify-between {$selectedRound === round.round ? 'bg-primary-500 text-surface-900' : 'hover:bg-surface-700'}"
                on:click={() => selectRound(round.round)}
              >
                <span class="font-medium">Round {round.round}</span>
                <span class="text-xs bg-surface-700 text-tertiary-300 py-1 px-2 rounded-full {$selectedRound === round.round ? 'bg-surface-900' : ''}">{round.totalVCs} VCs</span>
              </button>
            {/each}
          </div>
        </aside>
        
        <!-- Main content area -->
        <div class="flex-1 bg-surface-800 rounded-lg">
          <!-- View selector tabs -->
          <div class="border-b border-surface-700 px-4">
            <div class="flex overflow-x-auto">
              <button 
                class="p-4 font-medium transition-colors whitespace-nowrap {$selectedView === 'summary' ? 'border-b-2 border-primary-500 text-primary-500' : 'hover:text-tertiary-300'}"
                on:click={() => selectView('summary')}
              >
                Summary
              </button>
              <button 
                class="p-4 font-medium transition-colors whitespace-nowrap {$selectedView === 'token-distribution' ? 'border-b-2 border-primary-500 text-primary-500' : 'hover:text-tertiary-300'}"
                on:click={() => selectView('token-distribution')}
              >
                Token Distribution
              </button>
              <button 
                class="p-4 font-medium transition-colors whitespace-nowrap {$selectedView === 'investment' ? 'border-b-2 border-primary-500 text-primary-500' : 'hover:text-tertiary-300'}"
                on:click={() => selectView('investment')}
              >
                Investment Data
              </button>
              <button 
                class="p-4 font-medium transition-colors whitespace-nowrap {$selectedView === 'comparison' ? 'border-b-2 border-primary-500 text-primary-500' : 'hover:text-tertiary-300'}"
                on:click={() => selectView('comparison')}
              >
                Round Comparison
              </button>
            </div>
          </div>
          
          <!-- Content for selected round and view -->
          <div class="p-6">
            {#if $selectedView === 'summary'}
              <!-- Summary View -->
              <div>
                {#if $currentRoundData}
                  <div class="bg-surface-700 p-5 rounded-lg mb-6">
                    <h2 class="text-2xl font-bold mb-2">Round {$currentRoundData.round} {$currentRoundData.description ? `- ${$currentRoundData.description}` : ''}</h2>
                    <p class="text-tertiary-300 mb-4">Overview of token emission for investment round {$currentRoundData.round}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Vision Creators</h3>
                        <p class="text-2xl font-bold">{$currentRoundData.totalVCs}</p>
                        <p class="text-sm text-tertiary-300">+{$currentRoundData.newVCs} new</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Total Investment</h3>
                        <p class="text-2xl font-bold">{formatCurrency($currentRoundData.totalInvestSum)}</p>
                        <p class="text-sm text-tertiary-300">+{formatCurrency($currentRoundData.investRound)} this round</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Token Price</h3>
                        <p class="text-2xl font-bold">{formatCurrency($currentRoundData.tokenEmissionPrice)}</p>
                        <p class="text-sm text-tertiary-300">{$currentRoundData.tokenPerVC} tokens per VC</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Total Shares</h3>
                        <p class="text-2xl font-bold">{formatNumber($currentRoundData.totalShares)}</p>
                        <p class="text-sm text-tertiary-300">+{$currentRoundData.tokenEmittedInRound} tokens this round</p>
                      </div>
                    </div>
                    
                    <h3 class="text-xl font-semibold mb-3">Pool Distribution</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Community Token Pool</h4>
                        <p class="text-2xl font-bold">{formatNumber($currentRoundData.communityTokenPool)}</p>
                        <p class="text-sm text-tertiary-300">Total tokens</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg border-l-4 border-tertiary-500">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Investment Pool</h4>
                        <p class="text-2xl font-bold">{formatCurrency($currentRoundData.investmentPool)}</p>
                        <p class="text-sm text-tertiary-300">75% of investments</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg border-l-4 border-secondary-500">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Admin Pool</h4>
                        <p class="text-2xl font-bold">{formatCurrency($currentRoundData.adminPool)}</p>
                        <p class="text-sm text-tertiary-300">25% of investments</p>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {:else if $selectedView === 'token-distribution'}
              <!-- Token Distribution Component -->
              {#if $currentRoundData}
                <TokenDistribution data={$currentRoundData} />
              {/if}
            {:else if $selectedView === 'investment'}
              <!-- Investment Data Component -->
              {#if $currentRoundData}
                <InvestmentData data={$currentRoundData} />
              {/if}
            {:else if $selectedView === 'comparison'}
              <!-- Round Comparison Component -->
              {#if $tokenData.length > 0}
                <RoundComparison allRounds={$tokenData} currentRound={$selectedRound} />
              {/if}
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    background-color: var(--color-surface-900);
    color: var(--color-tertiary-300);
    font-family: var(--theme-font-family-base);
  }
  
  /* Define CSS variables with fallbacks */
  :root {
    --color-surface-900: #0d1132;
    --color-surface-800: #10153d;
    --color-surface-700: #141a4d;
    --color-tertiary-500: #dad3be;
    --color-tertiary-300: #f0ede5;
    --color-primary-500: #e9c96e;
    --color-secondary-500: #40b7c8;
    --theme-font-family-base: 'Rethink', sans-serif;
    --theme-font-family-heading: 'VisioncreatorFamily', sans-serif;
  }
  
  .font-heading {
    font-family: var(--theme-font-family-heading);
  }
  
  .font-base {
    font-family: var(--theme-font-family-base);
  }
</style>
  