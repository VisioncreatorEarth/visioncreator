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
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-12 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      What is a DAO?
    </h2>
    
    <div class="flex flex-col md:flex-row items-center gap-12">
      <!-- Left side - explanation -->
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}">
        <h3 class="text-2xl font-semibold text-blue-300 mb-4">Decentralized Autonomous Organization</h3>
        
        <p class="text-xl text-slate-300 mb-6">
          A member-owned community without centralized leadership.
        </p>
        
        <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 mb-6">
          <p class="text-slate-300">
            At VisionCreator, we've built a <span class="text-blue-300 font-medium">DAO light model</span> that gives members real ownership and voting power through our token system.
          </p>
        </div>
        
        <p class="text-slate-400">
          No more working for someone else's vision. Create and own together.
        </p>
      </div>
      
      <!-- Right side - benefits -->
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
        <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20">
          <h3 class="text-xl font-semibold text-teal-300 mb-4">Why It Matters</h3>
          
          <ul class="space-y-4">
            <li class="flex items-start transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 400ms;">
              <div class="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-sm font-bold">1</span>
              </div>
              <div>
                <h4 class="font-medium text-teal-300">True Ownership</h4>
                <p class="text-slate-300">Your stake grows as you contribute</p>
              </div>
            </li>
            
            <li class="flex items-start transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 600ms;">
              <div class="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-sm font-bold">2</span>
              </div>
              <div>
                <h4 class="font-medium text-teal-300">Collective Intelligence</h4>
                <p class="text-slate-300">Better decisions through community wisdom</p>
              </div>
            </li>
            
            <li class="flex items-start transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 800ms;">
              <div class="w-8 h-8 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-sm font-bold">3</span>
              </div>
              <div>
                <h4 class="font-medium text-teal-300">Fair Value Distribution</h4>
                <p class="text-slate-300">Value flows to those who create it</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div> 