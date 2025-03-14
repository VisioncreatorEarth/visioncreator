<script>
  import { onMount } from 'svelte';
  
  let revealed = false;
  let contentRevealed = false;
  
  onMount(() => {
    setTimeout(() => {
      revealed = true;
      
      setTimeout(() => {
        contentRevealed = true;
      }, 600);
    }, 400);
  });
</script>

<div class="slide-content flex flex-col items-center justify-center h-full p-8">
  <div class="max-w-5xl w-full mx-auto">
    <!-- Main heading -->
    <div class="text-center mb-10 transform transition-all duration-700 {revealed ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}">
      <div class="text-xl text-teal-400 uppercase font-semibold mb-2">Our First Product</div>
      <h2 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400 mb-2">
        Hominio AI
      </h2>
      <p class="text-2xl text-slate-300 font-light">Creation Without Barriers</p>
    </div>
    
    <!-- Content with before/after comparison -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 transition-all duration-1000 {contentRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">
      <!-- Before - Technical Complexity -->
      <div class="bg-gradient-to-br from-slate-900/80 to-slate-800/20 rounded-xl p-6 border border-slate-700/20">
        <div class="text-center mb-4">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-red-900/30 rounded-full mb-3">
            <span class="text-2xl">🛑</span>
          </div>
          <h3 class="text-xl font-bold text-red-400">Technical Barriers</h3>
        </div>
        
        <div class="bg-slate-900/70 p-4 rounded-md font-mono text-xs text-slate-400 overflow-auto max-h-32">
          <pre>
model = load_model("stable-diffusion")
prompt = "A futuristic city with flying cars"
negative_prompt = "blurry, low quality"
guidance_scale = 7.5
num_inference_steps = 50
image = model.generate(
  prompt, 
  negative_prompt=negative_prompt,
  guidance_scale=guidance_scale,
  num_inference_steps=num_inference_steps
)
image.save("futuristic_city.png")
          </pre>
        </div>
      </div>
      
      <!-- After - Voice Commands -->
      <div class="bg-gradient-to-br from-teal-900/30 to-black/20 rounded-xl p-6 border border-teal-600/20">
        <div class="text-center mb-4">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-teal-900/30 rounded-full mb-3">
            <span class="text-2xl">🎤</span>
          </div>
          <h3 class="text-xl font-bold text-teal-400">Voice Commands</h3>
        </div>
        
        <div class="bg-black/30 p-6 rounded-md text-center">
          <span class="text-xl text-white">"Create a futuristic city with flying cars"</span>
          <div class="flex justify-center mt-4">
            <span class="text-3xl animate-bounce">⬇️</span>
          </div>
          <div class="mt-4 bg-teal-900/20 p-2 rounded">
            <span class="text-teal-300">AI generates image</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom tagline -->
    <div class="text-center transition-all duration-1000 delay-200 {contentRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">
      <div class="inline-block bg-gradient-to-r from-teal-900/40 to-green-900/40 px-6 py-3 rounded-full">
        <p class="text-lg text-teal-300">
          <span class="font-bold">Our first community-owned startup:</span> 
          <span class="text-white">Make AI creation accessible to everyone</span>
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  /* Add any slide-specific styles here */
</style> 