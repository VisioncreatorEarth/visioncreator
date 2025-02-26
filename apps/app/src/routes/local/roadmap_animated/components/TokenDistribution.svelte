<script lang="ts">
  import type { TokenDataPoint } from '../types';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { select } from 'd3-selection';
  import { pie, arc } from 'd3-shape';
  
  export let data: TokenDataPoint;
  
  type PieDataItem = {
    name: string;
    value: number;
    percentage: number;
    color: string;
  };
  
  let pieData: PieDataItem[] = [];
  let chartElement: HTMLElement;
  
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
  
  // Create and update pie chart
  function createPieChart() {
    if (!browser || !chartElement || pieData.length === 0) return;
    
    try {
      // Clear previous chart
      select(chartElement).selectAll("*").remove();
      
      const width = 220;
      const height = 220;
      const radius = Math.min(width, height) / 2;
      
      // Create SVG element
      const svg = select(chartElement)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
      
      // Create pie layout
      const pieLayout = pie<PieDataItem>()
        .value(d => d.value)
        .sort(null);
      
      // Create arc generator
      const arcGenerator = arc<any>()
        .innerRadius(0)
        .outerRadius(radius * 0.8);
      
      // Create arcs for labels
      const outerArc = arc<any>()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);
      
      // Add tooltip
      const tooltip = select(chartElement)
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background-color", "#0d1132")
        .style("color", "#f0ede5")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none");
      
      // Create pie chart
      const path = svg.selectAll("path")
        .data(pieLayout(pieData))
        .enter()
        .append("path")
        .attr("d", arcGenerator)
        .attr("fill", d => d.data.color)
        .attr("stroke", "#10153d")
        .attr("stroke-width", 2)
        .style("transition", "opacity 0.3s")
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          select(this).style("opacity", 0.8);
          tooltip.style("opacity", 1)
            .html(`${d.data.name}: ${formatPercentage(d.data.percentage)} (${formatNumber(d.data.value)})`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 25) + "px");
        })
        .on("mouseout", function() {
          select(this).style("opacity", 1);
          tooltip.style("opacity", 0);
        });
      
      // Add percentage labels at center of arcs
      const text = svg.selectAll("text")
        .data(pieLayout(pieData))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arcGenerator.centroid(d)})`)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "white")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text(d => d.data.percentage >= 0.05 ? formatPercentage(d.data.percentage) : "");
    } catch (error) {
      console.error("Error creating pie chart:", error);
    }
  }
  
  // Create chart on mount and update when data changes
  onMount(() => {
    if (!browser) return;
    createPieChart();
  });
  
  $: if (browser && pieData.length > 0 && chartElement) {
    createPieChart();
  }
</script>

<div class="flex flex-col lg:flex-row items-start gap-8 max-w-4xl mx-auto">
  <div class="token-chart bg-surface-700 p-4 rounded-lg">
    <h2 class="text-center text-lg font-bold mb-3">Token Distribution Round {data.round}</h2>
    
    <!-- D3 Pie Chart -->
    <div bind:this={chartElement} class="pie-chart-container relative"></div>
    
    <div class="mt-2 text-center pt-2">
      <div class="text-sm font-bold">{formatNumber(data.totalShares)}</div>
      <div class="text-xs">Total Tokens</div>
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
    min-width: 280px;
  }
  
  .token-data {
    flex-grow: 1;
  }
  
  .pie-chart-container {
    width: 220px;
    height: 220px;
    margin: 0 auto;
  }
</style> 