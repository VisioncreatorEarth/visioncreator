<script>
  // Question Slide
  import { onMount } from 'svelte';
  
  let revealed = false;
  let typewriterComplete = false;
  let typingStep = 0;
  
  const words = ["freedom", "time", "expression", "purpose"];
  
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
      }, 2500);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full">
  <div class="max-w-4xl w-full mx-auto text-center">
    <!-- Dramatic Question -->
    <div class="mb-16 relative overflow-hidden">
      <div class="transform transition-all duration-1000 ease-out {revealed ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}">
        <h1 class="text-5xl sm:text-6xl font-bold text-slate-100 leading-tight">
          What does a human<br>fundamentally strive for?
        </h1>
      </div>
      
      <!-- Underline animation -->
      <div class="w-full h-1 mt-8 mx-auto {revealed ? 'scale-x-100' : 'scale-x-0'} transform transition-transform duration-1500 ease-out origin-left">
        <div class="h-full w-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"></div>
      </div>
    </div>
    
    <!-- Animated words --> 
    <div class="relative h-24 {typewriterComplete ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000">
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="flex items-center text-4xl md:text-5xl">
          <span class="text-slate-400 mr-4">Is it</span>
          {#each words as word, i}
            <span class="absolute transition-all duration-500 font-bold {typingStep === i ? 'opacity-100 scale-110' : 'opacity-0 scale-95'} {i === 0 ? 'text-yellow-400' : i === 1 ? 'text-cyan-400' : i === 2 ? 'text-green-400' : 'text-fuchsia-400'}">
              {word}?
            </span>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Subtle visual elements -->
    <div class="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-slate-800/30 blur-3xl mix-blend-screen"></div>
    <div class="absolute top-10 left-10 w-24 h-24 rounded-full bg-cyan-900/20 blur-3xl mix-blend-screen"></div>
  </div>
</div>

<style>
  /* Add any additional styles here */
</style> 