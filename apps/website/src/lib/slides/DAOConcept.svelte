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
      <p class="text-2xl md:text-3xl text-blue-300 mb-6">Powered by...</p>
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">
        The DAO Concept
      </h2>
    </div>
    
    <!-- Placeholder content - will be replaced with actual content -->
    <div class="text-center text-lg text-gray-400">
      <p class="mb-4">This slide will introduce the Decentralized Autonomous Organization (DAO) model, including:</p>
      <ul class="list-disc text-left max-w-lg mx-auto mb-8 space-y-2">
        <li>Proposal and voting systems</li>
        <li>Collective ownership through VCR token</li>
        <li>Community-driven innovation</li>
        <li>Flexible contribution and reward system</li>
      </ul>
      <p>The goal is building successful startups together.</p>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 