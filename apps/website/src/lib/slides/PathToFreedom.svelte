<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let activeStep = 0;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      // Cycle through steps
      const interval = setInterval(() => {
        if (activeStep < 4) {
          activeStep++;
        } else {
          clearInterval(interval);
        }
      }, 1200);
      
      return () => clearInterval(interval);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-4xl w-full mx-auto text-center">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400 mb-14">
      Your Path to Freedom
    </h2>
    
    <div class="relative px-6 py-10 max-w-3xl mx-auto">
      <!-- The path visual -->
      <div class="absolute top-0 left-1/2 h-full w-1 bg-gradient-to-b from-green-500/10 via-teal-500/30 to-emerald-500/70 transform -translate-x-1/2 rounded-full"></div>
      
      <!-- Step markers -->
      <div class="relative z-10 space-y-16">
        <!-- Step 1 -->
        <div class="flex items-center transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 100ms;">
          <div class="w-14 h-14 rounded-full flex items-center justify-center {activeStep >= 0 ? 'bg-green-900/40 border-2 border-green-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
            <span class="text-xl">€1</span>
          </div>
          <div class="ml-6 text-left">
            <h3 class="text-lg font-medium {activeStep >= 0 ? 'text-green-400' : 'text-slate-400'}">Begin Your Transition</h3>
            <p class="text-slate-300 text-sm">€1/day starts your journey from dependent to owner</p>
          </div>
        </div>
        
        <!-- Step 2 -->
        <div class="flex items-center transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 200ms;">
          <div class="w-14 h-14 rounded-full flex items-center justify-center {activeStep >= 1 ? 'bg-teal-900/40 border-2 border-teal-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
            <span class="text-xl">👥</span>
          </div>
          <div class="ml-6 text-left">
            <h3 class="text-lg font-medium {activeStep >= 1 ? 'text-teal-400' : 'text-slate-400'}">Join the Community</h3>
            <p class="text-slate-300 text-sm">Connect with those who value your autonomy</p>
          </div>
        </div>
        
        <!-- Step 3 -->
        <div class="flex items-center transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
          <div class="w-14 h-14 rounded-full flex items-center justify-center {activeStep >= 2 ? 'bg-emerald-900/40 border-2 border-emerald-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
            <span class="text-xl">🎯</span>
          </div>
          <div class="ml-6 text-left">
            <h3 class="text-lg font-medium {activeStep >= 2 ? 'text-emerald-400' : 'text-slate-400'}">Contribute Authentically</h3>
            <p class="text-slate-300 text-sm">Work on projects aligned with your interests</p>
          </div>
        </div>
        
        <!-- Step 4 -->
        <div class="flex items-center transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 400ms;">
          <div class="w-14 h-14 rounded-full flex items-center justify-center {activeStep >= 3 ? 'bg-teal-900/40 border-2 border-teal-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
            <span class="text-xl">📈</span>
          </div>
          <div class="ml-6 text-left">
            <h3 class="text-lg font-medium {activeStep >= 3 ? 'text-teal-400' : 'text-slate-400'}">Build Ownership Stakes</h3>
            <p class="text-slate-300 text-sm">Create a portfolio of assets that generate income</p>
          </div>
        </div>
        
        <!-- Step 5 -->
        <div class="flex items-center transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 500ms;">
          <div class="w-14 h-14 rounded-full flex items-center justify-center {activeStep >= 4 ? 'bg-green-900/40 border-2 border-green-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
            <span class="text-xl">🔑</span>
          </div>
          <div class="ml-6 text-left">
            <h3 class="text-lg font-medium {activeStep >= 4 ? 'text-green-400' : 'text-slate-400'}">Achieve Lifelong Freedom</h3>
            <p class="text-slate-300 text-sm">Establish the foundation for sustained autonomy</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 