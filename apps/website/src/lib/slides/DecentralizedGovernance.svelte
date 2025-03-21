<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let stepIndex = 0;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    const interval = setInterval(() => {
      if (stepIndex < 4) {
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    
    return () => clearInterval(interval);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-4xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-12 text-center">
      Decentralized Ownership & Governance
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      <!-- DAO Explanation -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <h3 class="text-xl font-semibold text-blue-300 mb-4">DAO Light Model</h3>
        <p class="text-slate-300 mb-4">
          A <span class="text-blue-300 font-medium">Decentralized Autonomous Organization</span> where members collectively own and govern the platform.
        </p>
        <ul class="space-y-2 text-slate-300">
          <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <span class="text-xs font-bold">1</span>
            </div>
            <p>Members propose ideas and vote on platform direction</p>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <span class="text-xs font-bold">2</span>
            </div>
            <p>Decisions about resource allocation are made collectively</p>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <span class="text-xs font-bold">3</span>
            </div>
            <p>Governance ensures transparency and fair value distribution</p>
          </li>
        </ul>
      </div>
      
      <!-- VCR Token System -->
      <div class="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-teal-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
        <h3 class="text-xl font-semibold text-teal-300 mb-4">VCR Token Ownership</h3>
        <p class="text-slate-300 mb-4">
          VCR tokens represent your stake in the collective, earned through contributions.
        </p>
        <ul class="space-y-2 text-slate-300">
          <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <span class="text-xs font-bold">1</span>
            </div>
            <p>Earn tokens by contributing skills and value</p>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <span class="text-xs font-bold">2</span>
            </div>
            <p>Tokens provide voting power in governance decisions</p>
          </li>
          <li class="flex items-start">
            <div class="w-6 h-6 rounded-full bg-teal-900/30 border border-teal-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
              <span class="text-xs font-bold">3</span>
            </div>
            <p>Tokens entitle you to income from the investment pool</p>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Investment Pool Section -->
    <div class="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 400ms;">
      <div class="flex flex-col md:flex-row items-start gap-6">
        <div class="md:w-1/2">
          <h3 class="text-xl font-semibold text-emerald-300 mb-4">VisionCreator Pool</h3>
          <p class="text-slate-300 mb-2">
            75% of all investments and income flows into the VisionCreator pool.
          </p>
          <ul class="space-y-2 text-slate-300">
            <li class="flex items-start">
              <div class="w-6 h-6 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold">→</span>
              </div>
              <p>Funds startups and projects proposed by the community</p>
            </li>
            <li class="flex items-start">
              <div class="w-6 h-6 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold">→</span>
              </div>
              <p>Returns from investments are distributed to token holders</p>
            </li>
            <li class="flex items-start">
              <div class="w-6 h-6 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold">→</span>
              </div>
              <p>Contributors earn from the pool based on their contributions</p>
            </li>
          </ul>
        </div>
        
        <div class="md:w-1/2 flex justify-center items-center">
          <div class="relative w-48 h-48 rounded-full bg-gradient-to-br from-emerald-900/20 to-blue-900/20 flex items-center justify-center border border-emerald-500/20">
            <div class="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse"></div>
            <div class="text-center">
              <span class="text-4xl font-bold text-emerald-400">75%</span>
              <p class="text-xs text-slate-300 mt-2">Community Pool</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Proposal System -->
    <div class="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 600ms;">
      <h3 class="text-xl font-semibold text-purple-300 mb-4">Decentralized Voting & Proposals</h3>
      
      <div class="flex flex-col md:flex-row gap-6">
        <div class="md:w-1/2">
          <p class="text-slate-300 mb-4">
            Our proposal system enables democratic decision-making on all aspects of the platform:
          </p>
          <ul class="space-y-2 text-slate-300">
            <li class="flex items-start">
              <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold">→</span>
              </div>
              <p>Product improvements and new features</p>
            </li>
            <li class="flex items-start">
              <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold">→</span>
              </div>
              <p>Investment decisions for the community pool</p>
            </li>
            <li class="flex items-start">
              <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold">→</span>
              </div>
              <p>Governance policy updates</p>
            </li>
          </ul>
        </div>
        
        <div class="md:w-1/2">
          <div class="bg-slate-900/70 p-4 rounded-lg border border-purple-500/10">
            <div class="flex items-center justify-between mb-3">
              <p class="text-slate-300 font-medium">Update dashboard metrics</p>
              <span class="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full">80% Approval</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-purple-500 to-blue-500" style="width: 80%"></div>
            </div>
            <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>8 of 10 votes</span>
              <span>Product improvement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-8 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 800ms;">
      <p class="text-xl text-slate-200">
        True ownership means having a voice and a stake in what you help build
      </p>
    </div>
  </div>
</div> 