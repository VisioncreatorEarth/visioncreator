<script>
  // WorkChoices.svelte - The work choices we have today
  import { onMount } from 'svelte';
  
  let phase1 = false;
  let phase2 = false;
  
  onMount(() => {
    setTimeout(() => {
      phase1 = true;
      
      setTimeout(() => {
        phase2 = true;
      }, 1500);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center transform transition-all duration-700 {phase1 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-8">
        What Choice Do We Have Today?
      </h2>
      
      <p class="text-2xl md:text-3xl text-slate-200 mb-4">
        In our current system, we're limited to <span class="text-indigo-300">two less-than-ideal options</span>
      </p>
      
      <div class="max-w-3xl mx-auto mt-12">
        <div class="bg-gradient-to-b from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl p-8 border border-purple-500/30">
          <div class="flex flex-col md:flex-row gap-8 mt-4">
            <div class="flex-1 bg-slate-900/50 p-6 rounded-lg border border-red-500/20">
              <h3 class="text-2xl font-semibold text-red-300 mb-3">Employee</h3>
              <p class="text-slate-300">Fixed hours, predictable income, but limited autonomy and no ownership of your work.</p>
            </div>
            
            <div class="flex-1 bg-slate-900/50 p-6 rounded-lg border border-blue-500/20">
              <h3 class="text-2xl font-semibold text-blue-300 mb-3">Founder</h3>
              <p class="text-slate-300">High autonomy but all responsibility, constant stress, and uncertain rewards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="text-center mt-16 transform transition-all duration-700 {phase2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
      <p class="text-2xl text-indigo-300 font-medium">
        Is this binary choice serving human needs?
      </p>
      <p class="text-xl text-slate-400 mt-4">
        Let's look closer at what each option means in practice...
      </p>
    </div>
  </div>
</div> 