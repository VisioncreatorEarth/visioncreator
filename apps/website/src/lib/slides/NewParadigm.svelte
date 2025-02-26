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
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-400 mb-10">
      The New Work Paradigm
    </h2>
    
    <div class="w-full max-w-3xl mx-auto mt-10">
      <div class="relative py-10">
        <!-- Dividing line -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-2/3 h-[2px] bg-slate-700/70"></div>
        </div>
        
        <!-- Traditional work -->
        <div class="relative flex mb-12">
          <div class="w-1/2 pr-8 text-right transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}">
            <h3 class="text-xl font-semibold text-red-400 mb-2">Traditional Work</h3>
            <div class="space-y-2">
              <p class="text-slate-300 text-sm">Forces artificial trade-offs</p>
              <p class="text-slate-400 text-xs">Stability OR autonomy</p>
              <p class="text-slate-400 text-xs">Security OR passion</p>
              <p class="text-slate-400 text-xs">Income OR purpose</p>
            </div>
          </div>
          
          <div class="absolute left-1/2 top-0 transform -translate-x-1/2 w-10 h-10 rounded-full bg-red-900/30 border border-red-500/50 flex items-center justify-center z-10">
            <span class="font-semibold text-red-400">×</span>
          </div>
          
          <div class="w-1/2 pl-8"></div>
        </div>
        
        <!-- Visioncreator -->
        <div class="relative flex">
          <div class="w-1/2 pr-8"></div>
          
          <div class="absolute left-1/2 top-0 transform -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-900/30 border border-emerald-500/50 flex items-center justify-center z-10 {revealed ? 'scale-125' : 'scale-100'} transition-transform duration-700 delay-500">
            <span class="font-semibold text-emerald-400">✓</span>
          </div>
          
          <div class="w-1/2 pl-8 text-left transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
            <h3 class="text-xl font-semibold text-emerald-400 mb-2">Visioncreator</h3>
            <div class="space-y-2">
              <p class="text-slate-300 text-sm">Eliminates false choices</p>
              <p class="text-slate-400 text-xs">Autonomy AND security</p>
              <p class="text-slate-400 text-xs">Freedom AND income</p>
              <p class="text-slate-400 text-xs">Ownership AND contribution</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 600ms;">
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-violet-500/20">
          <h4 class="text-violet-400 font-semibold mb-2">Decentralized Control</h4>
          <p class="text-slate-300 text-sm">
            Decisions made collectively by contributors
          </p>
        </div>
        
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-violet-500/20">
          <h4 class="text-violet-400 font-semibold mb-2">Shared Ownership</h4>
          <p class="text-slate-300 text-sm">
            Value accumulates to those who create it
          </p>
        </div>
        
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-violet-500/20">
          <h4 class="text-violet-400 font-semibold mb-2">Autonomous Work</h4>
          <p class="text-slate-300 text-sm">
            Freedom to choose when, where and how
          </p>
        </div>
      </div>
    </div>
  </div>
</div> 