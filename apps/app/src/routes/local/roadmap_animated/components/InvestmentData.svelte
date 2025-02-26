<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  
  // Import D3 modules
  import { select } from 'd3-selection';
  import { scaleBand, scaleLinear } from 'd3-scale';
  import { axisBottom, axisLeft } from 'd3-axis';
  
  // Props
  export let data: {
    round: number;
    totalVCs: number;
    investRound: number;
    totalInvestSum: number;
    investmentPool: number;
    adminPool: number;
  };
  
  let svgElement: SVGElement;
  let width = 460;
  let height = 320;
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  
  function createChart() {
    if (!browser || !data || !svgElement) return;
    
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
    
    // Define the data for the bars
    const barData = [
      { category: 'Round', value: data.investRound },
      { category: 'Total', value: data.totalInvestSum },
      { category: 'Investment', value: data.investmentPool },
      { category: 'Admin', value: data.adminPool }
    ];
    
    // Create scales
    const xScale = scaleBand()
      .domain(barData.map(d => d.category))
      .range([0, innerWidth])
      .padding(0.3);
    
    const yScale = scaleLinear()
      .domain([0, Math.max(...barData.map(d => d.value)) * 1.1])
      .range([innerHeight, 0]);
    
    // Add X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'translate(-5,0)rotate(-25)')
      .style('text-anchor', 'end')
      .attr('fill', '#f0ede5')
      .style('font-size', '10px');
    
    // Add Y axis with proper type casting for tickFormat
    g.append('g')
      .call(axisLeft(yScale)
        .ticks(5)
        .tickFormat((d: any) => `€${Math.round(d/1000)}k`))
      .selectAll('text')
      .attr('fill', '#f0ede5')
      .style('font-size', '10px');
    
    // Add the bars
    g.selectAll('.bar')
      .data(barData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.category) || 0)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', (d, i) => {
        // Different colors for different categories
        const colors = ['#e9c96e', '#dad3be', '#9a8c7e', '#40b7c8'];
        return colors[i % colors.length];
      })
      .attr('rx', 2)
      .attr('ry', 2);
    
    // Add value labels above the bars (shortened for space)
    g.selectAll('.label')
      .data(barData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.category) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0ede5')
      .style('font-size', '9px')
      .text(d => {
        if (d.value >= 10000) {
          return `€${Math.round(d.value/1000)}k`;
        }
        return `€${d.value.toLocaleString('de-DE')}`;
      });
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0ede5')
      .attr('font-size', '14px')
      .text(`Investment Data - Round ${data.round}`);
  }
  
  // Initialize and update chart
  onMount(createChart);
  afterUpdate(createChart);
</script>

<div class="investment-chart flex justify-center my-4">
  <svg bind:this={svgElement}></svg>
</div>

<div class="additional-info mt-4 p-4 bg-surface-800 rounded-lg">
  <h3 class="text-lg font-medium mb-3">Investment Details</h3>
  <ul class="space-y-2 text-sm">
    <li class="flex justify-between">
      <span>Total Vision Creators:</span>
      <span class="font-bold">{data.totalVCs}</span>
    </li>
    <li class="flex justify-between">
      <span>Average Investment per VC:</span>
      <span class="font-bold">€{(data.totalInvestSum / data.totalVCs).toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
    </li>
    <li class="flex justify-between">
      <span>Investment Pool Percentage:</span>
      <span class="font-bold">{Math.round((data.investmentPool / data.totalInvestSum) * 100)}%</span>
    </li>
    <li class="flex justify-between">
      <span>Admin Pool Percentage:</span>
      <span class="font-bold">{Math.round((data.adminPool / data.totalInvestSum) * 100)}%</span>
    </li>
  </ul>
</div>

<style>
  .investment-chart {
    width: 100%;
    height: 320px;
  }
  
  .additional-info {
    max-width: 460px;
    margin: 0 auto;
  }
</style> 