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
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center mb-8 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl text-amber-300 mb-2">From theory to practice</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
        Elena's Autonomous Journey
      </h2>
    </div>
    
    <div class="flex flex-col md:flex-row gap-6 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <!-- Elena story - left side -->
      <div class="w-full md:w-1/3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-5 border border-amber-500/20">
        <h3 class="text-lg font-semibold text-amber-400 mb-2 text-center">Elena's Story</h3>
        <p class="text-center text-slate-300 text-xs mb-3">Former marketing specialist who joined VisionCreator 8 months ago</p>
        
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 text-xs">Location</span>
            <span class="text-amber-300 text-xs font-medium">Split, Croatia</span>
          </div>
          <div class="h-1 w-full bg-slate-700/50 rounded-full">
            <div class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style="width: 85%"></div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-slate-400 text-xs">Token Holdings</span>
            <span class="text-amber-300 text-xs font-medium">1,280 VCR</span>
          </div>
          <div class="h-1 w-full bg-slate-700/50 rounded-full">
            <div class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style="width: 65%"></div>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-slate-400 text-xs">Projects</span>
            <span class="text-amber-300 text-xs font-medium">3 Active</span>
          </div>
          <div class="h-1 w-full bg-slate-700/50 rounded-full">
            <div class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style="width: 75%"></div>
          </div>
        </div>
      </div>
      
      <!-- Journey Timeline - right side -->
      <div class="w-full md:w-2/3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-5 border border-orange-500/20">
        <h3 class="text-lg font-semibold text-orange-400 mb-3">8-Month Transformation</h3>
        
        <div class="space-y-3">
          <!-- Step 1 -->
          <div class="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/30 border border-orange-500/10 transform transition-all duration-700 {step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 200ms;">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-900/30 border border-orange-500/30 flex items-center justify-center">
              <span class="text-orange-400 font-semibold">1</span>
            </div>
            <div>
              <h4 class="text-sm font-medium text-orange-300">From 9-5 to Life-Aligned Schedule</h4>
              <p class="text-slate-300 text-xs">Elena works when she's most productive - early mornings and late evenings, with a midday break</p>
            </div>
          </div>
          
          <!-- Step 2 -->
          <div class="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/30 border border-orange-500/10 transform transition-all duration-700 {step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 400ms;">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-900/30 border border-orange-500/30 flex items-center justify-center">
              <span class="text-orange-400 font-semibold">2</span>
            </div>
            <div>
              <h4 class="text-sm font-medium text-orange-300">Relocated to Her Dream City</h4>
              <p class="text-slate-300 text-xs">After years of dreaming about coastal living, she moved to Split for inspiration and community</p>
            </div>
          </div>
          
          <!-- Step 3 -->
          <div class="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/30 border border-orange-500/10 transform transition-all duration-700 {step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 600ms;">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-900/30 border border-orange-500/30 flex items-center justify-center">
              <span class="text-orange-400 font-semibold">3</span>
            </div>
            <div>
              <h4 class="text-sm font-medium text-orange-300">Built Her First Portfolio of Projects</h4>
              <p class="text-slate-300 text-xs">Now leads marketing for 3 projects she loves, having voting power in all strategic decisions</p>
            </div>
          </div>
          
          <!-- Step 4 -->
          <div class="flex items-start space-x-3 p-3 rounded-lg bg-slate-900/30 border border-orange-500/10 transform transition-all duration-700 {step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 800ms;">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-orange-900/30 border border-orange-500/30 flex items-center justify-center">
              <span class="text-orange-400 font-semibold">4</span>
            </div>
            <div>
              <h4 class="text-sm font-medium text-orange-300">Growing Asset Portfolio</h4>
              <p class="text-slate-300 text-xs">Her token holdings generate monthly income through staking rewards, while appreciating in value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-4 text-center transform transition-all duration-1000 {step >= 5 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 1200ms;">
      <p class="text-lg text-amber-300 font-medium">
        "VisionCreator didn't just change how I work—it changed how I live."
      </p>
    </div>
  </div>
</div> 