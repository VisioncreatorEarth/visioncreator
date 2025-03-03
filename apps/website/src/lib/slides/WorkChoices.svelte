<script>
  // WorkChoices.svelte - The limited options people face today
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
    <div class="text-center mb-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-purple-300 mb-4">Today, what options do you have?</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        A Forced Choice
      </h2>
    </div>
    
    <div class="flex flex-col md:flex-row items-stretch gap-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <!-- Employee -->
      <div class="md:w-1/2 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-red-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 500ms;">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <h3 class="text-2xl font-semibold text-red-300 mb-5 text-center">Employee</h3>
        
        <div class="space-y-4">
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-red-400 mr-2">→</span>
              <p class="text-slate-300">Set hours, fixed location, predictable income</p>
            </div>
          </div>
          
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-red-400 mr-2">→</span>
              <p class="text-slate-300">Working on someone else's vision</p>
            </div>
          </div>
          
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-red-400 mr-2">→</span>
              <p class="text-slate-300">Limited upside potential</p>
            </div>
          </div>
          
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-red-400 mr-2">→</span>
              <p class="text-slate-300">Security with dependence</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-slate-400 italic">"Is this what you chose?"</p>
        </div>
      </div>
      
      <!-- Founder -->
      <div class="md:w-1/2 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-blue-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 700ms;">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h3 class="text-2xl font-semibold text-blue-300 mb-5 text-center">Founder</h3>
        
        <div class="space-y-4">
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-blue-400 mr-2">→</span>
              <p class="text-slate-300">Work all hours, high risk, uncertain payoff</p>
            </div>
          </div>
          
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-blue-400 mr-2">→</span>
              <p class="text-slate-300">Your vision but immense pressure</p>
            </div>
          </div>
          
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-blue-400 mr-2">→</span>
              <p class="text-slate-300">Administrative burdens & overhead costs</p>
            </div>
          </div>
          
          <div class="bg-slate-900/30 p-4 rounded-lg">
            <div class="flex items-start">
              <span class="text-blue-400 mr-2">→</span>
              <p class="text-slate-300">Independence with high responsibility</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <p class="text-slate-400 italic">"Or did you pick this path?"</p>
        </div>
      </div>
    </div>
    
    <div class="text-center mt-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;">
      <p class="text-xl text-slate-300">
        Is this really all there is? <span class="text-purple-300 font-medium">Choosing between these extremes?</span>
      </p>
    </div>
  </div>
</div> 