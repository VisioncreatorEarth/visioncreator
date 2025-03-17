<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	// Function to determine if a link is active
	function isActive(path: string): boolean {
		if (path === '/' && $page.url.pathname === '/') {
			return true;
		}
		if (path !== '/' && $page.url.pathname.includes(path)) {
			return true;
		}
		return false;
	}

	// Mobile menu state
	let menuOpen = false;

	// Logo image error handling
	let logoError = false;
	let logoSources = [
		'https://visioncreator.io/visioncreator.svg',
		'/logo/logo.png',
		'/images/visioncreator-logo.png',
		'/static/logo/logo.png',
		'/static/images/visioncreator-logo.png'
	];
	let currentLogoSrc = logoSources[0];
	let logoIndex = 0;

	function handleImageError() {
		logoIndex++;
		if (logoIndex < logoSources.length) {
			currentLogoSrc = logoSources[logoIndex];
		} else {
			logoError = true;
			console.error('Failed to load logo from any of the expected locations');
		}
	}

	// Toggle mobile menu
	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	// Close menu when navigating
	function closeMenu() {
		menuOpen = false;
	}

	// Animation for nav links
	let navReady = false;
	onMount(() => {
		// Wait a small delay before showing the animations
		setTimeout(() => {
			navReady = true;
		}, 100);
	});
</script>

<header class="nav-glass fixed z-50 w-full">
	<div class="container mx-auto flex items-center px-4 py-3">
		{#if navReady}
			<a href="/" class="group relative flex items-center mx-auto" in:fly={{ y: -20, duration: 400 }}>
				<!-- Logo Image -->
				<div class="logo-container mr-3 flex items-center">
					{#if !logoError}
						<img
							src={currentLogoSrc}
							alt="VisionCreator Logo"
							class="h-9 w-9"
							on:error={handleImageError}
						/>
					{:else}
						<!-- Fallback logo if image fails -->
						<div class="relative h-9 w-9">
							<svg viewBox="0 0 200 200" width="36" height="36">
								<circle
									cx="100"
									cy="100"
									r="95"
									fill="rgba(0,0,0,0.5)"
									stroke="#64ffda"
									stroke-width="2"
								/>
								<circle
									cx="100"
									cy="100"
									r="85"
									fill="none"
									stroke="#f0b429"
									stroke-width="1"
									stroke-dasharray="4,4"
								/>
								<path
									d="M65,80 Q100,40 135,80 Q150,100 135,120 Q100,160 65,120 Q50,100 65,80 Z"
									fill="rgba(22, 48, 117, 0.7)"
								/>
								<path
									d="M75,85 Q100,55 125,85 M85,140 Q100,120 115,140"
									stroke="white"
									fill="none"
									stroke-width="2"
								/>
								<path d="M90,95 A5,8 0 1,0 90,110 Z M110,95 A5,8 0 1,0 110,110 Z" fill="white" />
								<path
									d="M130,80 L150,80 M130,90 L150,90 M130,100 L150,100 M130,110 L145,110"
									stroke="#f0b429"
									stroke-width="2"
								/>
							</svg>
						</div>
					{/if}
				</div>

				<!-- Logo text -->
				<div class="text-2xl font-bold tracking-wide">
					<span class="text-white">Vision</span><span class="text-[#64ffda]">creator</span>
				</div>
			</a>
		{/if}
	</div>
</header>

<style>
	/* Logo hover animation */
	.logo-container {
		transition: transform 0.3s ease;
	}

	.logo-container:hover {
		transform: scale(1.05);
	}

	/* Custom colors based on logo */
	:root {
		--navy-blue: #0a192f;
		--teal: #64ffda;
		--gold: #f0b429;
	}

	/* Navigation link underline animation */
	.nav-link::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0;
		height: 2px;
		background: linear-gradient(90deg, #f0b429, #64ffda);
		transition: width 0.3s ease;
	}

	.nav-link:hover::after {
		width: 100%;
	}

	/* Glassmorphism effect for the navigation */
	.nav-glass {
		background: rgba(0, 0, 0, 0.75); /* Increased opacity for better visibility */
		backdrop-filter: blur(12px); /* Increased blur */
		-webkit-backdrop-filter: blur(12px); /* For Safari */
		border-bottom: 1px solid rgba(255, 255, 255, 0.15); /* Slightly more visible border */
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); /* Added subtle shadow */
	}

	/* Glow effect for active elements */
	.nav-active {
		text-shadow: 0 0 8px rgba(100, 255, 218, 0.6);
	}
</style>
