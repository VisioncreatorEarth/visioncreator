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
      <p class="text-2xl md:text-3xl text-green-300 mb-6">How we organize...</p>
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">
        Visioncreator Organizational Principles
      </h2>
    </div>
    
    <!-- Placeholder content - will be replaced with actual content -->
    <div class="text-center text-lg text-gray-400">
      <p class="mb-4">This slide will detail how Visioncreator is organized, including:</p>
      <ul class="list-disc text-left max-w-lg mx-auto mb-8 space-y-2">
        <li>Collaborative work structure</li>
        <li>Collective ownership</li>
        <li>Democratic but individualized decision-making</li>
        <li>Self-determination aligned with collective goals</li>
      </ul>
      <p>The goal is alignment with inner strength/vision for all members.</p>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 