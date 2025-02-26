<script>
  // Autonomy Core Slide - Combined from AutonomyAnswer and AutonomyCrisis
  import { onMount } from 'svelte';
  
  let revealed = false;
  let contrastRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      contrastRevealed = true;
    }, 1200);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Title Section - Bold, clear statement -->
    <div class="text-center mb-8 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <h2 class="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
        AUTONOMY
      </h2>
      <p class="text-xl text-slate-300 mt-2">The fundamental human need we've lost</p>
    </div>
    
    <!-- Content Section - Clean visual problem/solution contrast -->
    <div class="flex flex-col md:flex-row items-stretch gap-6 transform transition-all duration-700 {contrastRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <!-- Left side - Problem -->
      <div class="md:w-1/2 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
        <h3 class="text-xl font-semibold text-red-300 mb-6 text-center">TODAY'S REALITY</h3>
        
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-slate-300">Time controlled by others</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p class="text-slate-300">Location dictated by employers</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08-.402 2.599-1M12 8v7m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-slate-300">No ownership in what you build</p>
          </div>
        </div>
      </div>
      
      <!-- Right side - Solution -->
      <div class="md:w-1/2 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
        <h3 class="text-xl font-semibold text-emerald-300 mb-6 text-center">OUR VISION</h3>
        
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-slate-300">Work when you're most productive</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p class="text-slate-300">Live and work from anywhere</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08-.402 2.599-1M12 8v7m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-slate-300">Own what you help build</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom tagline - Clear call to action -->
    <div class="text-center mt-8 transform transition-all duration-700 {contrastRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 300ms;">
      <p class="text-xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-emerald-400 font-medium">
        VisionCreator — Breaking the ancient practice of time-for-money exchange
      </p>
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