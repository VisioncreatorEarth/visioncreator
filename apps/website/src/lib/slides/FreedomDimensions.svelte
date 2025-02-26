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
      }, 3000);
      
      return () => clearInterval(interval);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-blue-300 mb-2">Our vision for creative work</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
        The Five Dimensions of Freedom
      </h2>
    </div>
    
    <div class="bg-gradient-to-b from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <!-- Time Freedom -->
        <div class="bg-slate-900/50 rounded-lg border transition-all duration-500 {activeIndex === 0 ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-700/30'} transform transition-all duration-300 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 400ms;">
          <div class="p-4 border-b border-slate-700/50 bg-red-900/10">
            <div class="flex items-center gap-3 text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium">Problem</h3>
            </div>
            <p class="text-slate-300 text-xs">Fixed schedules dictated by employers</p>
          </div>
          
          <div class="p-4 bg-slate-900/70">
            <div class="flex items-center gap-3 text-blue-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium">Time Freedom</h3>
            </div>
            <p class="text-slate-300 text-xs">Work when your energy and creativity peak</p>
          </div>
        </div>
        
        <!-- Location Freedom -->
        <div class="bg-slate-900/50 rounded-lg border transition-all duration-500 {activeIndex === 1 ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-700/30'} transform transition-all duration-300 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 600ms;">
          <div class="p-4 border-b border-slate-700/50 bg-red-900/10">
            <div class="flex items-center gap-3 text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium">Problem</h3>
            </div>
            <p class="text-slate-300 text-xs">Forced to work where the company decides</p>
          </div>
          
          <div class="p-4 bg-slate-900/70">
            <div class="flex items-center gap-3 text-blue-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium">Location Freedom</h3>
            </div>
            <p class="text-slate-300 text-xs">Contribute from anywhere, live where you thrive</p>
          </div>
        </div>
        
        <!-- Contribution Freedom -->
        <div class="bg-slate-900/50 rounded-lg border transition-all duration-500 {activeIndex === 2 ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-700/30'} transform transition-all duration-300 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 800ms;">
          <div class="p-4 border-b border-slate-700/50 bg-red-900/10">
            <div class="flex items-center gap-3 text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 class="text-sm font-medium">Problem</h3>
            </div>
            <p class="text-slate-300 text-xs">Assigned tasks that don't leverage your strengths</p>
          </div>
          
          <div class="p-4 bg-slate-900/70">
            <div class="flex items-center gap-3 text-blue-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 class="text-sm font-medium">Contribution Freedom</h3>
            </div>
            <p class="text-slate-300 text-xs">Apply skills where they bring joy and purpose</p>
          </div>
        </div>
        
        <!-- Financial Freedom -->
        <div class="bg-slate-900/50 rounded-lg border transition-all duration-500 {activeIndex === 3 ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-700/30'} transform transition-all duration-300 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1000ms;">
          <div class="p-4 border-b border-slate-700/50 bg-red-900/10">
            <div class="flex items-center gap-3 text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium">Problem</h3>
            </div>
            <p class="text-slate-300 text-xs">Value of your work determined by others</p>
          </div>
          
          <div class="p-4 bg-slate-900/70">
            <div class="flex items-center gap-3 text-blue-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium">Financial Freedom</h3>
            </div>
            <p class="text-slate-300 text-xs">Build ownership that grows over time</p>
          </div>
        </div>
        
        <!-- Decision Freedom -->
        <div class="bg-slate-900/50 rounded-lg border transition-all duration-500 {activeIndex === 4 ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-700/30'} transform transition-all duration-300 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1200ms;">
          <div class="p-4 border-b border-slate-700/50 bg-red-900/10">
            <div class="flex items-center gap-3 text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <h3 class="text-sm font-medium">Problem</h3>
            </div>
            <p class="text-slate-300 text-xs">No input on strategic decisions affecting your work</p>
          </div>
          
          <div class="p-4 bg-slate-900/70">
            <div class="flex items-center gap-3 text-blue-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <h3 class="text-sm font-medium">Decision Freedom</h3>
            </div>
            <p class="text-slate-300 text-xs">Have a real voice in what gets built</p>
          </div>
        </div>
      </div>
      
      <div class="mt-6 text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 1400ms;">
        <p class="text-lg md:text-xl text-blue-300 font-medium">
          VisionCreator: True autonomy in every dimension
        </p>
      </div>
    </div>
  </div>
</div> 