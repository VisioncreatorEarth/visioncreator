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
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-amber-300 mb-6">Why is that?</p>
      <h2 class="text-4xl md:text-5xl font-bold text-white mb-8">
        Root Causes of Our Work Crisis
      </h2>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <!-- Left column -->
      <div class="bg-gradient-to-b from-amber-900/20 to-black/20 p-6 rounded-xl border border-amber-800/30 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 100ms;">
        <h3 class="text-2xl font-semibold text-amber-300 mb-4">Historical Inertia</h3>
        <ul class="space-y-3 text-slate-300">
          <li class="flex items-start">
            <span class="text-amber-500 mr-2">•</span>
            <span>Organizations designed for industrial economy persist in digital age</span>
          </li>
          <li class="flex items-start">
            <span class="text-amber-500 mr-2">•</span>
            <span>Hierarchical structures that served stability now inhibit agility</span>
          </li>
          <li class="flex items-start">
            <span class="text-amber-500 mr-2">•</span>
            <span>Ownership models rooted in capital-labor divisions fail to reflect modern value creation</span>
          </li>
        </ul>
      </div>
      
      <!-- Right column -->
      <div class="bg-gradient-to-b from-amber-900/20 to-black/20 p-6 rounded-xl border border-amber-800/30 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
        <h3 class="text-2xl font-semibold text-amber-300 mb-4">False Binary</h3>
        <ul class="space-y-3 text-slate-300">
          <li class="flex items-start">
            <span class="text-amber-500 mr-2">•</span>
            <span>Forced to choose between stability as employees or risk as founders</span>
          </li>
          <li class="flex items-start">
            <span class="text-amber-500 mr-2">•</span>
            <span>No middle path that combines security with autonomy</span>
          </li>
          <li class="flex items-start">
            <span class="text-amber-500 mr-2">•</span>
            <span>Cooperative ownership remains niche despite potential to resolve the binary</span>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Bottom note -->
    <div class="mt-10 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">
      <p class="text-xl text-slate-400">
        These structures persist despite technology enabling entirely new possibilities
      </p>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 