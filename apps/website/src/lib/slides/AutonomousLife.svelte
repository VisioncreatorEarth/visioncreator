<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let step = 0;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      const interval = setInterval(() => {
        if (step < 5) {
          step++;
        } else {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-4xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-10 text-center">
      Living the Autonomous Life
    </h2>
    
    <div class="flex flex-col md:flex-row gap-8 mt-8">
      <!-- Elena profile -->
      <div class="w-full md:w-1/3 flex flex-col items-center transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}">
        <div class="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 overflow-hidden border-2 border-amber-500/30">
          <span class="text-6xl">👩‍💻</span>
        </div>
        <h3 class="text-xl font-semibold text-amber-400 mb-2">Elena</h3>
        <p class="text-center text-slate-300 text-sm">Working from Croatia</p>
      </div>
      
      <!-- Timeline -->
      <div class="w-full md:w-2/3 space-y-4">
        <div class="flex items-center space-x-4 p-3 rounded-lg {step >= 1 ? 'bg-slate-800/30 border border-amber-500/20' : ''} transition-all duration-300">
          <div class="w-10 h-10 rounded-full bg-amber-900/20 flex items-center justify-center flex-shrink-0 {step >= 1 ? 'text-amber-400' : 'text-slate-600'}">
            <span class="text-xl">⏰</span>
          </div>
          <div class="{step >= 1 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300">
            <h4 class="text-md font-medium text-amber-100">Wakes up without an alarm</h4>
            <p class="text-slate-400 text-sm">Time autonomy</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4 p-3 rounded-lg {step >= 2 ? 'bg-slate-800/30 border border-amber-500/20' : ''} transition-all duration-300">
          <div class="w-10 h-10 rounded-full bg-amber-900/20 flex items-center justify-center flex-shrink-0 {step >= 2 ? 'text-amber-400' : 'text-slate-600'}">
            <span class="text-xl">🌊</span>
          </div>
          <div class="{step >= 2 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300">
            <h4 class="text-md font-medium text-amber-100">Works from her garden by the sea</h4>
            <p class="text-slate-400 text-sm">Location autonomy</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4 p-3 rounded-lg {step >= 3 ? 'bg-slate-800/30 border border-amber-500/20' : ''} transition-all duration-300">
          <div class="w-10 h-10 rounded-full bg-amber-900/20 flex items-center justify-center flex-shrink-0 {step >= 3 ? 'text-amber-400' : 'text-slate-600'}">
            <span class="text-xl">💡</span>
          </div>
          <div class="{step >= 3 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300">
            <h4 class="text-md font-medium text-amber-100">Contributes to projects she believes in</h4>
            <p class="text-slate-400 text-sm">Purpose autonomy</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4 p-3 rounded-lg {step >= 4 ? 'bg-slate-800/30 border border-amber-500/20' : ''} transition-all duration-300">
          <div class="w-10 h-10 rounded-full bg-amber-900/20 flex items-center justify-center flex-shrink-0 {step >= 4 ? 'text-amber-400' : 'text-slate-600'}">
            <span class="text-xl">💰</span>
          </div>
          <div class="{step >= 4 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300">
            <h4 class="text-md font-medium text-amber-100">Receives income from multiple sources</h4>
            <p class="text-slate-400 text-sm">Financial autonomy</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4 p-3 rounded-lg {step >= 5 ? 'bg-slate-800/30 border border-amber-500/20' : ''} transition-all duration-300">
          <div class="w-10 h-10 rounded-full bg-amber-900/20 flex items-center justify-center flex-shrink-0 {step >= 5 ? 'text-amber-400' : 'text-slate-600'}">
            <span class="text-xl">🤝</span>
          </div>
          <div class="{step >= 5 ? 'opacity-100' : 'opacity-50'} transition-opacity duration-300">
            <h4 class="text-md font-medium text-amber-100">Collaborates with people she respects</h4>
            <p class="text-slate-400 text-sm">Relationship autonomy</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-10 text-center transform transition-all duration-1000 {step >= 5 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 600ms;">
      <p class="text-slate-200 italic">
        "This isn't a dream—it's the reality our members experience daily."
      </p>
    </div>
  </div>
</div> 