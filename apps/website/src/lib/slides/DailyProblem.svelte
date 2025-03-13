<script>
  // Daily Problem Slide - The emotional "why" to start with
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  let revealed = false;
  let problemsRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      setTimeout(() => {
        problemsRevealed = true;
      }, 1000);
    }, 300);
  });
</script>

<div class="h-full flex flex-col items-center justify-center p-6 md:p-12 text-white">
  <!-- Title section -->
  {#if revealed}
    <div 
      class="w-full text-center mb-8 md:mb-12" 
      in:fly={{ y: -20, duration: 600, delay: 200, easing: quintOut }}
    >
      <h1 class="text-3xl md:text-4xl font-bold mb-2">What's Wrong With Our Work?</h1>
      <p class="text-xl md:text-2xl text-red-300 font-light">The daily struggle we rarely talk about</p>
    </div>
  {/if}

  <!-- Problems section -->
  {#if problemsRevealed}
    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
      <!-- Problem 1 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-6 shadow-lg border-l-4 border-red-500"
        in:fly={{ x: -20, duration: 600, delay: 100, easing: quintOut }}
      >
        <h3 class="text-xl font-bold mb-3 text-red-400">Time Imprisonment</h3>
        <p class="text-gray-300">
          <span class="block mb-2">The 9-to-5 schedule controls your life, dictating when to wake up, when to eat, and even when you can see your family.</span>
          <span class="block text-white font-medium">Your most productive hours are often wasted in meetings that could have been emails.</span>
        </p>
      </div>
      
      <!-- Problem 2 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-6 shadow-lg border-l-4 border-amber-500"
        in:fly={{ x: 20, duration: 600, delay: 200, easing: quintOut }}
      >
        <h3 class="text-xl font-bold mb-3 text-amber-400">Location Chains</h3>
        <p class="text-gray-300">
          <span class="block mb-2">Commuting steals 1-2 hours daily from your life, while being tied to expensive cities restricts your freedom to live where you truly want.</span>
          <span class="block text-white font-medium">Your environment dictates your lifestyle, not your choices.</span>
        </p>
      </div>
      
      <!-- Problem 3 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-6 shadow-lg border-l-4 border-purple-500"
        in:fly={{ x: -20, duration: 600, delay: 300, easing: quintOut }}
      >
        <h3 class="text-xl font-bold mb-3 text-purple-400">Devalued Contributions</h3>
        <p class="text-gray-300">
          <span class="block mb-2">Your work enriches others disproportionately. No matter how much value you create, your salary stays mostly the same.</span>
          <span class="block text-white font-medium">You're an expense on someone's balance sheet, not a valued partner.</span>
        </p>
      </div>
      
      <!-- Problem 4 -->
      <div 
        class="bg-gray-800/60 rounded-xl p-6 shadow-lg border-l-4 border-blue-500"
        in:fly={{ x: 20, duration: 600, delay: 400, easing: quintOut }}
      >
        <h3 class="text-xl font-bold mb-3 text-blue-400">Fragile Security</h3>
        <p class="text-gray-300">
          <span class="block mb-2">Your livelihood depends on a single income stream that can disappear with a single decision you don't control.</span>
          <span class="block text-white font-medium">The "security" of traditional employment is an illusion that crumbles with economic shifts.</span>
        </p>
      </div>
    </div>
  {/if}
  
  <!-- Bottom tagline -->
  {#if problemsRevealed}
    <div 
      class="mt-8 text-center max-w-2xl"
      in:fade={{ duration: 800, delay: 1000 }}
    >
      <p class="text-xl text-red-300 italic">
        "We've normalized a system that serves the organization first and the human second."
      </p>
    </div>
  {/if}
</div> 