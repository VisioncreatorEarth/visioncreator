<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Avatar from '$lib/Avatar.svelte';
	
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
	let problemVisible = false;
	let communityVisible = false;
	
	// Community avatar seeds (for consistent generation)
	const communitySeeds = [
		'Alex', 'Maria', 'Jordan', 'Taylor', 
		'Robin', 'Casey', 'Jamie', 'Quinn',
		'Morgan', 'Avery', 'Riley', 'Skyler'
	];
	
	onMount(() => {
		logoVisible = true;
		// Add staggered delays for animations
		setTimeout(() => { storyVisible = true; }, 800);
		setTimeout(() => { problemVisible = true; }, 1200);
		setTimeout(() => { communityVisible = true; }, 1600);
	});
</script>

<div class="min-h-screen bg-black text-white universe-bg">
	<!-- Visioncreator logo in top left corner -->
	<div class="fixed top-4 left-4 z-50 flex items-center">
		<div class="logo-container mr-3 flex items-center">
			{#if !logoError}
				<img 
					src={currentLogoPath} 
					alt="Visioncreator Logo" 
					class="h-12 w-12 rounded-full object-contain" 
					on:error={handleLogoError}
				/>
			{:else}
				<div class="relative h-12 w-12">
					<svg viewBox="0 0 200 200" width="48" height="48">
						<circle
							cx="100"
							cy="100"
							r="95"
							fill="rgba(10,25,47,0.8)"
							stroke="#5078C8"
							stroke-width="2"
						/>
						<path
							d="M80,70 Q100,40 135,70 Q150,90 130,120 Q100,150 70,120 Q60,100 80,70"
							fill="white"
							stroke="none"
						/>
					</svg>
				</div>
			{/if}
		</div>
		
		<div class="text-2xl font-bold tracking-wide">
			<span class="text-white">Vision</span><span class="text-[#5078C8]">creator</span>
		</div>
	</div>

	<!-- Vision & Problem Section -->
	<section class="vision-section pt-28 pb-10 px-4 md:px-8 max-w-6xl mx-auto">
		<div class="section-container" class:visible={storyVisible}>
			<!-- Founders brief intro -->
			<div class="flex flex-col md:flex-row items-center mb-8 gap-6">
				<!-- Founder images - smaller size -->
				<div class="flex -space-x-2">
					<div class="w-16 h-16 rounded-full overflow-hidden border-2 border-[#5078C8] bg-gray-900 z-10">
						{#if !personalImageError}
							<img 
								src="/chielo_-43.JPG" 
								alt="Chielo" 
								class="w-full h-full object-cover"
								on:error={handlePersonalImageError}
							/>
						{:else}
							<div class="w-full h-full bg-gray-800 flex items-center justify-center text-white text-base font-bold">
								C
							</div>
						{/if}
					</div>
					<div class="w-16 h-16 rounded-full overflow-hidden border-2 border-[#5078C8] bg-gray-900">
						<div class="w-full h-full bg-gray-800 flex items-center justify-center text-white text-base font-bold">
							S
						</div>
					</div>
				</div>
				
				<div class="md:ml-4">
					<h2 class="text-2xl font-bold text-white">The Vision Behind Visioncreator</h2>
					<p class="text-gray-300 text-sm">Founded by Chielo & Sami</p>
				</div>
			</div>
			
			<!-- Personal message before the problem statement -->
			<div class="personal-message mb-10 text-center max-w-3xl mx-auto">
				<p class="text-lg text-gray-200 italic">
					"We've both spent years watching talented people pour their hearts into building companies, 
					only to walk away with nothing but a paycheck. Meanwhile, those who had money to invest 
					reaped the rewards. We knew there had to be a better way."
				</p>
				<div class="mt-2 text-[#5078C8] text-sm font-semibold">— Our Inspiration</div>
			</div>
			
			<!-- The Problem Statement - Emphasized -->
			<div class="problem-statement mb-12 p-6 bg-gradient-to-r from-gray-900/50 to-gray-900/30 border-l-4 border-[#5078C8] rounded-r-md" class:visible={problemVisible}>
				<h2 class="text-2xl font-bold mb-4 text-white">The Problem</h2>
				
				<div class="space-y-4">
					<div class="flex items-start">
						<div class="w-8 h-8 mr-4 bg-[#5078C8]/20 rounded-full flex items-center justify-center text-[#5078C8]">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
							</svg>
						</div>
						<p class="text-lg text-gray-200">
							<span class="font-bold text-white">Exclusive investment opportunities</span> - Regular people are shut out from investing in promising startups.
						</p>
					</div>
					
					<div class="flex items-start">
						<div class="w-8 h-8 mr-4 bg-[#5078C8]/20 rounded-full flex items-center justify-center text-[#5078C8]">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
							</svg>
						</div>
						<p class="text-lg text-gray-200">
							<span class="font-bold text-white">No ownership for contributors</span> - People who build and grow companies rarely own a piece of them.
						</p>
					</div>
					
					<div class="flex items-start">
						<div class="w-8 h-8 mr-4 bg-[#5078C8]/20 rounded-full flex items-center justify-center text-[#5078C8]">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
							</svg>
						</div>
						<p class="text-lg text-gray-200">
							<span class="font-bold text-white">Wealth concentration</span> - Only a handful of people benefit from everyone's collective effort.
						</p>
					</div>
				</div>
				
				<div class="mt-6 text-lg text-white">
					We believe rewards should be <span class="font-bold text-[#5078C8]">fair and distributed</span> to everyone who contributes to a company's success.
				</div>
			</div>
			
			<!-- Community of Believers -->
			<div class="community-section" class:visible={communityVisible}>
				<h3 class="text-xl font-bold mb-6 text-center text-white">Join Our Community of Believers</h3>
				
				<div class="flex flex-wrap justify-center gap-4 mb-8">
					<!-- Community faces using the Avatar component -->
					{#each communitySeeds.slice(0, 8) as seed, i}
						<div class="community-avatar" style="animation-delay: {i * 0.1}s">
							<Avatar {seed} size="52" />
						</div>
					{/each}
				</div>
				
				<p class="text-center text-gray-200 max-w-2xl mx-auto">
					People from all walks of life believe in our vision of a more inclusive, 
					fair startup ecosystem where everyone can participate and benefit.
				</p>
			</div>
		</div>
	</section>

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
	.section-container,
	.problem-statement,
	.community-section {
		opacity: 0;
		transform: translateY(20px);
		transition: all 1s cubic-bezier(0.215, 0.61, 0.355, 1);
	}
	
	.section-container.visible,
	.problem-statement.visible,
	.community-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	/* Community avatar animation */
	.community-avatar {
		opacity: 0;
		transform: scale(0.8);
		animation: pop-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
		animation-delay: var(--delay, 0s);
	}
	
	@keyframes pop-in {
		0% { 
			opacity: 0;
			transform: scale(0.8);
		}
		100% { 
			opacity: 1;
			transform: scale(1);
		}
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
