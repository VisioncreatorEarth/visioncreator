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
  <div class="max-w-4xl w-full mx-auto text-center">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400 mb-10">
      The Autonomy Crisis
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}">
        <div class="flex flex-col h-full">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-red-400 mb-4">Traditional Work Constraints</h3>
            <p class="text-slate-300 text-lg mb-2">Traditional employment strips away your fundamental freedoms</p>
          </div>
          <div class="mt-4 text-slate-300/70 text-xs">Your time. Your location. Your projects.</div>
        </div>
      </div>
      
      <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 200ms;">
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <div class="mx-auto mb-6 w-24 h-24 rounded-full bg-red-900/20 flex items-center justify-center">
              <span class="text-4xl">⛓️</span>
            </div>
            <p class="text-xl text-slate-200">
              <span class="text-red-400 font-bold">Dependency</span> rather than <span class="text-yellow-400 font-bold">possibility</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 