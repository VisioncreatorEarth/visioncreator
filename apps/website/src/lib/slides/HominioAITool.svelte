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

<div class="slide-content flex h-full flex-col items-center justify-center p-8">
	<div class="mx-auto w-full max-w-5xl">
		<!-- Main heading -->
		<div
			class="mb-10 transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div class="mb-2 text-xl font-semibold uppercase text-teal-400">Our First Product</div>
			<h2
				class="mb-2 bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
			>
				Hominio AI
			</h2>
			<p class="text-2xl font-light text-slate-300">Creation Without Barriers</p>
		</div>

		<!-- Content with before/after comparison -->
		<div
			class="mb-8 grid grid-cols-1 gap-8 transition-all duration-1000 md:grid-cols-2 {contentRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-8 opacity-0'}"
		>
			<!-- Before - Technical Complexity -->
			<div
				class="rounded-xl border border-slate-700/20 bg-gradient-to-br from-slate-900/80 to-slate-800/20 p-6"
			>
				<div class="mb-4 text-center">
					<div
						class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30"
					>
						<span class="text-2xl">🛑</span>
					</div>
					<h3 class="text-xl font-bold text-red-400">Technical Barriers</h3>
				</div>

				<div
					class="max-h-32 overflow-auto rounded-md bg-slate-900/70 p-4 font-mono text-xs text-slate-400"
				>
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
			<div
				class="rounded-xl border border-teal-600/20 bg-gradient-to-br from-teal-900/30 to-black/20 p-6"
			>
				<div class="mb-4 text-center">
					<div
						class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-900/30"
					>
						<span class="text-2xl">🎤</span>
					</div>
					<h3 class="text-xl font-bold text-teal-400">Voice Commands</h3>
				</div>

				<div class="rounded-md bg-black/30 p-6 text-center">
					<span class="text-xl text-white">"Create a futuristic city with flying cars"</span>
					<div class="mt-4 flex justify-center">
						<span class="animate-bounce text-3xl">⬇️</span>
					</div>
					<div class="mt-4 rounded bg-teal-900/20 p-2">
						<span class="text-teal-300">AI generates image</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom tagline -->
		<div
			class="text-center transition-all delay-200 duration-1000 {contentRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-8 opacity-0'}"
		>
			<div
				class="inline-block rounded-full bg-gradient-to-r from-teal-900/40 to-green-900/40 px-6 py-3"
			>
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
