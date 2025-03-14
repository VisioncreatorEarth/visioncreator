<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let questionRevealed = false;
  let answerRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      setTimeout(() => {
        questionRevealed = true;
        setTimeout(() => {
          answerRevealed = true;
        }, 800);
      }, 600);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Main Content -->
    <div class="text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <h2 class="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
        A BETTER WAY
      </h2>
      
      <div class="max-w-4xl mx-auto mt-8 transform transition-all duration-700 {questionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <p class="text-2xl md:text-3xl font-semibold text-gray-200 mb-6">
          Can we integrate all these elements into one organization?
        </p>
        
        <div class="flex items-center justify-center my-12">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="max-w-3xl mx-auto mt-8 bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-lg border border-slate-700 transform transition-all duration-700 {answerRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <p class="text-xl text-gray-300 mb-6">
          Traditional structures force us to choose between:
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <p class="text-lg font-medium text-indigo-300">Belonging</p>
            <p class="text-gray-400">vs.</p>
            <p class="text-lg font-medium text-purple-300">Autonomy</p>
          </div>
          
          <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <p class="text-lg font-medium text-indigo-300">Financial Security</p>
            <p class="text-gray-400">vs.</p>
            <p class="text-lg font-medium text-purple-300">Agency</p>
          </div>
        </div>
        
        <p class="text-xl text-gray-200 font-medium">
          What if we could build an organization that enables <span class="text-indigo-300">all of these</span> simultaneously?
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 