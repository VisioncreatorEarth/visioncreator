<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  
  // Import D3 modules
  import { select } from 'd3-selection';
  import { pie, arc } from 'd3-shape';
  import { scaleOrdinal } from 'd3-scale';
  
  // Props
  export let data: {
    round: number;
    tokenEmittedInRound: number;
    communityTokenPool: number;
    description?: string;
  };
  
  let svg: SVGElement;
  let width = 320;
  let height = 320;
  let radius = Math.min(width, height) / 2;
  
  function createChart() {
    if (!browser || !data) return;
    
    // Clear previous chart
    select(svg).selectAll('*').remove();
    
    // Setup colors
    const colorScale = scaleOrdinal<string>()
      .domain(['VCs', 'Community Pool'])
      .range(['#e9c96e', '#dad3be']);
    
    // Create data for pie
    const pieData = [
      { label: 'VCs', value: data.tokenEmittedInRound },
      { label: 'Community Pool', value: data.communityTokenPool }
    ];
    
    // Setup the pie chart layout
    const pieGenerator = pie<typeof pieData[0]>()
      .sort(null)
      .value(d => d.value);
    
    // Generate arcs
    const arcGenerator = arc<any>()
      .innerRadius(radius * 0.5) // Donut chart
      .outerRadius(radius * 0.8);
    
    const labelArc = arc<any>()
      .innerRadius(radius * 0.85)
      .outerRadius(radius * 0.85);
    
    // Create chart container
    const chart = select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Add slices
    const slices = chart.selectAll('.arc')
      .data(pieGenerator(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    // Add path elements for slices with animation
    slices.append('path')
      .attr('d', d => arcGenerator(d))
      .attr('fill', d => colorScale(d.data.label))
      .attr('stroke', '#0d1132')
      .attr('stroke-width', 2)
      .style('opacity', 0.9);
    
    // Add text labels outside the arcs
    slices.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0ede5')
      .text(d => d.data.label);
    
    // Add percentage labels inside slices
    const totalTokens = pieData.reduce((sum, item) => sum + item.value, 0);
    
    slices.append('text')
      .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#0d1132')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(d => {
        const percent = Math.round((d.data.value / totalTokens) * 100);
        return `${percent}%`;
      });
    
    // Add center text
    chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .attr('fill', '#f0ede5')
      .attr('font-size', '16px')
      .text(`Round ${data.round}`);
    
    chart.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('fill', '#f0ede5')
      .attr('font-size', '14px')
      .text(`Total: ${totalTokens.toLocaleString()} tokens`);
  }
  
  // Create chart on mount and update
  onMount(createChart);
  afterUpdate(createChart);
</script>

<div class="token-distribution-chart flex justify-center my-4">
  <svg bind:this={svg}></svg>
</div>

<div class="token-data-summary grid grid-cols-2 gap-4 max-w-sm mx-auto">
  <div class="bg-surface-800 p-3 rounded-lg border-l-4 border-primary-500">
    <h4 class="text-sm uppercase text-tertiary-300 opacity-70">VCs</h4>
    <p class="text-xl font-bold">{data.tokenEmittedInRound.toLocaleString()}</p>
    <p class="text-xs text-tertiary-300">Tokens in this round</p>
  </div>
  
  <div class="bg-surface-800 p-3 rounded-lg border-l-4 border-tertiary-500">
    <h4 class="text-sm uppercase text-tertiary-300 opacity-70">Community Pool</h4>
    <p class="text-xl font-bold">{data.communityTokenPool.toLocaleString()}</p>
    <p class="text-xs text-tertiary-300">Total pool size</p>
  </div>
</div>

<style>
  .token-distribution-chart {
    width: 100%;
    height: 320px;
  }
</style> 