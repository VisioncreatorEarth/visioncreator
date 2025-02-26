<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import Papa from 'papaparse';
  import { browser } from '$app/environment';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  
  // Import specific D3 modules - but don't initialize them yet
  import { select, selectAll } from 'd3-selection';
  import { transition } from 'd3-transition';
  import { scaleLinear } from 'd3-scale';
  import { max, min } from 'd3-array';
  import { easeCubicOut } from 'd3-ease';
  
  // Only initialize D3 transition in the browser
  let d3Transition;
  
  // Store for our parsed data
  const tokenData = writable<TokenDataPoint[]>([]);
  const currentRound = writable(1);
  const isLoading = writable(true);
  const visibleRounds = writable(1);
  
  interface TokenDataPoint {
    round: number;
    totalVCs: number;
    newVCs: number;
    investRound: number;
    totalInvestSum: number;
    tokenEmissionPrice: number;
    tokenPerVC: number;
    tokenEmittedInRound: number;
    totalShares: number;
    communityTokenPool: number;
    investmentPool: number;
    adminPool: number;
    totalPoolValue: number;
    description?: string;
  }
  
  // Function to parse the CSV file
  async function parseCSV() {
    try {
      isLoading.set(true);
      const response = await fetch('/token_emission.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          // Transform to more usable format
          const data: TokenDataPoint[] = [];
          const rows = results.data as string[][];
          
          // Extract descriptions from the first column
          const descriptions: Record<number, string> = {};
          for (let i = 2; i < 32; i++) {
            const row = rows[i];
            if (row && row[0] && row[2]) {
              const round = parseInt(row[2]);
              if (!isNaN(round) && row[0].trim() !== '') {
                descriptions[round] = row[0].trim();
              }
            }
          }
          
          // Skip the first several rows which are headers and descriptions
          for (let i = 2; i < 32; i++) {
            const row = rows[i];
            if (row && row[2] && !isNaN(parseInt(row[2]))) { // Check if it's a round row
              const round = parseInt(row[2]);
              const roundData: TokenDataPoint = {
                round: round,
                totalVCs: parseInt(row[3]) || 0,
                newVCs: parseInt(row[4]) || 0,
                investRound: parseFloat((row[5] || "0").replace('€', '').replace(/\./g, '').replace(',', '.')) || 0,
                totalInvestSum: parseFloat((row[6] || "0").replace('€', '').replace(/\./g, '').replace(',', '.')) || 0,
                tokenEmissionPrice: parseFloat((row[8] || "0").replace('€', '').replace(/\./g, '').replace(',', '.')) || 0,
                tokenPerVC: parseFloat(row[9]) || 0,
                tokenEmittedInRound: parseFloat(row[10]) || 0,
                totalShares: parseFloat(row[11]) || 0,
                communityTokenPool: parseFloat(row[17]) || 0,
                investmentPool: parseFloat((row[18] || "0").replace('€', '').replace(/\./g, '').replace(',', '.')) || 0,
                adminPool: parseFloat((row[19] || "0").replace('€', '').replace(/\./g, '').replace(',', '.')) || 0,
                totalPoolValue: parseFloat((row[20] || "0").replace('€', '').replace(/\./g, '').replace(',', '.')) || 0,
                description: descriptions[round] || ''
              };
              data.push(roundData);
            }
          }
          
          tokenData.set(data);
          isLoading.set(false);
          
          // Initialize D3 visualization after data is loaded
          if (browser) {
            tick().then(() => {
              initializeD3Visualization();
            });
          }
        }
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      isLoading.set(false);
    }
  }
  
  // Format large values like 1k, 1m, etc.
  function formatValue(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toFixed(0);
    }
  }
  
  // Setup scroll trigger for animation
  function setupScrollTrigger() {
    if (!browser) return;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;
      
      // Calculate what percentage of the page has been scrolled
      const scrollPercentage = scrollY / (documentHeight - windowHeight);
      
      // Calculate how many rounds should be visible based on scroll position
      const $data = $tokenData;
      if (!$data || $data.length === 0) return;
      
      const maxRounds = $data.length;
      const roundsToShow = Math.ceil(scrollPercentage * (maxRounds + 2));
      
      visibleRounds.set(Math.min(roundsToShow, maxRounds));
      
      // Update D3 visualization based on visible rounds
      updateD3Visualization();
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Call once to set initial state
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }
  
  // Configuration
  let treeWidth = 900;
  let treeHeight = 4000;
  let nodeRadius = 10;
  let maxNodesPerLevel = 15; // Maximum nodes to display per level
  
  // Constants for pool visualization
  const poolHeight = 70;
  const poolWidth = 120;
  
  // D3 visualization functions
  function initializeD3Visualization() {
    if (!browser) return;
    
    // Select the SVG container
    const svg = select('.tree-visualization');
    
    // Create the tree trunk
    svg.append('line')
      .attr('x1', treeWidth / 2)
      .attr('y1', 50)
      .attr('x2', treeWidth / 2)
      .attr('y2', treeHeight - 50)
      .attr('stroke', '#7e57c2') // Direct color instead of CSS var
      .attr('stroke-width', 10)
      .attr('stroke-linecap', 'round');
    
    // Initial update
    updateD3Visualization();
  }
  
  function updateD3Visualization() {
    if (!browser || $tokenData.length === 0) return;
    
    // Select the SVG container
    const svg = select('.tree-visualization');
    
    // Remove existing levels to redraw
    svg.selectAll('.tree-level').remove();
    
    // Create levels for each visible round
    $tokenData.slice(0, $visibleRounds).forEach((round, i) => {
      const verticalSpacing = (treeHeight - 200) / $tokenData.length;
      const yPosition = (i + 1) * verticalSpacing + 50;
      const branchThickness = Math.max(4, Math.min(10, 4 + Math.log(round.totalVCs) / 2));
      const branchWidth = Math.min(Math.max(100, Math.min(round.totalVCs, 500) * 1.5), treeWidth * 0.7);
      
      // Create a group for this level
      const levelGroup = svg.append('g')
        .attr('class', `tree-level level-${round.round}`)
        .attr('transform', `translate(0, ${yPosition})`)
        .style('opacity', 0);
      
      // Animate the level appearance
      levelGroup.transition()
        .duration(800)
        .delay(200)
        .style('opacity', 1)
        .ease(easeCubicOut);
      
      // Info label background
      levelGroup.append('rect')
        .attr('x', 20)
        .attr('y', -35)
        .attr('width', 250)
        .attr('height', round.description ? 100 : 70)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', '#1a1a2e') // Dark background
        .attr('stroke', '#7e57c2') // Purple border
        .attr('stroke-width', 1)
        .attr('opacity', 0.8);
      
      // Round info
      levelGroup.append('text')
        .attr('x', 40)
        .attr('y', -10)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#d1c4e9') // Light purple text
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text(`Round ${round.round}: ${round.totalVCs} VCs`);
      
      // Token price
      levelGroup.append('text')
        .attr('x', 40)
        .attr('y', 15)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#64b5f6') // Blue text
        .attr('font-size', '14px')
        .text(`Token Price: €${round.tokenEmissionPrice.toFixed(2)}`);
      
      // Description if available
      if (round.description) {
        levelGroup.append('text')
          .attr('x', 40)
          .attr('y', 45)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#d1c4e9') // Light purple text
          .attr('font-size', '12px')
          .attr('font-style', 'italic')
          .text(round.description);
      }
      
      // Branches
      levelGroup.append('line')
        .attr('x1', treeWidth / 2)
        .attr('y1', 0)
        .attr('x2', (treeWidth / 2) + (branchWidth / 2))
        .attr('y2', -20)
        .attr('stroke', '#7e57c2') // Purple
        .attr('stroke-width', branchThickness)
        .attr('stroke-linecap', 'round');
      
      levelGroup.append('line')
        .attr('x1', treeWidth / 2)
        .attr('y1', 0)
        .attr('x2', (treeWidth / 2) - (branchWidth / 2))
        .attr('y2', -20)
        .attr('stroke', '#7e57c2') // Purple
        .attr('stroke-width', branchThickness)
        .attr('stroke-linecap', 'round');
      
      // VC Nodes
      const nodeCount = Math.min(round.totalVCs, maxNodesPerLevel);
      const nodeSpacing = branchWidth / (nodeCount + 1);
      
      for (let j = 0; j < nodeCount; j++) {
        const x = (treeWidth / 2) - (branchWidth / 2) + ((j + 1) * nodeSpacing);
        const randomOffset = Math.random() * 10 - 5;
        const y = -30 - (j % 3) * 15 + randomOffset;
        
        // Connection to branch
        levelGroup.append('line')
          .attr('x1', x < (treeWidth / 2) ? x + 5 : x - 5)
          .attr('y1', -20)
          .attr('x2', x)
          .attr('y2', y)
          .attr('stroke', '#7e57c2') // Purple
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round');
        
        // Node
        levelGroup.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', nodeRadius)
          .attr('fill', '#64b5f6') // Blue
          .attr('stroke', '#1a1a2e') // Dark border
          .attr('stroke-width', 2);
      }
      
      // Community Token Pool
      const communityPoolFillHeight = Math.min(poolHeight * (round.communityTokenPool / 6000), poolHeight);
      
      const communityPoolGroup = levelGroup.append('g')
        .attr('transform', `translate(${treeWidth - 170}, -20)`);
      
      // Pool label
      communityPoolGroup.append('text')
        .attr('x', 0)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#4fc3f7') // Light blue
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('Community Token Pool');
      
      // Pool background
      communityPoolGroup.append('rect')
        .attr('x', -poolWidth / 2 - 5)
        .attr('y', -poolHeight - 5)
        .attr('width', poolWidth + 10)
        .attr('height', poolHeight + 10)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', '#1a1a2e') // Dark background
        .attr('stroke', '#4fc3f7') // Light blue border
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);
      
      // Pool border
      communityPoolGroup.append('rect')
        .attr('x', -poolWidth / 2)
        .attr('y', -poolHeight)
        .attr('width', poolWidth)
        .attr('height', poolHeight)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('stroke', '#4fc3f7') // Light blue border
        .attr('stroke-width', 2)
        .attr('fill', 'none');
      
      // Pool fill
      communityPoolGroup.append('rect')
        .attr('x', -poolWidth / 2)
        .attr('y', -communityPoolFillHeight)
        .attr('width', poolWidth)
        .attr('height', communityPoolFillHeight)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#4fc3f7') // Light blue fill
        .attr('opacity', 0.7);
      
      // Token count
      communityPoolGroup.append('text')
        .attr('x', 0)
        .attr('y', -poolHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`${Math.round(round.communityTokenPool)} tokens`);
      
      // Investment Pool
      const scaledInvestmentPool = round.investmentPool > 10000 
        ? Math.log(round.investmentPool) * 10 
        : round.investmentPool / 100;
      const investmentPoolFillHeight = Math.min(poolHeight * (scaledInvestmentPool / 80), poolHeight);
      
      const investmentPoolGroup = levelGroup.append('g')
        .attr('transform', `translate(170, -20)`);
      
      // Pool label
      investmentPoolGroup.append('text')
        .attr('x', 0)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffb74d') // Orange
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text('Investment Pool');
      
      // Pool background
      investmentPoolGroup.append('rect')
        .attr('x', -poolWidth / 2 - 5)
        .attr('y', -poolHeight - 5)
        .attr('width', poolWidth + 10)
        .attr('height', poolHeight + 10)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', '#1a1a2e') // Dark background
        .attr('stroke', '#ffb74d') // Orange border
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);
      
      // Pool border
      investmentPoolGroup.append('rect')
        .attr('x', -poolWidth / 2)
        .attr('y', -poolHeight)
        .attr('width', poolWidth)
        .attr('height', poolHeight)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('stroke', '#ffb74d') // Orange border
        .attr('stroke-width', 2)
        .attr('fill', 'none');
      
      // Pool fill
      investmentPoolGroup.append('rect')
        .attr('x', -poolWidth / 2)
        .attr('y', -investmentPoolFillHeight)
        .attr('width', poolWidth)
        .attr('height', investmentPoolFillHeight)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#ffb74d') // Orange fill
        .attr('opacity', 0.7);
      
      // Value label
      investmentPoolGroup.append('text')
        .attr('x', 0)
        .attr('y', -poolHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`€${formatValue(round.investmentPool)}`);
    });
  }

  // Setup on mount
  onMount(() => {
    if (browser) {
      // Initialize D3 transition only in the browser
      d3Transition = transition();
      
      parseCSV();
      setupScrollTrigger();
      
      // Handle window resize
      const handleResize = () => {
        // Update dimensions
        treeWidth = Math.min(window.innerWidth - 40, 1000);
        
        // Reinitialize visualization with new dimensions
        initializeD3Visualization();
      };
      
      window.addEventListener('resize', handleResize);
      handleResize();
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  });
</script>

<svelte:head>
  <title>Token Emission Roadmap</title>
  <meta name="description" content="Visioncreator Token Emission Roadmap - Animated visualization of token growth">
</svelte:head>

<main class="min-h-screen bg-surface-900">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-3xl md:text-4xl font-bold text-tertiary-300 mb-4">Token Emission Roadmap</h1>
    <p class="text-tertiary-300 mb-8">Scroll down to see how the Visioncreator token ecosystem grows over time</p>
    
    {#if $isLoading}
      <div class="flex justify-center items-center py-20">
        <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else}
      <div class="relative mb-20">
        <div class="sticky top-0 w-full z-10 bg-surface-900/80 backdrop-blur-sm py-4 flex justify-between items-center border-b border-surface-700/30">
          <div class="text-tertiary-300 text-sm">
            <span class="font-semibold">Round {$visibleRounds}</span> of {$tokenData.length}
          </div>
          
          <div class="flex space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-amber-400"></div>
              <span class="text-xs text-tertiary-300">Investment Pool</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full bg-blue-400"></div>
              <span class="text-xs text-tertiary-300">Community Token Pool</span>
            </div>
          </div>
        </div>
        
        <!-- SVG container for visualization -->
        <svg class="tree-visualization w-full" height={treeHeight} viewBox="0 0 {treeWidth} {treeHeight}" preserveAspectRatio="xMidYMid meet">
          <!-- Define filters -->
          <defs>
            <filter id="tree-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="pool-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <!-- D3 will render the visualization here -->
        </svg>
        
        <!-- Static content to create scroll space -->
        <div class="h-[5000px]"></div>
      </div>
    {/if}
  </div>
</main>

<style>
  /* Style for the visualization */
  :global(body) {
    background-color: #121212;
    color: #d1c4e9;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  main {
    position: relative;
    overflow-x: hidden;
    background-color: #121212;
  }
  
  .tree-visualization {
    background-color: #121212;
  }
  
  /* Define CSS variables with fallbacks */
  :root {
    --color-surface-900: #121212;
    --color-surface-800: #1a1a2e;
    --color-surface-700: #2a2a3c;
    --color-tertiary-500: #7e57c2;
    --color-tertiary-300: #d1c4e9;
    --color-primary-500: #64b5f6;
    --color-secondary-500: #4fc3f7;
  }
</style>
