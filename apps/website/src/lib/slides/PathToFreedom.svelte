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
      }, 1500);
      
      return () => clearInterval(interval);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-green-300 mb-4">Practical steps to transform your work life</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
        5-Step Journey to Freedom
      </h2>
    </div>
    
    <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-green-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <!-- The path visual -->
      <div class="relative max-w-4xl mx-auto pb-6">
        <div class="absolute top-0 left-1/2 h-full w-1 bg-gradient-to-b from-green-500/10 via-teal-500/30 to-emerald-500/70 transform -translate-x-1/2 rounded-full"></div>
      
        <!-- Step markers -->
        <div class="relative z-10 space-y-8">
          <!-- Step 1 -->
          <div class="flex items-start transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 100ms;">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center {activeStep >= 0 ? 'bg-green-900/40 border-2 border-green-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
              <span class="text-green-400 font-semibold">1</span>
            </div>
            <div class="ml-4 text-left">
              <h3 class="text-base font-medium {activeStep >= 0 ? 'text-green-400' : 'text-slate-400'}">Start with a Single Euro</h3>
              <p class="text-slate-300 text-xs">Begin by committing €1/day for your membership</p>
            </div>
          </div>
          
          <!-- Step 2 -->
          <div class="flex items-start transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 200ms;">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center {activeStep >= 1 ? 'bg-teal-900/40 border-2 border-teal-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
              <span class="text-teal-400 font-semibold">2</span>
            </div>
            <div class="ml-4 text-left">
              <h3 class="text-base font-medium {activeStep >= 1 ? 'text-teal-400' : 'text-slate-400'}">Complete Onboarding Quests</h3>
              <p class="text-slate-300 text-xs">Learn platform basics & earn first VCR tokens</p>
            </div>
          </div>
          
          <!-- Step 3 -->
          <div class="flex items-start transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center {activeStep >= 2 ? 'bg-emerald-900/40 border-2 border-emerald-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
              <span class="text-emerald-400 font-semibold">3</span>
            </div>
            <div class="ml-4 text-left">
              <h3 class="text-base font-medium {activeStep >= 2 ? 'text-emerald-400' : 'text-slate-400'}">Join Your First Project</h3>
              <p class="text-slate-300 text-xs">Choose from projects or propose your own</p>
            </div>
          </div>
          
          <!-- Step 4 -->
          <div class="flex items-start transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 400ms;">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center {activeStep >= 3 ? 'bg-teal-900/40 border-2 border-teal-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
              <span class="text-teal-400 font-semibold">4</span>
            </div>
            <div class="ml-4 text-left">
              <h3 class="text-base font-medium {activeStep >= 3 ? 'text-teal-400' : 'text-slate-400'}">Build Your Portfolio</h3>
              <p class="text-slate-300 text-xs">Diversify into multiple income streams</p>
            </div>
          </div>
          
          <!-- Step 5 -->
          <div class="flex items-start transform transition-all duration-500 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 500ms;">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center {activeStep >= 4 ? 'bg-green-900/40 border-2 border-green-500/50' : 'bg-slate-800/30 border border-slate-700/50'}">
              <span class="text-green-400 font-semibold">5</span>
            </div>
            <div class="ml-4 text-left">
              <h3 class="text-base font-medium {activeStep >= 4 ? 'text-green-400' : 'text-slate-400'}">Shape the VisionCreator Future</h3>
              <p class="text-slate-300 text-xs">Participate in governance & development</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 