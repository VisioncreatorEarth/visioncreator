<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
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
  
  // Logo image error handling
  let logoError = false;
  let logoSources = [
    '/logo/logo.png',
    '/images/visioncreator-logo.png',
    '/static/logo/logo.png',
    '/static/images/visioncreator-logo.png'
  ];
  let currentLogoSrc = logoSources[0];
  let logoIndex = 0;
  
  function handleImageError() {
    logoIndex++;
    if (logoIndex < logoSources.length) {
      currentLogoSrc = logoSources[logoIndex];
    } else {
      logoError = true;
      console.error('Failed to load logo from any of the expected locations');
    }
  }
  
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
  .logo-container {
    transition: transform 0.3s ease;
  }
  
  .logo-container:hover {
    transform: scale(1.05);
  }
  
  /* Custom colors based on logo */
  :root {
    --navy-blue: #0a192f;
    --teal: #64ffda;
    --gold: #f0b429;
  }
</style>

<header class="border-b border-gray-800/50 bg-[#0a192f] fixed w-full z-50 shadow-md shadow-[#64ffda]/10">
  <div class="container mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="relative flex items-center group">
      <!-- Logo Image -->
      <div class="logo-container mr-3 flex items-center">
        {#if !logoError}
          <img 
            src={currentLogoSrc} 
            alt="VisionCreator Logo" 
            class="h-9 w-9"
            on:error={handleImageError}
          />
        {:else}
          <!-- Fallback logo if image fails -->
          <div class="h-9 w-9 relative">
            <svg viewBox="0 0 200 200" width="36" height="36">
              <circle cx="100" cy="100" r="95" fill="#0a192f" stroke="#64ffda" stroke-width="2" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="#f0b429" stroke-width="1" stroke-dasharray="4,4" />
              <path d="M65,80 Q100,40 135,80 Q150,100 135,120 Q100,160 65,120 Q50,100 65,80 Z" fill="#163075" />
              <path d="M75,85 Q100,55 125,85 M85,140 Q100,120 115,140" stroke="white" fill="none" stroke-width="2" />
              <path d="M90,95 A5,8 0 1,0 90,110 Z M110,95 A5,8 0 1,0 110,110 Z" fill="white" />
              <path d="M130,80 L150,80 M130,90 L150,90 M130,100 L150,100 M130,110 L145,110" stroke="#f0b429" stroke-width="2" />
            </svg>
          </div>
        {/if}
      </div>
      
      <!-- Logo text -->
      <div class="text-2xl font-bold tracking-wide">
        <span class="text-white">Vision</span><span class="text-[#64ffda]">creator</span>
      </div>
    </a>
    
    <div class="flex items-center gap-4">
      <!-- Desktop Navigation -->
      <nav class="hidden md:flex gap-6">
        <a 
          href="/" 
          class="px-3 py-1.5 rounded-md transition-all duration-200 border-b-2 {isActive('/') ? 'text-white font-medium border-[#64ffda]' : 'border-transparent text-gray-300 hover:text-white hover:border-[#64ffda]/50'}"
        >
          Home
        </a>
        <a 
          href="/presentation" 
          class="px-3 py-1.5 rounded-md transition-all duration-200 border-b-2 {isActive('/presentation') ? 'text-white font-medium border-[#64ffda]' : 'border-transparent text-gray-300 hover:text-white hover:border-[#64ffda]/50'}"
        >
          Presentation
        </a>
        <a 
          href="/roadmap" 
          class="px-3 py-1.5 rounded-md transition-all duration-200 border-b-2 {isActive('/roadmap') ? 'text-white font-medium border-[#64ffda]' : 'border-transparent text-gray-300 hover:text-white hover:border-[#64ffda]/50'}"
        >
          Roadmap
        </a>
      </nav>
      
      <!-- Join Now Button -->
      <a 
        href="#join" 
        class="px-5 py-2 bg-gradient-to-r from-[#f0b429] to-[#64ffda] rounded-full text-[#0a192f] font-medium hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg shadow-[#64ffda]/20 border border-[#64ffda]/20"
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
    <div class="md:hidden border-t border-gray-800/50 bg-[#0a192f]">
      <nav class="container mx-auto py-4 px-4 flex flex-col gap-4">
        <a 
          href="/" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/') ? 'bg-[#0a192f]/50 text-white font-medium border-l-2 border-[#64ffda] pl-3' : 'text-gray-300 hover:text-white hover:bg-[#0a192f]/30'}"
        >
          Home
        </a>
        <a 
          href="/presentation" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/presentation') ? 'bg-[#0a192f]/50 text-white font-medium border-l-2 border-[#64ffda] pl-3' : 'text-gray-300 hover:text-white hover:bg-[#0a192f]/30'}"
        >
          Presentation
        </a>
        <a 
          href="/roadmap" 
          on:click={closeMenu}
          class="px-4 py-2 rounded-md transition-all {isActive('/roadmap') ? 'bg-[#0a192f]/50 text-white font-medium border-l-2 border-[#64ffda] pl-3' : 'text-gray-300 hover:text-white hover:bg-[#0a192f]/30'}"
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