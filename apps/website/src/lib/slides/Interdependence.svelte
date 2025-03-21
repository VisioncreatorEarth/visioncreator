<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let sectionRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      sectionRevealed = true;
    }, 1000);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-indigo-300 mb-4">Beyond isolation and dependence</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
        From Dependence to Interdependence
      </h2>
    </div>
    
    <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-indigo-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <!-- Timeline visualization -->
      <div class="relative py-8 flex justify-between max-w-4xl mx-auto">
        <!-- Timeline line -->
        <div class="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-red-500/30 via-blue-500/30 to-emerald-500/30 transform -translate-y-1/2 rounded-full"></div>
        
        <!-- Three stages -->
        <div class="relative z-10 text-center transform transition-all duration-700 ease-out {sectionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
          <div class="w-20 h-20 rounded-full bg-red-900/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4">
            <div class="w-10 h-10 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-medium text-red-400 mb-1">Forced Dependence</h3>
          <p class="text-slate-300 text-sm">Traditional employment</p>
          
          <div class="mt-4 bg-slate-900/30 p-3 rounded-lg border border-red-500/10 transform transition-all duration-700 {sectionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 200ms;">
            <ul class="text-left text-sm space-y-2">
              <li class="flex items-start">
                <span class="text-red-400 mr-2">•</span>
                <span class="text-slate-300">Rigid structures</span>
              </li>
              <li class="flex items-start">
                <span class="text-red-400 mr-2">•</span>
                <span class="text-slate-300">Exchanging time for money</span>
              </li>
              <li class="flex items-start">
                <span class="text-red-400 mr-2">•</span>
                <span class="text-slate-300">Limited upside potential</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="relative z-10 text-center transform transition-all duration-700 ease-out {sectionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 150ms;">
          <div class="w-20 h-20 rounded-full bg-blue-900/20 border-2 border-blue-500/50 flex items-center justify-center mx-auto mb-4">
            <div class="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-medium text-blue-400 mb-1">Isolated Independence</h3>
          <p class="text-slate-300 text-sm">Solo entrepreneurship</p>
          
          <div class="mt-4 bg-slate-900/30 p-3 rounded-lg border border-blue-500/10 transform transition-all duration-700 {sectionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 350ms;">
            <ul class="text-left text-sm space-y-2">
              <li class="flex items-start">
                <span class="text-blue-400 mr-2">•</span>
                <span class="text-slate-300">Complete freedom</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-400 mr-2">•</span>
                <span class="text-slate-300">High personal responsibility</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-400 mr-2">•</span>
                <span class="text-slate-300">Limited capacity & support</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div class="relative z-10 text-center transform transition-all duration-700 ease-out {sectionRevealed ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-8 opacity-0 scale-100'}" style="transition-delay: 300ms;">
          <div class="w-20 h-20 rounded-full bg-emerald-900/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
            <div class="w-10 h-10 rounded-full bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <h3 class="text-lg font-medium text-emerald-400 mb-1">Empowered Interdependence</h3>
          <p class="text-slate-300 text-sm">VisionCreator</p>
          
          <div class="mt-4 bg-slate-900/30 p-3 rounded-lg border border-emerald-500/10 transform transition-all duration-700 {sectionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 500ms;">
            <ul class="text-left text-sm space-y-2">
              <li class="flex items-start">
                <span class="text-emerald-400 mr-2">•</span>
                <span class="text-slate-300">Personal freedom</span>
              </li>
              <li class="flex items-start">
                <span class="text-emerald-400 mr-2">•</span>
                <span class="text-slate-300">Collective amplification</span>
              </li>
              <li class="flex items-start">
                <span class="text-emerald-400 mr-2">•</span>
                <span class="text-slate-300">Shared resources & ownership</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Supporting text -->
      <div class="mt-10 transform transition-all duration-700 {sectionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 700ms;">
        <p class="text-slate-200 text-center text-xl">
          We create the <span class="text-indigo-300 font-medium">community infrastructure</span> that makes autonomy sustainable<br>
          through mutual support, shared resources, and collaborative networks.
        </p>
      </div>
    </div>
  </div>
</div> 