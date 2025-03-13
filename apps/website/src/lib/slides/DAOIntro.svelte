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
    <!-- Question first approach -->
    <div class="text-center mb-16 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-blue-300 mb-6">What if you could...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
        Own What You Help Build?
      </h2>
    </div>
    
    <div class="text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <p class="text-xl md:text-2xl text-slate-300 mb-12">
        Introducing our <span class="text-blue-300 font-medium">Decentralized Ownership Model</span>
      </p>
      
      <div class="flex flex-col md:flex-row items-center justify-center gap-8 mt-12">
        <div class="text-center p-6 rounded-xl bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/20 max-w-sm transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 500ms;">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-blue-300 mb-2">Collective Ownership</h3>
          <p class="text-slate-300">Not just a contributor – an actual owner with real stake</p>
        </div>
        
        <div class="text-4xl font-light text-blue-300 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 600ms;">+</div>
        
        <div class="text-center p-6 rounded-xl bg-gradient-to-b from-teal-900/20 to-transparent border border-teal-500/20 max-w-sm transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 700ms;">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-teal-300 mb-2">Democratic Governance</h3>
          <p class="text-slate-300">Your voice matters in all platform decisions</p>
        </div>
      </div>
    </div>
  </div>
</div> 