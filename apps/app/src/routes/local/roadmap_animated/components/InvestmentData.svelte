<script lang="ts">
  import type { TokenDataPoint } from '../types';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { select, selectAll } from 'd3-selection';
  import { scaleLinear, scaleOrdinal } from 'd3-scale';
  import { area, curveBasis, stack, stackOffsetWiggle } from 'd3-shape';
  import { min, max } from 'd3-array';
  import { axisBottom } from 'd3-axis';
  
  export let data: TokenDataPoint;
  
  let chartElement: HTMLElement;
  
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
  
  // Prepare data for streamgraph
  function prepareStreamData() {
    // We'll fetch all rounds up to current one to show progression
    let allRounds = [];
    
    // In a real application, you would fetch all rounds up to the current one
    // For demonstration, we'll simulate rounds from the current data
    for (let i = 1; i <= data.round; i++) {
      // Create simulated historical data based on current data
      // In a real app, this would come from actual historical data
      const factor = i / data.round;
      allRounds.push({
        round: i,
        investmentPool: data.investmentPool * factor * factor,
        platformPool: data.platformPool * factor * factor,
        daoTreasury: data.daoTreasuryValue * factor * factor,
        foundersValue: data.foundersShareValue * factor * factor
      });
    }
    
    return allRounds;
  }
  
  // Create streamgraph
  function createStreamGraph() {
    if (!browser || !chartElement) return;
    
    try {
      // Clear previous chart
      select(chartElement).selectAll("*").remove();
      
      const margin = { top: 30, right: 30, bottom: 30, left: 60 };
      const width = chartElement.clientWidth - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
      
      // Prepare data
      const streamData = prepareStreamData();
      const keys = ["investmentPool", "platformPool", "daoTreasury", "foundersValue"];
      const labels = ["Investment Pool", "Platform Pool", "DAO Treasury", "Founders Value"];
      const colors = ["#40b7c8", "#a36cdc", "#e9c96e", "#e96e6e"];
      
      // Create color scale
      const color = scaleOrdinal<string>()
        .domain(keys)
        .range(colors);
      
      // Stack data
      const stackGenerator = stack()
        .keys(keys)
        .offset(stackOffsetWiggle);
      
      const series = stackGenerator(streamData);
      
      // Create SVG
      const svg = select(chartElement)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Create scales
      const x = scaleLinear()
        .domain([1, streamData.length])
        .range([0, width]);
      
      const y = scaleLinear()
        .domain([min(series, layer => min(layer, d => d[0])) || 0, 
                max(series, layer => max(layer, d => d[1])) || 0])
        .range([height, 0]);
      
      // Create area generator
      const areaGenerator = area<any>()
        .x(d => x(d.data.round))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(curveBasis);
      
      // Add areas
      svg.selectAll("path")
        .data(series)
        .join("path")
        .attr("d", areaGenerator)
        .attr("fill", (d, i) => colors[i])
        .attr("opacity", 0.85)
        .attr("stroke", "#10153d")
        .attr("stroke-width", 0.5);
      
      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(axisBottom(x).ticks(streamData.length).tickFormat(d => `R${d}`))
        .call(g => {
          const domain = g.select(".domain");
          if (domain) domain.remove();
        })
        .selectAll("text")
        .attr("fill", "#f0ede5");
      
      // Add legend
      const legend = svg.append("g")
        .attr("transform", `translate(${width - 150}, 10)`);
      
      keys.forEach((key, i) => {
        const g = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        
        g.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", colors[i]);
        
        g.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .attr("fill", "#f0ede5")
          .attr("font-size", "12px")
          .text(labels[i]);
      });
    } catch (error) {
      console.error("Error creating streamgraph:", error);
    }
  }
  
  // Calculate bar width as percentage
  $: maxInvestment = Math.max(data.totalInvestSum, 1);
  $: barWidth = (data.totalInvestSum / maxInvestment) * 100;
  
  // Create chart on mount and update when data changes
  onMount(() => {
    if (!browser) return;
    
    try {
      createStreamGraph();
      
      const resizeObserver = new ResizeObserver(() => {
        createStreamGraph();
      });
      
      if (chartElement) {
        resizeObserver.observe(chartElement);
      }
      
      return () => {
        if (chartElement) {
          resizeObserver.unobserve(chartElement);
        }
      };
    } catch (error) {
      console.error("Error setting up chart:", error);
    }
  });
</script>

<div class="flex flex-col gap-8 my-6">
  <div class="investment-chart p-6 bg-surface-700 rounded-lg">
    <h2 class="text-2xl font-bold mb-6">Investment Data Round {data.round}</h2>
    
    <!-- D3 Streamgraph -->
    <div bind:this={chartElement} class="stream-chart-container"></div>
  </div>
  
  <div class="p-6 bg-surface-700 rounded-lg">
    <h3 class="text-lg font-bold mb-4">Investment Details</h3>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">VCs Participating</p>
        <p class="text-xl font-bold">{data.totalVCs}</p>
        <p class="text-sm opacity-70">+{data.newVCs} new</p>
      </div>
      
      <div class="bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">Investment Pool</p>
        <p class="text-xl font-bold">{formatShortCurrency(data.investmentPool)}</p>
        <p class="text-sm opacity-70">75% of investments</p>
      </div>
      
      <div class="bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">Platform Pool</p>
        <p class="text-xl font-bold">{formatShortCurrency(data.platformPool)}</p>
        <p class="text-sm opacity-70">25% of investments</p>
      </div>
      
      <div class="bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">Round Investment</p>
        <p class="text-xl font-bold">{formatCurrency(data.investRound)}</p>
      </div>
      
      <div class="bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">DAO Treasury</p>
        <p class="text-xl font-bold">{formatShortCurrency(data.daoTreasuryValue)}</p>
      </div>
      
      <div class="bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">Founders Value</p>
        <p class="text-xl font-bold">{formatShortCurrency(data.foundersShareValue)}</p>
      </div>
      
      <div class="col-span-2 bg-surface-800 p-4 rounded-lg">
        <p class="text-xs uppercase opacity-70">Total Investment</p>
        <p class="text-xl font-bold">{formatCurrency(data.totalInvestSum)}</p>
        <div class="h-3 w-full bg-surface-600 rounded-full overflow-hidden mt-2">
          <div class="h-full bg-blue-500 rounded-full" style="width: {barWidth}%"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .stream-chart-container {
    width: 100%;
    height: 300px;
    margin: 0 auto;
  }
</style> 