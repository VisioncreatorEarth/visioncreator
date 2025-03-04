<script>
  // FounderChoice.svelte - The Founder option in our work choices
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
    <div class="text-center mb-8 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-blue-300 mb-4">What does it mean to be a</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
        Founder
      </h2>
    </div>
    
    <div class="max-w-3xl mx-auto bg-gradient-to-b from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl p-8 border border-blue-500/30 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">      
      <div class="space-y-6 mt-4">
        <div class="bg-slate-900/50 p-5 rounded-lg border border-blue-500/20 flex items-start">
          <span class="text-blue-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl"><span class="text-blue-300 font-medium">Work all hours</span> with no boundaries between life and work</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-blue-500/20 flex items-start">
          <span class="text-blue-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Your vision, but with <span class="text-blue-300 font-medium">extreme stress</span> and personal risk</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-blue-500/20 flex items-start">
          <span class="text-blue-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Spend time on <span class="text-blue-300 font-medium">admin, legal, and fundraising</span> instead of creating</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-blue-500/20 flex items-start">
          <span class="text-blue-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl"><span class="text-blue-300 font-medium">Financial uncertainty</span> and potentially years without profit</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-blue-500/20 flex items-start">
          <span class="text-blue-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Loneliness of <span class="text-blue-300 font-medium">bearing all responsibility</span> for success or failure</p>
        </div>
      </div>
    </div>
    
    <div class="text-center mt-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;">
      <p class="text-xl text-slate-300">
        Is this really the <span class="text-blue-300 font-medium">freedom</span> you were looking for? Or just <span class="text-blue-300 font-medium">another trap</span>?
      </p>
    </div>
  </div>
</div> 