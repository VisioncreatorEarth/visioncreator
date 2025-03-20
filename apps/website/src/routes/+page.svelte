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
	<div class="full-page-background"></div>
	
	<section class="hero">
		<div class="hero-wrapper">
			<!-- Left side with main statement -->
			<div class="hero-left" class:visible={textVisible}>
				<h2 class="hero-statement">Innovation belongs to everyone.</h2>
				
				<div class="hero-actions">
					<a href="/contribute" class="hero-cta primary" class:visible={buttonsVisible}>
						Contribute
					</a>
					<a href="/invest" class="hero-cta secondary" class:visible={buttonsVisible}>
						Invest
					</a>
							</div>
				</div>

			<!-- Right side with more detailed content -->
			<div class="hero-right" class:visible={textVisible}>
				<h1 class="hero-title">
					The <span>Ownership</span> Layer
							</h1>
							
				<div class="hero-problem">
					<p>The startup world is structured to favor a select few—founders and big investors—who take the lion's share while contributors and supporters are left with nothing but a paycheck.</p>
							</div>
							
				<div class="read-more" class:visible={buttonsVisible}>
					<a href="#investment-section">
						Read the vision
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</a>
							</div>
						</div>
							</div>
							
		<!-- Hominio section (redesigned) -->
		<div class="hominio-section" class:visible={sectionsVisible}>
			<div class="hominio-container">
				<div class="hominio-left">
					<div class="hominio-label">INTRODUCING</div>
					<h2 class="hominio-title">HOMINIO</h2>
					<p class="hominio-description">
						An AI-powered platform that lets you interact with your digital world through voice commands.
					</p>
					<ul class="hominio-features">
						<li>Build mini-apps with simple voice instructions</li>
						<li>Manage your private data securely</li>
						<li>Control your digital experience</li>
						<li>Everything runs locally on your device</li>
									</ul>
					<div class="hominio-cta">
						<a href="#investment-section" class="hominio-button">Learn More</a>
								</div>
									</div>
				<div class="hominio-right">
					<div class="terminal">
						<div class="terminal-header">
							<div class="terminal-buttons">
								<span></span>
								<span></span>
								<span></span>
								</div>
							<div class="terminal-title">Hominio AI</div>
							</div>
						<div class="terminal-body">
							<div class="terminal-line">$ <span class="terminal-user">Launch Hominio</span></div>
							<div class="terminal-line"><span class="terminal-system">Initializing AI system...</span></div>
							<div class="terminal-line"><span class="terminal-system">Voice interface activated.</span></div>
							<div class="terminal-line terminal-space"></div>
							<div class="terminal-line"><span class="terminal-ai">How can I help you today?</span></div>
							<div class="terminal-line"><span class="terminal-user">"Create a budget tracker app"</span></div>
							<div class="terminal-line"><span class="terminal-ai">Building budget tracker... What features do you need?</span></div>
							<div class="terminal-line terminal-current">|</div>
							</div>
						</div>
							</div>
									</div>
								</div>
								
		<!-- JOIN US banner (simplified) -->
		<div class="join-banner" class:visible={sectionsVisible}>
			<div class="join-content">
				<h2 class="join-heading">JOIN US IN BUILDING OUR FIRST COMMUNITY BUILT AND OWNED STARTUP</h2>
								</div>
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
								<div class="token-amount">+ 150 VCR</div>
								<div class="budget-label">Estimated Rewards</div>
							</div>
									</div>
								</div>
									</div>
								</div>
							</div>
			</section>
		
		<!-- How to Invest Section -->
		<div id="investment-section" class="investment-section" class:visible={sectionsVisible}>
			<h2 class="section-title animate-fade-in">How to Invest</h2>
			
			<div class="contribute-intro animate-fade-in" style="animation-delay: 0.2s;">
				<p>You can invest in Visioncreator by buying VCR tokens. Your investment helps build the future of community-owned startups.</p>
								</div>
								
			<div class="split-container" class:visible={investVisible}>
				<div class="split-header">
					<h3 class="split-title">Investment Split</h3>
					<p class="split-description">
						All investments are split equally into two pools, both working together to grow Hominio as a community-owned project.
					</p>
							</div>
							
				<div class="split-chart">
					<div class="split-half community">
						<div class="split-label">Community Pool</div>
						<div class="split-percentage">50%</div>
						<div class="split-list">
							<div class="split-item">Community proposals</div>
							<div class="split-item">Public contributions</div>
							<div class="split-item">Development grants</div>
							<div class="split-item">Community-driven initiatives</div>
										</div>
									</div>
					<div class="split-half platform">
						<div class="split-label">Platform Pool</div>
						<div class="split-percentage">50%</div>
						<div class="split-list">
							<div class="split-item">Hiring professional developers</div>
							<div class="split-item">Infrastructure & operations</div>
							<div class="split-item">Marketing campaigns</div>
							<div class="split-item">Core feature development</div>
										</div>
									</div>
									</div>
									
				<div class="investment-info">
					<div class="info-card">
						<h3 class="info-title">Minimum Investment</h3>
						<div class="budget-amount">€200</div>
						<p class="budget-label">Entry-level investment to join Hominio</p>
										</div>
					<div class="info-card">
						<h3 class="info-title">Initial Fundraising</h3>
						<div class="budget-amount">€8M</div>
						<p class="budget-label">First phase target for Hominio launch</p>
									</div>
					<div class="info-card">
						<h3 class="info-title">Maximum Investment</h3>
						<div class="budget-amount">Unlimited</div>
						<p class="budget-label">No cap on how much you can contribute</p>
								</div>
							</div>
						</div>
							</div>
	</main>

<!-- Personal Journey Section - Redesigned for visual storytelling -->
<div id="journey-section" class="journey-section" class:visible={sectionsVisible}>
	<h2 class="section-title animate-fade-in">Our Journey</h2>
	
	<div class="journey-container" class:visible={investVisible}>
		<div class="timeline-intro">
			<p class="timeline-intro-text animate-text">
				From idea to innovation: The story of how VisionCreator came to be.
			</p>
		</div>
		
		<div class="timeline-container">
			<!-- Vertical timeline track -->
			<div class="timeline-path"></div>
			
			<!-- Chielo's beginning -->
			<div class="timeline-node">
				<div class="timeline-avatar">
					<img src="/images/chielo_-43.JPG" alt="Chielo" />
				</div>
				<div class="timeline-pulse"></div>
				<div class="timeline-content">
					<div class="timeline-date">The Beginning</div>
					<h3 class="timeline-title">The Dream</h3>
					<p class="timeline-text">
						At 16, I dreamed of building something meaningful but lacked resources and connections. 
						Great ideas kept coming, but they remained just ideas.
					</p>
					<p class="timeline-highlight">
						"There has to be a better way to bring ideas to life."
					</p>
				</div>
			</div>
			
			<!-- Meeting Sami -->
			<div class="timeline-node">
				<div class="timeline-avatar">
					<div class="timeline-avatar-placeholder">S</div>
				</div>
				<div class="timeline-pulse"></div>
				<div class="timeline-content">
					<div class="timeline-date">The Catalyst</div>
					<h3 class="timeline-title">Meeting Sami</h3>
					<p class="timeline-text">
						Meeting Sami changed everything. A tech innovator with industry experience, 
						we connected over shared frustrations with how startups operate.
					</p>
					<p class="timeline-highlight">
						"What if everyone who helps build something actually owns a piece of it?"
					</p>
				</div>
			</div>
			
			<!-- Meeting Yvonne -->
			<div class="timeline-node">
				<div class="timeline-avatar">
					<div class="timeline-avatar-placeholder">Y</div>
				</div>
				<div class="timeline-pulse"></div>
				<div class="timeline-content">
					<div class="timeline-date">The Structure</div>
					<h3 class="timeline-title">German Connection</h3>
					<p class="timeline-text">
						Yvonne brought crucial bureaucratic expertise and became our guide through Germany's complex 
						regulatory framework, helping position our vision within the established system.
					</p>
					<p class="timeline-highlight">
						"Innovation needs structure to thrive."
					</p>
				</div>
			</div>
			
			<!-- Founding VisionCreator -->
			<div class="timeline-node">
				<div class="timeline-avatar">
					<div class="timeline-avatar-placeholder">VC</div>
				</div>
				<div class="timeline-pulse"></div>
				<div class="timeline-content">
					<div class="timeline-date">The Launch</div>
					<h3 class="timeline-title">VisionCreator Born</h3>
					<p class="timeline-text">
						In early 2023, we made it official. VisionCreator was founded with a simple but revolutionary principle: 
						everyone who contributes gets ownership.
					</p>
					<p class="timeline-highlight">
						Building a world where contribution determines your opportunity to own the future.
					</p>
				</div>
			</div>
			
			<!-- Meeting Ceva -->
			<div class="timeline-node">
				<div class="timeline-avatar">
					<div class="timeline-avatar-placeholder">C</div>
				</div>
				<div class="timeline-pulse"></div>
				<div class="timeline-content">
					<div class="timeline-date">The Foundation</div>
					<h3 class="timeline-title">Ceva Completes Us</h3>
					<p class="timeline-text">
						Ceva's expertise in governance systems completed our founding team, creating the proposal and voting 
						system that enables transparent, collective decision-making.
					</p>
					<p class="timeline-highlight">
						"Good governance channels different perspectives toward better outcomes."
					</p>
				</div>
			</div>
		</div>
		
		<div class="timeline-conclusion">
			<p class="timeline-conclusion-text animate-pulse-text">
				Hominio is our first community-built and owned startup. Join us in building 
				a new world of collaborative innovation and shared ownership!
			</p>
		</div>
	</div>
</div>

<style>
	/* Canvas for stars */
	.stars-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
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
		z-index: 2;
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
		z-index: 2;
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
		z-index: 3;
	}

	/* Full-page background */
	.full-page-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url("/images/li-zhang-xRRQlR8Qu-Y-unsplash.jpg");
		background-size: cover;
		background-position: center;
		opacity: 0.3;
		filter: contrast(1.2) brightness(0.6);
		z-index: 0;
		animation: subtle-zoom 30s infinite alternate ease-in-out;
	}
	
	@keyframes subtle-zoom {
		0% { transform: scale(1); }
		100% { transform: scale(1.05); }
	}

	/* Hero Section Styling */
	.hero {
		position: relative;
		overflow: hidden;
	}
	
	.hero-wrapper {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		padding: 8rem 2rem;
		min-height: 80vh;
		align-items: center;
	}
	
	/* Left Side - Main Statement */
	.hero-left {
		padding-right: 2rem;
		opacity: 0;
		transform: translateX(-30px);
		transition: all 0.8s ease-out;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}
	
	.hero-left.visible {
		opacity: 1;
		transform: translateX(0);
	}
	
	.hero-statement {
		font-size: 4.5rem;
		font-weight: 800;
		line-height: 1.1;
		margin-bottom: 3rem;
		color: white;
		position: relative;
	}
	
	.hero-statement::before {
		content: "";
		position: absolute;
		top: -30px;
		left: 0;
		width: 60px;
		height: 6px;
		background: linear-gradient(90deg, #3B82F6, #93C5FD);
		border-radius: 3px;
	}
	
	.hero-actions {
		display: flex;
		gap: 1.5rem;
		margin-top: 3rem;
	}
	
	.hero-cta {
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease-out;
		padding: 0.75rem 2rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		text-align: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.hero-cta.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.hero-cta.primary {
		background: linear-gradient(135deg, #3B82F6, #1D4ED8);
		color: white;
		box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
	}
	
	.hero-cta.primary:hover {
		background: linear-gradient(135deg, #2563EB, #1E40AF);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
		transform: translateY(-2px);
	}
	
	.hero-cta.secondary {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: white;
	}
	
	.hero-cta.secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}
	
	/* Right Side - Details */
	.hero-right {
		opacity: 0;
		transform: translateX(30px);
		transition: all 0.8s ease-out;
		transition-delay: 0.2s;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}
	
	.hero-right.visible {
		opacity: 1;
		transform: translateX(0);
	}
	
	.hero-title {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: white;
	}

	.hero-title span {
		background: linear-gradient(90deg, #3B82F6, #93C5FD);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		font-weight: 800;
	}
	
	.hero-problem {
		font-size: 1.2rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 2rem;
		max-width: 90%;
	}
	
	.read-more {
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease-out;
		margin-top: 2rem;
	}
	
	.read-more.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.read-more a {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #3B82F6;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}
	
	.read-more a:hover {
		color: #93C5FD;
	}
	
	.read-more svg {
		transition: transform 0.2s ease;
	}
	
	.read-more a:hover svg {
		transform: translateY(3px);
	}
	
	/* Hominio Section (New Design) */
	.hominio-section {
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
		margin: 5rem auto;
		max-width: 1400px;
		padding: 0 2rem;
	}
	
	.hominio-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.hominio-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		background: rgba(20, 30, 60, 0.4);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
					0 0 0 1px rgba(59, 130, 246, 0.2);
		backdrop-filter: blur(10px);
	}
	
	.hominio-left {
		padding: 4rem 3rem;
	}
	
	.hominio-label {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: rgba(59, 130, 246, 0.1);
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 2px;
		color: #60A5FA;
		margin-bottom: 1.5rem;
	}
	
	.hominio-title {
		font-size: 4rem;
		font-weight: 800;
		margin: 0 0 1.5rem;
		background: linear-gradient(135deg, #3B82F6, #93C5FD);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		line-height: 1;
	}
	
	.hominio-description {
		font-size: 1.3rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 2rem;
		line-height: 1.5;
	}
	
	.hominio-features {
		list-style: none;
		padding: 0;
		margin: 0 0 2.5rem;
	}
	
	.hominio-features li {
		position: relative;
		padding-left: 1.8rem;
		margin-bottom: 1rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.1rem;
	}
	
	.hominio-features li:before {
		content: "";
		position: absolute;
		left: 0;
		top: 0.5rem;
		width: 0.8rem;
		height: 0.8rem;
		background: #3B82F6;
		border-radius: 50%;
	}
	
	.hominio-cta {
		margin-top: 2rem;
	}
	
	.hominio-button {
		display: inline-block;
		padding: 1rem 2.5rem;
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: white;
		font-weight: 600;
		font-size: 1.1rem;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}
	
	.hominio-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
		background: linear-gradient(135deg, #4287f5, #1d4ed8);
	}
	
	.hominio-right {
		background: linear-gradient(135deg, rgba(30, 58, 138, 0.3), rgba(30, 58, 138, 0.1));
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}
	
	/* Terminal styling */
	.terminal {
		width: 100%;
		max-width: 500px;
		background: rgba(15, 23, 42, 0.9);
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
		font-family: 'Courier New', monospace;
	}
	
	.terminal-header {
		background: rgba(30, 41, 59, 0.8);
		padding: 0.8rem 1rem;
		display: flex;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.terminal-buttons {
		display: flex;
		gap: 0.5rem;
		margin-right: 1rem;
	}
	
	.terminal-buttons span {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: block;
	}
	
	.terminal-buttons span:nth-child(1) {
		background: #ff5f56;
	}
	
	.terminal-buttons span:nth-child(2) {
		background: #ffbd2e;
	}
	
	.terminal-buttons span:nth-child(3) {
		background: #27c93f;
	}
	
	.terminal-title {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		text-align: center;
		flex-grow: 1;
		margin-right: 3rem;
	}
	
	.terminal-body {
		padding: 1.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.95rem;
		line-height: 1.5;
	}
	
	.terminal-line {
		margin-bottom: 0.8rem;
	}
	
	.terminal-space {
		height: 1rem;
	}
	
	.terminal-system {
		color: #a5a5a5;
	}
	
	.terminal-user {
		color: #5beda7;
	}
	
	.terminal-ai {
		color: #60A5FA;
	}
	
	.terminal-current {
		animation: blink 1s infinite;
	}
	
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}
	
	/* Media queries for hominio section */
	@media (max-width: 1024px) {
		.hominio-container {
			grid-template-columns: 1fr;
		}
		
		.hominio-right {
			padding: 2rem 3rem 4rem;
		}
		
		.hominio-title {
			font-size: 3.5rem;
		}
	}
	
	@media (max-width: 768px) {
		.hominio-left {
			padding: 3rem 2rem;
		}
		
		.hominio-title {
			font-size: 3rem;
		}
		
		.join-heading {
			font-size: 1.8rem;
		}
		
		.join-subtext {
		font-size: 1rem;
		}
	}
	
	@media (max-width: 480px) {
		.hominio-left {
			padding: 2rem 1.5rem;
		}
		
		.hominio-title {
			font-size: 2.5rem;
		}
		
		.hominio-description {
			font-size: 1.1rem;
		}
		
		.hominio-features li {
			font-size: 1rem;
		}
		
		.terminal-body {
			padding: 1rem;
			font-size: 0.8rem;
		}
		
		.join-heading {
			font-size: 1.5rem;
		}
	}
	
	/* Participate Section */
	.participate-section {
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
		padding: 4rem 2rem;
		max-width: 1400px;
		margin: 0 auto 5rem;
	}
	
	.participate-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 3rem;
		color: white;
	}

	.contribute-intro {
		text-align: center;
		max-width: 700px;
		margin: 0 auto 4rem;
		font-size: 1.3rem;
		color: rgba(255, 255, 255, 0.9);
	}
	
	/* Process Cards */
	.process-flow {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}
	
	.process-card {
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.6s ease-out;
		background: rgba(30, 58, 138, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 12px;
		padding: 2rem;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}
	
	.process-card.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.process-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.15);
		border-color: rgba(59, 130, 246, 0.3);
	}
	
	.card-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.icon-wrapper {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(59, 130, 246, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.card-title {
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0;
		color: white;
	}
	
	.card-body {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1rem;
		line-height: 1.6;
	}
	
	/* Idea Examples */
	.idea-examples {
		margin-top: 1.5rem;
		display: grid;
		gap: 1rem;
	}
	
	.idea-example-card {
		background: rgba(30, 58, 138, 0.15);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 8px;
		padding: 1.25rem;
		transition: transform 0.2s ease;
	}
	
	.idea-example-card:hover {
		transform: translateY(-3px);
	}
	
	.idea-user {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}
	
	.user-avatar {
		width: 28px;
		height: 28px;
		background: rgba(59, 130, 246, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 600;
		color: #3B82F6;
	}
	
	.idea-example-card h4 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: white;
	}
	
	.idea-example-card p {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 1rem;
	}
	
	.vote-count {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	
	.votes {
		color: #3B82F6;
		font-weight: 600;
	}
	
	.votes-label {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.8rem;
		letter-spacing: 1px;
	}
	
	.vote-button {
		margin-left: auto;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 4px;
		padding: 0.35rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #3B82F6;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.vote-button:hover {
		background: rgba(59, 130, 246, 0.2);
	}
	
	/* Vote Visualization */
	.vote-visualization {
		margin-top: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.users-voting {
		display: flex;
	}
	
	.user-vote {
		position: relative;
		margin-right: -10px;
	}
	
	.vote-plus {
		position: absolute;
		top: -10px;
		right: -5px;
		background: #3B82F6;
		color: white;
		border-radius: 10px;
		padding: 0.1rem 0.35rem;
		font-size: 0.7rem;
		font-weight: 600;
	}
	
	.big-vote-count {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.big-vote-count span {
		font-size: 2.5rem;
		font-weight: 700;
		color: #3B82F6;
		line-height: 1;
	}
	
	/* Budget sliders */
	.rewards-section {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.budget-sliders {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	
	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.slider-value {
		color: #3B82F6;
		font-weight: 500;
	}

	.slider-track {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	.slider-progress {
		height: 100%;
		background: linear-gradient(90deg, #3B82F6, #60A5FA);
		border-radius: 4px;
		position: relative;
	}
	
	.slider-handle {
		position: absolute;
		right: 0;
		top: 50%;
		width: 16px;
		height: 16px;
		background: white;
		border-radius: 50%;
		transform: translate(50%, -50%);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	.budget-result {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-top: 1.5rem;
	}

	.budget-amount {
		font-size: 2rem;
		font-weight: 700;
		color: white;
	}
	
	.token-amount {
		font-size: 1.1rem;
		color: #60A5FA;
		margin-top: 0.25rem;
		font-weight: 600;
	}
	
	.budget-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		margin-top: 0.5rem;
	}
	
	/* Animation classes */
	.animate-fade-in {
		opacity: 0;
		transform: translateY(20px);
		animation: fadeIn 0.6s ease-out forwards;
	}
	
	@keyframes fadeIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* Investment section */
	.investment-container {
		max-width: 1200px;
		margin: 6rem auto;
		padding: 0 2rem;
	}
	
	.invest-card {
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.6s ease-out;
		background: rgba(30, 58, 138, 0.15);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 16px;
		padding: 3rem;
		margin-bottom: 4rem;
	}
	
	.invest-card.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	/* Journey section */
	.journey-section {
		padding: 5rem 2rem;
		margin: 0 auto;
		max-width: 1200px;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
	}
	
	.journey-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.journey-container {
		margin-top: 3rem;
		opacity: 0;
		transform: translateY(20px);
		transition: all 0.5s ease-out 0.2s;
	}
	
	.journey-container.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.timeline-intro {
		text-align: center;
		max-width: 800px;
		margin: 0 auto 6rem;
	}
	
	.timeline-intro-text {
		font-size: 1.4rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 2rem;
	}
	
	.timeline-conclusion {
		text-align: center;
		margin: 4rem auto 2rem;
		max-width: 800px;
	}
	
	.timeline-conclusion-text {
		font-size: 1.4rem;
		line-height: 1.7;
		padding: 2rem;
		background: linear-gradient(135deg, rgba(30, 58, 138, 0.7), rgba(59, 130, 246, 0.7));
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(30, 58, 138, 0.3);
		border: 1px solid rgba(59, 130, 246, 0.3);
		color: white;
		font-weight: 600;
		margin-top: 2rem;
		animation: pulse-text 3s ease infinite;
	}
	
	@keyframes pulse-text {
		0%, 100% { 
			box-shadow: 0 10px 25px rgba(30, 58, 138, 0.3);
		}
		50% { 
			box-shadow: 0 15px 35px rgba(59, 130, 246, 0.5);
		}
	}
	
	/* Timeline styles */
	.timeline-container {
		position: relative;
		margin: 4rem auto;
	}
	
	.timeline-path {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 4px;
		background: linear-gradient(to bottom, #3B82F6, #60A5FA);
		transform: translateX(-50%);
		z-index: 1;
		/* Create snake effect with curved path */
		animation: snake-path 0.5s ease-in-out infinite alternate;
		animation-play-state: paused;
	}
	
	@keyframes snake-path {
		0% { transform: translateX(-50%) translateY(0); }
		100% { transform: translateX(-50%) translateY(5px); }
	}
	
	.timeline-section.visible .timeline-path {
		animation-play-state: running;
	}
	
	/* Create snake-like path with pseudo-elements */
	.timeline-node:nth-child(odd)::before {
		content: "";
		position: absolute;
		top: 40px;
		right: 50%;
		width: 100px;
		height: 4px;
		background: linear-gradient(to right, transparent, #3B82F6);
		z-index: 1;
	}
	
	.timeline-node:nth-child(even)::before {
		content: "";
		position: absolute;
		top: 40px;
		left: 50%;
		width: 100px;
		height: 4px;
		background: linear-gradient(to left, transparent, #3B82F6);
		z-index: 1;
	}
	
	.timeline-node {
		position: relative;
		margin-bottom: 8rem;
		z-index: 2;
	}
	
	.timeline-node:nth-child(odd) {
		text-align: right;
		padding-right: calc(50% + 2rem);
		padding-left: 0;
	}
	
	.timeline-node:nth-child(even) {
		text-align: left;
		padding-left: calc(50% + 2rem);
		padding-right: 0;
	}
	
	.timeline-node:last-child {
		margin-bottom: 0;
	}
	
	.timeline-content {
		background: rgba(15, 23, 42, 0.6);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		display: inline-block;
		max-width: 100%;
	}
	
	.timeline-content:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
	}
	
	.timeline-node:nth-child(odd) .timeline-content {
		border-right: 4px solid #3B82F6;
	}
	
	.timeline-node:nth-child(even) .timeline-content {
		border-left: 4px solid #3B82F6;
	}
	
	/* Use same color for all nodes for consistency, with subtle variations */
	.timeline-node .timeline-content {
		border-color: #3B82F6;
	}
	
	.timeline-date {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 0.5rem;
	}
	
	.timeline-title {
		font-size: 1.6rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: white;
	}
	
	/* Use consistent color scheme for all titles */
	.timeline-node .timeline-title {
		color: #3B82F6;
	}
	
	.timeline-text {
		font-size: 1.1rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 1rem;
	}
	
	.timeline-quote {
		font-style: italic;
		color: rgba(255, 255, 255, 0.9);
		border-left: 3px solid #3B82F6;
		padding-left: 1rem;
		margin:.5rem 0 1.5rem;
	}
	
	.timeline-highlight {
		color: #60A5FA;
		font-weight: 600;
	}
	
	.timeline-avatar {
		position: absolute;
		top: 0;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 4px solid #3B82F6;
		background: rgba(30, 58, 138, 0.3);
		overflow: hidden;
		z-index: 3;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
	}
	
	/* Use consistent color for all avatars */
	.timeline-node .timeline-avatar {
		border-color: #3B82F6;
	}
	
	.timeline-node:nth-child(odd) .timeline-avatar {
		right: calc(50% - 40px);
	}
	
	.timeline-node:nth-child(even) .timeline-avatar {
		left: calc(50% - 40px);
	}
	
	.timeline-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.timeline-avatar-placeholder {
		width: 100%;
		height: 100%;
		background: rgba(30, 58, 138, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 700;
		color: white;
	}
	
	/* Consistent blue color for all placeholders */
	.timeline-node .timeline-avatar-placeholder {
		color: #60A5FA;
	}
	
	.timeline-pulse {
		position: absolute;
		top: 40px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		z-index: 4;
	}
	
	.timeline-node:nth-child(odd) .timeline-pulse {
		right: calc(50% - 8px);
	}
	
	.timeline-node:nth-child(even) .timeline-pulse {
		left: calc(50% - 8px);
	}
	
	.timeline-pulse::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.4);
		animation: pulse-timeline 2s infinite;
	}
	
	@keyframes pulse-timeline {
		0% { transform: scale(1); opacity: 1; }
		100% { transform: scale(4); opacity: 0; }
	}
	
	/* Media queries for timeline */
	@media (max-width: 992px) {
		.timeline-path {
			left: 40px;
		}
		
		.timeline-node {
			margin-bottom: 6rem;
			padding-left: 100px !important;
			padding-right: 0 !important;
			text-align: left !important;
		}
		
		.timeline-avatar {
			left: 0 !important;
			right: auto !important;
		}
		
		.timeline-pulse {
			left: 32px !important;
			right: auto !important;
		}
		
		.timeline-content {
			border-left: 4px solid #3B82F6 !important;
			border-right: none !important;
		}
		
		/* Remove the snake-like effect on small screens */
		.timeline-node::before {
			display: none;
		}
	}
	
	@media (max-width: 768px) {
		.split-chart {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.investment-info {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		
		.timeline-intro-text,
		.timeline-conclusion-text {
			font-size: 1.2rem;
		}
		
		.timeline-title {
			font-size: 1.4rem;
		}
		
		.timeline-text {
			font-size: 1rem;
		}
	}
	
	@media (max-width: 480px) {
		.timeline-path {
			left: 30px;
		}
		
		.timeline-node {
			padding-left: 80px !important;
		}
		
		.timeline-avatar {
			width: 60px;
			height: 60px;
			border-width: 3px;
		}
		
		.timeline-pulse {
			left: 22px !important;
		}
		
		.timeline-intro-text,
		.timeline-conclusion-text {
			font-size: 1.1rem;
		}
		
		.timeline-title {
			font-size: 1.3rem;
		}
		
		.info-title {
			font-size: 1.1rem;
		}
		
		.split-title {
			font-size: 1.8rem;
		}
		
		.split-percentage {
			font-size: 2rem;
		}
	}
</style>

