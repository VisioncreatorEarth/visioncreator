<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Main Content -->
    <div class="text-center transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-yellow-300 mb-6">Yes! The answer is...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 mb-8">
        Visioncreator
      </h2>
      
      <div class="relative mx-auto w-32 h-32 mb-12 transform transition-all duration-700 {revealed ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}" style="transition-delay: 300ms;">
        <!-- Stylized logo -->
        <div class="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl rotate-45 transform group-hover:scale-110 transition-all duration-300 shadow-lg shadow-amber-900/40"></div>
        <div class="absolute inset-2 bg-black rounded-lg rotate-45"></div>
        <div class="absolute top-3 left-[0.95rem] w-4 h-6 bg-gradient-to-b from-yellow-400 to-amber-500 transform rotate-45"></div>
        
        <!-- Glowing effect -->
        <div class="absolute inset-0 bg-yellow-500/20 rounded-xl rotate-45 animate-pulse"></div>
      </div>
      
      <div class="max-w-3xl mx-auto mt-12 bg-gradient-to-r from-amber-900/20 via-black/30 to-amber-900/20 p-6 rounded-xl backdrop-blur-sm transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">
        <p class="text-xl text-slate-300">
          A community-owned platform that combines the best elements of traditional organizations 
          and modern ownership structures. It's designed from the ground up to support human 
          flourishing through shared vision, ownership, and governance.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 