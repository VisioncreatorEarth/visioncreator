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
  <div class="max-w-5xl w-full mx-auto text-center">
    <div class="relative">
      <!-- Background glow effects -->
      <div class="absolute -z-10 inset-0 flex justify-center items-center opacity-20">
        <div class="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-yellow-400 blur-3xl"></div>
      </div>
      
      <div class="text-center mb-12 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <p class="text-xl md:text-2xl text-cyan-300 mb-4">The revolution starts now</p>
        <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-500">
          Your Work, Your Life
        </h2>
      </div>
      
      <div class="max-w-2xl mx-auto transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
        <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-cyan-500/20 mb-10">
          <p class="text-xl text-slate-200 mb-6">
            VisionCreator is not just another platform. It's a fundamentally new economic model that puts humans first.
          </p>
          
          <div class="bg-slate-900/30 p-5 rounded-lg border border-cyan-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 300ms;">
            <p class="text-slate-200 text-lg">We're building a world where:</p>
            <ul class="mt-3 space-y-2 text-left">
              <li class="flex items-start">
                <span class="text-cyan-400 mr-2 mt-1">→</span>
                <span class="text-slate-300">Work becomes an expression of your purpose, not just a means to survive</span>
              </li>
              <li class="flex items-start">
                <span class="text-emerald-400 mr-2 mt-1">→</span>
                <span class="text-slate-300">Your contributions create lasting value that you actually own</span>
              </li>
              <li class="flex items-start">
                <span class="text-yellow-400 mr-2 mt-1">→</span>
                <span class="text-slate-300">Community amplifies individual potential instead of exploiting it</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="mt-8 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}" style="transition-delay: 600ms;">
        <a href="#join" class="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-xl inline-block hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300">
          Start Your Journey Today
        </a>
        
        <p class="mt-6 text-slate-400">
          €1/day. Unlimited potential.
        </p>
      </div>
    </div>
  </div>
</div> 