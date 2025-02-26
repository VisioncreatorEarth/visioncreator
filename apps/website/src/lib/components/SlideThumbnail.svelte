<script lang="ts">
  export let title: string = '';
  export let index: number = 0;
  export let slideType: string = 'default';
  
  // Generate background colors based on slide type
  let bgGradient = 'from-cyan-400 to-blue-600';
  let icon = '✨';
  
  // Set different color schemes and icons based on slide type or index for visual variety
  if (index === 0) { // Title slide
    bgGradient = 'from-cyan-400 to-emerald-500'; 
    icon = '🚀';
  } else if (index === 1) { // Question slide
    bgGradient = 'from-indigo-400 to-purple-500';
    icon = '❓';
  } else if (index === 2) { // Autonomy slide
    bgGradient = 'from-orange-400 to-red-500';
    icon = '🔑';
  } else if (index === 3) { // Autonomy Crisis slide
    bgGradient = 'from-red-400 to-amber-500';
    icon = '⛓️';
  } else if (index === 4) { // True Autonomy Unleashed slide
    bgGradient = 'from-teal-400 to-emerald-500';
    icon = '⏱️';
  } else if (index === 5) { // Beyond the False Binary slide
    bgGradient = 'from-purple-400 to-indigo-500';
    icon = '👑';
  } else if (index === 6) { // Freedom Dimensions slide
    bgGradient = 'from-blue-400 to-cyan-500';
    icon = '🌐';
  } else if (index === 7) { // New Work Paradigm slide
    bgGradient = 'from-violet-400 to-fuchsia-500';
    icon = '✅';
  } else if (index === 8) { // Autonomous Life slide
    bgGradient = 'from-amber-400 to-orange-500';
    icon = '👩‍💻';
  } else if (index === 9) { // Interdependence slide
    bgGradient = 'from-blue-400 to-indigo-500';
    icon = '🌱';
  } else if (index === 10) { // Path to Freedom slide
    bgGradient = 'from-green-400 to-teal-500';
    icon = '🛤️';
  } else if (index === 11) { // Reclaim Work slide
    bgGradient = 'from-cyan-400 to-emerald-500';
    icon = '🔄';
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
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Title</div>
        <div class="text-md font-bold text-white">
          Freedom to Create,<br>Right to Own
        </div>
      </div>
    {:else if index === 1}
      <!-- Question slide layout -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Question</div>
        <div class="text-sm font-medium text-white">
          What does a human<br>fundamentally strive for?
        </div>
      </div>
    {:else if index === 2}
      <!-- Answer slide layout -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Answer</div>
        <div class="text-xl font-bold text-white">AUTONOMY</div>
      </div>
    {:else if index === 3}
      <!-- Autonomy Crisis slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Crisis</div>
        <div class="text-sm font-medium text-white">
          Dependency vs Possibility
        </div>
      </div>
    {:else if index === 4}
      <!-- True Autonomy slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Unleashed</div>
        <div class="text-sm font-medium text-white">
          Time, Location & Financial<br>Autonomy
        </div>
      </div>
    {:else if index === 5}
      <!-- False Binary slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Beyond</div>
        <div class="text-sm font-medium text-white">
          Employee to Owner-Contributor
        </div>
      </div>
    {:else if index === 6}
      <!-- Freedom Dimensions slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Dimensions</div>
        <div class="text-sm font-medium text-white">
          Multiple Types of Freedom
        </div>
      </div>
    {:else if index === 7}
      <!-- New Paradigm slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Paradigm</div>
        <div class="text-sm font-medium text-white">
          Eliminating False Choices
        </div>
      </div>
    {:else if index === 8}
      <!-- Autonomous Life slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Life</div>
        <div class="text-sm font-medium text-white">
          Elena's Autonomous Journey
        </div>
      </div>
    {:else if index === 9}
      <!-- Interdependence slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Journey</div>
        <div class="text-sm font-medium text-white">
          From Dependence to<br>Interdependence
        </div>
      </div>
    {:else if index === 10}
      <!-- Path to Freedom slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Path</div>
        <div class="text-sm font-medium text-white">
          5-Step Journey to Freedom
        </div>
      </div>
    {:else if index === 11}
      <!-- Reclaim Work slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Reclaim</div>
        <div class="text-sm font-medium text-white">
          Your Work, Your Life
        </div>
      </div>
    {:else}
      <!-- Generic slide layout with text only -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">{title.split(' ')[0]}</div>
        <div class="text-sm font-medium text-white">{title}</div>
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