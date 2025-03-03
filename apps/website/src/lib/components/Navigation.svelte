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

<header class="border-b border-gray-800 bg-black/50 backdrop-blur-sm fixed w-full z-50">
  <div class="container mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="text-2xl font-bold text-rose-400 hover:text-rose-300 transition-all duration-200 transform hover:scale-105">
      VisionCreator
    </a>
    
    <div class="flex items-center gap-4">
      <!-- Desktop Navigation -->
      <nav class="hidden md:flex gap-6">
        <a 
          href="/" 
          class="px-3 py-1 rounded-md transition-all duration-200 border-b-2 {isActive('/') ? 'text-white font-medium border-rose-500' : 'border-transparent text-gray-300 hover:text-white hover:border-rose-500/50'}"
        >
          Home
        </a>
        <a 
          href="/presentation" 
          class="px-3 py-1 rounded-md transition-all duration-200 border-b-2 {isActive('/presentation') ? 'text-white font-medium border-rose-500' : 'border-transparent text-gray-300 hover:text-white hover:border-rose-500/50'}"
        >
          Presentation
        </a>
        <a 
          href="/roadmap" 
          class="px-3 py-1 rounded-md transition-all duration-200 border-b-2 {isActive('/roadmap') ? 'text-white font-medium border-rose-500' : 'border-transparent text-gray-300 hover:text-white hover:border-rose-500/50'}"
        >
          Roadmap
        </a>
      </nav>
      
      <!-- Join Now Button -->
      <a 
        href="#join" 
        class="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-md text-white font-medium hover:from-rose-400 hover:to-pink-500 transition-all duration-200 hover:scale-105 shadow-md shadow-rose-700/20"
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
    <div class="md:hidden border-t border-gray-800 bg-black/95">
      <nav class="container mx-auto py-4 px-4 flex flex-col gap-4">
        <a 
          href="/" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/') ? 'bg-rose-900/30 text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'}"
        >
          Home
        </a>
        <a 
          href="/presentation" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/presentation') ? 'bg-rose-900/30 text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'}"
        >
          Presentation
        </a>
        <a 
          href="/roadmap" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/roadmap') ? 'bg-rose-900/30 text-white font-medium' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'}"
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
    class="fixed inset-0 bg-black/40 z-40 md:hidden" 
    on:click={closeMenu}
  ></div>
{/if} 