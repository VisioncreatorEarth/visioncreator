<script lang="ts">
  import { page } from '$app/stores';
  
  // Function to determine if a link is active
  function isActive(path: string): boolean {
    if (path === '/' && $page.url.pathname === '/') {
      return true;
    }
    if (path !== '/' && $page.url.pathname.includes(path)) {
      return true;
    }
    return false;
  }
  
  // Mobile menu state
  let menuOpen = false;
  
  // Toggle mobile menu
  function toggleMenu() {
    menuOpen = !menuOpen;
  }
  
  // Close menu when navigating
  function closeMenu() {
    menuOpen = false;
  }
</script>

<style>
  /* Logo hover animation */
  @keyframes pulse-glow {
    0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
    100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
  }
  
  .group:hover .logo-pulse {
    animation: pulse-glow 2s infinite;
  }
  
  /* Sparkle animation */
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(45deg); }
  }
  
  .sparkle {
    animation: sparkle 2s ease-in-out infinite;
  }
</style>

<header class="border-b border-gray-800/50 bg-gradient-to-r from-black to-gray-900/90 backdrop-blur-lg fixed w-full z-50 shadow-md shadow-emerald-900/10">
  <div class="container mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="relative flex items-center group">
      <!-- Updated Logo mark -->
      <div class="mr-1.5 w-7 h-7 relative logo-pulse">
        <div class="absolute inset-0 bg-gradient-to-br from-yellow-400 to-emerald-500 rounded-sm rotate-45 transform group-hover:scale-110 transition-all duration-300"></div>
        <div class="absolute inset-0.5 bg-black rounded-sm rotate-45"></div>
        <!-- Turquoise accent element -->
        <div class="absolute top-1 left-2.5 w-2 h-4 bg-gradient-to-b from-teal-400 to-teal-500 transform rotate-12"></div>
        
        <!-- Sparkle element -->
        <div class="absolute -top-1 -right-1 w-2 h-2 sparkle">
          <div class="absolute inset-0 bg-teal-300 rotate-45"></div>
          <div class="absolute inset-0 bg-teal-300 rotate-90"></div>
        </div>
      </div>
      
      <!-- Logo text with new color scheme -->
      <div class="text-2xl font-extrabold tracking-wide">
        <span class="bg-gradient-to-r from-yellow-400 via-green-400 to-teal-400 bg-clip-text text-transparent transition-all duration-300">Vision</span><span class="text-teal-400 group-hover:text-teal-300 transition-colors duration-300">creator</span>
      </div>
    </a>
    
    <div class="flex items-center gap-4">
      <!-- Desktop Navigation -->
      <nav class="hidden md:flex gap-6">
        <a 
          href="/" 
          class="px-3 py-1 rounded-md transition-all duration-200 border-b-2 {isActive('/') ? 'text-white font-medium border-teal-400' : 'border-transparent text-gray-300 hover:text-white hover:border-teal-400/50'}"
        >
          Home
        </a>
        <a 
          href="/presentation" 
          class="px-3 py-1 rounded-md transition-all duration-200 border-b-2 {isActive('/presentation') ? 'text-white font-medium border-teal-400' : 'border-transparent text-gray-300 hover:text-white hover:border-teal-400/50'}"
        >
          Presentation
        </a>
        <a 
          href="/roadmap" 
          class="px-3 py-1 rounded-md transition-all duration-200 border-b-2 {isActive('/roadmap') ? 'text-white font-medium border-teal-400' : 'border-transparent text-gray-300 hover:text-white hover:border-teal-400/50'}"
        >
          Roadmap
        </a>
      </nav>
      
      <!-- Join Now Button -->
      <a 
        href="#join" 
        class="px-5 py-2 bg-gradient-to-r from-yellow-400 via-green-500 to-teal-500 rounded-full text-white font-medium hover:from-yellow-300 hover:via-green-400 hover:to-teal-400 transition-all duration-300 hover:scale-105 shadow-lg shadow-teal-700/30 border border-teal-400/20"
      >
        Join Now
      </a>
      
      <!-- Mobile menu button -->
      <button 
        class="md:hidden w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white"
        on:click={toggleMenu}
        aria-label="Toggle menu"
      >
        {#if menuOpen}
          <!-- X icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        {:else}
          <!-- Hamburger icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
  
  <!-- Mobile Navigation -->
  {#if menuOpen}
    <div class="md:hidden border-t border-gray-800/50 bg-gradient-to-b from-gray-900 to-black/95 backdrop-blur-lg">
      <nav class="container mx-auto py-4 px-4 flex flex-col gap-4">
        <a 
          href="/" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/') ? 'bg-gradient-to-r from-teal-900/30 to-emerald-900/30 text-white font-medium border-l-2 border-teal-400 pl-3' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'}"
        >
          Home
        </a>
        <a 
          href="/presentation" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/presentation') ? 'bg-gradient-to-r from-teal-900/30 to-emerald-900/30 text-white font-medium border-l-2 border-teal-400 pl-3' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'}"
        >
          Presentation
        </a>
        <a 
          href="/roadmap" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/roadmap') ? 'bg-gradient-to-r from-teal-900/30 to-emerald-900/30 text-white font-medium border-l-2 border-teal-400 pl-3' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'}"
        >
          Roadmap
        </a>
      </nav>
    </div>
  {/if}
</header>

<!-- Simplified overlay -->
{#if menuOpen}
  <div 
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
    on:click={closeMenu}
  ></div>
{/if} 