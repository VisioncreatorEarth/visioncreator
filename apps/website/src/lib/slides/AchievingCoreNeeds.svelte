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
    <!-- Main heading -->
    <div class="text-center mb-12 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <p class="text-2xl md:text-3xl text-teal-300 mb-6">From theory to practice...</p>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400 mb-4">
        How are these needs achieved?
      </h2>
    </div>
    
    <!-- Needs and how to achieve them -->
    <div class="space-y-6">
      <!-- Belonging -->
      <div class="flex flex-col md:flex-row gap-4 items-center bg-gradient-to-r from-teal-900/20 to-transparent rounded-xl p-6 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 100ms;">
        <div class="md:w-1/4 shrink-0">
          <h3 class="text-2xl font-bold text-teal-300 text-center md:text-right">Belonging</h3>
        </div>
        <div class="md:w-3/4 bg-black/30 p-4 rounded-lg">
          <p class="text-slate-200">
            Being part of a group with shared values, feeling seen, welcomed, and respected.
            We create belonging through collaborative governance and shared ownership 
            where everyone's voice is valued. Community identity forms around shared goals
            and mutual support.
          </p>
        </div>
      </div>
      
      <!-- Autonomy -->
      <div class="flex flex-col md:flex-row gap-4 items-center bg-gradient-to-r from-green-900/20 to-transparent rounded-xl p-6 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 200ms;">
        <div class="md:w-1/4 shrink-0">
          <h3 class="text-2xl font-bold text-green-300 text-center md:text-right">Autonomy</h3>
        </div>
        <div class="md:w-3/4 bg-black/30 p-4 rounded-lg">
          <p class="text-slate-200">
            Freedom to follow your impulses and make your own choices without rigid restrictions.
            Autonomy is achieved when contribution levels are self-determined and work
            schedules are flexible. Each person decides how to contribute their unique talents
            based on their own priorities.
          </p>
        </div>
      </div>
      
      <!-- Agency -->
      <div class="flex flex-col md:flex-row gap-4 items-center bg-gradient-to-r from-teal-900/20 to-transparent rounded-xl p-6 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 300ms;">
        <div class="md:w-1/4 shrink-0">
          <h3 class="text-2xl font-bold text-teal-300 text-center md:text-right">Agency</h3>
        </div>
        <div class="md:w-3/4 bg-black/30 p-4 rounded-lg">
          <p class="text-slate-200">
            Having purpose, drive, creativity, and self-determination in your work.
            Agency is secured through our proposal system where anyone can initiate
            projects and influence the organization's direction. Your creative vision
            can become reality with community support.
          </p>
        </div>
      </div>
      
      <!-- Financial Security -->
      <div class="flex flex-col md:flex-row gap-4 items-center bg-gradient-to-r from-green-900/20 to-transparent rounded-xl p-6 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 400ms;">
        <div class="md:w-1/4 shrink-0">
          <h3 class="text-2xl font-bold text-green-300 text-center md:text-right">Financial Security</h3>
        </div>
        <div class="md:w-3/4 bg-black/30 p-4 rounded-lg">
          <p class="text-slate-200">
            Building projects that create sustainable value for ourselves and others.
            Our model provides financial security through shared ownership and 
            revenue distribution. As the community builds valuable products together,
            all members benefit from that collective success.
          </p>
        </div>
      </div>
      
      <!-- Inner Expression -->
      <div class="flex flex-col md:flex-row gap-4 items-center bg-gradient-to-r from-teal-900/20 to-transparent rounded-xl p-6 transform transition-all duration-700 {revealed ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}" style="transition-delay: 500ms;">
        <div class="md:w-1/4 shrink-0">
          <h3 class="text-2xl font-bold text-teal-300 text-center md:text-right">Inner Expression</h3>
        </div>
        <div class="md:w-3/4 bg-black/30 p-4 rounded-lg">
          <p class="text-slate-200">
            Aligning values, congruency, and inner knowledge with external work.
            Inner expression thrives when we can choose projects aligned with our values
            and strengths. Our flexible contribution system encourages each member to
            bring their authentic self to their work.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 