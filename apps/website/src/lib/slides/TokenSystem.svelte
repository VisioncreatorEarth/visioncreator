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
  <div class="max-w-5xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 mb-10 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      How Does Ownership Work?
    </h2>
    
    <!-- Token Circle Visual -->
    <div class="flex flex-col md:flex-row items-center justify-center gap-12 mb-10">
      <div class="md:w-1/2 flex justify-center transform transition-all duration-700 {revealed ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}" style="transition-delay: 200ms;">
        <div class="relative w-64 h-64 rounded-full bg-gradient-to-br from-teal-900/20 to-slate-900/30 flex items-center justify-center border border-teal-500/20">
          <div class="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-pulse"></div>
          <div class="text-center">
            <div class="flex items-center justify-center mb-2">
              <span class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">VCR</span>
            </div>
            <p class="text-lg text-teal-300 font-medium">Token</p>
            <p class="text-xs text-slate-300 mt-2 px-8">Your digital share of the collective</p>
          </div>
        </div>
      </div>
      
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 400ms;">
        <h3 class="text-2xl font-semibold text-teal-300 mb-4">Earning & Using Tokens</h3>
        
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20 mb-6">
          <ul class="space-y-4">
            <li class="flex items-start transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 600ms;">
              <div class="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-sm font-medium">→</span>
              </div>
              <div>
                <p class="text-slate-300"><span class="text-teal-300 font-medium">Earn tokens</span> by contributing skills, time, and value</p>
              </div>
            </li>
            
            <li class="flex items-start transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 800ms;">
              <div class="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-sm font-medium">→</span>
              </div>
              <div>
                <p class="text-slate-300"><span class="text-teal-300 font-medium">Vote with tokens</span> on platform decisions</p>
              </div>
            </li>
            
            <li class="flex items-start transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 1000ms;">
              <div class="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-sm font-medium">→</span>
              </div>
              <div>
                <p class="text-slate-300"><span class="text-teal-300 font-medium">Receive income</span> from the investment pool based on your token holdings</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Bottom question -->
    <div class="text-center mt-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1200ms;">
      <p class="text-xl text-slate-300">
        <span class="text-teal-300 font-medium">Question:</span> What if the work you do today could build your ownership tomorrow?
      </p>
    </div>
  </div>
</div> 