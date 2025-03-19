<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	// Logo image handling
	let logoError = false;
	let logoVisible = false;
	
	// Possible paths to check for the logo
	const logoPaths = [
		'/logo.png',
		'/static/logo.png',
		'/images/logo.png',
		'/static/images/logo.png',
		'/assets/logo.png'
	];
	
	let currentLogoPath = logoPaths[0];
	let logoIndex = 0;
	
	// Handle logo image error by trying the next path
	function handleLogoError() {
		logoIndex++;
		if (logoIndex < logoPaths.length) {
			currentLogoPath = logoPaths[logoIndex];
		} else {
			logoError = true;
		}
	}
	
	onMount(() => {
		logoVisible = true;
	});
</script>

<div class="min-h-screen bg-black text-white universe-bg">
	<!-- Simple Visioncreator logo in top left corner -->
	<div class="fixed top-4 left-4 z-50 flex items-center">
		<div class="logo-container mr-3 flex items-center">
			{#if !logoError}
				<!-- Try to use the actual logo image -->
				<img 
					src={currentLogoPath} 
					alt="Visioncreator Logo" 
					class="h-12 w-12 rounded-full object-contain" 
					on:error={handleLogoError}
				/>
			{:else}
				<!-- Fallback to SVG if all image paths fail -->
				<div class="relative h-12 w-12">
					<svg viewBox="0 0 200 200" width="48" height="48">
						<circle
							cx="100"
							cy="100"
							r="95"
							fill="rgba(10,25,47,0.8)"
							stroke="#64ffda"
							stroke-width="2"
						/>
						<!-- Simple face profile as placeholder -->
						<path
							d="M80,70 Q100,40 135,70 Q150,90 130,120 Q100,150 70,120 Q60,100 80,70"
							fill="white"
							stroke="none"
						/>
					</svg>
				</div>
			{/if}
		</div>
		
		<!-- Logo text -->
		<div class="text-2xl font-bold tracking-wide">
			<span class="text-white">Vision</span><span class="text-[#64ffda]">creator</span>
		</div>
	</div>

	<div class="pt-0">
		<slot />
	</div>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		overflow-y: auto;
		background-color: black;
	}
	
	/* Logo container with subtle hover effect */
	.logo-container {
		transition: transform 0.3s ease;
	}
	
	.logo-container:hover {
		transform: scale(1.05);
	}
	
	/* Universe background with stars */
	.universe-bg {
		position: relative;
		background-color: #000;
		background-image: 
			radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(1.5px 1.5px at 90px 40px, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(1.5px 1.5px at 160px 120px, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0));
		background-repeat: repeat;
		background-size: 250px 250px;
		z-index: 0; /* Ensure proper stacking with other elements */
	}
</style>
