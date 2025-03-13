<script>
  // EmployeeChoice.svelte - The Employee option in our work choices
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
    <div class="text-center mb-8 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-xl md:text-2xl text-red-300 mb-4">What does it mean to be an</p>
      <h2 class="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">
        Employee
      </h2>
    </div>
    
    <div class="max-w-3xl mx-auto bg-gradient-to-b from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-xl p-8 border border-red-500/30 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">      
      <div class="space-y-6 mt-4">
        <div class="bg-slate-900/50 p-5 rounded-lg border border-red-500/20 flex items-start">
          <span class="text-red-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Work on <span class="text-red-300 font-medium">someone else's vision</span>, not realizing your own potential</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-red-500/20 flex items-start">
          <span class="text-red-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">No <span class="text-red-300 font-medium">ownership</span> of what you create</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-red-500/20 flex items-start">
          <span class="text-red-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Limited <span class="text-red-300 font-medium">income ceiling</span> while creating value for shareholders</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-red-500/20 flex items-start">
          <span class="text-red-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Illusion of <span class="text-red-300 font-medium">security</span> that can disappear overnight</p>
        </div>
        
        <div class="bg-slate-900/50 p-5 rounded-lg border border-red-500/20 flex items-start">
          <span class="text-red-400 text-2xl mr-4 mt-1">→</span>
          <p class="text-slate-200 text-xl">Sacrifice of <span class="text-red-300 font-medium">time</span> and <span class="text-red-300 font-medium">autonomy</span> for predictability</p>
        </div>
      </div>
    </div>
    
    <div class="text-center mt-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}" style="transition-delay: 900ms;">
      <p class="text-xl text-slate-300">
        Is this really what you <span class="text-red-300 font-medium">chose</span>? Or was it just the <span class="text-red-300 font-medium">safer option</span>?
      </p>
    </div>
  </div>
</div> 