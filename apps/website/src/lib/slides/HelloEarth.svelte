<script>
  // A Better Solution Slide
  import { onMount } from 'svelte';
  
  let revealed = true; // Title visible immediately
  
  onMount(() => {
    // No delay needed
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-4">
  <div class="max-w-5xl w-full mx-auto text-center relative">
    <!-- Background visual elements -->
    <div class="absolute -z-10 w-full h-full flex justify-center items-center opacity-10">
      <div class="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-yellow-400 via-cyan-500 to-emerald-400 blur-3xl"></div>
    </div>
    
    <!-- Top Title -->
    <div class="relative mb-12">
      <h2 class="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600">
        Freedom to Create, Right to Own
      </h2>
    </div>
    
    <!-- Main Brand -->
    <div class="relative py-12">
      <h1 class="text-6xl sm:text-7xl font-extrabold bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 text-transparent bg-clip-text">
        VisionCreator
      </h1>
      
      <!-- Decorative elements -->
      <div class="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-purple-400/50 -translate-x-4 -translate-y-4"></div>
      <div class="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-indigo-400/50 translate-x-4 translate-y-4"></div>
    </div>
    
    <!-- Tagline -->
    <p class="text-xl text-slate-300/80 mt-10 max-w-lg mx-auto">
      A new way of work
    </p>
  </div>
</div>

<style>
  h1 {
    line-height: 1.2;
    text-shadow: 0 0 40px rgba(79, 70, 229, 0.2);
  }
</style> 