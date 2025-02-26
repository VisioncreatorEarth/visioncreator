<script>
  // Question Slide
  import { onMount } from 'svelte';
  
  let revealed = false;
  let wordsRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
    
    setTimeout(() => {
      wordsRevealed = true;
    }, 1500);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full">
  <div class="max-w-5xl w-full mx-auto text-center">
    <!-- Question with typing effect animation -->
    <div class="relative h-[200px] flex flex-col items-center justify-center">
      <!-- Animated Question Mark -->
      <div class="absolute -top-16 right-0 transform {revealed ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-24 opacity-0 rotate-12'} transition-all duration-1000 ease-out">
        <span class="text-[180px] font-bold text-cyan-400/20">?</span>
      </div>
      
      <!-- Question Text with Word-by-Word Reveal -->
      <h2 class="text-5xl font-bold text-cyan-100 relative z-10 leading-tight">
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 300ms;">What</span>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 400ms;"> does</span>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 500ms;"> a</span>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 600ms;"> human</span>
        <br>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 700ms;">fundamentally</span>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 800ms;"> strive</span>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;"> for</span>
        <span class="inline-block transform transition-all duration-500 {revealed ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-90'}" style="transition-delay: 1000ms;">?</span>
      </h2>
    </div>
    
    <!-- Animated Words -->
    <div class="mt-24 flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 100ms;">Freedom?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 200ms;">Wealth?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 300ms;">Recognition?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 400ms;">Purpose?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 500ms;">Security?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 600ms;">Power?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 700ms;">Control?</div>
      <div class="word-bubble {wordsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}" style="transition-delay: 800ms;">Happiness?</div>
    </div>
  </div>
</div>

<style>
  .word-bubble {
    @apply px-5 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full text-xl text-cyan-100/80;
    @apply border border-cyan-500/20 transform transition-all duration-700;
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.1);
  }
  
  .word-bubble:hover {
    @apply bg-slate-800/80 text-cyan-100 border-cyan-500/40 scale-110;
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
  }
</style> 