<script>
  // Title Slide
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
    
    <!-- Main Title with spotlight effect -->
    <div class="relative py-12">
      <h1 class="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text">
        <span class="block mb-2 tracking-wider">Freedom to Create,</span>
        <span class="block tracking-wider">Right to Own</span>
      </h1>
      
      <!-- Decorative elements -->
      <div class="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-yellow-400/50 -translate-x-4 -translate-y-4"></div>
      <div class="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-cyan-400/50 translate-x-4 translate-y-4"></div>
    </div>
    
    <!-- Tagline -->
    <p class="text-xl text-cyan-100/80 mt-6 max-w-lg mx-auto">
      A new way of work
    </p>
  </div>
</div>

<style>
  h1 {
    line-height: 1.2;
    text-shadow: 0 0 40px rgba(56, 189, 248, 0.2);
  }
</style> 