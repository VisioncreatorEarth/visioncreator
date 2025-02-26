<script lang="ts">
  import type { TokenDataPoint } from '../types';
  
  export let allRounds: TokenDataPoint[] = [];
  export let currentRound: number = 1;
  
  // Add logging when props change
  $: {
    console.log('RoundComparison - allRounds:', allRounds);
    console.log('RoundComparison - currentRound:', currentRound);
  }
  
  // Format currency values
  function formatCurrency(value: number): string {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }
  
  // Format percentage values
  function formatPercentage(value: number): string {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${(value * 100).toFixed(1)}%`;
  }
  
  // Calculate growth percentage
  function calculateGrowth(previous: number, current: number): number {
    if (previous === 0 || !previous || !current || typeof previous !== 'number' || typeof current !== 'number') return 0;
    return (current - previous) / previous;
  }
  
  // Get rounds to display (last 5 up to current round)
  $: filteredRounds = Array.isArray(allRounds) && allRounds.length > 0
    ? allRounds.filter((r: TokenDataPoint) => r.round <= currentRound).slice(-5)
    : [];
    
  $: console.log('RoundComparison - filteredRounds:', filteredRounds);
</script>

<div class="max-w-lg mx-auto">
  <div class="bg-surface-700 p-4 rounded-lg mb-6">
    <h2 class="text-xl font-bold mb-4">Round Comparison</h2>
    <p class="mb-4">Comparing metrics across investment rounds</p>
    
    <!-- Simple visualization placeholder -->
    <div class="relative h-40 bg-surface-800 rounded p-4 mb-6">
      <div class="text-center text-sm mb-2">Visual comparison not available</div>
      <div class="text-center">Using simplified tabular data for comparisons</div>
    </div>
  </div>
  
  <div class="comparison-tables bg-surface-700 p-4 rounded-lg">
    <h3 class="text-lg font-bold mb-3">Growth Comparison</h3>
    
    {#if filteredRounds.length > 1}
      <div class="grid grid-cols-2 gap-4">
        <!-- VCs Growth Table -->
        <div class="bg-surface-800 p-3 rounded-lg">
          <h4 class="text-sm uppercase opacity-70 mb-2">Vision Creators Growth</h4>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-700">
                <th class="text-left py-1">Round</th>
                <th class="text-right py-1">VCs</th>
                <th class="text-right py-1">Growth</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredRounds as round, i}
                <tr class="border-b border-surface-700 last:border-0" class:text-primary-500={round.round === currentRound}>
                  <td class="py-1">R{round.round}</td>
                  <td class="text-right py-1">{round.totalVCs}</td>
                  <td class="text-right py-1">
                    {#if i > 0 && filteredRounds[i-1] && filteredRounds[i-1].totalVCs}
                      {formatPercentage(calculateGrowth(filteredRounds[i-1].totalVCs, round.totalVCs))}
                    {:else}
                      -
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        <!-- Price Growth Table -->
        <div class="bg-surface-800 p-3 rounded-lg">
          <h4 class="text-sm uppercase opacity-70 mb-2">Token Price Growth</h4>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-surface-700">
                <th class="text-left py-1">Round</th>
                <th class="text-right py-1">Price</th>
                <th class="text-right py-1">Growth</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredRounds as round, i}
                <tr class="border-b border-surface-700 last:border-0" class:text-primary-500={round.round === currentRound}>
                  <td class="py-1">R{round.round}</td>
                  <td class="text-right py-1">{formatCurrency(round.tokenEmissionPrice)}</td>
                  <td class="text-right py-1">
                    {#if i > 0 && filteredRounds[i-1] && filteredRounds[i-1].tokenEmissionPrice}
                      {formatPercentage(calculateGrowth(filteredRounds[i-1].tokenEmissionPrice, round.tokenEmissionPrice))}
                    {:else}
                      -
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <div class="bg-surface-800 p-3 rounded-lg">
        <p class="text-center">Not enough data to show comparison (found {filteredRounds.length} rounds)</p>
      </div>
    {/if}
  </div>
</div>

<style>
  table {
    border-collapse: collapse;
  }
</style> 