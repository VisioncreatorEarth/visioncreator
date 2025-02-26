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
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-12 text-center">
      From Dependence to Interdependence
    </h2>
    
    <!-- Timeline visualization -->
    <div class="relative py-4 flex justify-between max-w-3xl mx-auto">
      <!-- Timeline line -->
      <div class="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-red-500/30 via-blue-500/30 to-emerald-500/30 transform -translate-y-1/2 rounded-full"></div>
      
      <!-- Three stages -->
      <div class="relative z-10 text-center transform transition-all duration-700 ease-out {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
        <div class="w-20 h-20 rounded-full bg-red-900/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">⛓️</span>
        </div>
        <h3 class="text-lg font-medium text-red-400 mb-1">Forced Dependence</h3>
        <p class="text-slate-300 text-sm">Traditional employment</p>
      </div>
      
      <div class="relative z-10 text-center transform transition-all duration-700 ease-out {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 150ms;">
        <div class="w-20 h-20 rounded-full bg-blue-900/20 border-2 border-blue-500/50 flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">🏝️</span>
        </div>
        <h3 class="text-lg font-medium text-blue-400 mb-1">Isolated Independence</h3>
        <p class="text-slate-300 text-sm">Solo entrepreneurship</p>
      </div>
      
      <div class="relative z-10 text-center transform transition-all duration-700 ease-out {revealed ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-8 opacity-0 scale-100'}" style="transition-delay: 300ms;">
        <div class="w-20 h-20 rounded-full bg-emerald-900/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">🌱</span>
        </div>
        <h3 class="text-lg font-medium text-emerald-400 mb-1">Empowered Interdependence</h3>
        <p class="text-slate-300 text-sm">Visioncreator</p>
      </div>
    </div>
    
    <!-- Supporting text -->
    <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/20 mt-14 max-w-3xl mx-auto transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">
      <p class="text-slate-300 text-center">
        We create the community structure that makes autonomy sustainable and ownership accessible to everyone.
      </p>
    </div>
  </div>
</div> 