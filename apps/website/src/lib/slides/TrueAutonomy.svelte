<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let sectionsRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      sectionsRevealed = true;
    }, 1000);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center mb-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-teal-300 mb-4">A new way of working</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
        True Autonomy Unleashed
      </h2>
    </div>
    
    <div class="transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-teal-500/20">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-slate-900/30 p-6 rounded-lg border border-teal-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 500ms;">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-teal-300 mb-2 text-center">Time Autonomy</h3>
            <p class="text-slate-300 text-center">Work when your energy and creativity peak, not when a schedule dictates</p>
          </div>
          
          <div class="bg-slate-900/30 p-6 rounded-lg border border-teal-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 700ms;">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-teal-300 mb-2 text-center">Location Autonomy</h3>
            <p class="text-slate-300 text-center">Contribute from anywhere in the world, live where you thrive</p>
          </div>
          
          <div class="bg-slate-900/30 p-6 rounded-lg border border-teal-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-teal-300 mb-2 text-center">Financial Autonomy</h3>
            <p class="text-slate-300 text-center">Build ownership and assets that grow over time, not just income</p>
          </div>
        </div>
        
        <div class="mt-10 text-center transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1100ms;">
          <p class="text-xl text-slate-300">
            <span class="text-teal-300 font-medium">True autonomy</span> means you own your time, your location, and the value you create.
          </p>
        </div>
      </div>
    </div>
  </div>
</div> 