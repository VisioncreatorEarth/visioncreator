<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  
  // Import D3 modules
  import { select } from 'd3-selection';
  import { scaleLinear, scalePoint } from 'd3-scale';
  import { line } from 'd3-shape';
  import { axisBottom, axisLeft } from 'd3-axis';
  
  // Define interface for data
  interface RoundData {
    round: number;
    totalVCs: number;
    investRound: number;
    totalInvestSum: number;
    tokenEmissionPrice: number;
    tokenPerVC: number;
    tokenEmittedInRound: number;
    communityTokenPool: number;
  }
  
  // Props - expect all rounds data
  export let allRounds: RoundData[];
  
  // Current round to highlight
  export let currentRound: number;
  
  let svgElement: SVGElement;
  let width = 460;
  let height = 320;
  const margin = { top: 40, right: 60, bottom: 50, left: 60 };
  
  function createChart() {
    if (!browser || !allRounds || !svgElement) return;
    
    // Clear previous chart
    select(svgElement).selectAll('*').remove();
    
    // Create the SVG container
    const svg = select(svgElement)
      .attr('width', width)
      .attr('height', height);
    
    // Calculate the inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create a group for the chart content
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Sort rounds by round number
    const sortedRounds = [...allRounds].sort((a, b) => a.round - b.round);
    
    // X scale - rounds
    const xScale = scalePoint<number>()
      .domain(sortedRounds.map(d => d.round))
      .range([0, innerWidth])
      .padding(0.5);
    
    // Create multiple line charts for different metrics
    
    // 1. Total VCs
    createLineChart(
      g, 
      sortedRounds, 
      xScale, 
      'totalVCs', 
      'VCs', 
      '#e9c96e', 
      0, 
      Math.max(...sortedRounds.map(d => d.totalVCs)) * 1.1
    );
    
    // 2. Token Emission Price
    createLineChart(
      g, 
      sortedRounds, 
      xScale, 
      'tokenEmissionPrice', 
      'Token €', 
      '#40b7c8', 
      0, 
      Math.max(...sortedRounds.map(d => d.tokenEmissionPrice)) * 1.1,
      innerWidth + 40 // Position on right axis
    );
    
    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(axisBottom(xScale).tickFormat(d => `R${d}`))
      .selectAll('text')
      .attr('fill', '#f0ede5')
      .attr('font-size', '10px');
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0ede5')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Round Comparison');
    
    // Add highlight for current round
    const currentRoundX = xScale(currentRound);
    if (currentRoundX !== undefined) {
      g.append('line')
        .attr('x1', currentRoundX)
        .attr('x2', currentRoundX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#f0ede5')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      
      g.append('text')
        .attr('x', currentRoundX)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f0ede5')
        .attr('font-size', '10px')
        .text(`Current: R${currentRound}`);
    }
  }
  
  // Helper function to create a line chart for a specific metric
  function createLineChart(
    g: any, 
    data: RoundData[], 
    xScale: any, 
    yProperty: keyof RoundData, 
    label: string, 
    color: string, 
    yMin = 0,
    yMax: number,
    axisPosition = 0 // 0 for left axis, other value for right axis
  ) {
    const innerHeight = height - margin.top - margin.bottom;
    
    // Y scale
    const yScale = scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);
    
    // Create Y axis
    const yAxis = g.append('g');
    
    if (axisPosition > 0) {
      // Right axis
      yAxis.attr('transform', `translate(${axisPosition}, 0)`)
        .call(axisLeft(yScale)
          .tickFormat((value: any) => yProperty === 'tokenEmissionPrice' ? `€${value}` : value.toString()))
        .selectAll('text')
        .attr('fill', '#f0ede5')
        .attr('font-size', '10px');
    } else {
      // Left axis
      yAxis.call(axisLeft(yScale))
        .selectAll('text')
        .attr('fill', '#f0ede5')
        .attr('font-size', '10px');
    }
    
    // Create the line generator
    const lineGenerator = line<RoundData>()
      .x(d => xScale(d.round) || 0)
      .y(d => yScale(d[yProperty] as number));
    
    // Add the line path
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', lineGenerator);
    
    // Add data points
    g.selectAll(`.dot-${yProperty}`)
      .data(data)
      .enter()
      .append('circle')
      .attr('class', `dot-${yProperty}`)
      .attr('cx', (d: RoundData) => xScale(d.round) || 0)
      .attr('cy', (d: RoundData) => yScale(d[yProperty] as number))
      .attr('r', 3)
      .attr('fill', color)
      .attr('stroke', '#0d1132')
      .attr('stroke-width', 1);
    
    // Add axis label
    g.append('text')
      .attr('transform', axisPosition > 0 
        ? `translate(${axisPosition + 30}, ${innerHeight / 2}) rotate(90)` 
        : `translate(-40, ${innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', color)
      .attr('font-size', '10px')
      .text(label);
  }
  
  // Initialize and update chart
  onMount(createChart);
  afterUpdate(createChart);
</script>

<div class="comparison-chart flex justify-center my-4">
  <svg bind:this={svgElement}></svg>
</div>

<div class="comparison-metrics grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div class="bg-surface-800 p-3 rounded-lg">
    <h3 class="text-base font-medium mb-2">Growth Metrics</h3>
    <table class="w-full text-xs">
      <thead>
        <tr class="border-b border-surface-700">
          <th class="text-left py-1">Round</th>
          <th class="text-right py-1">VCs</th>
          <th class="text-right py-1">Growth</th>
        </tr>
      </thead>
      <tbody>
        {#each allRounds.filter(r => r.round <= currentRound).sort((a, b) => a.round - b.round) as round, i}
          {@const prevRound = i > 0 ? allRounds.find(r => r.round === round.round - 1) : null}
          {@const growth = prevRound ? Math.round((round.totalVCs / prevRound.totalVCs - 1) * 100) : 0}
          <tr class="border-b border-surface-700 {round.round === currentRound ? 'bg-surface-700' : ''}">
            <td class="py-1">Round {round.round}</td>
            <td class="text-right py-1">{round.totalVCs}</td>
            <td class="text-right py-1 {growth > 0 ? 'text-green-400' : ''}">{i > 0 ? `+${growth}%` : '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  <div class="bg-surface-800 p-3 rounded-lg">
    <h3 class="text-base font-medium mb-2">Token Metrics</h3>
    <table class="w-full text-xs">
      <thead>
        <tr class="border-b border-surface-700">
          <th class="text-left py-1">Round</th>
          <th class="text-right py-1">Token Price</th>
          <th class="text-right py-1">Growth</th>
        </tr>
      </thead>
      <tbody>
        {#each allRounds.filter(r => r.round <= currentRound).sort((a, b) => a.round - b.round) as round, i}
          {@const prevRound = i > 0 ? allRounds.find(r => r.round === round.round - 1) : null}
          {@const growth = prevRound ? Math.round((round.tokenEmissionPrice / prevRound.tokenEmissionPrice - 1) * 100) : 0}
          <tr class="border-b border-surface-700 {round.round === currentRound ? 'bg-surface-700' : ''}">
            <td class="py-1">Round {round.round}</td>
            <td class="text-right py-1">€{round.tokenEmissionPrice.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</td>
            <td class="text-right py-1 {growth > 0 ? 'text-green-400' : ''}">{i > 0 ? `+${growth}%` : '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .comparison-chart {
    width: 100%;
    height: 320px;
  }
</style> 