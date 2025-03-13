<script lang="ts">
  export let slides: {component: any; title: string}[] = [];
  export let currentSlide = 0;
  
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();
  
  let isLoading = true;
  
  // Allow fullscreen toggle
  let isFullscreen = false;
  
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        isFullscreen = false;
      }
    }
  }
  
  // Handle fullscreen change events
  onMount(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Simulate slide loading completion
    isLoading = false;
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });
  
  // Track when current slide changes
  $: {
    if (currentSlide !== undefined) {
      isLoading = true;
      setTimeout(() => {
        isLoading = false;
      }, 300);
    }
  }
  
  function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
  }
</script>

<div class="presentation relative h-full w-full overflow-hidden bg-slate-900">
  <!-- Background gradient -->
  <div class="absolute inset-0 -z-10">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-l from-purple-900/20 to-transparent rounded-full blur-3xl opacity-30"></div>
    <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-cyan-900/20 to-transparent rounded-full blur-3xl opacity-20"></div>
  </div>
  
  <!-- Loading indicator -->
  {#if isLoading}
    <div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div class="w-20 h-20 rounded-full bg-slate-800/80 backdrop-blur-sm flex items-center justify-center">
        <div class="loading-spinner"></div>
      </div>
    </div>
  {/if}
  
  <!-- Slide display area -->
  <div class="h-full w-full">
    {#if slides[currentSlide]}
      <div in:fade={{ duration: 400 }} out:fade={{ duration: 200 }} class="h-full w-full">
        <svelte:component this={slides[currentSlide].component} />
      </div>
    {/if}
  </div>
  
  <!-- Fullscreen toggle button -->
  <button 
    class="absolute bottom-4 right-4 p-3 rounded-full bg-slate-800/50 hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 transition-all duration-300 z-50 backdrop-blur-sm"
    on:click={toggleFullscreen}
    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
  >
    {#if isFullscreen}
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path></svg>
    {/if}
  </button>
</div>

<style>
  .presentation {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid rgba(103, 232, 249, 0.8); /* cyan-400 */
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style> 