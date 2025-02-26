<script>
  // Title Slide
  import { onMount } from 'svelte';
  
  let revealed = true; // Set to true by default to ensure the title is visible immediately
  
  onMount(() => {
    // No delay needed as we're setting revealed to true by default
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-4">
  <div class="max-w-5xl w-full mx-auto text-center">
    <!-- Main Title with immediate visibility -->
    <h1 class="text-7xl sm:text-9xl font-extrabold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text">
      <span class="block mb-4">Freedom to Create,</span>
      <span class="block">Right to Own</span>
    </h1>
  </div>
</div>

<style>
  /* Simplified styles without the animations that might cause visibility issues */
  h1 {
    line-height: 1.1;
    padding: 20px 0;
  }
</style> 