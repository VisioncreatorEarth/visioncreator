<script>
  // Answer Slide
  import { onMount } from 'svelte';
  
  let revealed = false;
  let explanationRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 500);
    
    setTimeout(() => {
      explanationRevealed = true;
    }, 2000);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full">
  <div class="max-w-5xl w-full mx-auto text-center">
    <!-- Dramatic Answer Reveal -->
    <div class="relative mb-16">
      <div class="transform transition-all duration-1500 ease-out {revealed ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}">
        <h1 class="text-8xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
          AUTONOMY
        </h1>
      </div>
      
      <!-- Subtle pulse animation after reveal -->
      {#if revealed}
        <div class="absolute inset-0 -z-10 animate-pulse-slow">
          <div class="w-full h-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
      {/if}
    </div>
    
    <!-- Explanation Text -->
    <div class="max-w-3xl mx-auto space-y-8 transform transition-all duration-1000 ease-out {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl text-slate-200 leading-relaxed">
        Humans fundamentally strive to <span class="text-cyan-300 font-semibold">own their time</span> and <span class="text-cyan-300 font-semibold">own their creation</span>.
      </p>
      
      <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-cyan-500/20 mt-6">
        <p class="text-xl text-slate-200">
          VisionCreator exists to restore this fundamental human need, enabling people to break free from the ancient practice of time-for-money exchange.
        </p>
      </div>
      
      <div class="flex items-center justify-center gap-6 mt-8 flex-wrap text-slate-300 text-xl">
        <div class="flex items-center px-6 py-2 rounded-full bg-slate-800/50 border border-cyan-600/20">
          <span class="text-cyan-400 mr-2">→</span> Self-Direction
        </div>
        <div class="flex items-center px-6 py-2 rounded-full bg-slate-800/50 border border-cyan-600/20">
          <span class="text-cyan-400 mr-2">→</span> Creative Control
        </div>
        <div class="flex items-center px-6 py-2 rounded-full bg-slate-800/50 border border-cyan-600/20">
          <span class="text-cyan-400 mr-2">→</span> Value Ownership
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom animation for the pulsing effect */
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.1;
      transform: scale(0.95);
    }
    50% {
      opacity: 0.3;
      transform: scale(1.05);
    }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style> 