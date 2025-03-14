<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  let visible = false;
  let logoError = false;
  let logoSources = [
    '/logo/logo.png',
    '/images/visioncreator-logo.png',
    '/static/logo/logo.png',
    '/static/images/visioncreator-logo.png',
    '/logo.png',
    '/assets/logo.png'
  ];
  let currentLogoSrc = logoSources[0];
  let logoIndex = 0;
  
  function handleImageError() {
    logoIndex++;
    if (logoIndex < logoSources.length) {
      currentLogoSrc = logoSources[logoIndex];
    } else {
      logoError = true;
      console.error('Failed to load logo from any of the expected locations');
    }
  }
  
  onMount(() => {
    setTimeout(() => {
      visible = true;
    }, 300);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-4 md:p-8 bg-[#0a192f]">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Pitch Deck Hero Section -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <!-- Left - Logo and Brand -->
      <div class="md:w-2/5 flex flex-col items-center md:items-start mb-8 md:mb-0">
        {#if visible}
          <div in:fade={{ duration: 400 }}>
            {#if !logoError}
              <div class="w-28 h-28 md:w-32 md:h-32 relative">
                <img 
                  src={currentLogoSrc}
                  alt="VisionCreator Logo" 
                  class="w-full h-full object-contain filter drop-shadow-lg"
                  on:error={handleImageError}
                />
              </div>
            {:else}
              <!-- SVG Fallback logo -->
              <div class="w-28 h-28 md:w-32 md:h-32 relative">
                <svg viewBox="0 0 200 200" width="100%" height="100%">
                  <circle cx="100" cy="100" r="95" fill="#0a192f" stroke="#64ffda" stroke-width="2" />
                  <circle cx="100" cy="100" r="85" fill="none" stroke="#f0b429" stroke-width="1" stroke-dasharray="4,4" />
                  <path d="M65,80 Q100,40 135,80 Q150,100 135,120 Q100,160 65,120 Q50,100 65,80 Z" fill="#163075" />
                  <path d="M75,85 Q100,55 125,85 M85,140 Q100,120 115,140" stroke="white" fill="none" stroke-width="2" />
                  <path d="M90,95 A5,8 0 1,0 90,110 Z M110,95 A5,8 0 1,0 110,110 Z" fill="white" />
                  <path d="M130,80 L150,80 M130,90 L150,90 M130,100 L150,100 M130,110 L145,110" stroke="#f0b429" stroke-width="2" />
                </svg>
              </div>
            {/if}
            
            <div class="mt-4">
              <div class="text-2xl font-bold tracking-wide">
                <span class="text-white">Vision</span><span class="text-[#64ffda]">creator</span>
              </div>
              <div class="mt-1 text-sm text-gray-400">The future of work</div>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Right - Headline and Subheadline -->
      <div class="md:w-3/5">
        {#if visible}
          <div in:fade={{ duration: 400, delay: 100 }}>
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Traditional Work Models Have <span class="text-[#f0b429]">Lost Their Spark</span>
            </h1>
            
            <div class="h-1 w-24 bg-[#64ffda]/30 mt-6 mb-6"></div>
            
            <p class="text-xl md:text-2xl text-gray-300 leading-relaxed">
              This is the story of <span class="text-[#64ffda] font-medium">you</span> — a visionary knowledge worker or creator — deserving a way of working that truly inspires.
            </p>
          </div>
        {/if}
      </div>
    </div>
    
    {#if visible}
      <!-- Key Pain Points -->
      <div class="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" in:fade={{ duration: 400, delay: 200 }}>
        <!-- Point 1 -->
        <div class="bg-[#0a192f] border border-gray-800 rounded-lg p-5 shadow-lg transform transition hover:shadow-[#64ffda]/5 duration-300">
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-[#64ffda]/10 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#64ffda]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white">Outdated Systems</h3>
          </div>
          <p class="text-gray-400">Work structures designed for a different era limit creative potential and satisfaction</p>
        </div>
        
        <!-- Point 2 -->
        <div class="bg-[#0a192f] border border-gray-800 rounded-lg p-5 shadow-lg transform transition hover:shadow-[#64ffda]/5 duration-300">
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-[#64ffda]/10 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#64ffda]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white">Locked Potential</h3>
          </div>
          <p class="text-gray-400">Current models constrain visionaries from reaching their fullest expression</p>
        </div>
        
        <!-- Point 3 -->
        <div class="bg-[#0a192f] border border-gray-800 rounded-lg p-5 shadow-lg transform transition hover:shadow-[#64ffda]/5 duration-300">
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-[#64ffda]/10 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#64ffda]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-white">Lost Inspiration</h3>
          </div>
          <p class="text-gray-400">Work should be a source of inspiration, not merely obligation or survival</p>
        </div>
      </div>
    {/if}
    
    {#if visible}
      <!-- Bottom Call to Action -->
      <div class="mt-12 text-center" in:fade={{ duration: 400, delay: 300 }}>
        <p class="text-2xl text-[#f0b429] font-medium">
          You deserve better.
        </p>
      </div>
    {/if}
    
    <!-- Slide Number -->
    <div class="absolute bottom-4 right-4 text-xs text-gray-500">
      01
    </div>
  </div>
</div>

<style>
  .slide-content {
    min-height: calc(100vh - 80px);
    position: relative;
  }
</style> 