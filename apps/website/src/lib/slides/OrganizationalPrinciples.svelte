<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let principlesRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      setTimeout(() => {
        principlesRevealed = true;
      }, 600);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Main heading -->
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <h2 class="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
        THE STRUCTURE
      </h2>
      <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
        Visioncreator Organizational Principles
      </p>
    </div>
    
    <!-- Principles content -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <!-- Collaborative Work Structure -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg border border-slate-700 transform transition-all duration-700 {principlesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 100ms;">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-blue-400">Collaborative Work</h3>
        </div>
        <div class="pl-14">
          <p class="text-gray-300 mb-2">
            Teams form organically around projects based on interest and skills, not rigid hierarchies.
          </p>
          <p class="text-gray-400 text-sm">
            Members can contribute to multiple projects simultaneously, allowing for cross-pollination of ideas and skills.
          </p>
        </div>
      </div>
      
      <!-- Collective Ownership -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg border border-slate-700 transform transition-all duration-700 {principlesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 200ms;">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-green-400">Collective Ownership</h3>
        </div>
        <div class="pl-14">
          <p class="text-gray-300 mb-2">
            All members share ownership of the organization and its outputs.
          </p>
          <p class="text-gray-400 text-sm">
            Revenue is distributed based on contribution, ensuring that value created flows back to those who created it.
          </p>
        </div>
      </div>
      
      <!-- Democratic Decision-Making -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg border border-slate-700 transform transition-all duration-700 {principlesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 300ms;">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-amber-400">Democratic Governance</h3>
        </div>
        <div class="pl-14">
          <p class="text-gray-300 mb-2">
            Decisions are made collectively but with respect for individual autonomy.
          </p>
          <p class="text-gray-400 text-sm">
            Voting power is weighted by contribution, ensuring those most invested have appropriate influence.
          </p>
        </div>
      </div>
      
      <!-- Self-Determination -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg border border-slate-700 transform transition-all duration-700 {principlesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 400ms;">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-purple-400">Self-Determination</h3>
        </div>
        <div class="pl-14">
          <p class="text-gray-300 mb-2">
            Members choose their level of involvement and which projects to work on.
          </p>
          <p class="text-gray-400 text-sm">
            Individual goals align with collective vision through shared values and transparent communication.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Bottom tagline -->
    <div class="text-center mt-10 transform transition-all duration-700 {principlesRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}" style="transition-delay: 500ms;">
      <p class="text-xl text-indigo-300 font-medium">
        The goal: Alignment with inner strength and vision for all members
      </p>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 