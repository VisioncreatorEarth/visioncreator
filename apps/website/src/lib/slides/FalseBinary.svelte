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
      <p class="text-xl md:text-2xl text-purple-300 mb-4">Moving past outdated models</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        Beyond the False Binary
      </h2>
    </div>
    
    <div class="flex flex-col md:flex-row items-stretch gap-8 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <!-- Employee -->
      <div class="md:w-1/3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 500ms;">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-red-300 mb-3 text-center">Employee</h3>
        
        <div class="space-y-3">
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Trading time for money</p>
          </div>
          
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Limited upside potential</p>
          </div>
          
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Security with dependence</p>
          </div>
        </div>
      </div>
      
      <!-- Employer -->
      <div class="md:w-1/3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 700ms;">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-blue-300 mb-3 text-center">Employer</h3>
        
        <div class="space-y-3">
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Administrative burdens</p>
          </div>
          
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Overhead costs</p>
          </div>
          
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Control with high responsibility</p>
          </div>
        </div>
      </div>
      
      <!-- Owner-Contributor -->
      <div class="md:w-1/3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20 transform transition-all duration-700 md:scale-110 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-semibold text-emerald-300 mb-3 text-center">Owner-Contributor</h3>
        
        <div class="space-y-3">
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Ownership in what you build</p>
          </div>
          
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Unlimited upside potential</p>
          </div>
          
          <div class="bg-slate-900/30 p-3 rounded-lg">
            <p class="text-slate-300 text-sm text-center">Security without dependence</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 