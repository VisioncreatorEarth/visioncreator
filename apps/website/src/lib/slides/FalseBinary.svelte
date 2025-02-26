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
  <div class="max-w-4xl w-full mx-auto">
    <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-10 text-center">
      Beyond the False Binary
    </h2>
    
    <div class="flex flex-col md:flex-row justify-between space-y-6 md:space-y-0 md:space-x-8 mt-8">
      <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 transform transition-all duration-700 basis-1/3 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
        <div class="text-center">
          <div class="mx-auto mb-6 w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center">
            <span class="text-3xl">👨‍💼</span>
          </div>
          <h3 class="text-xl font-semibold text-red-400 mb-2">Employee</h3>
          <p class="text-slate-300 text-sm">Security with dependency</p>
        </div>
      </div>
      
      <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 transform transition-all duration-700 basis-1/3 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 150ms;">
        <div class="text-center">
          <div class="mx-auto mb-6 w-16 h-16 rounded-full bg-blue-900/20 flex items-center justify-center">
            <span class="text-3xl">👑</span>
          </div>
          <h3 class="text-xl font-semibold text-blue-400 mb-2">Employer</h3>
          <p class="text-slate-300 text-sm">Control with overwhelming responsibility</p>
        </div>
      </div>
      
      <div class="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20 transform transition-all duration-700 basis-1/3 {revealed ? 'translate-y-0 opacity-100 scale-110' : 'translate-y-12 opacity-0 scale-100'}" style="transition-delay: 300ms;">
        <div class="text-center">
          <div class="mx-auto mb-6 w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center">
            <span class="text-3xl">✨</span>
          </div>
          <h3 class="text-xl font-semibold text-emerald-400 mb-2">Owner-Contributor</h3>
          <p class="text-slate-300 text-sm">Security without dependency</p>
        </div>
      </div>
    </div>
  </div>
</div> 