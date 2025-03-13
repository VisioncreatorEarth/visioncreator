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
      <p class="text-2xl md:text-3xl text-emerald-300 mb-6">Product Details</p>
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">
        Hominio AI - Part 2
      </h2>
    </div>
    
    <!-- Placeholder content - will be replaced with actual content -->
    <div class="text-center text-lg text-gray-400">
      <p class="mb-4">This slide will explore specific details of the Hominio AI tool (Part 2).</p>
      <p class="mb-4">Content will be developed as the product details are finalized.</p>
      <div class="p-8 border border-dashed border-gray-700 rounded-lg mt-8 mx-auto max-w-md">
        <p class="text-gray-500">Placeholder for product screenshots, diagrams, or demos</p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 