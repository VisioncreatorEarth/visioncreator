<script>
  // MoneyFlows.svelte - Visualizing how money flows in the VisionCreator ecosystem
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';

  let revealed = false;
  let titleRevealed = false;
  let contributionsRevealed = false;
  let poolRevealed = false;
  let flowsRevealed = false;
  let outputsRevealed = false;
  let conclusionRevealed = false;

  // Interactive elements
  let hoveredElement = null;

  onMount(() => {
    setTimeout(() => {
      titleRevealed = true;
      setTimeout(() => {
        contributionsRevealed = true;
        setTimeout(() => {
          poolRevealed = true;
          setTimeout(() => {
            flowsRevealed = true;
            setTimeout(() => {
              outputsRevealed = true;
              setTimeout(() => {
                conclusionRevealed = true;
              }, 800);
            }, 800);
          }, 800);
        }, 800);
      }, 600);
    }, 400);
  });
</script>

<div class="h-full flex flex-col items-center justify-center p-6 md:p-12 text-white">
  <!-- Title section -->
  {#if titleRevealed}
    <div 
      class="w-full text-center mb-6" 
      in:fly={{ y: -20, duration: 600, delay: 200, easing: quintOut }}
    >
      <h1 class="text-3xl md:text-4xl font-bold mb-2">How The Money Flows</h1>
      <p class="text-xl md:text-2xl text-rose-300 font-light">Making it practical</p>
    </div>
  {/if}

  <!-- Compact visualization with improved flow design -->
  <div class="w-full max-w-4xl mx-auto relative mb-4">
    <!-- Interactive flow diagram - more compact version -->
    <div class="relative h-[420px] bg-gray-900/30 rounded-2xl border border-gray-800/50 p-4 overflow-hidden">
      
      <!-- Background visual elements -->
      <div class="absolute inset-0 -z-10 opacity-10">
        <div class="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-gradient-to-l from-rose-500 to-transparent blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-gradient-to-r from-rose-500 to-transparent blur-3xl"></div>
      </div>

      <!-- Contributors section at top -->
      {#if contributionsRevealed}
        <div 
          class="absolute top-4 left-0 w-full flex justify-center"
          in:fade={{ duration: 500, delay: 100 }}
        >
          <div class="flex flex-wrap justify-center gap-3 w-full">
            <!-- Contributors -->
            <div class="flex flex-col items-center">
              <div class="mb-1 text-center">
                <div class="text-sm text-gray-400 mb-1">Members</div>
              </div>
              <div class="flex gap-2">
                {#each [1, 2, 3, 4] as i}
                  <div 
                    class="bg-gradient-to-b from-rose-900/40 to-rose-900/20 p-1 rounded-full w-14 h-14 flex items-center justify-center border border-rose-500/30 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    on:mouseenter={() => hoveredElement = `contrib-${i}`}
                    on:mouseleave={() => hoveredElement = null}
                    class:ring-2={hoveredElement === `contrib-${i}`}
                    class:ring-rose-400={hoveredElement === `contrib-${i}`}
                  >
                    <div class="text-lg font-bold text-rose-300">€1</div>
                  </div>
                {/each}
              </div>
              <div class="text-center mt-1">
                <div class="text-xs text-gray-400">Daily Contributions</div>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Flow connectors - replaced with curved SVG paths for better aesthetics -->
      {#if flowsRevealed}
        <div class="absolute top-[95px] left-0 w-full" in:fade={{ duration: 500, delay: 100 }}>
          <svg width="100%" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="overflow-visible">
            <!-- Left to center flow path -->
            <path d="M100,10 C100,50 140,80 200,100" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Center flow path -->
            <path d="M200,10 C200,50 200,80 200,100" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Right to center flow path -->
            <path d="M300,10 C300,50 260,80 200,100" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Far left to center -->
            <path d="M70,10 C70,60 120,80 200,100" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Far right to center -->
            <path d="M330,10 C330,60 280,80 200,100" stroke="url(#grad1)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Gradient definitions -->
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(244, 63, 94, 0.2)" />
                <stop offset="100%" stop-color="rgba(244, 63, 94, 0.8)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      {/if}

      <!-- Community Pool in the center - more compact -->
      {#if poolRevealed}
        <div class="absolute top-[200px] left-1/2 transform -translate-x-1/2 w-[300px]"
          in:fly={{ y: 20, duration: 800, delay: 300, easing: elasticOut }}>
          <div 
            class="bg-gradient-to-r from-rose-900/40 to-rose-800/40 rounded-xl p-4 text-center border-2 border-rose-500/30 shadow-lg hover:border-rose-400 transition-colors cursor-pointer"
            on:mouseenter={() => hoveredElement = 'pool'}
            on:mouseleave={() => hoveredElement = null}
            class:ring-2={hoveredElement === 'pool'}
            class:ring-rose-400={hoveredElement === 'pool'}
          >
            <div class="text-xl font-bold text-rose-300 mb-1">Community Pool</div>
            <div class="text-gray-300 text-xs">(Grows with each contribution)</div>
            <div class="flex justify-center gap-3 mt-3 opacity-80">
              <div class="text-sm font-medium text-gray-300">
                1,000 members = <span class="text-rose-300">€30,000/month</span>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Distribution connectors - improved with SVG curves -->
      {#if flowsRevealed}
        <div class="absolute top-[270px] left-0 w-full" in:fade={{ duration: 600, delay: 500 }}>
          <svg width="100%" height="100" viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="overflow-visible">
            <!-- Center to left path -->
            <path d="M200,10 C150,30 120,40 80,80" stroke="url(#grad2)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Center to bottom path -->
            <path d="M200,10 C200,30 200,40 200,80" stroke="url(#grad3)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Center to right path -->
            <path d="M200,10 C250,30 280,40 320,80" stroke="url(#grad4)" stroke-width="2" stroke-linecap="round" class="flow-path" />
            
            <!-- Gradient definitions -->
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(244, 63, 94, 0.6)" />
                <stop offset="100%" stop-color="rgba(251, 191, 36, 0.8)" />
              </linearGradient>
              
              <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="rgba(244, 63, 94, 0.6)" />
                <stop offset="100%" stop-color="rgba(20, 184, 166, 0.8)" />
              </linearGradient>
              
              <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(244, 63, 94, 0.6)" />
                <stop offset="100%" stop-color="rgba(59, 130, 246, 0.8)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      {/if}

      <!-- Output destinations - more compact -->
      {#if outputsRevealed}
        <div class="absolute bottom-6 left-0 w-full flex justify-between px-8"
          in:fly={{ y: 20, duration: 600, delay: 200, easing: quintOut }}>
          
          <!-- Projects funding -->
          <div 
            class="bg-gradient-to-b from-amber-900/40 to-amber-900/20 p-3 rounded-xl text-center w-[30%] border border-amber-500/30 shadow-lg hover:scale-105 transition-transform cursor-pointer"
            on:mouseenter={() => hoveredElement = 'projects'}
            on:mouseleave={() => hoveredElement = null}
            class:ring-2={hoveredElement === 'projects'}
            class:ring-amber-400={hoveredElement === 'projects'}
          >
            <div class="w-8 h-8 mx-auto rounded-full bg-amber-900/40 border border-amber-500/30 flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="font-medium text-amber-300 text-sm mb-1">Project Funding</div>
            <div class="text-xs text-gray-300">
              Community-voted startups and projects
            </div>
          </div>
          
          <!-- Income shares -->
          <div 
            class="bg-gradient-to-b from-teal-900/40 to-teal-900/20 p-3 rounded-xl text-center w-[30%] border border-teal-500/30 shadow-lg hover:scale-105 transition-transform cursor-pointer"
            on:mouseenter={() => hoveredElement = 'income'}
            on:mouseleave={() => hoveredElement = null}
            class:ring-2={hoveredElement === 'income'}
            class:ring-teal-400={hoveredElement === 'income'}
          >
            <div class="w-8 h-8 mx-auto rounded-full bg-teal-900/40 border border-teal-500/30 flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="font-medium text-teal-300 text-sm mb-1">Income Shares</div>
            <div class="text-xs text-gray-300">
              Token-based earnings for members
            </div>
          </div>
          
          <!-- Platform growth -->
          <div 
            class="bg-gradient-to-b from-blue-900/40 to-blue-900/20 p-3 rounded-xl text-center w-[30%] border border-blue-500/30 shadow-lg hover:scale-105 transition-transform cursor-pointer"
            on:mouseenter={() => hoveredElement = 'growth'}
            on:mouseleave={() => hoveredElement = null}
            class:ring-2={hoveredElement === 'growth'}
            class:ring-blue-400={hoveredElement === 'growth'}
          >
            <div class="w-8 h-8 mx-auto rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div class="font-medium text-blue-300 text-sm mb-1">Shared Growth</div>
            <div class="text-xs text-gray-300">
              Platform development and improvements
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Bottom conclusion -->
  {#if conclusionRevealed}
    <div 
      class="mt-3 text-center max-w-3xl"
      in:fade={{ duration: 800, delay: 200 }}
    >
      <p class="text-xl">
        <span class="text-rose-300 font-medium">With just €1/day</span>, we build a powerful funding ecosystem that grows with each new member.
      </p>
    </div>
  {/if}
</div>

<style>
  .flow-path {
    opacity: 0.8;
    stroke-dasharray: 150;
    stroke-dashoffset: 150;
    animation: flow 1.5s ease-in-out forwards;
  }
  
  @keyframes flow {
    to {
      stroke-dashoffset: 0;
    }
  }
  
  /* Enhanced hover interactions */
  div[class*="hover:scale"] {
    transition: all 0.3s ease;
  }
</style> 