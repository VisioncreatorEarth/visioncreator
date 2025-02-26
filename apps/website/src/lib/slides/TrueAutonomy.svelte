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
  <div class="max-w-4xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 mb-10 text-center">
      True Autonomy Unleashed
    </h2>
    
    <div class="mt-8">
      <div class="w-full h-1 bg-gradient-to-r from-cyan-500/20 to-green-500/20 rounded-full mb-10"></div>
      
      <div class="flex flex-col space-y-6">
        <div class="flex items-center transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}">
          <div class="w-16 h-16 rounded-full bg-cyan-800/20 flex items-center justify-center mr-6">
            <span class="text-3xl">⏱️</span>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-cyan-400">Time Autonomy</h3>
            <p class="text-slate-300">Work when your energy and creativity peak</p>
          </div>
        </div>
        
        <div class="flex items-center transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 150ms;">
          <div class="w-16 h-16 rounded-full bg-teal-800/20 flex items-center justify-center mr-6">
            <span class="text-3xl">🌍</span>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-teal-400">Location Autonomy</h3>
            <p class="text-slate-300">Contribute from anywhere in the world</p>
          </div>
        </div>
        
        <div class="flex items-center transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
          <div class="w-16 h-16 rounded-full bg-green-800/20 flex items-center justify-center mr-6">
            <span class="text-3xl">💰</span>
          </div>
          <div>
            <h3 class="text-xl font-semibold text-green-400">Financial Autonomy</h3>
            <p class="text-slate-300">Build income streams that you own</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 