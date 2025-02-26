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
      <p class="text-xl md:text-2xl text-red-300 mb-4">We face a modern paradox</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-500">
        The Autonomy Crisis
      </h2>
    </div>
    
    <div class="flex flex-col md:flex-row items-stretch gap-8 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <!-- Left side - Problem -->
      <div class="md:w-1/2 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-red-500/20">
        <h3 class="text-2xl font-semibold text-red-300 mb-6">The Dependency Trap</h3>
        
        <div class="space-y-6">
          <div class="bg-slate-900/30 p-5 rounded-lg border border-red-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 500ms;">
            <p class="text-slate-300 mb-1"><span class="text-red-300 font-medium">Time Dependency</span></p>
            <p class="text-slate-400">Rigid schedules dictated by employers</p>
          </div>
          
          <div class="bg-slate-900/30 p-5 rounded-lg border border-red-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 700ms;">
            <p class="text-slate-300 mb-1"><span class="text-red-300 font-medium">Location Dependency</span></p>
            <p class="text-slate-400">Forced to work where the company decides</p>
          </div>
          
          <div class="bg-slate-900/30 p-5 rounded-lg border border-red-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 900ms;">
            <p class="text-slate-300 mb-1"><span class="text-red-300 font-medium">Income Dependency</span></p>
            <p class="text-slate-400">Value of your work determined by others</p>
          </div>
        </div>
      </div>
      
      <!-- Right side - Contrast -->
      <div class="md:w-1/2 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-amber-500/20 transform transition-all duration-700 {sectionsRevealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 400ms;">
        <h3 class="text-2xl font-semibold text-amber-300 mb-6">The Possibility Vision</h3>
        
        <div class="relative h-full flex flex-col justify-between">
          <div class="space-y-6">
            <div class="bg-slate-900/30 p-5 rounded-lg border border-amber-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 600ms;">
              <p class="text-slate-300 mb-1"><span class="text-amber-300 font-medium">Time Freedom</span></p>
              <p class="text-slate-400">Work when you're most productive and creative</p>
            </div>
            
            <div class="bg-slate-900/30 p-5 rounded-lg border border-amber-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 800ms;">
              <p class="text-slate-300 mb-1"><span class="text-amber-300 font-medium">Location Freedom</span></p>
              <p class="text-slate-400">Live and work from anywhere in the world</p>
            </div>
            
            <div class="bg-slate-900/30 p-5 rounded-lg border border-amber-500/10 transform transition-all duration-700 {sectionsRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 1000ms;">
              <p class="text-slate-300 mb-1"><span class="text-amber-300 font-medium">Income Freedom</span></p>
              <p class="text-slate-400">Build assets and ownership that grow over time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 