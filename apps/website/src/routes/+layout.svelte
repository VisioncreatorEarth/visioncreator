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
	
	// Personal image handling
	let personalImageError = false;
	
	// Handle personal image error
	function handlePersonalImageError(event: Event) {
		personalImageError = true;
	}
	
	// Content visibility animation
	let storyVisible = false;
	
	onMount(() => {
		logoVisible = true;
		// Add staggered delays for animations
		setTimeout(() => { storyVisible = true; }, 800);
	});
</script>

<div class="min-h-screen bg-black text-white universe-bg">
	<!-- Visioncreator logo in top left corner has been removed -->

	<!-- Vision & Problem Section has been removed -->

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
	
	/* Animation classes */
	.section-container {
		opacity: 0;
		transform: translateY(20px);
		transition: all 1s cubic-bezier(0.215, 0.61, 0.355, 1);
	}
	
	.section-container.visible {
		opacity: 1;
		transform: translateY(0);
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
