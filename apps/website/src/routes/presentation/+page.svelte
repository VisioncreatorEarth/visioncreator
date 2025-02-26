<script lang="ts">
  import { onMount } from 'svelte';
  
  // Import slides
  import HelloEarth from '$lib/slides/HelloEarth.svelte';
  import HumanQuestion from '$lib/slides/HumanQuestion.svelte';
  import AutonomyAnswer from '$lib/slides/AutonomyAnswer.svelte';
  import VisionRise from '$lib/slides/VisionRise.svelte';
  import Results from '$lib/slides/Results.svelte';
  
  // Define slides
  const slides = [
    { id: 'hello-earth', title: 'Freedom to Create', component: HelloEarth, icon: '🌍' },
    { id: 'human-question', title: 'The Question', component: HumanQuestion, icon: '❓' },
    { id: 'autonomy-answer', title: 'Autonomy', component: AutonomyAnswer, icon: '✨' },
    { id: 'vision-rise', title: 'RISE', component: VisionRise, icon: '⬆️' },
    { id: 'results', title: 'Real Results', component: Results, icon: '📊' }
  ];
  
  // Current slide state
  let currentSlideIndex = 0;
  $: currentSlide = slides[currentSlideIndex];
  
  // Slide navigation functions
  function selectSlide(index: number) {
    currentSlideIndex = index;
  }
  
  function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
    }
  }
  
  function prevSlide() {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
    }
  }
  
  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === ' ') {
      nextSlide();
    } else if (event.key === 'ArrowLeft') {
      prevSlide();
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<svelte:head>
  <title>VisionCreator | Presentation</title>
</svelte:head>

<div class="presentation-container h-screen flex overflow-hidden bg-slate-900 text-white">
  <!-- Sidebar -->
  <div class="sidebar w-64 border-r border-slate-700/50 bg-slate-800/50 backdrop-blur-xl overflow-y-auto">
    <div class="p-4 border-b border-slate-700/50">
      <h1 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        VisionCreator
      </h1>
      <p class="text-sm text-slate-400">Presentation Mode</p>
    </div>
    
    <!-- Slides List -->
    <div class="py-4">
      <h2 class="px-4 text-xs uppercase text-slate-500 font-semibold mb-2">Slides</h2>
      <ul class="space-y-1">
        {#each slides as slide, index}
          <li>
            <button
              on:click={() => selectSlide(index)}
              class="w-full px-4 py-3 flex items-center {currentSlideIndex === index ? 'bg-slate-700/70 border-l-4 border-cyan-400' : 'border-l-4 border-transparent hover:bg-slate-700/30'} transition-all duration-200"
            >
              <div class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/70 mr-2">
                {slide.icon}
              </div>
              <span class="{currentSlideIndex === index ? 'text-cyan-100' : 'text-cyan-100/70'}">{slide.title}</span>
              {#if currentSlideIndex === index}
                <span class="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
    
    <!-- Controls -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-md">
      <div class="flex items-center justify-between">
        <button
          on:click={prevSlide}
          class="px-3 py-2 rounded-lg {currentSlideIndex > 0 ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/40 cursor-not-allowed'} transition-all"
          disabled={currentSlideIndex === 0}
        >
          ← Prev
        </button>
        <span class="text-sm text-slate-400">{currentSlideIndex + 1} / {slides.length}</span>
        <button
          on:click={nextSlide}
          class="px-3 py-2 rounded-lg {currentSlideIndex < slides.length - 1 ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700/40 cursor-not-allowed'} transition-all"
          disabled={currentSlideIndex === slides.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  </div>
  
  <!-- Main Content Area -->
  <div class="flex-1 relative overflow-hidden">
    <!-- Slide Controls Overlay -->
    <div class="absolute top-4 right-4 z-50 flex space-x-2 opacity-50 hover:opacity-100 transition-opacity">
      <button
        on:click={prevSlide}
        class="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center border border-slate-700/50 hover:bg-slate-700 transition-all"
        disabled={currentSlideIndex === 0}
      >
        ←
      </button>
      <button
        on:click={nextSlide}
        class="w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center border border-slate-700/50 hover:bg-slate-700 transition-all"
        disabled={currentSlideIndex === slides.length - 1}
      >
        →
      </button>
    </div>
    
    <!-- Current Slide -->
    <div class="slide-container h-full p-8">
      <svelte:component this={currentSlide.component} />
    </div>
  </div>
</div>

<style>
  .sidebar {
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }
  
  .slide-container {
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(250, 204, 21, 0.05) 0%, transparent 40%);
    background-size: 100% 100%;
  }
</style> 