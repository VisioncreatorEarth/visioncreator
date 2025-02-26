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
  <div class="max-w-4xl w-full mx-auto text-center">
    <div class="relative">
      <!-- Background glow effects -->
      <div class="absolute -z-10 inset-0 flex justify-center items-center opacity-20">
        <div class="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-400 via-emerald-400 to-yellow-400 blur-3xl"></div>
      </div>
      
      <h2 class="text-4xl sm:text-5xl font-bold mb-10 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Reclaim Your Work,</span>
        <span class="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400 mt-2">Reclaim Your Life</span>
      </h2>
      
      <div class="max-w-2xl mx-auto transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
        <p class="text-xl text-slate-200 mb-8">
          Break free from the employer-employee relationship that constrains human potential.
        </p>
      </div>
      
      <div class="mt-10 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}" style="transition-delay: 400ms;">
        <a href="#join" class="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-xl inline-block hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300">
          Join the Revolution
        </a>
      </div>
      
      <div class="mt-12 flex flex-wrap justify-center gap-6 transform transition-all duration-1000 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 600ms;">
        <div class="flex items-center px-6 py-2 rounded-full bg-slate-800/50 border border-cyan-600/20">
          <span class="text-cyan-400 mr-2">→</span> Autonomy
        </div>
        <div class="flex items-center px-6 py-2 rounded-full bg-slate-800/50 border border-emerald-600/20">
          <span class="text-emerald-400 mr-2">→</span> Ownership
        </div>
        <div class="flex items-center px-6 py-2 rounded-full bg-slate-800/50 border border-yellow-600/20">
          <span class="text-yellow-400 mr-2">→</span> Community
        </div>
      </div>
    </div>
  </div>
</div> 