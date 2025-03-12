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
      <p class="text-2xl md:text-3xl text-teal-300 mb-6">Our first product...</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400 mb-8">
        Hominio AI Tool
      </h2>
    </div>
    
    <!-- Placeholder content - will be replaced with actual content -->
    <div class="text-center text-lg text-gray-400">
      <p class="mb-4">This slide will introduce the Hominio AI tool, including:</p>
      <ul class="list-disc text-left max-w-lg mx-auto mb-8 space-y-2">
        <li>Key features and capabilities</li>
        <li>Target audience</li>
        <li>Problem it solves</li>
        <li>How it relates to the Visioncreator model</li>
      </ul>
      <p>Further details will be developed in subsequent slides.</p>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 