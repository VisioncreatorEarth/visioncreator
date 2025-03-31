<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	// Animation states
	let logoVisible = false;
	let navVisible = false;
	
	onMount(() => {
		logoVisible = true;
		navVisible = true;
	});
</script>

<div class="min-h-screen bg-black text-white universe-bg">
	<header class="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300 backdrop-blur-md bg-black/30">
		<nav class="flex justify-between items-center max-w-7xl mx-auto">
			<div class="logo-container" class:visible={logoVisible}>
				<a href="/" class="flex items-center">
					<span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Hominio</span>
				</a>
			</div>
			
			<div class="nav-links" class:visible={navVisible}>
				<a href="#features" class="nav-link">Features</a>
				<a href="#how-it-works" class="nav-link">How It Works</a>
				<a href="#marketplace" class="nav-link">Marketplace</a>
				<a href="#join" class="nav-link cta">Join Waitlist</a>
			</div>
		</nav>
	</header>

	<div class="pt-20">
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
		font-family: 'Inter', sans-serif;
	}
	
	/* Logo container with subtle hover effect */
	.logo-container {
		opacity: 0;
		transform: translateY(-10px);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	
	.logo-container.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.logo-container:hover {
		transform: scale(1.05);
	}
	
	/* Nav links */
	.nav-links {
		display: flex;
		gap: 2rem;
		align-items: center;
		opacity: 0;
		transform: translateY(-10px);
		transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
	}
	
	.nav-links.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.nav-link {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-size: 1rem;
		font-weight: 500;
		padding: 0.5rem;
		transition: color 0.3s ease, transform 0.3s ease;
		position: relative;
	}
	
	.nav-link:hover {
		color: white;
		transform: translateY(-2px);
	}
	
	.nav-link::after {
		content: '';
		position: absolute;
		width: 0;
		height: 2px;
		bottom: 0;
		left: 50%;
		background: linear-gradient(90deg, #3B82F6, #8B5CF6);
		transition: width 0.3s ease, left 0.3s ease;
	}
	
	.nav-link:hover::after {
		width: 100%;
		left: 0;
	}
	
	.nav-link.cta {
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: white;
		padding: 0.5rem 1.25rem;
		border-radius: 8px;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}
	
	.nav-link.cta:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
	}
	
	.nav-link.cta::after {
		display: none;
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
		z-index: 0;
	}
	
	/* Media queries */
	@media (max-width: 768px) {
		.nav-links {
			gap: 1rem;
		}
		
		.nav-link {
			font-size: 0.9rem;
			padding: 0.4rem;
		}
		
		.nav-link.cta {
			padding: 0.4rem 1rem;
		}
	}
	
	@media (max-width: 640px) {
		.nav-links {
			display: none;
		}
	}
</style>
