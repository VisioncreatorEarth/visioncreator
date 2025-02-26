<script lang="ts">
  export let title: string = '';
  export let index: number = 0;
  export let slideType: string = 'default';
  
  // Generate background colors based on slide type
  let bgGradient = 'from-cyan-400 to-blue-600';
  
  // Set different color schemes based on slide type or index for visual variety
  if (index === 0) {
    bgGradient = 'from-cyan-400 to-emerald-500'; // Title slide
  } else if (index === 1) {
    bgGradient = 'from-indigo-400 to-purple-500'; // Question slide
  } else if (index === 2) {
    bgGradient = 'from-orange-400 to-red-500'; // Autonomy slide
  } else if (index % 4 === 0) {
    bgGradient = 'from-emerald-400 to-teal-600';
  } else if (index % 4 === 1) {
    bgGradient = 'from-cyan-400 to-blue-600';
  } else if (index % 4 === 2) {
    bgGradient = 'from-purple-400 to-indigo-600';
  } else if (index % 4 === 3) {
    bgGradient = 'from-amber-400 to-orange-600';
  }
</script>

<div class="slide-thumbnail relative bg-slate-800 rounded-lg overflow-hidden shadow-lg">
  <div class="aspect-video bg-slate-700 flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0 opacity-20 bg-gradient-to-br {bgGradient}"></div>
    
    <!-- Different layout for each slide type -->
    {#if index === 0}
      <!-- Title slide layout -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Title Slide</div>
        <div class="text-lg font-bold text-white leading-tight">{title}</div>
      </div>
    {:else if index === 1}
      <!-- Question slide layout -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Question</div>
        <div class="text-sm font-medium text-white">What does a human fundamentally strive for?</div>
      </div>
    {:else if index === 2}
      <!-- Answer slide layout -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xl font-bold text-white">AUTONOMY</div>
      </div>
    {:else}
      <!-- Generic slide layout with elements representing content -->
      <div class="relative z-10 flex flex-col items-center">
        <div class="w-16 h-1 bg-white/30 mb-3"></div>
        <div class="w-24 h-2 bg-white/20 mb-1 rounded-full"></div>
        <div class="w-16 h-2 bg-white/20 rounded-full"></div>
      </div>
    {/if}
    
    <!-- Slide number -->
    <div class="absolute bottom-2 right-2 text-xs font-bold text-white/50 bg-black/20 px-2 py-1 rounded-full">
      {index + 1}
    </div>
  </div>
  
  <div class="p-3">
    <h3 class="text-sm font-medium text-slate-200 truncate" title={title}>{title}</h3>
  </div>
</div>

<style>
  .slide-thumbnail {
    transition: all 0.2s ease-in-out;
  }
  
  .slide-thumbnail:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
</style> 