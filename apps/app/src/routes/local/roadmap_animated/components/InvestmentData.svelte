<script lang="ts">
  import type { TokenDataPoint } from '../types';
  
  export let data: TokenDataPoint;
  
  // Format currency values
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }
  
  // Format short currency values (K, M, B)
  function formatShortCurrency(value: number): string {
    if (value >= 1000000000) {
      return '€' + (value / 1000000000).toFixed(1) + 'B';
    } else if (value >= 1000000) {
      return '€' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return '€' + (value / 1000).toFixed(1) + 'K';
    } else {
      return '€' + value.toFixed(0);
    }
  }
  
  // Calculate bar width as percentage
  $: maxInvestment = Math.max(data.totalInvestSum, 1);
  $: barWidth = (data.totalInvestSum / maxInvestment) * 100;
</script>

<div class="flex flex-col md:flex-row gap-8 my-6">
  <div class="investment-chart p-6 bg-surface-700 rounded-lg flex-1">
    <h2 class="text-2xl font-bold mb-6">Investment Data Round {data.round}</h2>
    
    <!-- Simple bar chart -->
    <div class="space-y-8">
      <div>
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs uppercase opacity-70">Total Investment</span>
          <span class="text-sm font-medium">{formatCurrency(data.totalInvestSum)}</span>
        </div>
        <div class="h-8 w-full bg-surface-600 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full" style="width: {barWidth}%"></div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="investment-details p-6 bg-surface-700 rounded-lg flex-1">
    <h3 class="text-lg font-bold mb-4">Additional Information</h3>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs uppercase opacity-70">VCs Participating</p>
        <p class="text-xl font-bold">{data.totalVCs}</p>
      </div>
      <div>
        <p class="text-xs uppercase opacity-70">New Investors</p>
        <p class="text-xl font-bold">{data.newVCs}</p>
      </div>
      <div>
        <p class="text-xs uppercase opacity-70">DAO Treasury</p>
        <p class="text-lg font-medium">{formatShortCurrency(data.daoTreasuryValue)}</p>
      </div>
      <div>
        <p class="text-xs uppercase opacity-70">Founders Value</p>
        <p class="text-lg font-medium">{formatShortCurrency(data.foundersShareValue)}</p>
      </div>
      <div class="col-span-2">
        <p class="text-xs uppercase opacity-70">Round Investment</p>
        <p class="text-2xl font-bold">{formatCurrency(data.investRound)}</p>
      </div>
    </div>
  </div>
</div>

<style>
  .investment-chart, .investment-details {
    min-width: 300px;
  }
</style> 