<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let animatePercentage = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      animatePercentage = true;
    }, 1000);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 mb-12 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      The VisionCreator Pool
    </h2>
    
    <div class="flex flex-col md:flex-row items-center gap-12">
      <!-- Left side - explanation -->
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
        <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-emerald-500/20">
          <h3 class="text-2xl font-semibold text-emerald-300 mb-6">Shared Prosperity</h3>
          
          <p class="text-slate-300 mb-6">
            <span class="text-emerald-300 font-medium text-3xl">75%</span> of all investments and income flows directly into the community pool.
          </p>
          
          <p class="text-slate-300 mb-6">
            This creates a sustainable ecosystem where value circulates back to the people who create it.
          </p>
          
          <div class="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 600ms;">
            <h4 class="font-medium text-emerald-300 mb-2">Why 75%?</h4>
            <p class="text-slate-400 text-sm">
              This significant majority ensures that contributors receive the lion's share of the value they create - unlike traditional models where value flows primarily to shareholders.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Right side - circular diagram -->
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 500ms;">
        <div class="relative">
          <!-- Outer circle - 100% -->
          <div class="relative w-72 h-72 mx-auto rounded-full border-4 border-slate-700/50 flex items-center justify-center">
            <!-- Inner circle - 75% -->
            <div class="absolute w-54 h-54 top-[12.5%] left-[12.5%] rounded-full border-0 {animatePercentage ? 'bg-gradient-to-br from-emerald-500/30 to-green-500/20' : 'bg-transparent'} transition-all duration-1000">
              <div class="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-pulse"></div>
            </div>
            
            <!-- Center text -->
            <div class="text-center z-10">
              <p class="text-sm text-slate-400 mb-1">Community Pool</p>
              <div class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 {animatePercentage ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}">
                75%
              </div>
            </div>
            
            <!-- Labels -->
            <div class="absolute -top-4 -left-6 bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700">
              <p class="text-xs text-slate-300">25% Operations</p>
            </div>
            <div class="absolute -bottom-4 -right-6 bg-slate-800/90 px-3 py-1 rounded-lg border border-emerald-500/30">
              <p class="text-xs text-emerald-300">75% Community</p>
            </div>
          </div>
        </div>
        
        <div class="mt-8 space-y-2 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 800ms;">
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-emerald-500/80 mr-2"></div>
            <p class="text-slate-300 text-sm">Funds community-proposed projects and startups</p>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-emerald-500/80 mr-2"></div>
            <p class="text-slate-300 text-sm">Distributes returns based on token ownership</p>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-emerald-500/80 mr-2"></div>
            <p class="text-slate-300 text-sm">Sustains long-term ecosystem growth</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 