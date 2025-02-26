<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let activeIndex = -1;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      // Cycle through items
      const interval = setInterval(() => {
        activeIndex = (activeIndex + 1) % 5;
      }, 1500);
      
      return () => clearInterval(interval);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-4xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-16 text-center">
      Freedom in Multiple Dimensions
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      <div class="p-4 rounded-lg border transition-all duration-500 {revealed ? 'opacity-100' : 'opacity-0'} {activeIndex === 0 ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700/30'}">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">⏱️</span>
          <h3 class="text-lg font-medium text-slate-200">Time Freedom</h3>
        </div>
        <p class="text-slate-400 text-sm">Structure your days around your life, not vice versa</p>
      </div>
      
      <div class="p-4 rounded-lg border transition-all duration-500 {revealed ? 'opacity-100' : 'opacity-0'} {activeIndex === 1 ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700/30'}" style="transition-delay: 100ms;">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">💼</span>
          <h3 class="text-lg font-medium text-slate-200">Contribution Freedom</h3>
        </div>
        <p class="text-slate-400 text-sm">Apply your skills where they bring you joy</p>
      </div>
      
      <div class="p-4 rounded-lg border transition-all duration-500 {revealed ? 'opacity-100' : 'opacity-0'} {activeIndex === 2 ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700/30'}" style="transition-delay: 200ms;">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">💰</span>
          <h3 class="text-lg font-medium text-slate-200">Income Freedom</h3>
        </div>
        <p class="text-slate-400 text-sm">Build wealth through ownership, not just wages</p>
      </div>
      
      <div class="p-4 rounded-lg border transition-all duration-500 {revealed ? 'opacity-100' : 'opacity-0'} {activeIndex === 3 ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700/30'}" style="transition-delay: 300ms;">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">🗳️</span>
          <h3 class="text-lg font-medium text-slate-200">Decision Freedom</h3>
        </div>
        <p class="text-slate-400 text-sm">Vote on which projects receive funding</p>
      </div>
      
      <div class="p-4 rounded-lg border transition-all duration-500 {revealed ? 'opacity-100' : 'opacity-0'} {activeIndex === 4 ? 'border-cyan-500 bg-slate-800/50' : 'border-slate-700/30'}" style="transition-delay: 400ms;">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">🤝</span>
          <h3 class="text-lg font-medium text-slate-200">Association Freedom</h3>
        </div>
        <p class="text-slate-400 text-sm">Collaborate with those who inspire you</p>
      </div>
    </div>
    
    <div class="mt-12 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 600ms;">
      <p class="text-slate-300 text-lg">
        All forms of autonomy humans naturally seek<br>but traditional work denies
      </p>
    </div>
  </div>
</div> 