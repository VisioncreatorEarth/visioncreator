<script lang="ts">
	// Enhanced landing page for Visioncreator
	import { onMount } from 'svelte';

	// Stars animation
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const stars: {x: number, y: number, radius: number, speed: number, opacity: number, twinkleSpeed: number}[] = [];
	
	// Animation states
	let textVisible = false;
	let buttonsVisible = false;
	let titleVisible = false;
	let sectionsVisible = false;
	let cardsVisible = false;
	let investVisible = false;
	
	onMount(() => {
		// Only run on client
		if (typeof window !== 'undefined') {
			initCanvas();
			createStars();
			animateStars();
			
			// Resize handler
			const handleResize = () => {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				createStars();
			};
			
			window.addEventListener('resize', handleResize);
			
			// Staggered animations with fixed delays
			setTimeout(() => { titleVisible = true; }, 300);
			setTimeout(() => { textVisible = true; }, 1200);
			setTimeout(() => { buttonsVisible = true; }, 2000);
			setTimeout(() => { sectionsVisible = true; }, 2500);
			setTimeout(() => { cardsVisible = true; }, 3000);
			setTimeout(() => { investVisible = true; }, 3500);
			
			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}
	});
	
	function initCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx = canvas.getContext('2d')!;
	}
	
	function createStars() {
		stars.length = 0;
		const numStars = Math.floor((canvas.width * canvas.height) / 5000);
		
		for (let i = 0; i < numStars; i++) {
			stars.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				radius: Math.random() * 1.2,
				speed: Math.random() * 0.03,
				opacity: 0.05 + Math.random() * 0.5,
				twinkleSpeed: 0.001 + Math.random() * 0.01
			});
		}
	}
	
	function animateStars() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// Occasional shooting star
		if (Math.random() < 0.01) {
			createShootingStar();
		}
		
		for (let i = 0; i < stars.length; i++) {
			const star = stars[i];
			
			// Make stars twinkle with less intensity
			star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.005;
			star.opacity = Math.max(0.1, Math.min(0.6, star.opacity));
			
			// Draw star
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
			ctx.fill();
			
			// Move star
			star.y += star.speed;
			
			// Reset if it moves off the screen
			if (star.y > canvas.height) {
				star.y = 0;
				star.x = Math.random() * canvas.width;
			}
		}
		
		requestAnimationFrame(animateStars);
	}
	
	function createShootingStar() {
		const shootingStar = {
			x: Math.random() * canvas.width,
			y: 0,
			length: 80 + Math.random() * 50,
			speed: 10 + Math.random() * 10,
			angle: (Math.PI / 4) + (Math.random() * Math.PI / 4)
		};
		
		const animate = () => {
			// Clear the area where the shooting star was
			ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
			ctx.fillRect(
				shootingStar.x - shootingStar.length, 
				shootingStar.y - shootingStar.length, 
				shootingStar.length * 2, 
				shootingStar.length * 2
			);
			
			// Update position
			shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
			shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
			
			// Draw shooting star
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(shootingStar.x, shootingStar.y);
			ctx.lineTo(
				shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length,
				shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length
			);
			ctx.stroke();
			
			// Stop animation when off screen
			if (
				shootingStar.x > canvas.width ||
				shootingStar.x < 0 ||
				shootingStar.y > canvas.height
			) {
				return;
			}
			
			requestAnimationFrame(animate);
		};
		
		animate();
	}
</script>

<svelte:head>
	<title>Visioncreator | Own Your Future</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<style>
		/* Ensure global styles are applied */
		body {
			background-color: #000;
			color: #fff;
			font-family: 'Inter', sans-serif;
			line-height: 1.5;
			margin: 0;
			padding: 0;
			overflow-x: hidden;
		}
		
		@keyframes gradient {
			0% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
			100% { background-position: 0% 50%; }
		}
		
		@keyframes fadeUp {
			0% { 
				opacity: 0;
				transform: translateY(20px);
			}
			100% { 
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		@keyframes glow {
			0% { text-shadow: 0 0 5px rgba(255,255,255,0.3); }
			50% { text-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.2); }
			100% { text-shadow: 0 0 5px rgba(255,255,255,0.3); }
		}
	</style>
</svelte:head>

<main class="landing-container">
	<canvas bind:this={canvas} class="stars-canvas"></canvas>
	
	<div class="ambient-light"></div>
	<div class="ambient-light-2"></div>
	
	<section class="hero">
		<div class="content">
			<!-- Removed logo-title from hero section as it's now in the header -->
			
			<p class="main-text" class:visible={textVisible}>
				Join us in building Hominio, the first community-built and owned startup, powered by Visioncreator
			</p>
			
			<div class="introducing" class:visible={textVisible}><span class="smaller-text">INTRODUCING</span> <span class="bigger-text">HOMINIO</span></div>
			
			<div class="cta-container" class:visible={buttonsVisible}>
				<a href="/hominio" class="button-primary">
					<span>Hominio</span>
					<div class="button-glow"></div>
				</a>
				<a href="/contribute" class="button-secondary">
					<span>Contribute</span>
					<div class="button-border"></div>
				</a>
				<a href="/invest" class="button-secondary">
					<span>Invest</span>
					<div class="button-border"></div>
				</a>
			</div>
				
			<div class="participate-section" class:visible={sectionsVisible}>
				<h2 class="section-title animate-fade-in">How to Participate</h2>
				
				<!-- Contribute section - simple sentence above Got an Idea -->
				<div class="contribute-intro animate-fade-in" style="animation-delay: 0.2s;">
					<p>Contribute your skills and ideas to shape the future of Visioncreator and Hominio.</p>
				</div>
				
				<!-- Step by step idea flow as seen in screenshots -->
				<div class="process-flow">
					<!-- Step 1: Got an Idea? Share It! -->
					<div class="process-card idea-card animate-fade-in" class:visible={cardsVisible} style="animation-delay: 0.4s;">
						<div class="card-header">
							<div class="icon-wrapper">
								<svg class="megaphone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M3 10.5V13.5M3 13.5H6M3 13.5L4.5 12M4.5 12L6 10.5M4.5 12L6.5 13.5M6.5 13.5L8 12M6.5 13.5H13" stroke="#5078C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</div>
							<h3 class="card-title">Got an Idea? Share It!</h3>
								</div>
						<div class="card-body">
							<p>Have an idea or a way to make something better? Post it on our idea board! Whether it's a new feature or a small tweak, this is your chance to shape Visioncreator.</p>
							
							<!-- Example idea cards as shown in screenshot - keeping only the first one -->
							<div class="idea-examples">
								<div class="idea-example-card">
									<div class="idea-user">
										<div class="user-avatar">JD</div>
										<span>John D.</span>
								</div>
								<h4>Improve Onboarding Flow</h4>
								<p>Create a more intuitive onboarding experience for new members with interactive tutorials.</p>
									<div class="vote-count">
										<span class="votes">12</span>
										<span class="votes-label">VOTES</span>
										<button class="vote-button">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 5L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
												<path d="M5 12L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
										</svg>
										Vote
									</button>
								</div>
							</div>
								</div>
									</div>
							</div>
							
					<!-- Step 2: Discuss and Vote -->
					<div class="process-card vote-card animate-fade-in" class:visible={cardsVisible} style="animation-delay: 0.6s;">
						<div class="card-header">
							<div class="icon-wrapper">
								<svg class="vote-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="12" cy="12" r="8" stroke="#5078C8" stroke-width="2"/>
									<path d="M12 8L12 16" stroke="#5078C8" stroke-width="2" stroke-linecap="round"/>
									<path d="M16 12L8 12" stroke="#5078C8" stroke-width="2" stroke-linecap="round"/>
									</svg>
								</div>
							<h3 class="card-title">Discuss and Vote</h3>
							</div>
						<div class="card-body">
							<p>Your idea kicks off a conversation. We discuss it together as a collective, share feedback, and then vote. Get enough votes, and your idea turns into a draft—ready to take the next step.</p>
							
							<div class="vote-visualization">
								<div class="users-voting">
									<div class="user-vote">
										<div class="user-avatar">
											<span class="vote-plus">+1</span>
								</div>
							</div>
									<div class="user-vote">
										<div class="user-avatar"></div>
										<span class="vote-plus">+1</span>
						</div>
									<div class="user-vote">
										<div class="user-avatar"></div>
										<span class="vote-plus">+1</span>
							</div>
									</div>
								<div class="vote-result">
									<div class="big-vote-count">
										<span>8</span>
										<div class="votes-label">VOTES</div>
									</div>
								</div>
									</div>
									</div>
								</div>
								
					<!-- Step 3: Combined Success Earns & Investment Split -->
					<div class="process-card combined-card animate-fade-in" class:visible={cardsVisible} style="animation-delay: 0.8s;">
						<div class="card-header">
							<div class="icon-wrapper">
								<svg class="reward-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="#5078C8" stroke-width="2"/>
									<path d="M12 15V22" stroke="#5078C8" stroke-width="2" stroke-linecap="round"/>
									<path d="M15 19H9" stroke="#5078C8" stroke-width="2" stroke-linecap="round"/>
									<path d="M15 12L9 8" stroke="#5078C8" stroke-width="2" stroke-linecap="round"/>
											</svg>
										</div>
							<h3 class="card-title">Success Earns You Rewards</h3>
									</div>
						<div class="card-body">
							<p>Take ownership of your idea by defining its scope and resources. Successful projects earn you both payment and ownership tokens.</p>
							
							<div class="rewards-section">
								<div class="budget-sliders">
									<div class="slider-group">
									<div class="slider-label">
										<span>Development Time</span>
										<span class="slider-value">2 weeks</span>
									</div>
									<div class="slider-track">
											<div class="slider-progress" style="width: 40%;">
												<div class="slider-handle"></div>
											</div>
									</div>
								</div>
								
									<div class="slider-group">
									<div class="slider-label">
										<span>Complexity</span>
										<span class="slider-value">Medium</span>
									</div>
									<div class="slider-track">
											<div class="slider-progress" style="width: 60%;">
												<div class="slider-handle"></div>
									</div>
								</div>
								</div>
							</div>
							
								<div class="budget-result">
								<div class="budget-amount">€1,500</div>
									<div class="budget-label">Estimated Budget</div>
							</div>
									</div>
								</div>
									</div>
								</div>
				
				<h2 class="section-title animate-fade-in" class:visible={investVisible} style="animation-delay: 1s;">How to Invest</h2>
				
				<div class="investment-container">
					<div class="invest-card animate-fade-in" class:visible={investVisible} style="animation-delay: 1.2s;">
						<div class="card-header animate-item">
							<div class="icon-wrapper pulse-icon">
								<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 5C7.58172 5 4 8.58172 4 13C4 17.4183 7.58172 21 12 21C16.4183 21 20 17.4183 20 13C20 8.58172 16.4183 5 12 5Z" stroke="#5078C8" stroke-width="2"/>
									<path d="M12 9V13L15 15" stroke="#5078C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M8 3L12 5L16 3" stroke="#5078C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</div>
							<h3 class="card-title">Real Equity Investment</h3>
									</div>
						<div class="card-body">
							<p class="animate-fade-up" style="animation-delay: 0.2s;">Invest in Hominio using our VCR tokens, which represent actual company shares and ownership rights. Your investment is secured on blockchain technology providing transparency, security, and verifiable ownership.</p>
							
							<div class="token-info animate-item" style="animation-delay: 0.3s;">
								<div class="token-icon">
									<span>VCR</span>
										</div>
								<div class="token-details">
									<div class="token-label">VCR Token</div>
									<div class="token-description">Real equity ownership in Hominio</div>
									</div>
									</div>
									
							<div class="investment-split-section animate-item" style="animation-delay: 0.4s;">
								<h4 class="animate-fade-up" style="animation-delay: 0.2s;">50/50 Investment Split</h4>
								<p class="animate-fade-up" style="animation-delay: 0.3s;">Every investment is distributed in a balanced way that ensures both community growth and platform sustainability:</p>
								
								<div class="split-visualization animate-fade-up" style="animation-delay: 0.4s;">
									<div class="split-chart">
										<div class="split-half community-half">
											<div class="split-label animate-pulse">50%</div>
											<div class="flow-arrow community-arrow"></div>
							</div>
										<div class="split-half platform-half">
											<div class="split-label animate-pulse">50%</div>
											<div class="flow-arrow platform-arrow"></div>
								</div>
								</div>
								
									<div class="split-destinations">
										<div class="destination community-pool animate-fade-up" style="animation-delay: 0.5s;">
											<div class="destination-icon animate-pulse">
												<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M17 20H7M17 20C18.1046 20 19 19.1046 19 18V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H6C4.89543 3 4 3.89543 4 5V18C4 19.1046 4.89543 20 6 20H7M17 20H7M9 16H10M9 13H10M9 10H10M14 16H15M14 13H15M14 10H15" stroke="#5078C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												</svg>
								</div>
											<h4>Community Pool</h4>
											<p>Funds community projects, rewards contributors, and supports the growth of Hominio ecosystem.</p>
											<div class="coin-animation community-coins"></div>
							</div>
							
										<div class="destination platform-team animate-fade-up" style="animation-delay: 0.7s;">
											<div class="destination-icon animate-pulse">
												<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M17 20H7V16.7C7 16.0717 7 15.7576 7.10897 15.5123C7.20487 15.2957 7.35993 15.1099 7.55245 14.9759C7.77045 14.824 8.07612 14.7575 8.68745 14.6243L9.21233 14.5139C11.37 14.0492 12.4489 13.8169 13.5202 13.9275C14.4593 14.0271 15.3788 14.3321 16.2144 14.823C16.5251 15.0021 16.828 15.2177 17.4338 15.6488C17.867 15.9651 18.0835 16.1232 18.2275 16.33C18.354 16.5127 18.4431 16.7194 18.4903 16.9376C18.5443 17.1871 18.5443 17.4539 18.5443 17.9874V20H17ZM17 20H21V16.5C21 16.0879 20.614 15.7018 20.0188 15.5442C18.4327 15.1036 16.9781 14.2498 15.8144 13.0862L15.6506 12.9223C15.3992 12.671 15.2735 12.5453 15.1925 12.3913C15.1386 12.2843 15.1034 12.1698 15.0881 12.0519C15.0667 11.8873 15.0901 11.7178 15.1369 11.3789C15.2572 10.5188 15.0586 9.64333 14.5842 8.9238L14.3841 8.6237C13.6252 7.4853 12.4842 6.70528 11.1751 6.40482C10.915 6.3479 10.7849 6.31944 10.6611 6.28117C10.5691 6.25259 10.4796 6.21793 10.3935 6.17746C10.2775 6.12455 10.1686 6.05432 9.95079 5.91385L9.75984 5.79155C9.07478 5.35452 8.27906 5.24389 7.5289 5.48723L6.83946 5.71484C6.3902 5.8481 6.16558 5.91474 5.96247 5.97056C5.69016 6.04501 5.42586 6.14646 5.17436 6.27351C4.98519 6.3708 4.80693 6.49399 4.45042 6.74036L3.36395 7.5C3.13469 7.66765 3.02006 7.75147 2.92893 7.84853C2.7649 8.02539 2.63976 8.23498 2.5584 8.46282C2.5 8.63342 2.5 8.82284 2.5 9.20168V20H6V13C6 12.4477 6.44771 12 7 12C7.55228 12 8 12.4477 8 13V14.9198M12 4.5C10.067 4.5 8.5 3.17392 8.5 1.5C8.5 3.17392 6.933 4.5 5 4.5C6.933 4.5 8.5 5.82608 8.5 7.5C8.5 5.82608 10.067 4.5 12 4.5Z" stroke="#5078C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
							</div>
											<h4>Platform Team</h4>
											<p>Ensures ongoing development, maintenance, and growth of the Hominio platform.</p>
											<!-- Removed coin animation -->
						</div>
								</div>
								</div>
								</div>
								
							<div class="token-benefits animate-item" style="animation-delay: 0.9s;">
								<div class="benefit animate-fade-up" style="animation-delay: 0.3s;">
									<div class="benefit-value">100%</div>
									<div class="benefit-label">Transparency</div>
										</div>
								<div class="benefit animate-fade-up" style="animation-delay: 0.4s;">
									<div class="benefit-value">Real</div>
									<div class="benefit-label">Ownership</div>
									</div>
								<div class="benefit animate-fade-up" style="animation-delay: 0.5s;">
									<div class="benefit-value">Community</div>
									<div class="benefit-label">Governance</div>
										</div>
									</div>
									
							<a href="/invest" class="invest-button animate-pulse">
								<span>Start Investing</span>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M3.33337 8H12.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M8.66663 4L12.6666 8L8.66663 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
							</a>
										</div>
									</div>
										</div>
									</div>
				</div>
			</section>
	</main>

<style>
	/* Canvas for stars */
	.stars-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		opacity: 0.6;
	}
	
	/* Ambient light effects - Updated with deeper blues */
	.ambient-light {
		position: fixed;
		top: 40%;
		right: -10%;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, rgba(70, 90, 150, 0.15) 0%, rgba(0, 0, 0, 0) 60%);
		z-index: 1;
		pointer-events: none;
		animation: pulse 8s ease-in-out infinite;
	}
	
	.ambient-light-2 {
		position: fixed;
		bottom: -50%;
		left: -10%;
		width: 80%;
		height: 80%;
		background: radial-gradient(circle, rgba(50, 70, 120, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
		z-index: 1;
		pointer-events: none;
		animation: pulse 12s ease-in-out infinite alternate;
	}
	
	@keyframes pulse {
		0% { opacity: 0.5; transform: scale(1); }
		50% { opacity: 0.7; transform: scale(1.05); }
		100% { opacity: 0.5; transform: scale(1); }
	}
	
	/* Main container */
	.landing-container {
		position: relative;
		width: 100%;
		min-height: 100vh;
		z-index: 2;
	}
	
	/* Hero section */
	.hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 7rem 3rem 5rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.content {
		max-width: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	/* Enlarged main text */
	.main-text {
		font-size: 2.5rem;
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 4rem;
		max-width: 900px;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) 0.3s;
		text-align: center;
		font-weight: 500;
	}
	
	.main-text.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.introducing {
		margin: 0 0 3rem;
		letter-spacing: 2px;
		background: linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(80, 120, 200, 0.8) 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: glow 4s ease-in-out infinite;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) 0.4s;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	.smaller-text {
		font-size: 2rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		letter-spacing: 3px;
	}
	
	.bigger-text {
		font-size: 5rem;
		font-weight: 800;
		letter-spacing: 4px;
		line-height: 1;
	}
	
	.introducing.visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* Button styling - Updated with deeper blues */
	.cta-container {
		display: flex;
		gap: 1.5rem;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) 0.5s;
		margin-bottom: 5rem;
	}
	
	.cta-container.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	/* Button styles */
	.button-primary,
	.button-secondary {
		padding: 0.9rem 2rem;
		border-radius: 2rem;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.4s ease;
		letter-spacing: 0.5px;
		position: relative;
		overflow: hidden;
		z-index: 1;
	}
	
	/* Primary button with glow effect */
	.button-primary {
		background: transparent;
		color: #000;
		border: none;
		position: relative;
	}

	.button-primary::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 2rem;
		z-index: -2;
	}
	
	.button-primary span {
		position: relative;
		z-index: 3;
	}
	
	.button-glow {
		position: absolute;
		top: -20%;
		left: -10%;
		width: 120%;
		height: 140%;
		background: radial-gradient(circle, rgba(80, 120, 200, 0.6) 0%, rgba(255,255,255,0) 70%);
		opacity: 0;
		transition: opacity 0.4s ease;
		z-index: -1;
		mix-blend-mode: overlay;
	}
	
	.button-primary:hover {
		transform: translateY(-3px) scale(1.02);
	}
	
	.button-primary:hover .button-glow {
		opacity: 0.8;
		animation: pulse 2s infinite;
	}
	
	/* Secondary button with animated border */
	.button-secondary {
		background: rgba(0, 0, 0, 0.3);
		color: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}
	
	.button-border {
		position: absolute;
		top: -2px;
		left: -2px;
		width: calc(100% + 4px);
		height: calc(100% + 4px);
		border-radius: 2rem;
		border: 1px solid rgba(255, 255, 255, 0);
		z-index: -1;
	}
	
	.button-secondary:hover {
		transform: translateY(-3px);
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(5px);
	}
	
	.button-secondary:hover .button-border {
		border-color: rgba(80, 120, 200, 0.6);
		animation: borderPulse 2s infinite;
	}
	
	@keyframes borderPulse {
		0% { border-color: rgba(80, 120, 200, 0.3); }
		50% { border-color: rgba(120, 160, 255, 0.8); }
		100% { border-color: rgba(80, 120, 200, 0.3); }
	}
	
	/* Participate Section */
	.participate-section {
		width: 100%;
		margin-top: 2rem;
		opacity: 0;
		transform: translateY(30px);
		transition: all 1s cubic-bezier(0.215, 0.61, 0.355, 1) 0.6s;
	}
	
	.participate-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.section-title {
		font-size: 1.75rem;
		font-weight: 500;
		margin-bottom: 3rem;
		color: rgba(255, 255, 255, 0.9);
		position: relative;
		text-align: center;
	}

	.section-title::after {
		content: '';
		position: absolute;
		bottom: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 2px;
		background: linear-gradient(to right, rgba(80, 120, 200, 0.8), rgba(50, 70, 120, 0));
	}
	
	/* Updated contribute intro with deeper blues */
	.contribute-intro {
		text-align: center;
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.85);
		margin-bottom: 2rem;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		background: rgba(50, 70, 120, 0.1);
		box-shadow: 0 0 15px rgba(70, 90, 150, 0.15);
	}
	
	/* Process flow layout */
	.process-flow {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		width: 100%;
		margin-bottom: 4rem;
	}
	
	/* Process card styling */
	.process-card {
		background: rgba(15, 20, 30, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 2rem;
		position: relative;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1);
	}
	
	.process-card.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.card-header {
		display: flex;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	
	.card-title {
		font-size: 1.4rem;
		margin: 0;
		font-weight: 500;
	}
	
	.card-body {
		color: rgba(255, 255, 255, 0.8);
	}
	
	/* Updated icon wrapper with deeper blues */
	.icon-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 50px;
		height: 50px;
		background: rgba(50, 70, 120, 0.2);
		border-radius: 50%;
		margin-right: 1rem;
		animation: pulse-subtle 3s infinite;
		box-shadow: 0 0 15px rgba(80, 120, 200, 0.3);
	}
	
	@keyframes pulse-subtle {
		0% { box-shadow: 0 0 15px rgba(80, 120, 200, 0.3); }
		50% { box-shadow: 0 0 25px rgba(100, 140, 220, 0.5); }
		100% { box-shadow: 0 0 15px rgba(80, 120, 200, 0.3); }
	}
	
	/* Updated pulse-icon animation with deeper blues */
	.pulse-icon {
		animation: pulse-glow 2s infinite;
	}
	
	@keyframes pulse-glow {
		0% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(80, 120, 200, 0.3)); }
		50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(100, 140, 220, 0.7)); }
		100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(80, 120, 200, 0.3)); }
	}
	
	/* Idea examples section */
	.idea-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}
	
	.idea-example-card {
		background: rgba(30, 40, 60, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1.2rem;
		transition: all 0.3s ease;
	}
	
	.idea-user {
		display: flex;
		align-items: center;
		margin-bottom: 0.8rem;
	}
	
	.user-avatar {
		width: 30px;
		height: 30px;
		background: rgba(80, 120, 200, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		margin-right: 0.5rem;
	}
	
	.idea-example-card h4 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		font-weight: 500;
	}
	
	.idea-example-card p {
		font-size: 0.85rem;
		margin: 0 0 1rem;
		opacity: 0.8;
	}
	
	.vote-count {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
	}
	
	.votes {
		font-weight: 600;
		font-size: 1.2rem;
	}
	
	.votes-label {
		font-size: 0.7rem;
		opacity: 0.7;
		margin-left: 0.3rem;
	}
	
	/* Updated idea card hover with deeper blues */
	.idea-example-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
		border-color: rgba(80, 120, 200, 0.3);
	}
	
	/* Updated vote button with deeper blues */
	.vote-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(70, 90, 150, 0.2);
		border: 1px solid rgba(80, 120, 200, 0.4);
		color: rgba(255, 255, 255, 0.9);
		padding: 0.5rem 0.9rem;
		border-radius: 20px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.vote-button:hover {
		background: rgba(80, 120, 200, 0.3);
		transform: translateY(-2px);
	}
	
	/* Vote visualization */
	.vote-visualization {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding: 1rem;
		background: rgba(20, 30, 50, 0.3);
		border-radius: 12px;
		position: relative;
	}
	
	/* Updated vote visualization with deeper blues */
	.vote-visualization::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at center, rgba(70, 90, 150, 0.1) 0%, rgba(0, 0, 0, 0) 70%);
		pointer-events: none;
	}
	
	.users-voting {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.user-vote {
		display: flex;
		align-items: center;
	}
	
	.vote-plus {
		background: rgba(70, 90, 150, 0.3);
		color: rgba(255, 255, 255, 0.9);
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		margin-left: 0.5rem;
	}
	
	.vote-result {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.big-vote-count {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 100px;
		background: rgba(70, 90, 150, 0.15);
		border: 2px solid rgba(80, 120, 200, 0.3);
		border-radius: 50%;
		position: relative;
	}
	
	/* Rewards section */
	.rewards-section {
		display: flex;
		flex-direction: column;
		margin-top: 2rem;
		gap: 1rem;
		animation: fadeIn 0.8s ease-out forwards;
	}
	
	.budget-sliders {
		width: 100%;
	}
	
	.slider-group {
		margin-bottom: 1.5rem;
		animation: fadeUp 0.8s ease-out forwards;
		animation-delay: calc(0.2s * var(--index, 1));
	}
	
	.slider-group:nth-child(1) {
		--index: 1;
	}
	
	.slider-group:nth-child(2) {
		--index: 2;
	}
	
	.slider-label {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}
	
	/* Slider value color updated */
	.slider-value {
		color: rgba(120, 160, 255, 0.9);
		font-weight: 500;
	}
	
	.slider-track {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		position: relative;
	}
	
	/* Updated slider progress with deeper blues */
	.slider-progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: rgba(80, 120, 200, 0.5);
		border-radius: 3px;
		transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	.slider-handle {
		width: 14px;
		height: 14px;
		background: white;
		border-radius: 50%;
		position: absolute;
		right: -7px;
		top: 50%;
		transform: translateY(-50%);
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
		transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	.budget-result {
		align-self: flex-start;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		margin-top: 1rem;
		animation: fadeUp 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
		animation-delay: 0.5s;
	}
	
	/* Updated budget amount with deeper blues */
	.budget-amount {
		font-size: 3rem;
		font-weight: 700;
		color: rgba(100, 140, 220, 0.9);
		margin-bottom: 0.3rem;
	}
	
	.budget-label {
		font-size: 0.9rem;
		opacity: 0.7;
	}
	
	/* Investment container */
	.investment-container {
		width: 100%;
	}
	
	.invest-card {
		background: rgba(15, 20, 30, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 2rem;
		position: relative;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1);
	}
	
	.invest-card.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.token-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1.5rem 0;
		padding: 1rem;
		background: rgba(30, 40, 60, 0.3);
		border-radius: 12px;
	}
	
	/* Token info styling with deeper blues */
	.token-icon {
		width: 3rem;
		height: 3rem;
		background: linear-gradient(135deg, rgba(80, 120, 200, 0.8), rgba(50, 70, 120, 0.8));
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		color: white;
		font-size: 1rem;
		box-shadow: 0 0 15px rgba(80, 120, 200, 0.5);
	}
	
	.token-details {
		display: flex;
		flex-direction: column;
	}
	
	.token-label {
		font-weight: 600;
		font-size: 1.1rem;
	}
	
	.token-description {
		font-size: 0.9rem;
		opacity: 0.8;
	}
	
	/* Investment split section */
	.investment-split-section {
		margin: 2rem 0;
	}
	
	.investment-split-section h4 {
		font-size: 1.2rem;
		margin-bottom: 1rem;
	}
	
	/* Split visualization */
	.split-visualization {
		margin: 1.5rem 0;
	}
	
	.split-chart {
		display: flex;
		height: 100px;
		margin-bottom: 1.5rem;
	}
	
	.split-half {
		width: 50%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}
	
	.community-half {
		background: linear-gradient(to right, rgba(70, 90, 150, 0.3), rgba(80, 120, 200, 0.5));
		border-radius: 12px 0 0 12px;
	}
	
	.platform-half {
		background: linear-gradient(to left, rgba(70, 90, 150, 0.3), rgba(80, 120, 200, 0.5));
		border-radius: 0 12px 12px 0;
	}
	
	.split-label {
		font-size: 1.8rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.9);
	}
	
	.flow-arrow {
		position: absolute;
		bottom: -20px;
		width: 30px;
		height: 30px;
		background: rgba(80, 120, 200, 0.6);
		clip-path: polygon(50% 100%, 0 0, 100% 0);
	}
	
	.community-arrow {
		left: 25%;
	}
	
	.platform-arrow {
		right: 25%;
	}
	
	.split-destinations {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 2rem;
	}
	
	.destination {
		background: rgba(20, 30, 50, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	
	.destination-icon {
		margin-bottom: 1rem;
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(50, 70, 120, 0.2);
		border-radius: 50%;
	}
	
	.destination h4 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}
	
	.destination p {
		font-size: 0.9rem;
		opacity: 0.8;
		margin: 0;
	}
	
	/* Token benefits */
	.token-benefits {
		display: flex;
		justify-content: space-between;
		margin: 2rem 0;
		gap: 1rem;
	}
	
	.benefit {
		flex: 1;
		background: rgba(20, 30, 50, 0.3);
		padding: 1.2rem;
		border-radius: 12px;
		text-align: center;
	}
	
	.benefit-value {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 0.3rem;
		color: rgba(120, 160, 255, 0.9);
	}
	
	.benefit-label {
		font-size: 0.85rem;
		opacity: 0.8;
	}
	
	/* Invest button */
	.invest-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		background: linear-gradient(90deg, rgba(80, 120, 200, 0.8), rgba(100, 140, 220, 0.6));
		color: white;
		padding: 1rem 2rem;
		border-radius: 2rem;
		font-weight: 500;
		font-size: 1.1rem;
		text-decoration: none;
		margin-top: 1rem;
		transition: all 0.3s ease;
	}
	
	.invest-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
	}
	
	/* Animation classes */
	@keyframes fadeIn {
		0% { opacity: 0; }
		100% { opacity: 1; }
	}
	
	.animate-fade-in {
		opacity: 0;
		animation: fadeIn 0.8s ease-out forwards;
	}
	
	@keyframes fadeUp {
		0% { 
			opacity: 0;
			transform: translateY(20px);
		}
		100% { 
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.animate-fade-up {
		opacity: 0;
		transform: translateY(20px);
		animation: fadeUp 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
	}
	
	.animate-pulse {
		animation: pulse 2s infinite;
	}
	
	.animate-item {
		opacity: 0;
		transform: translateY(10px);
		animation: fadeUp 0.5s ease forwards;
	}
	
	/* Ensure process cards and elements properly transition in */
	.process-card.visible {
		opacity: 1;
		transform: translateY(0);
		transition: all 0.6s cubic-bezier(0.215, 0.61, 0.355, 1);
	}
	
	.rewards-section, .budget-sliders, .budget-result {
		transition: all 0.5s ease-in-out;
		animation: fadeIn 1s ease-out forwards;
	}
	
	.slider-group {
		animation: fadeUp 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
		animation-delay: 0.2s;
	}
	
	.budget-result {
		animation: fadeUp 0.8s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
		animation-delay: 0.4s;
	}
	
	/* All animations with deeper blues */
	@keyframes glow {
		0% { text-shadow: 0 0 5px rgba(80, 120, 200, 0.3); }
		50% { text-shadow: 0 0 20px rgba(100, 140, 220, 0.5), 0 0 30px rgba(80, 120, 200, 0.2); }
		100% { text-shadow: 0 0 5px rgba(80, 120, 200, 0.3); }
	}
	
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	
	/* Mobile responsiveness */
	@media (max-width: 768px) {
		.hero {
			padding: 5rem 1.5rem 2rem;
		}
		
		.main-text {
			font-size: 1.6rem;
		}
		
		.bigger-text {
			font-size: 3.5rem;
		}
		
		.smaller-text {
			font-size: 1.5rem;
		}
		
		.cta-container {
			flex-direction: column;
			width: 100%;
		}
		
		.button-primary, 
		.button-secondary {
			width: 100%;
			text-align: center;
		}
		
		.process-flow {
			grid-template-columns: 1fr;
		}
		
		.split-destinations {
			grid-template-columns: 1fr;
		}
		
		.rewards-section {
			flex-direction: column;
		}
		
		.token-benefits {
			flex-direction: column;
		}
	}
</style>
