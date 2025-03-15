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
  import tokenEmissionData from './VC Tokens 2.json';
  
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
  
  // Function to parse a string with commas to a number
  function parseStringNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;
    return parseFloat(value.replace(/,/g, '').replace(/\"/g, '')) || 0;
  }
  
  // Load data from JSON file
  function loadTokenEmissionData() {
    isLoading.set(true);
    
    try {
      console.log('Loading token emission data from JSON...');
      
      // Transform the data to match our interface
      const transformedData = tokenEmissionData.map(round => {
        console.log('Processing round:', round.Round);
        
        // Remove all descriptions
        let description = "";
        
        try {
          const data: TokenDataPoint = {
            round: round.Round,
            totalVCs: parseStringNumber(round["Total VCs"]),
            newVCs: parseStringNumber(round["New VCs"]),
            investRound: parseCurrency(round["Invested in this Round"]),
            totalInvestSum: parseCurrency(round["Total Invest Pool"]),
            tokenEmissionPrice: parseCurrency(round["Current Token Emission Price"]),
            tokenPerVC: parseFloat(String(round["Token Emission Per VC"]).replace(',', '.')),
            tokenEmittedInRound: parseStringNumber(round["Token Emission in this Round"]),
            totalShares: parseCurrency(String(round["Total Shares (regs. Capital + total Tokens emitted"])),
            communityTokenPool: parseStringNumber(round["Contributions Pool (Token)  Total"]),
            addedTokensToPool: parseStringNumber(round["Contributions Pool (Token) added this round"]),
            investmentPool: parseCurrency(round["Contributions Pool (Euro) total "]),
            platformPool: parseCurrency(round["Guardians Operations (Euro) total "]),
            totalPoolValue: parseCurrency(round["Total Invest Pool"]),
            addedPoolValue: parseCurrency(round["Invested in this Round"]),
            capitalIncrease: parsePercentage(round["Capital increase in % per round"]),
            regCapitalShare: 0, // Not directly available in new data
            foundersDAOTreasuryShare: parsePercentage(round["Founders holdings (Emissions + GmbH)"]),
            daoTreasuryShare: round["Guardians Treasury"] ? parsePercentage(round["Guardians Treasury"]) : 0,
            perFounderShare: parsePercentage(round["Founders  Token Shares"]),
            minValuation: parseCurrency(round[" Total valuation based on current emission price"]),
            daoTreasuryFoundersValue: parseCurrency(round["Total Founder Valuation based on emission price"]),
            firstRoundEmissionValue: 0, // Not directly available
            daoTreasuryValue: 0, // Would need to calculate
            foundersShareValue: parseCurrency(round["Founders (GmbH) Valuation based on emission price"]),
            description
          };
          console.log('Transformed data for round', round.Round, ':', data);
          return data;
        } catch (roundError) {
          console.error('Error processing round:', round.Round, roundError);
          // Return a complete object with default values to match the interface
          return {
            round: round.Round || 0,
            totalVCs: parseStringNumber(round["Total VCs"]),
            newVCs: parseStringNumber(round["New VCs"]),
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
  
  // For debugging scroll issues
  let roundsContainerHeight = 0;
  let mainContainerHeight = 0;
  
  // Track dimensions for debugging
  function updateDebugInfo() {
    if (browser) {
      const roundsEl = document.querySelector('.rounds-container');
      const mainEl = document.querySelector('main');
      
      if (roundsEl) roundsContainerHeight = roundsEl.scrollHeight;
      if (mainEl) mainContainerHeight = mainEl.scrollHeight;
    }
  }
  
  // Load data on component mount
  onMount(() => {
    if (browser) {
      loadTokenEmissionData();
      
      // Update debug info after data loads
      setTimeout(updateDebugInfo, 1000);
      
      // Listen for window resize
      window.addEventListener('resize', updateDebugInfo);
      
      return () => {
        window.removeEventListener('resize', updateDebugInfo);
      };
    }
  });
</script>

<svelte:head>
  <title>Token Emission Dashboard</title>
  <meta name="description" content="Visioncreator Token Emission Data Visualization">
</svelte:head>

<!-- Debug info overlay -->
{#if browser}
<div class="debug-height">
  Rounds height: {roundsContainerHeight}px<br>
  Main height: {mainContainerHeight}px
</div>
{/if}

<main class="bg-surface-900 text-tertiary-300 font-base overflow-y-auto">
  <div class="container mx-auto py-8 px-4 max-w-[1800px]">
    <h1 class="text-4xl font-heading mb-8 text-center">Token Emission Explorer</h1>
    
    <div class="flex flex-col md:flex-row gap-8">
      <!-- Sidebar with Rounds - scrollable -->
      <div class="md:w-[320px] flex-shrink-0">
        <div class="bg-surface-800 p-4 rounded-lg rounds-container md:max-h-[calc(100vh-120px)] overflow-y-auto">
          <h2 class="text-2xl font-heading mb-4">Investment Rounds</h2>
          
          <div class="grid grid-cols-1 gap-2 pb-4">
            {#each $tokenData as data}
              <button
                class="p-3 rounded-md text-left transition-all duration-200 {$selectedRound === data.round ? 'bg-surface-700 border-l-4 border-primary-500' : 'hover:bg-surface-700'}"
                on:click={() => selectRound(data.round)}
              >
                <div class="font-bold">Round {data.round}</div>
              </button>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Main content area - fixed position -->
      <div class="flex-1">
        <div class="bg-surface-800 rounded-lg flex flex-col md:sticky md:top-4">
          <!-- View selector tabs - make them sticky -->
          <div class="border-b border-surface-700 px-4 sticky top-0 bg-surface-800 z-10">
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
                    <h2 class="text-2xl font-bold mb-2">Round {$currentRoundData.round}</h2>
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
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Contributions Pool</h3>
                        <p class="text-lg font-bold">{formatCurrency($currentRoundData.investmentPool)}</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Capital Increase</h3>
                        <p class="text-lg font-bold">{formatPercentage($currentRoundData.capitalIncrease)}</p>
                      </div>
                      
                      <div class="bg-surface-800 p-4 rounded-lg">
                        <h3 class="text-sm uppercase text-tertiary-300 opacity-70">Total Valuation</h3>
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
  </div>
</main>

<style>
  :global(body) {
    background-color: var(--color-surface-900);
    color: var(--color-tertiary-300);
    font-family: var(--theme-font-family-base);
    min-height: 100vh;
    overflow-y: auto;
    margin: 0;
    padding: 0;
  }
  
  :global(html) {
    overflow-y: auto;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  
  main {
    display: block;
    width: 100%;
    min-height: 100vh;
    padding-bottom: 4rem;
  }
  
  /* Debug styles to help identify overflow issues */
  .debug-height {
    position: fixed;
    top: 0;
    right: 0;
    background: rgba(255,0,0,0.2);
    color: white;
    padding: 4px;
    z-index: 1000;
    font-size: 12px;
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
  