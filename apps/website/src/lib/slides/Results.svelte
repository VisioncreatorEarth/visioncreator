<script>
  // Results.svelte - A slide showing real results and case study
  import Avatar from '$lib/Avatar.svelte';
</script>

<div class="slide-content flex flex-col items-center justify-center h-full">
  <h1 class="text-5xl font-bold mb-12 bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text">
    Real Results
  </h1>
  
  <div class="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 max-w-3xl w-full">
    <div class="space-y-8">
      <div class="flex items-start gap-6">
        <Avatar seed="marco" size="64" />
        <div>
          <h3 class="text-2xl font-bold text-yellow-400 mb-2">Marco's Journey</h3>
          <p class="text-cyan-100/80 text-sm">Developer from Portugal</p>
        </div>
      </div>
      
      <!-- Visual Timeline -->
      <div class="relative pl-8 pb-4">
        <!-- Timeline Line -->
        <div class="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-yellow-400/20 via-cyan-400/30 to-cyan-400/70 rounded-full"></div>
        
        <!-- 1st Milestone -->
        <div class="relative mb-8">
          <div class="absolute left-0 top-0 w-8 h-8 bg-yellow-400 rounded-full transform -translate-x-[18px] -translate-y-[4px] z-10 flex items-center justify-center">
            <span class="text-black font-bold">1</span>
          </div>
          <div class="pl-6">
            <h4 class="text-xl font-bold text-yellow-400 mb-2">Joined the Community</h4>
            <div class="bg-slate-800/50 rounded-lg p-4 border-l-4 border-yellow-400">
              <p class="text-cyan-100">Started with just €1/day</p>
              <p class="text-cyan-100/70 text-sm mt-2">Day 1</p>
            </div>
          </div>
        </div>
        
        <!-- 2nd Milestone -->
        <div class="relative mb-8">
          <div class="absolute left-0 top-0 w-8 h-8 bg-gradient-to-r from-yellow-400 to-cyan-400/80 rounded-full transform -translate-x-[18px] -translate-y-[4px] z-10 flex items-center justify-center">
            <span class="text-black font-bold">2</span>
          </div>
          <div class="pl-6">
            <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400/80 mb-2">Passive Income</h4>
            <div class="bg-slate-800/50 rounded-lg p-4 border-l-4 border-cyan-400/80">
              <div class="flex justify-between">
                <div class="text-sm text-cyan-100/70">Initial: €30</div>
                <div class="text-sm text-yellow-400 font-bold">Monthly: €350+</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-yellow-400/10 to-cyan-400/10 rounded-xl p-6">
        <p class="text-cyan-100/90 italic text-lg">
          "I used to build products for others. Now I build wealth for myself while doing what I love."
        </p>
        <div class="flex justify-between items-center mt-4">
          <p class="text-sm text-cyan-100/70">— Marco</p>
          <div class="flex items-center">
            <span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            <span class="text-xs text-cyan-100/70">Active Member • 8 Months</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 