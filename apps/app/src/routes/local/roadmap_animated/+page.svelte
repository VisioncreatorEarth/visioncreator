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
  import tokenEmissionData from './token_emission_30_rounds.json';
  
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
        else if (round.Round === 15) description = "Market Expansion";
        else if (round.Round === 20) description = "Global Scale";
        else if (round.Round === 25) description = "Maturity Phase";
        else if (round.Round === 30) description = "Full Adoption";
        
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
            totalShares: parseCurrency(String(round["Total Shares (Token + reg. Capital)"])),
            communityTokenPool: round["Sum of token in com. token pool"],
            addedTokensToPool: round["Added tokens to community token pool"],
            investmentPool: parseCurrency(round["Investment pool (SumInvests *0,75)"]),
            platformPool: parseCurrency(round["Admin Pool (SumInvest * 0,25)"]),
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
            platformPool: 0,
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
      isLoading.set(false);
    } catch (error) {
      console.error('Failed to load token emission data:', error);
      isLoading.set(false);
    }
  }
  
  // Utility functions
  function selectRound(round: number) {
    selectedRound.set(round);
  }
  
  function selectView(view: string) {
    selectedView.set(view);
  }
  
  // Format currency values for display
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  // Format percentages for display
  function formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  }
  
  // Format numbers for display
  function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  // Load data on component mount
  onMount(() => {
    if (browser) {
      loadTokenEmissionData();
    }
  });
</script>

<svelte:head>
  <title>Token Emission Dashboard</title>
  <meta name="description" content="Visioncreator Token Emission Data Visualization">
</svelte:head>

<main class="min-h-screen bg-surface-900 text-tertiary-300 font-base">
  <div class="container mx-auto py-8 px-4 max-w-[1800px]">
    <h1 class="text-4xl font-heading mb-8 text-center">Token Emission Explorer</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
      <!-- Sidebar with Rounds -->
      <div class="bg-surface-800 p-4 rounded-lg md:sticky md:top-4 self-start overflow-y-auto max-h-[calc(100vh-120px)]">
        <h2 class="text-2xl font-heading mb-4">Investment Rounds</h2>
        
        <div class="grid grid-cols-1 gap-2 overflow-y-auto pb-4">
          {#each $tokenData as data}
            <button
              class="p-3 rounded-md text-left transition-all duration-200 {$selectedRound === data.round ? 'bg-surface-700 border-l-4 border-primary-500' : 'hover:bg-surface-700'}"
              on:click={() => selectRound(data.round)}
            >
              <div class="font-bold">Round {data.round}</div>
              {#if data.description}
                <div class="text-xs text-tertiary-500 mt-1">{data.description}</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
      
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
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style="grid-template-columns: 1fr 2fr 1.5fr 1.5fr">
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
                  
                  <!-- Additional metrics in a grid -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" style="grid-template-columns: 1fr 1.7fr 1.2fr 1.5fr">
                    <div class="bg-surface-800 p-4 rounded-lg">
                      <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Platform Pool</h3>
                      <p class="text-lg font-bold">{formatCurrency($currentRoundData.platformPool)}</p>
                    </div>
                    
                    <div class="bg-surface-800 p-4 rounded-lg">
                      <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Investment Pool</h3>
                      <p class="text-lg font-bold">{formatCurrency($currentRoundData.investmentPool)}</p>
                    </div>
                    
                    <div class="bg-surface-800 p-4 rounded-lg">
                      <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Capital Increase</h3>
                      <p class="text-lg font-bold">{formatPercentage($currentRoundData.capitalIncrease)}</p>
                    </div>
                    
                    <div class="bg-surface-800 p-4 rounded-lg">
                      <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Minimum Valuation</h3>
                      <p class="text-lg font-bold">{formatCurrency($currentRoundData.minValuation)}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Removed the visualization components from summary view -->
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
  </div>
</main>

<style>
  :global(body) {
    background-color: var(--color-surface-900);
    color: var(--color-tertiary-300);
    font-family: var(--theme-font-family-base);
    min-height: 100vh;
    overflow-y: auto;
  }
  
  :global(html) {
    overflow-y: auto;
    height: 100%;
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
  