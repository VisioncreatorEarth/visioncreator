<script>
  // DAOExamples.svelte - Real-world DAO examples to make the concept relatable
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
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-blue-300 mb-4">This is already happening in the world</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
        DAOs in Action
      </h2>
    </div>
    
    <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 mb-10">
        <p class="text-slate-300 text-lg mb-6 text-center">
          Did you know that <span class="text-blue-300 font-medium">complete strangers</span> around the world are already managing <span class="text-blue-300 font-medium">billions in assets</span> they've created together?
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- MakerDAO Example -->
          <div class="bg-slate-900/30 p-5 rounded-lg border border-blue-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 500ms;">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-blue-300 mb-2 text-center">MakerDAO</h3>
            <p class="text-slate-300 text-sm mb-3">Created a decentralized stablecoin that's used by millions of people</p>
            <div class="bg-slate-800/40 p-2 rounded-lg text-center">
              <p class="text-xs text-blue-200">$4+ billion in value managed by its community</p>
            </div>
          </div>
          
          <!-- Uniswap Example -->
          <div class="bg-slate-900/30 p-5 rounded-lg border border-blue-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 700ms;">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-blue-300 mb-2 text-center">Uniswap</h3>
            <p class="text-slate-300 text-sm mb-3">Community-built trading platform that's rivaling traditional exchanges</p>
            <div class="bg-slate-800/40 p-2 rounded-lg text-center">
              <p class="text-xs text-blue-200">$1.5+ billion daily trading volume</p>
            </div>
          </div>
          
          <!-- Decentraland Example -->
          <div class="bg-slate-900/30 p-5 rounded-lg border border-blue-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-blue-300 mb-2 text-center">Decentraland</h3>
            <p class="text-slate-300 text-sm mb-3">Virtual world owned by its users who build, trade, and earn together</p>
            <div class="bg-slate-800/40 p-2 rounded-lg text-center">
              <p class="text-xs text-blue-200">Users collectively own $1B+ in digital land</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1100ms;">
        <h3 class="text-2xl font-semibold text-teal-300 mb-4">Our Twist</h3>
        <p class="text-xl text-slate-300 max-w-3xl mx-auto">
          We're bringing this model into the real economy for your daily life — making ownership accessible without the complexity.
        </p>
      </div>
    </div>
  </div>
</div> 