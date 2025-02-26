<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { browser } from '$app/environment';
  import type { TokenDataPoint } from './types';
  
  // Import visualization components
  import TokenDistribution from './components/TokenDistribution.svelte';
  import InvestmentData from './components/InvestmentData.svelte';
  import RoundComparison from './components/RoundComparison.svelte';
  
  // Import token emission data
  import tokenEmissionData from './token_emission.json';
  
  // Stores for state management
  const tokenData = writable<TokenDataPoint[]>([]);
  const selectedRound = writable(1);
  const selectedView = writable('summary');
  const isLoading = writable(true);
  
  // Create a derived store for the current round data
  const currentRoundData = derived(
    [tokenData, selectedRound],
    ([$tokenData, $selectedRound]) => {
      console.log('Deriving currentRoundData, tokenData length:', $tokenData.length, 'selectedRound:', $selectedRound);
      if ($tokenData.length === 0) {
        console.log('No token data available');
        return null;
      }
      const foundRound = $tokenData.find(d => d.round === $selectedRound);
      console.log('Found round data:', foundRound || 'Not found');
      return foundRound || $tokenData[0];
    }
  );
  
  // Function to parse currency string to number
  function parseCurrency(value: string | undefined | null): number {
    if (!value || typeof value !== 'string') {
      console.warn('Invalid value for parseCurrency:', value);
      console.trace('Stack trace for invalid currency value');
      return 0;
    }
    try {
      // Remove currency symbol, spaces, and replace comma with dot
      return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    } catch (error) {
      console.error('Error parsing currency:', error);
      return 0;
    }
  }
  
  // Function to parse percentage string to number
  function parsePercentage(value: string | undefined | null): number {
    if (!value || typeof value !== 'string') {
      console.warn('Invalid value for parsePercentage:', value);
      return 0;
    }
    try {
      // Remove percentage symbol, spaces, and replace comma with dot
      return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) / 100 || 0;
    } catch (error) {
      console.error('Error parsing percentage:', error);
      return 0;
    }
  }
  
  // Load data from JSON file
  function loadTokenEmissionData() {
    isLoading.set(true);
    
    try {
      console.log('Loading token emission data from JSON...');
      
      // Transform the data to match our interface
      const transformedData = tokenEmissionData.map(round => {
        console.log('Processing round:', round.Round);
        
        // Add descriptions to specific rounds
        let description = "";
        if (round.Round === 1) description = "Initial Launch";
        else if (round.Round === 4) description = "Token Expansion";
        else if (round.Round === 7) description = "Scaling Phase";
        else if (round.Round === 10) description = "Growth Acceleration";
        
        try {
          const data: TokenDataPoint = {
            round: round.Round,
            totalVCs: round["Total VCs (VisionCreators)"],
            newVCs: round["New VCs"],
            investRound: parseCurrency(round["Invest Round (= new VCs * 365€)"]),
            totalInvestSum: parseCurrency(round["Total Invest Sum"]),
            tokenEmissionPrice: parseCurrency(round["Token Emission Price"]),
            tokenPerVC: parseFloat(String(round["Token Per VC"]).replace(',', '.')),
            tokenEmittedInRound: round["Token emitted in this round"],
            totalShares: round["Total Shares (Token + reg. Capital)"],
            communityTokenPool: round["Sum of token in com. token pool"],
            addedTokensToPool: round["Added tokens to community token pool"],
            investmentPool: parseCurrency(round["Investment pool (SumInvests *0,75)"]),
            adminPool: parseCurrency(round["Admin Pool (SumInvest * 0,25)"]),
            totalPoolValue: parseCurrency(round["Total value of both pools in €"]),
            addedPoolValue: parseCurrency(round["Added value to both pools in this round in €"]),
            capitalIncrease: parsePercentage(round["Capital increase in % (from reg. capital)"]),
            regCapitalShare: parsePercentage(round["Reg. capital share of value"]),
            foundersDAOTreasuryShare: parsePercentage(round["Founders + DAO Treasury (in % of all tokens)"]),
            daoTreasuryShare: parsePercentage(round["DAO Treasury (in % of all tokens)"]),
            perFounderShare: parsePercentage(round["Per Founder Share (in % of all tokens)"]),
            minValuation: parseCurrency(round["Min Valuation in €"]),
            daoTreasuryFoundersValue: parseCurrency(round["DAO Treasury + Founders value in €"]),
            firstRoundEmissionValue: parseCurrency(round["First round emission value (per VC)"]),
            daoTreasuryValue: parseCurrency(round["DAO Treasury's value  in € "]),
            foundersShareValue: parseCurrency(round["All founders initial share combined value in €"]),
            description
          };
          console.log('Transformed data for round', round.Round, ':', data);
          return data;
        } catch (roundError) {
          console.error('Error processing round:', round.Round, roundError);
          // Return a complete object with default values to match the interface
          return {
            round: round.Round || 0,
            totalVCs: round["Total VCs (VisionCreators)"] || 0,
            newVCs: round["New VCs"] || 0,
            investRound: 0,
            totalInvestSum: 0,
            tokenEmissionPrice: 0,
            tokenPerVC: 0,
            tokenEmittedInRound: 0,
            totalShares: 0,
            communityTokenPool: 0,
            addedTokensToPool: 0,
            investmentPool: 0,
            adminPool: 0,
            totalPoolValue: 0,
            addedPoolValue: 0,
            capitalIncrease: 0,
            regCapitalShare: 0,
            foundersDAOTreasuryShare: 0,
            daoTreasuryShare: 0,
            perFounderShare: 0,
            minValuation: 0,
            daoTreasuryFoundersValue: 0,
            firstRoundEmissionValue: 0,
            daoTreasuryValue: 0,
            foundersShareValue: 0,
            description: description || ""
          };
        }
      });
      
      console.log('Transformed token emission data:', transformedData);
      tokenData.set(transformedData);
    } catch (error) {
      console.error('Error loading token emission data:', error);
      tokenData.set([]);
    } finally {
      isLoading.set(false);
    }
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
  
  // Format percentage values
  function formatPercentage(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 2 }).format(value);
  }
  
  // Handle view selection
  function selectView(view: string) {
    selectedView.set(view);
    console.log('Selected view:', view);
  }
  
  // Handle round selection
  function selectRound(round: number) {
    selectedRound.set(round);
    console.log('Selected round:', round);
  }
  
  // Initialize data on component mount
  onMount(() => {
    console.log('Component mounted, loading token emission data...');
    loadTokenEmissionData();
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
        <aside class="md:w-56 flex-shrink-0 bg-surface-800 rounded-lg p-4">
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
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div class="bg-surface-800 p-4 rounded-lg border-l-4 border-primary-500">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Community Token Pool</h4>
                        <p class="text-2xl font-bold">{formatNumber($currentRoundData.communityTokenPool)}</p>
                        <p class="text-sm text-tertiary-300">+{$currentRoundData.addedTokensToPool} this round</p>
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
                    
                    <h3 class="text-xl font-semibold mb-3">Additional Metrics</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Minimum Valuation</h4>
                        <p class="text-xl font-bold">{formatCurrency($currentRoundData.minValuation)}</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">DAO Treasury Share</h4>
                        <p class="text-xl font-bold">{formatPercentage($currentRoundData.daoTreasuryShare)}</p>
                        <p class="text-sm text-tertiary-300">{formatCurrency($currentRoundData.daoTreasuryValue)}</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Founders Share</h4>
                        <p class="text-xl font-bold">{formatPercentage($currentRoundData.perFounderShare)}</p>
                        <p class="text-sm text-tertiary-300">per founder</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Capital Increase</h4>
                        <p class="text-xl font-bold">{formatPercentage($currentRoundData.capitalIncrease)}</p>
                        <p class="text-sm text-tertiary-300">from regular capital</p>
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
  