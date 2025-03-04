<script>
  // Question Slide
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
    <!-- Dramatic Question -->
    <div class="text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-indigo-300 mb-6">Every journey begins with a question...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        What does human<br>fundamentally strive for??
      </h2>
    </div>
  </div>
</div>

<style>
  /* Add any additional styles here */
</style> 