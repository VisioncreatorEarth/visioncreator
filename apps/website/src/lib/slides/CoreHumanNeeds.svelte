<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Main heading -->
    <div class="text-center mb-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-blue-300 mb-6">For true quality of life...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4">
        What do we need?
      </h2>
    </div>
    
    <!-- Core needs -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Need 1: Belonging -->
      <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 100ms;">
        <div class="bg-gradient-to-b from-blue-900/30 to-black/20 rounded-xl p-6 border border-blue-600/20 h-full flex flex-col">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-blue-300 mb-3 text-center">Belonging</h3>
          <p class="text-slate-300 text-center flex-grow">Being part of a community with shared values where we feel seen, respected, and valued for our contributions.</p>
        </div>
      </div>
      
      <!-- Need 2: Autonomy -->
      <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
        <div class="bg-gradient-to-b from-cyan-900/30 to-black/20 rounded-xl p-6 border border-cyan-600/20 h-full flex flex-col">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-cyan-300 mb-3 text-center">Autonomy</h3>
          <p class="text-slate-300 text-center flex-grow">Freedom to follow our own path, make our own decisions, and work according to our own rhythms and values.</p>
        </div>
      </div>
      
      <!-- Need 3: Agency -->
      <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
        <div class="bg-gradient-to-b from-sky-900/30 to-black/20 rounded-xl p-6 border border-sky-600/20 h-full flex flex-col">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-sky-900/50 border border-sky-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-sky-300 mb-3 text-center">Agency</h3>
          <p class="text-slate-300 text-center flex-grow">Having purpose, drive, and the ability to act on our creative impulses to meaningfully influence our environment.</p>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <!-- Need 4: Financial Security -->
      <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 400ms;">
        <div class="bg-gradient-to-b from-blue-900/30 to-black/20 rounded-xl p-6 border border-blue-600/20 h-full flex flex-col">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-blue-300 mb-3 text-center">Financial Security</h3>
          <p class="text-slate-300 text-center flex-grow">Building projects that create lasting value, providing stability without sacrificing autonomy or meaning.</p>
        </div>
      </div>
      
      <!-- Need 5: Expression of Inner Strength -->
      <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">
        <div class="bg-gradient-to-b from-cyan-900/30 to-black/20 rounded-xl p-6 border border-cyan-600/20 h-full flex flex-col">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-cyan-300 mb-3 text-center">Inner Expression</h3>
          <p class="text-slate-300 text-center flex-grow">Aligning our outer work with our inner values and strengths, creating congruence between who we are and what we do.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 