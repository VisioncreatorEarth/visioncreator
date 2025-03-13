<script>
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
    <!-- Main heading -->
    <div class="text-center mb-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-purple-300 mb-6">The crucial question...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-8">
        Why does this<br>matter?
      </h2>
    </div>
    
    <!-- Simon Sinek reference -->
    <div class="relative mb-16 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
      <div class="absolute -left-4 -top-4 text-8xl text-purple-700/30 font-serif">"</div>
      <div class="relative z-10 bg-black/30 backdrop-blur-sm p-8 rounded-xl border border-purple-600/20">
        <p class="text-xl md:text-2xl text-center text-slate-200 italic">
          "People don't buy what you do; they buy why you do it. And what you do simply proves what you believe."
        </p>
        <p class="text-right mt-4 text-purple-300">— Simon Sinek</p>
      </div>
    </div>
    
    <!-- Our why -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 400ms;">
      <div class="bg-gradient-to-br from-purple-900/30 to-black/20 rounded-xl p-6 border border-purple-600/20">
        <h3 class="text-2xl font-bold text-purple-300 mb-4">The Search for Livability</h3>
        <p class="text-slate-300">
          We strive to create environments where work enhances rather than depletes our lives.
          Current systems force trade-offs between stability, autonomy, and purpose that shouldn't
          exist in our connected world.
        </p>
      </div>
      
      <div class="bg-gradient-to-br from-indigo-900/30 to-black/20 rounded-xl p-6 border border-indigo-600/20">
        <h3 class="text-2xl font-bold text-indigo-300 mb-4">Quality of Life</h3>
        <p class="text-slate-300">
          Work consumes the majority of our waking hours. When properly structured, it becomes
          a source of meaning, connection, and fulfillment rather than merely a means to survive.
          True quality of life blends purpose with prosperity.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 