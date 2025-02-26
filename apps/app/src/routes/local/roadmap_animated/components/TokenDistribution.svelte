<script lang="ts">
  import type { TokenDataPoint } from '../types';
  
  export let data: TokenDataPoint;
  
  type PieDataItem = {
    name: string;
    value: number;
    percentage: number;
    color: string;
  };
  
  let pieData: PieDataItem[] = [];
  
  // Calculate token distribution data
  $: {
    const totalTokens = data.totalShares;
    const communityPool = data.communityTokenPool;
    const foundersShare = Math.round((data.foundersDAOTreasuryShare - data.daoTreasuryShare) * totalTokens);
    const vcShare = totalTokens - communityPool - foundersShare;
    
    pieData = [
      { name: 'Community Pool', value: communityPool, percentage: communityPool / totalTokens, color: '#e9c96e' },
      { name: 'VCs', value: vcShare, percentage: vcShare / totalTokens, color: '#40b7c8' },
      { name: 'Founders', value: foundersShare, percentage: foundersShare / totalTokens, color: '#a36cdc' }
    ];
  }
  
  // Format numbers for display
  function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(Math.round(num));
  }
  
  function formatPercentage(value: number): string {
    return new Intl.NumberFormat('en', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  }
  
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }
</script>

<div class="flex flex-col lg:flex-row items-center gap-8 max-w-sm mx-auto">
  <div class="token-chart bg-surface-700 p-4 rounded-lg">
    <h2 class="text-center text-lg font-bold mb-3">Token Distribution Round {data.round}</h2>
    
    <!-- Simple pie representation -->
    <div class="flex flex-col items-center gap-2 mb-4">
      <div class="flex flex-wrap justify-center gap-2">
        {#each pieData as item}
          <div class="flex flex-col items-center">
            <div class="w-16 h-4 my-1" style="background-color: {item.color};"></div>
            <div class="text-xs">{item.name}</div>
            <div class="text-xs font-bold">{formatPercentage(item.percentage)}</div>
          </div>
        {/each}
      </div>
      
      <div class="mt-2 text-center">
        <div class="text-sm font-bold">{formatNumber(data.totalShares)}</div>
        <div class="text-xs">Total Tokens</div>
      </div>
    </div>
  </div>
  
  <div class="token-data">
    <h2 class="text-xl font-bold mb-4">Distribution for Round {data.round}</h2>
    
    <div class="space-y-4">
      {#each pieData as item}
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 rounded-full" style="background-color: {item.color}"></div>
          <div>
            <p class="font-medium">{item.name}</p>
            <p class="text-sm opacity-80">{formatNumber(item.value)} tokens ({formatPercentage(item.percentage)})</p>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="mt-6 p-4 bg-surface-700 rounded-lg">
      <h3 class="text-sm uppercase opacity-70 mb-2">Token Price</h3>
      <p class="text-2xl font-bold">{formatCurrency(data.tokenEmissionPrice)}</p>
    </div>
  </div>
</div>

<style>
  .token-chart {
    border-radius: 0.5rem;
  }
  
  .token-data {
    flex-grow: 1;
  }
</style> 