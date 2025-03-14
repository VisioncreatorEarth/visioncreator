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

<div class="slide-content flex flex-col items-center justify-center h-full p-6 md:p-12 bg-[#0a192f]">
  <!-- Content Container -->
  <div class="max-w-6xl w-full mx-auto">
    <!-- Header -->
    {#if visible}
      <div class="mb-10" in:fade={{ duration: 400 }}>
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
          Why This <span class="text-[#f0b429]">Matters</span>
        </h1>
        <div class="h-1 w-32 bg-[#64ffda]/30 mt-4 mb-4"></div>
        <p class="text-xl md:text-2xl text-gray-300">
          The status quo significantly impacts your quality of life
        </p>
      </div>
    {/if}
    
    <!-- Top Stat - Prominently Featured -->
    {#if visible}
      <div class="flex justify-center mb-12" in:fade={{ duration: 400, delay: 150 }}>
        <div class="text-center px-8 py-6 bg-[#0a1a3a]/50 rounded-lg border border-gray-800 max-w-2xl">
          <div class="text-5xl md:text-7xl font-bold text-[#64ffda] mb-2">33%</div>
          <div class="text-xl md:text-2xl text-white">OF YOUR LIFE SPENT WORKING</div>
          <div class="mt-4 text-gray-400">That's 90,000+ hours over your lifetime</div>
        </div>
      </div>
    {/if}
    
    <!-- Three Impact Cards -->
    {#if visible}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" in:fade={{ duration: 400, delay: 250 }}>
        <!-- Impact Card 1 -->
        <div class="bg-[#0a1a3a]/50 rounded-lg p-5 border border-gray-800">
          <div class="flex items-start">
            <div class="shrink-0 w-10 h-10 rounded-full bg-[#0a192f] flex items-center justify-center mr-4 border border-[#f0b429]/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#f0b429]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#f0b429]">Time Investment</h3>
              <p class="text-gray-300 mt-1">Your work should enhance well-being, not drain purpose</p>
            </div>
          </div>
        </div>
        
        <!-- Impact Card 2 -->
        <div class="bg-[#0a1a3a]/50 rounded-lg p-5 border border-gray-800">
          <div class="flex items-start">
            <div class="shrink-0 w-10 h-10 rounded-full bg-[#0a192f] flex items-center justify-center mr-4 border border-[#64ffda]/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#64ffda]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#64ffda]">Engagement Crisis</h3>
              <p class="text-gray-300 mt-1">85% of workers are not engaged at their jobs</p>
            </div>
          </div>
        </div>
        
        <!-- Impact Card 3 -->
        <div class="bg-[#0a1a3a]/50 rounded-lg p-5 border border-gray-800">
          <div class="flex items-start">
            <div class="shrink-0 w-10 h-10 rounded-full bg-[#0a192f] flex items-center justify-center mr-4 border border-[#f0b429]/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#f0b429]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#f0b429]">Emotional Impact</h3>
              <p class="text-gray-300 mt-1">47% of knowledge workers experience burnout</p>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Bottom Message -->
    {#if visible}
      <div class="text-center" in:fade={{ duration: 400, delay: 350 }}>
        <p class="text-2xl md:text-3xl text-white">
          Work should <span class="text-[#64ffda]">contribute</span> to wellbeing, not <span class="text-[#f0b429]">diminish</span> it
        </p>
      </div>
    {/if}
    
    <!-- Slide Number -->
    <div class="absolute bottom-4 right-4 text-sm text-gray-500">
      03
    </div>
  </div>
</div>

<style>
  .slide-content {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }
</style> 