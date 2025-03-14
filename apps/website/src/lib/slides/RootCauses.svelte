<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  let visible = false;
  
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 300);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-4 md:p-8 bg-[#0a192f]">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Minimal Header with Strong Visual Impact -->
    <div class="text-center mb-6">
      <h2 class="text-5xl md:text-6xl lg:text-7xl font-bold mb-3">
        <span class="text-white">The </span>
        <span class="text-[#f0b429]">False Choice</span>
      </h2>
      
      {#if visible}
        <div class="mx-auto mb-8" in:fade={{ duration: 400 }}>
          <p class="text-xl md:text-2xl text-[#64ffda] font-medium tracking-wide">
            Neither option leads to fulfillment
          </p>
        </div>
      {/if}
    </div>
    
    {#if visible}
      <!-- Main Visual Component - The Fork in the Road -->
      <div class="relative w-full h-16 md:h-24 mb-10 overflow-hidden">
        <!-- Central Dividing Line -->
        <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-white to-amber-500 transform -translate-y-1/2"></div>
        
        <!-- Starting Point -->
        <div class="absolute top-1/2 left-1/2 w-6 h-6 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
        
        <!-- "YOU ARE HERE" Label -->
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 text-white text-sm">YOU ARE HERE</div>
      </div>
    {/if}
    
    {#if visible}
      <!-- Two Paths - Clean Visual Comparison -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <!-- Left Path - Employee -->
        <div class="flex flex-col h-full" in:fade={{ duration: 400, delay: 100 }}>
          <div class="bg-gradient-to-br from-red-900/20 to-red-950/30 border border-red-900/20 rounded-xl p-6 flex-grow">
            <h3 class="text-2xl font-bold text-white border-b border-gray-700/50 pb-3 mb-4">Work Under Direction</h3>
            
            <ul class="space-y-4 text-gray-200">
              <li class="flex items-start">
                <span class="text-red-400 mr-3 font-bold text-lg">→</span>
                <span>Create value for <span class="text-red-400 font-medium">someone else</span></span>
              </li>
              <li class="flex items-start">
                <span class="text-red-400 mr-3 font-bold text-lg">→</span>
                <span>Follow <span class="text-red-400 font-medium">others' directions</span></span>
              </li>
              <li class="flex items-start">
                <span class="text-red-400 mr-3 font-bold text-lg">→</span>
                <span><span class="text-red-400 font-medium">Limited</span> potential realization</span>
              </li>
            </ul>
          </div>
          
          <div class="text-center mt-3 text-lg text-red-300">
            "Building someone else's dream"
          </div>
        </div>
        
        <!-- Right Path - Founder -->
        <div class="flex flex-col h-full" in:fade={{ duration: 400, delay: 200 }}>
          <div class="bg-gradient-to-br from-amber-900/20 to-amber-950/30 border border-amber-900/20 rounded-xl p-6 flex-grow">
            <h3 class="text-2xl font-bold text-white border-b border-gray-700/50 pb-3 mb-4">Run Your Own Enterprise</h3>
            
            <ul class="space-y-4 text-gray-200">
              <li class="flex items-start">
                <span class="text-amber-400 mr-3 font-bold text-lg">→</span>
                <span>Shoulder <span class="text-amber-400 font-medium">overwhelming</span> responsibility</span>
              </li>
              <li class="flex items-start">
                <span class="text-amber-400 mr-3 font-bold text-lg">→</span>
                <span>Life <span class="text-amber-400 font-medium">revolves around</span> business</span>
              </li>
              <li class="flex items-start">
                <span class="text-amber-400 mr-3 font-bold text-lg">→</span>
                <span><span class="text-amber-400 font-medium">Constant</span> administrative burden</span>
              </li>
            </ul>
          </div>
          
          <div class="text-center mt-3 text-lg text-amber-300">
            "Drowning in responsibilities"
          </div>
        </div>
      </div>
    {/if}
    
    {#if visible}
      <!-- Key Insight -->
      <div class="text-center mb-8" in:fade={{ duration: 400, delay: 300 }}>
        <div class="inline-block px-8 py-4 bg-[#0a192f] border-2 border-[#64ffda]/30 rounded-lg">
          <p class="text-2xl md:text-3xl text-white">
            You need a <span class="text-[#f0b429] font-bold">new model</span> where you
            <span class="text-[#64ffda] font-bold">own what you create</span>
          </p>
        </div>
      </div>
    {/if}
    
    {#if visible}
      <!-- Bottom Quote for Transition -->
      <div class="text-center mt-8 opacity-80" in:fade={{ duration: 400, delay: 350 }}>
        <p class="text-xl text-gray-400 italic">
          "The traditional work paradigm is broken at both ends of the spectrum."
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .slide-content {
    min-height: calc(100vh - 80px);
  }
</style> 