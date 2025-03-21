<script>
  // Autonomy Core Slide
  import { onMount } from 'svelte';
  
  let phase1 = false;
  let phase2 = false;
  
  onMount(() => {
    setTimeout(() => {
      phase1 = true;
      
      setTimeout(() => {
        phase2 = true;
      }, 1500);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Insight Phase -->
    <div class="text-center transform transition-all duration-700 {phase1 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-indigo-300 mb-4">
        What we think we want is complex...
      </p>
      <p class="text-xl text-slate-300 mb-6">
        Money. Success. Power. Recognition.
      </p>
      <p class="text-2xl md:text-3xl text-amber-300">
        But what we truly need is simpler
      </p>
    </div>
    
    <!-- Core Needs and Balance -->
    <div class="mt-16 transform transition-all duration-700 {phase1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
      <div class="flex flex-col items-center">
        <!-- Core Needs -->
        <div class="flex items-center justify-center">
          <div class="px-8 py-5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl border border-orange-500/30">
            <p class="text-3xl font-bold text-orange-300">AUTONOMY</p>
          </div>
          
          <div class="mx-6">
            <div class="bg-slate-800/50 backdrop-blur-sm rounded-full px-5 py-2 border border-slate-700">
              <p class="text-lg text-slate-300">and</p>
            </div>
          </div>
          
          <div class="px-8 py-5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
            <p class="text-3xl font-bold text-purple-300">BELONGING</p>
          </div>
        </div>
        
        <!-- Connection to VisionCreator -->
        <div class="mt-16 text-center transform transition-all duration-700 {phase2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          <div class="h-16 w-px bg-gradient-to-b from-transparent via-indigo-500/30 to-indigo-500/80 mx-auto mb-6"></div>
          <div class="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/20 max-w-2xl mx-auto">
            <p class="text-xl text-slate-300">
              VisionCreator helps you achieve the <span class="text-indigo-300 font-medium">perfect balance</span> between these fundamental human needs
            </p>
          </div>
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