<script>
  // BetterSolution.svelte - We have a better solution!
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  let revealed = false;
  let solutionRevealed = false;
  let featuresRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      setTimeout(() => {
        solutionRevealed = true;
        setTimeout(() => {
          featuresRevealed = true;
        }, 800);
      }, 1000);
    }, 300);
  });
</script>

<div class="h-full flex flex-col items-center justify-center p-6 md:p-12 text-white">
  <!-- Title section -->
  {#if revealed}
    <div 
      class="w-full text-center mb-8" 
      in:fly={{ y: -20, duration: 600, delay: 200, easing: quintOut }}
    >
      <h1 class="text-3xl md:text-4xl font-bold mb-2">We Have a Better Solution</h1>
      <p class="text-xl md:text-2xl text-teal-300 font-light">The middle path to true autonomy</p>
    </div>
  {/if}

  <!-- Solution visualization -->
  {#if solutionRevealed}
    <div class="w-full flex flex-col max-w-4xl relative mb-12">
      <div class="grid grid-cols-3 gap-4 z-10">
        <!-- Old approach -->
        <div 
          class="bg-gray-800/50 rounded-xl p-4 text-center opacity-50"
          in:fly={{ y: 20, duration: 500, easing: quintOut }}
        >
          <h3 class="text-lg font-medium text-orange-400 mb-2">EMPLOYEE</h3>
          <div class="text-sm text-gray-400">Security without freedom</div>
        </div>
        
        <!-- VisionCreator -->
        <div 
          class="bg-gradient-to-b from-teal-900/40 to-cyan-900/40 rounded-xl p-4 text-center border-2 border-teal-500 transform scale-110 shadow-lg shadow-teal-500/20"
          in:fly={{ y: -20, duration: 800, delay: 300, easing: quintOut }}
        >
          <h3 class="text-xl font-bold text-teal-300 mb-2">VISIONCREATOR</h3>
          <div class="text-sm text-teal-100">Security AND freedom</div>
        </div>
        
        <!-- Old approach -->
        <div 
          class="bg-gray-800/50 rounded-xl p-4 text-center opacity-50"
          in:fly={{ y: 20, duration: 500, easing: quintOut }}
        >
          <h3 class="text-lg font-medium text-amber-400 mb-2">FOUNDER</h3>
          <div class="text-sm text-gray-400">Freedom without security</div>
        </div>
      </div>
      
      <!-- Connecting line -->
      <div class="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 via-teal-500 to-amber-500 -translate-y-1/2"></div>
    </div>
  {/if}
  
  <!-- Features -->
  {#if featuresRevealed}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
      <!-- Feature 1 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-5 border-t-2 border-teal-500"
        in:fly={{ y: 30, duration: 500, delay: 100, easing: quintOut }}
      >
        <div class="rounded-full bg-teal-500/20 w-12 h-12 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-teal-300 mb-2">Time Freedom</h3>
        <p class="text-sm text-gray-300">
          Work when and how much you want. No fixed schedules, just results that match your contribution level.
        </p>
      </div>
      
      <!-- Feature 2 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-5 border-t-2 border-teal-500"
        in:fly={{ y: 30, duration: 500, delay: 200, easing: quintOut }}
      >
        <div class="rounded-full bg-teal-500/20 w-12 h-12 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-1.565" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-teal-300 mb-2">Location Freedom</h3>
        <p class="text-sm text-gray-300">
          Contribute from anywhere in the world. Your geographic location should never limit your opportunities.
        </p>
      </div>
      
      <!-- Feature 3 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-5 border-t-2 border-teal-500"
        in:fly={{ y: 30, duration: 500, delay: 300, easing: quintOut }}
      >
        <div class="rounded-full bg-teal-500/20 w-12 h-12 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-teal-300 mb-2">Financial Autonomy</h3>
        <p class="text-sm text-gray-300">
          Own what you help build through tokens that represent actual ownership, not just compensation.
        </p>
      </div>
    </div>
  {/if}
  
  <!-- Bottom tagline -->
  {#if featuresRevealed}
    <div 
      class="mt-8 text-center max-w-3xl"
      in:fade={{ duration: 800, delay: 500 }}
    >
      <p class="text-lg text-teal-200 font-medium">
        VisionCreator is a decentralized autonomous organization (DAO) that combines the best of both worlds.
      </p>
    </div>
  {/if}
</div> 