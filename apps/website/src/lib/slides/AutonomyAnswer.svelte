<script>
  // Answer Slide
  import { onMount } from 'svelte';
  
  let revealed = false;
  let explanationRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      explanationRevealed = true;
    }, 1500);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Answer Reveal -->
    <div class="text-center mb-12 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <h2 class="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
        AUTONOMY
      </h2>
    </div>
    
    <!-- Explanation Text -->
    <div class="transform transition-all duration-700 {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-orange-500/20 max-w-3xl mx-auto">
        <p class="text-xl md:text-2xl text-slate-300 mb-6 text-center">
          Humans fundamentally strive for autonomy - the freedom to control our own:
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="bg-slate-900/30 p-5 rounded-lg border border-orange-500/10 transform transition-all duration-700 {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 500ms;">
            <h3 class="text-xl font-semibold text-orange-300 mb-2">Time</h3>
            <p class="text-slate-300">Freedom from rigid schedules and external control of your most precious asset</p>
          </div>
          
          <div class="bg-slate-900/30 p-5 rounded-lg border border-orange-500/10 transform transition-all duration-700 {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 700ms;">
            <h3 class="text-xl font-semibold text-orange-300 mb-2">Location</h3>
            <p class="text-slate-300">The ability to work and live wherever you thrive, not where you're tethered</p>
          </div>
          
          <div class="bg-slate-900/30 p-5 rounded-lg border border-orange-500/10 transform transition-all duration-700 {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 900ms;">
            <h3 class="text-xl font-semibold text-orange-300 mb-2">Projects</h3>
            <p class="text-slate-300">Creating work that aligns with your passions, skills and purpose</p>
          </div>
          
          <div class="bg-slate-900/30 p-5 rounded-lg border border-orange-500/10 transform transition-all duration-700 {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 1100ms;">
            <h3 class="text-xl font-semibold text-orange-300 mb-2">Worth</h3>
            <p class="text-slate-300">Receiving fair value for the contributions you make, owning your economic destiny</p>
          </div>
        </div>
        
        <div class="text-center transform transition-all duration-700 {explanationRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1300ms;">
          <p class="text-xl text-slate-300">
            VisionCreator exists to restore this fundamental human need, breaking the ancient practice of <span class="text-orange-300 font-medium">time-for-money exchange</span>.
          </p>
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