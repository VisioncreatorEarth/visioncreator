<script lang="ts">
  import { onMount } from 'svelte';
  
  let revealed = false;
  let questionRevealed = false;
  let ctaRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      setTimeout(() => {
        questionRevealed = true;
        
        setTimeout(() => {
          ctaRevealed = true;
        }, 800);
      }, 600);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-slate-900 to-slate-950">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Header -->
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="text-yellow-400 text-xl mb-3">JOIN US</div>
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
        The <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Decision</span> is Yours
      </h2>
    </div>
    
    <!-- Questions Section -->
    <div class="max-w-4xl mx-auto mb-12 transform transition-all duration-700 delay-300 {questionRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="p-8 rounded-xl bg-gradient-to-br from-amber-900/20 to-slate-900/30 border border-amber-700/30">
        <div class="space-y-6">
          <div class="flex items-start">
            <div class="text-amber-400 text-2xl mr-3">?</div>
            <p class="text-xl text-gray-200">
              Are you ready to stop building for others and start building for yourself?
            </p>
          </div>
          
          <div class="flex items-start">
            <div class="text-amber-400 text-2xl mr-3">?</div>
            <p class="text-xl text-gray-200">
              Do you want to join a vibrant community that creates remarkable ventures while staying true to its core values?
            </p>
          </div>
          
          <div class="flex justify-center mt-8">
            <div class="px-6 py-4 bg-amber-500/20 rounded-lg border border-amber-400/30">
              <p class="text-2xl text-amber-300 font-bold">"Absolutely!"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA Section -->
    <div class="transform transition-all duration-700 delay-600 {ctaRevealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="text-center">
        <p class="text-2xl text-gray-300 mb-8">
          Then join VisionCreator today by booking your personal 1:1 call!
        </p>
        
        <div class="flex flex-col sm:flex-row gap-6 justify-center">
          <a 
            href="#book-call" 
            class="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold rounded-xl shadow-lg hover:shadow-amber-500/30 transition-all hover:translate-y-[-2px] text-lg"
          >
            Book Your 1:1 Call
          </a>
          
          <a 
            href="#learn-more" 
            class="px-8 py-4 bg-slate-800 border border-amber-500/30 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all text-lg"
          >
            Learn More
          </a>
        </div>
        
        <div class="mt-12 flex justify-center">
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p class="text-gray-300">Your future self will thank you for taking this step.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style> 