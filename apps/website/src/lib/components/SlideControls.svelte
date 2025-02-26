<script lang="ts">
  export let currentSlide = 1;
  export let totalSlides = 1;
  export let onNext = () => {};
  export let onPrev = () => {};
  export let onGoToSlide = (index: number) => {};
  
  let isControlsOpen = false;
  
  function toggleControls() {
    isControlsOpen = !isControlsOpen;
  }
</script>

<div class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none">
  <div class="flex flex-col items-center">
    <!-- Navigation Controls -->
    <div class="mb-4 flex items-center gap-4 pointer-events-auto {isControlsOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300">
      <!-- Previous button -->
      <button 
        class="p-3 rounded-full bg-slate-800/70 backdrop-blur-sm hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={onPrev}
        disabled={currentSlide <= 1}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      
      <!-- Slide counter -->
      <div class="bg-slate-800/70 backdrop-blur-sm text-slate-300 px-4 py-2 rounded-full">
        {currentSlide} / {totalSlides}
      </div>
      
      <!-- Next button -->
      <button 
        class="p-3 rounded-full bg-slate-800/70 backdrop-blur-sm hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={onNext}
        disabled={currentSlide >= totalSlides}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
      
      <!-- Slide thumbnails -->
      <div class="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-slate-800/50 backdrop-blur-sm rounded-lg {isControlsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-300">
        {#each Array(totalSlides) as _, i}
          <button 
            class="w-2 h-2 rounded-full {currentSlide === i + 1 ? 'bg-cyan-400' : 'bg-slate-500'} hover:bg-cyan-300 transition-all"
            on:click={() => onGoToSlide(i)}
            title={`Go to slide ${i + 1}`}
          ></button>
        {/each}
      </div>
    </div>
    
    <!-- Toggle button -->
    <button 
      class="p-3 mb-6 rounded-full bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-all duration-300 pointer-events-auto"
      on:click={toggleControls}
    >
      {#if isControlsOpen}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      {/if}
    </button>
  </div>
</div> 