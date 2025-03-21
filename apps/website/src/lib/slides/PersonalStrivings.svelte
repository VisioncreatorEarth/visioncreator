<script>
  // Personal Strivings Slide
  import { onMount } from 'svelte';
  
  let revealed = false;
  let typewriterComplete = false;
  let typingStep = 0;
  
  // Options that will be displayed
  const words = ["freedom", "time", "purpose", "money"];
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      setTimeout(() => {
        typewriterComplete = true;
        
        // Change the highlighted word
        const interval = setInterval(() => {
          if (typingStep < words.length - 1) {
            typingStep++;
          } else {
            clearInterval(interval);
          }
        }, 1200);
        
        return () => clearInterval(interval);
      }, 1500);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Main Question -->
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        What is it for you?
      </h2>
      <p class="text-2xl md:text-3xl text-indigo-300 mt-4">The fundamental human striving...</p>
    </div>
    
    <!-- Animated words --> 
    <div class="transform transition-all duration-700 {typewriterComplete ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 300ms;">
      <div class="bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-8 border border-indigo-500/20 max-w-3xl mx-auto">
        <div class="flex flex-col gap-6">
          <div class="text-center">
            <p class="text-2xl text-slate-300 mb-4">Could it be...</p>
            
            <div class="h-20 relative">
              {#each words as word, i}
                <div class="absolute inset-0 flex items-center justify-center transition-all duration-500 
                  {typingStep === i ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}">
                  <span class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r 
                    {i === 0 ? 'from-yellow-400 to-amber-500' : 
                     i === 1 ? 'from-cyan-400 to-blue-500' : 
                     i === 2 ? 'from-purple-400 to-indigo-500' : 
                     'from-emerald-400 to-green-500'}">
                    {word}?
                  </span>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="flex items-center justify-center gap-8 mt-4">
            <div class="w-12 h-1 bg-gradient-to-r from-indigo-500/50 to-transparent rounded-full"></div>
            <div class="text-slate-400 text-sm">or perhaps</div>
            <div class="w-12 h-1 bg-gradient-to-l from-indigo-500/50 to-transparent rounded-full"></div>
          </div>
          
          <p class="text-center text-xl text-slate-300">
            Something more <span class="text-indigo-300 font-medium">fundamental</span> to the human experience?
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any additional styles here */
</style> 