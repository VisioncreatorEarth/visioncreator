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
    <!-- Main Content -->
    <div class="text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-red-300 mb-6">The uncomfortable truth...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-8">
        Our way of organizing<br>work is outdated
      </h2>
      
      <div class="max-w-3xl mx-auto mt-12 bg-black/30 p-6 rounded-xl backdrop-blur-sm transform transition-all duration-700 delay-300 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <p class="text-xl text-slate-300">
          Despite technological revolutions, our organizational models remain stuck in industrial-era thinking. 
          They fail to address our fundamental human needs in a world of unprecedented connectivity and possibility.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 