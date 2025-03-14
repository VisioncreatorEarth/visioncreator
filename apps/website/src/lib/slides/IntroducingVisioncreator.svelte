<script lang="ts">
  import { onMount } from 'svelte';
  
  let revealed = false;
  let introRevealed = false;
  let logoRevealed = false;
  let featuresRevealed = false;
  
  // Error handler for image
  function handleImageError(e: Event): void {
    const target = e.currentTarget as HTMLImageElement;
    target.classList.add('hidden');
    const prevElement = target.previousElementSibling;
    if (prevElement) {
      prevElement.classList.remove('opacity-0');
    }
  }
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      setTimeout(() => {
        introRevealed = true;
        
        setTimeout(() => {
          logoRevealed = true;
          
          setTimeout(() => {
            featuresRevealed = true;
          }, 800);
        }, 800);
      }, 600);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-slate-900 to-slate-950">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Header -->
    <div class="text-center mb-6 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="text-yellow-400 text-xl mb-3">INTRODUCING VISIONCREATOR</div>
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
        The <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400">Solution</span> You Need
      </h2>
    </div>
    
    <!-- Guide Introduction -->
    <div class="max-w-4xl mx-auto mb-8 transform transition-all duration-700 delay-300 {introRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="p-6 bg-gradient-to-br from-purple-900/20 to-slate-900/30 rounded-xl border border-purple-700/30">
        <div class="flex items-start">
          <div class="text-purple-400 text-4xl mr-4 leading-none">"</div>
          <div>
            <p class="text-xl text-gray-200 italic">
              Yes, it's real. Welcome to Vision Creator—the future of economic organizations.
            </p>
            <p class="text-right text-purple-400 mt-2">— The Guide</p>
          </div>
          <div class="text-purple-400 text-4xl ml-4 leading-none self-end">"</div>
        </div>
      </div>
    </div>
    
    <!-- Logo Section -->
    <div class="flex justify-center mb-10 transform transition-all duration-700 delay-600 {logoRevealed ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}">
      <div class="relative w-40 h-40 flex items-center justify-center">
        <!-- Fallback diamond logo -->
        <div class="absolute inset-0 opacity-0">
          <div class="w-full h-full flex items-center justify-center">
            <div class="w-32 h-32 relative transform rotate-45">
              <div class="absolute inset-0 bg-gradient-to-br from-green-400 to-yellow-400 rounded-sm shadow-lg shadow-green-500/20"></div>
              <div class="absolute top-3 right-3 w-6 h-6 bg-teal-400 rounded-sm transform -rotate-45"></div>
            </div>
          </div>
        </div>
        
        <!-- Primary logo image -->
        <img
          src="/logo/visioncreator-diamond-logo.png"
          alt="Visioncreator Logo"
          class="w-full h-full object-contain"
          on:error={handleImageError}
        />
        
        <!-- Glow effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 opacity-20 rounded-full blur-xl -z-10"></div>
      </div>
    </div>
    
    <!-- Features Section -->
    <div class="transform transition-all duration-700 delay-900 {featuresRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-purple-900/20 to-slate-900/30 p-5 rounded-xl border border-purple-700/30">
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white">Community Ownership</h3>
          </div>
          <p class="text-gray-300">
            Shared values, collective decisions, real belonging
          </p>
        </div>
        
        <div class="bg-gradient-to-br from-blue-900/20 to-slate-900/30 p-5 rounded-xl border border-blue-700/30">
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white">Self-Direction</h3>
          </div>
          <p class="text-gray-300">
            Freedom to pursue your vision and creativity
          </p>
        </div>
        
        <div class="bg-gradient-to-br from-teal-900/20 to-slate-900/30 p-5 rounded-xl border border-teal-700/30">
          <div class="flex items-center mb-3">
            <div class="w-10 h-10 rounded-full bg-teal-500/30 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white">Economic Freedom</h3>
          </div>
          <p class="text-gray-300">
            Real ownership with lasting financial value
          </p>
        </div>
      </div>
      
      <!-- Tagline -->
      <div class="mt-8 text-center">
        <p class="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 font-semibold">
          The future of economic organizations
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style> 