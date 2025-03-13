<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let voteProgress = 0;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      voteProgress = 80;
    }, 1200);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center mb-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl text-purple-300 mb-4">How decisions get made</p>
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
        Your Voice, Your Vote
      </h2>
    </div>
    
    <div class="flex flex-col md:flex-row items-stretch gap-12">
      <!-- Left side - explanation -->
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
        <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 h-full">
          <h3 class="text-xl font-semibold text-purple-300 mb-4">Proposal & Voting System</h3>
          
          <p class="text-slate-300 mb-6">
            Token holders propose and vote on all aspects of the platform's future.
          </p>
          
          <div class="space-y-5">
            <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 500ms;">
              <h4 class="flex items-center text-purple-300 font-medium mb-1">
                <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-2 flex-shrink-0">
                  <span class="text-xs font-bold">1</span>
                </div>
                Submit Proposals
              </h4>
              <p class="text-slate-300 text-sm pl-8">
                Anyone can propose new features, investments, or policy changes
              </p>
            </div>
            
            <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 700ms;">
              <h4 class="flex items-center text-purple-300 font-medium mb-1">
                <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-2 flex-shrink-0">
                  <span class="text-xs font-bold">2</span>
                </div>
                Community Discussion
              </h4>
              <p class="text-slate-300 text-sm pl-8">
                Open debate with transparent information for all stakeholders
              </p>
            </div>
            
            <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 900ms;">
              <h4 class="flex items-center text-purple-300 font-medium mb-1">
                <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-2 flex-shrink-0">
                  <span class="text-xs font-bold">3</span>
                </div>
                Token-Based Voting
              </h4>
              <p class="text-slate-300 text-sm pl-8">
                Vote with your tokens - more contribution means more say
              </p>
            </div>
            
            <div class="transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 1100ms;">
              <h4 class="flex items-center text-purple-300 font-medium mb-1">
                <div class="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center mr-2 flex-shrink-0">
                  <span class="text-xs font-bold">4</span>
                </div>
                Implementation
              </h4>
              <p class="text-slate-300 text-sm pl-8">
                Approved proposals become reality with full transparency
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right side - voting example -->
      <div class="md:w-1/2 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}" style="transition-delay: 400ms;">
        <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 h-full">
          <h3 class="text-xl font-semibold text-blue-300 mb-6">Decision Making in Action</h3>
          
          <div class="space-y-6">
            <!-- Sample proposal 1 -->
            <div class="bg-slate-900/70 p-5 rounded-lg border border-purple-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 600ms;">
              <div class="flex items-center justify-between mb-3">
                <p class="text-slate-300 font-medium">Update dashboard metrics</p>
                <span class="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full">80% Approval</span>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1500 ease-out" style="width: {voteProgress}%"></div>
              </div>
              <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>8 of 10 votes</span>
                <span>Product improvement</span>
              </div>
            </div>
            
            <!-- Sample proposal 2 -->
            <div class="bg-slate-900/70 p-5 rounded-lg border border-purple-500/10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 800ms;">
              <div class="flex items-center justify-between mb-3">
                <p class="text-slate-300 font-medium">Fund new AI research project</p>
                <span class="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded-full">Passed</span>
              </div>
              <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-green-500 to-emerald-500" style="width: 92%"></div>
              </div>
              <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>46 of 50 votes</span>
                <span>Investment decision</span>
              </div>
            </div>
            
            <!-- Question box -->
            <div class="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-5 rounded-lg border border-purple-500/30 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}" style="transition-delay: 1200ms;">
              <h4 class="text-blue-300 font-medium mb-2">What would you vote for?</h4>
              <p class="text-slate-300 text-sm">
                Imagine helping decide which projects get funded, what features get built, or how resources are allocated.
              </p>
              <p class="text-purple-300 mt-2 font-medium">
                That's the power of decentralized governance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 