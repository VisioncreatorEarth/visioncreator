<div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
  <div class="text-center space-y-8">
    <h1 class="text-6xl font-bold text-white mb-4">
      Welcome to Counter
    </h1>
    
    <div class="bg-white/20 backdrop-blur-lg rounded-2xl p-12 shadow-xl">
      <p class="text-8xl font-bold text-white mb-8" id="counter">
        {count}
      </p>
      
      <div class="flex gap-4 justify-center">
        <button
          on:click={() => count -= 1}
          class="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-2xl transition-all duration-200 hover:scale-105"
        >
          -
        </button>
        <button
          on:click={() => count += 1}
          class="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-2xl transition-all duration-200 hover:scale-105"
        >
          +
        </button>
      </div>
    </div>
    
    <p class="text-white/60 text-lg">
      A simple counter with a beautiful design
    </p>
  </div>
</div>

<script>
  let count = 0;
</script>
