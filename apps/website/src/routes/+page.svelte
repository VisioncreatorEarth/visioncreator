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
	let brainVisible = false;
	let connectionsVisible = false;
	let sectionsVisible = false;
	let cardsVisible = false;
	let investVisible = false;
	let journeyVisible = false;
	
	// Brain animation
	let brainCanvas: HTMLCanvasElement | null = null;
	let brainCtx: CanvasRenderingContext2D | null = null;
	let brainNodes: {x: number, y: number, radius: number, vx: number, vy: number, connections: number[]}[] = [];
	let brainLines: {start: number, end: number, progress: number, speed: number}[] = [];
	let brainAnimationFrame: number;
	let pulsating = 0;
	
	onMount(() => {
		// Only run on client
		if (typeof window !== 'undefined') {
			// Initialize stars
			initCanvas();
			createStars();
			animateStars();
			
			// Initialize brain animation only if canvas exists
			setTimeout(() => {
				if (brainCanvas) {
					initBrainCanvas();
					createBrainNodes();
					animateBrain();
				}
			}, 100);
			
			// Resize handler
			const handleResize = () => {
				// Stars canvas
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
				createStars();
				
				// Brain canvas
				if (brainCanvas) {
					brainCanvas.width = brainCanvas.offsetWidth;
					brainCanvas.height = brainCanvas.offsetHeight;
					createBrainNodes();
				}
			};
			
			window.addEventListener('resize', handleResize);
			
			// Staggered animations with fixed delays
			setTimeout(() => { textVisible = true; }, 300);
			setTimeout(() => { brainVisible = true; }, 1000);
			setTimeout(() => { connectionsVisible = true; }, 1500);
			setTimeout(() => { buttonsVisible = true; }, 2000);
			setTimeout(() => { sectionsVisible = true; }, 2500);
			
			// Add scroll animation detection
			const handleScroll = () => {
				const scrollPosition = window.scrollY;
				const windowHeight = window.innerHeight;
				
				// Get element positions
				const investmentSection = document.getElementById('investment-section');
				const journeySection = document.getElementById('journey-section');
				
				if (investmentSection) {
					const investmentPosition = investmentSection.getBoundingClientRect().top + scrollPosition;
					if (scrollPosition > investmentPosition - windowHeight * 0.8) {
						investVisible = true;
					}
				}
				
				if (journeySection) {
					const journeyPosition = journeySection.getBoundingClientRect().top + scrollPosition;
					if (scrollPosition > journeyPosition - windowHeight * 0.8) {
						journeyVisible = true;
					}
				}
			};
			
			// Initial call for elements already in viewport
			setTimeout(handleScroll, 100);
			
			// Add scroll listener
			window.addEventListener('scroll', handleScroll);
			
			return () => {
				window.removeEventListener('resize', handleResize);
				window.removeEventListener('scroll', handleScroll);
				if (brainAnimationFrame) {
					cancelAnimationFrame(brainAnimationFrame);
				}
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
			if (shootingStar.x > canvas.width || shootingStar.x < 0 || shootingStar.y > canvas.height) {
				return;
			}
			
			requestAnimationFrame(animate);
		};
		
		animate();
	}
	
	// Brain animation functions
	function initBrainCanvas() {
		if (!brainCanvas) return;
		
		brainCanvas.width = brainCanvas.offsetWidth;
		brainCanvas.height = brainCanvas.offsetHeight;
		brainCtx = brainCanvas.getContext('2d');
	}
	
	function createBrainNodes() {
		if (!brainCanvas || !brainCtx) return;
		
		const width = brainCanvas.width;
		const height = brainCanvas.height;
		const centerX = width / 2;
		const centerY = height / 2;
		
		brainNodes = [];
		brainLines = [];
		
		// Create central "brain" node
		brainNodes.push({
			x: centerX,
			y: centerY,
			radius: 30,
			vx: 0,
			vy: 0,
			connections: []
		});
		
		// Create orbital nodes (services/data types)
		const numNodes = 8;
		const radius = Math.min(width, height) * 0.3;
		
		for (let i = 0; i < numNodes; i++) {
			const angle = (i / numNodes) * Math.PI * 2;
			const x = centerX + Math.cos(angle) * radius;
			const y = centerY + Math.sin(angle) * radius;
			
			brainNodes.push({
				x: x,
				y: y,
				radius: 12 + Math.random() * 8,
				vx: Math.random() * 0.2 - 0.1,
				vy: Math.random() * 0.2 - 0.1,
				connections: [0] // All connect to central brain
			});
			
			// Connect to central node
			brainLines.push({
				start: 0,
				end: i + 1,
				progress: 0,
				speed: 0.005 + Math.random() * 0.01
			});
			
			// Add some connections between nodes
			if (i > 0 && Math.random() > 0.5) {
				const connectTo = 1 + Math.floor(Math.random() * i);
				brainNodes[i + 1].connections.push(connectTo);
				brainNodes[connectTo].connections.push(i + 1);
				
				brainLines.push({
					start: i + 1,
					end: connectTo,
					progress: 0,
					speed: 0.005 + Math.random() * 0.01
				});
			}
		}
	}
	
	function animateBrain() {
		if (!brainCanvas || !brainCtx) return;
		
		const width = brainCanvas.width;
		const height = brainCanvas.height;
		
		brainCtx.clearRect(0, 0, width, height);
		
		// Update pulsating effect
		pulsating += 0.05;
		
		// Draw connections (lines)
		if (connectionsVisible) {
			for (let i = 0; i < brainLines.length; i++) {
				const line = brainLines[i];
				const startNode = brainNodes[line.start];
				const endNode = brainNodes[line.end];
				
				// Update progress
				line.progress = Math.min(1, line.progress + line.speed);
				
				// Draw line with gradient
				const gradient = brainCtx.createLinearGradient(
					startNode.x, startNode.y, 
					endNode.x, endNode.y
				);
				
				// Different colors for central connections vs peripheral
				if (line.start === 0 || line.end === 0) {
					gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)"); // Blue
					gradient.addColorStop(1, "rgba(139, 92, 246, 0.8)"); // Purple
				} else {
					gradient.addColorStop(0, "rgba(139, 92, 246, 0.6)"); // Purple
					gradient.addColorStop(1, "rgba(236, 72, 153, 0.6)"); // Pink
				}
				
				brainCtx.strokeStyle = gradient;
				brainCtx.lineWidth = 2;
				brainCtx.beginPath();
				
				// Only draw up to current progress
				const progressX = startNode.x + (endNode.x - startNode.x) * line.progress;
				const progressY = startNode.y + (endNode.y - startNode.y) * line.progress;
				
				brainCtx.moveTo(startNode.x, startNode.y);
				brainCtx.lineTo(progressX, progressY);
				brainCtx.stroke();
				
				// Data packet animation along the line
				if (line.progress > 0.1 && Math.random() > 0.97) {
					const packetProgress = Math.random();
					const packetX = startNode.x + (endNode.x - startNode.x) * packetProgress;
					const packetY = startNode.y + (endNode.y - startNode.y) * packetProgress;
					
					brainCtx.beginPath();
					brainCtx.arc(packetX, packetY, 3, 0, Math.PI * 2);
					brainCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
					brainCtx.fill();
				}
			}
		}
		
		// Draw nodes
		for (let i = 0; i < brainNodes.length; i++) {
			const node = brainNodes[i];
			
			// Central node (brain)
			if (i === 0 && brainVisible) {
				// Pulsating glow effect
				const glowRadius = 30 + Math.sin(pulsating) * 5;
				const gradient = brainCtx.createRadialGradient(
					node.x, node.y, glowRadius * 0.5,
					node.x, node.y, glowRadius * 2
				);
				gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)");
				gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
				
				brainCtx.beginPath();
				brainCtx.arc(node.x, node.y, glowRadius * 2, 0, Math.PI * 2);
				brainCtx.fillStyle = gradient;
				brainCtx.fill();
				
				// Brain circle
				brainCtx.beginPath();
				brainCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
				brainCtx.fillStyle = "rgba(59, 130, 246, 0.9)";
				brainCtx.fill();
				
				// Brain inner details
				brainCtx.beginPath();
				brainCtx.arc(node.x, node.y, node.radius * 0.7, 0, Math.PI * 2);
				brainCtx.fillStyle = "rgba(255, 255, 255, 0.15)";
				brainCtx.fill();
				
				// Neural pattern inside brain
				brainCtx.beginPath();
				for (let j = 0; j < 8; j++) {
					const angle = (j / 8) * Math.PI * 2;
					const innerRadius = node.radius * 0.4;
					brainCtx.moveTo(node.x, node.y);
					brainCtx.lineTo(
						node.x + Math.cos(angle) * innerRadius,
						node.y + Math.sin(angle) * innerRadius
					);
				}
				brainCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
				brainCtx.lineWidth = 1;
				brainCtx.stroke();
			} 
			// Peripheral nodes (services/data)
			else if (i > 0 && connectionsVisible) {
				// Update position with subtle movement
				node.x += node.vx;
				node.y += node.vy;
				
				// Boundary check and reverse direction
				const maxDistance = Math.min(width, height) * 0.3;
				const dx = node.x - width/2;
				const dy = node.y - height/2;
				const distance = Math.sqrt(dx*dx + dy*dy);
				
				if (distance > maxDistance || distance < maxDistance * 0.7) {
					node.vx = -node.vx;
					node.vy = -node.vy;
				}
				
				// Draw node
				brainCtx.beginPath();
				brainCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
				brainCtx.fillStyle = i % 2 === 0 ? 
					"rgba(139, 92, 246, 0.8)" : "rgba(236, 72, 153, 0.8)";
				brainCtx.fill();
				
				// Draw service icon or symbol inside
				brainCtx.beginPath();
				brainCtx.arc(node.x, node.y, node.radius * 0.6, 0, Math.PI * 2);
				brainCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
				brainCtx.fill();
			}
		}
		
		brainAnimationFrame = requestAnimationFrame(animateBrain);
	}
</script>

<svelte:head>
	<title>Hominio | Own Your Digital Life</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
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
	</style>
</svelte:head>

<main class="landing-container">
	<canvas bind:this={canvas} class="stars-canvas"></canvas>
	
	<div class="ambient-light"></div>
	<div class="ambient-light-2"></div>
	
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<div class="hero-text" class:visible={textVisible}>
				<h1>Master Your Digital Life with <span class="gradient-text">Voice</span></h1>
				<p class="hero-subtitle">Hominio is your AI-powered digital brain. Organize your digital life with natural
					voice commands and let Hominio handle the rest.</p>
				
				<div class="hero-actions" class:visible={buttonsVisible}>
					<a href="#waitlist" class="hero-cta primary">Join Waitlist</a>
					<a href="#how-it-works" class="hero-cta secondary">See Features</a>
				</div>
			</div>
			
			<div class="brain-container" class:visible={brainVisible}>
				<canvas bind:this={brainCanvas} class="brain-canvas"></canvas>
				
				<div class="brain-labels" class:visible={connectionsVisible}>
					<div class="brain-label" style="--index: 1; top: 20%; left: 15%;">
						<span class="label-dot"></span>Voice Commands
					</div>
					<div class="brain-label" style="--index: 2; top: 30%; left: 75%;">
						<span class="label-dot"></span>Calendar
					</div>
					<div class="brain-label" style="--index: 3; top: 65%; left: 25%;">
						<span class="label-dot"></span>Email
					</div>
					<div class="brain-label" style="--index: 4; top: 70%; left: 70%;">
						<span class="label-dot"></span>Documents
					</div>
					<div class="brain-label center">
						<span class="label-pulse"></span>Hominio Brain
					</div>
				</div>
			</div>
		</div>
		
		<div class="scroll-indicator" class:visible={textVisible}>
			<span>Explore Hominio</span>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 5v14M5 12l7 7 7-7"/>
			</svg>
		</div>
	</section>
	
	<!-- How It Works Section -->
	<section id="how-it-works" class="how-section" class:visible={sectionsVisible}>
		<div class="section-header">
			<h2 class="section-title">How It Works</h2>
			<p class="section-subtitle">Hominio uses voice commands to simplify your digital life, connecting seamlessly with your apps and services.</p>
		</div>
		
		<div class="flow-container">
			<div class="flow-track"></div>
			
			<!-- Step 1: Voice Command -->
			<div class="flow-step">
				<div class="step-number">1</div>
				<div class="step-content">
					<div class="step-icon voice-step">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
							<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
							<line x1="12" x2="12" y1="19" y2="22"></line>
						</svg>
					</div>
					<h3>Speak Your Command</h3>
					<p>Just speak naturally to Hominio. No need to remember specific phrases or formats - Hominio understands natural language.</p>
					
					<div class="command-bubble">
						<div class="sound-wave">
							<div class="sound-bar"></div>
							<div class="sound-bar"></div>
							<div class="sound-bar"></div>
							<div class="sound-bar"></div>
							<div class="sound-bar"></div>
						</div>
						<div class="command-text">"Hominio, set up a meeting with Sarah about the project next Tuesday at 3 PM and remind me to prepare slides"</div>
					</div>
				</div>
			</div>
			
			<!-- Step 2: Hominio Processing -->
			<div class="flow-step">
				<div class="step-number">2</div>
				<div class="step-content">
					<div class="step-icon agent-step">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect width="16" height="20" x="4" y="2" rx="2"></rect>
							<circle cx="12" cy="14" r="4"></circle>
							<line x1="12" x2="12" y1="6" y2="6"></line>
							<line x1="12" x2="12" y1="18" y2="18"></line>
						</svg>
					</div>
					<h3>Hominio Agent Processes</h3>
					<p>The Hominio Agent recognizes your command and breaks it down into actions. It identifies what services are required and how to coordinate between them.</p>
					
					<div class="agent-processing">
						<div class="processing-icon"></div>
						<div class="processing-steps">
							<div class="processing-step">
								<span class="step-label">Understanding intent</span>
								<div class="step-progress" style="--delay: 0s;"></div>
							</div>
							<div class="processing-step">
								<span class="step-label">Identifying services</span>
								<div class="step-progress" style="--delay: 0.5s;"></div>
							</div>
							<div class="processing-step">
								<span class="step-label">Structuring request</span>
								<div class="step-progress" style="--delay: 1s;"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Step 3: Task Completion -->
			<div class="flow-step">
				<div class="step-number">3</div>
				<div class="step-content">
					<div class="step-icon data-step">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
						</svg>
					</div>
					<h3>Task Completion</h3>
					<p>Hominio interacts with the relevant services to fulfill your request. All data remains on your device, ensuring privacy and ownership.</p>
					
					<div class="completion-card">
						<div class="card-header">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
								<polyline points="22 4 12 14.01 9 11.01"></polyline>
							</svg>
							Completed
						</div>
						<div class="card-body">
							<h4>Meeting with Sarah</h4>
							<p>Added to calendar: Tuesday, 3:00 PM - 4:00 PM</p>
							<div class="card-details">
								<div class="detail-item">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
									</svg>
									Project Meeting
								</div>
								<div class="detail-item">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M10 3H8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9"></path>
										<path d="M17 10h-2V8h2a3 3 0 1 0 0-6h-2v2h2a1 1 0 0 1 0 2h-2V4"></path>
										<path d="M7 12h6"></path>
										<path d="M7 16h6"></path>
										<path d="M13 8h-3"></path>
									</svg>
									Reminder Added
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
	
	<!-- Marketplace Section -->
	<section id="marketplace" class="marketplace-section" class:visible={sectionsVisible}>
		<div class="section-header">
			<h2 class="section-title">Vibe Marketplace</h2>
			<p class="section-subtitle">Extend Hominio's functionality with community-created Vibes and Agents</p>
		</div>
		
		<div class="marketplace-grid">
			<!-- Vibe Card 1 -->
			<div class="vibe-card">
				<div class="vibe-badge">FEATURED</div>
				<h3>Work Assistant</h3>
				<p>Organizes your work tasks, meetings, and documents. Integrates with productivity apps to provide a cohesive workflow.</p>
				
				<div class="vibe-creator">
					<div class="creator-avatar">
						<img src="https://i.pravatar.cc/40?img=1" alt="Creator avatar" />
					</div>
					<div class="creator-info">
						<div class="creator-name">Alex Chen</div>
						<div class="creator-title">Productivity Expert</div>
					</div>
					<div class="vibe-stats">
						<div class="download-count">2.3k</div>
						<div class="rating">
							<span>★★★★★</span>
						</div>
					</div>
				</div>
				
				<a href="#" class="vibe-cta">
					<span>Download Vibe</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7 10 12 15 17 10"></polyline>
						<line x1="12" x2="12" y1="15" y2="3"></line>
					</svg>
				</a>
			</div>
			
			<!-- Vibe Card 2 -->
			<div class="vibe-card">
				<div class="vibe-badge">POPULAR</div>
				<h3>Budget Tracker</h3>
				<p>Monitors expenses, manages subscriptions, and provides financial insights. Alerts you to unusual spending patterns.</p>
				
				<div class="vibe-creator">
					<div class="creator-avatar">
						<img src="https://i.pravatar.cc/40?img=2" alt="Creator avatar" />
					</div>
					<div class="creator-info">
						<div class="creator-name">Maya Johnson</div>
						<div class="creator-title">Financial Advisor</div>
					</div>
					<div class="vibe-stats">
						<div class="download-count">1.7k</div>
						<div class="rating">
							<span>★★★★☆</span>
						</div>
					</div>
				</div>
				
				<a href="#" class="vibe-cta">
					<span>Download Vibe</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7 10 12 15 17 10"></polyline>
						<line x1="12" x2="12" y1="15" y2="3"></line>
					</svg>
				</a>
			</div>
			
			<!-- Vibe Card 3 -->
			<div class="vibe-card">
				<div class="vibe-badge">NEW</div>
				<h3>Writer's Block</h3>
				<p>Capture ideas, organize research, and streamline your writing process. Perfect for content creators and authors.</p>
				
				<div class="vibe-creator">
					<div class="creator-avatar">
						<img src="https://i.pravatar.cc/40?img=3" alt="Creator avatar" />
					</div>
					<div class="creator-info">
						<div class="creator-name">Leo Thompson</div>
						<div class="creator-title">Author & Blogger</div>
					</div>
					<div class="vibe-stats">
						<div class="download-count">952</div>
						<div class="rating">
							<span>★★★★★</span>
						</div>
					</div>
				</div>
				
				<a href="#" class="vibe-cta">
					<span>Download Vibe</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7 10 12 15 17 10"></polyline>
						<line x1="12" x2="12" y1="15" y2="3"></line>
					</svg>
				</a>
			</div>
		</div>
		
		<div class="marketplace-cta">
			<h3>Create Your Own Vibes</h3>
			<p>Join our developer program and create custom Vibes for yourself or to share with the community.</p>
			<a href="#" class="vibe-developer-cta">Join Developer Program</a>
		</div>
	</section>
	
	<!-- Call to Action Section -->
	<section id="waitlist" class="cta-section" class:visible={sectionsVisible}>
		<div class="cta-content">
			<h2 class="cta-title">Join the <span class="gradient-text">Hominio</span> Waitlist</h2>
			<p class="cta-subtitle">Be among the first to experience the future of digital organization</p>
			
			<form class="waitlist-form">
				<input type="email" placeholder="Enter your email" required />
				<button type="submit" class="waitlist-button">Join Waitlist</button>
			</form>
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
		50% { opacity: 0.7; transform: scale(1.1); }
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

	/* Hero Section Styling - New Streamlined Design */
	.hero {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 2rem;
	}
	
	.hero-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: center;
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.hero-text {
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.8s ease, transform 0.8s ease;
	}
	
	.hero-text.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.hero-text h1 {
		font-size: 3.5rem;
		font-weight: 800;
		line-height: 1.2;
		margin-bottom: 1.5rem;
	}
	
	.gradient-text {
		background: linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	
	.hero-subtitle {
		font-size: 1.25rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 2.5rem;
		max-width: 500px;
	}
	
	.hero-actions {
		display: flex;
		gap: 1.5rem;
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	
	.hero-actions.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.hero-cta {
		padding: 1rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		text-align: center;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.hero-cta.primary {
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}
	
	.hero-cta.secondary {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(5px);
		color: #60A5FA;
		border: 1px solid rgba(96, 165, 250, 0.3);
	}
	
	.hero-cta.primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
	}
	
	.hero-cta.secondary:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-3px);
	}
	
	/* Brain animation container */
	.brain-container {
		position: relative;
		width: 100%;
		padding-bottom: 100%;
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 1s ease, transform 1s ease;
	}
	
	.brain-container.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.brain-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	
	/* Brain labels */
	.brain-labels {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.5s ease;
	}
	
	.brain-labels.visible {
		opacity: 1;
	}
	
	.brain-label {
		position: absolute;
		display: flex;
		align-items: center;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(0, 0, 0, 0.6);
		padding: 0.3rem 0.7rem;
		border-radius: 20px;
		white-space: nowrap;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(5px);
		opacity: 0;
		transform: translateY(10px);
		animation: fadeInLabel 0.5s ease forwards;
		animation-delay: calc(var(--index) * 0.2s);
	}
	
	@keyframes fadeInLabel {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.brain-label.center {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(59, 130, 246, 0.2);
		border: 1px solid rgba(59, 130, 246, 0.4);
		padding: 0.4rem 0.8rem;
		font-weight: 600;
		color: #3B82F6;
	}
	
	.label-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #3B82F6;
		margin-right: 0.5rem;
	}
	
	.label-pulse {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: rgba(59, 130, 246, 0.1);
		z-index: -1;
		animation: pulse-ring 2s infinite;
	}
	
	@keyframes pulse-ring {
		0% {
			transform: translate(-50%, -50%) scale(0.8);
			opacity: 0.5;
		}
		50% {
			opacity: 0.2;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0;
		}
	}
	
	/* Scroll indicator */
	.scroll-indicator {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.creator-avatar {
		width: 32px;
		height: 32px;
		background: rgba(139, 92, 246, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		font-weight: 600;
		color: #8B5CF6;
	}
	
	.vibe-stats {
		display: flex;
		justify-content: space-between;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.stat-number {
		font-size: 1.2rem;
		font-weight: 700;
		color: #8B5CF6;
	}
	
	.stat-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
	}
	
	.marketplace-cta {
		text-align: center;
		margin-top: 3rem;
		padding: 3rem;
		background: rgba(17, 24, 39, 0.3);
		border-radius: 16px;
		border: 1px solid rgba(55, 65, 81, 0.2);
	}
	
	.marketplace-cta h3 {
		font-size: 1.8rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}
	
	.marketplace-cta p {
		color: rgba(255, 255, 255, 0.8);
		max-width: 600px;
		margin: 0 auto 2rem;
	}
	
	.cta-button {
		display: inline-block;
		background: linear-gradient(135deg, #8B5CF6, #6366F1);
		color: white;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.3s ease;
	}
	
	.cta-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
	}
	
	/* Call to Action Section */
	.cta-section {
		padding: 8rem 2rem;
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
	}
	
	.cta-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.cta-content {
		padding: 4rem;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
		border-radius: 24px;
		border: 1px solid rgba(59, 130, 246, 0.2);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}
	
	.cta-content h2 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
	}
	
	.cta-content p {
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.2rem;
		margin-bottom: 2.5rem;
	}
	
	.waitlist-form {
		display: flex;
		max-width: 500px;
		margin: 0 auto 3rem;
	}
	
	.waitlist-form input {
		flex: 1;
		padding: 1rem 1.5rem;
		border-radius: 8px 0 0 8px;
		border: 1px solid rgba(59, 130, 246, 0.3);
		background: rgba(17, 24, 39, 0.6);
		color: white;
		font-size: 1rem;
	}
	
	.waitlist-form input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}
	
	.waitlist-form button {
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: white;
		font-weight: 600;
		border: none;
		border-radius: 0 8px 8px 0;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.waitlist-form button:hover {
		background: linear-gradient(135deg, #2563EB, #1D4ED8);
	}
	
	.community-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: rgba(255, 255, 255, 0.7);
	}
	
	.community-note svg {
		flex-shrink: 0;
	}
	
	.community-note p {
		margin: 0;
		font-size: 1rem;
	}
	
	/* Media queries */
	@media (max-width: 768px) {
		.how-section, .marketplace-section, .cta-section {
			padding: 5rem 1.5rem;
		}
		
		.step-number {
			width: 50px;
			height: 50px;
			font-size: 1.25rem;
			margin-right: 1.5rem;
		}
		
		.flow-track {
			left: 25px;
		}
		
		.vibe-card p {
			min-height: auto;
		}
		
		.marketplace-cta {
			padding: 2rem 1.5rem;
		}
		
		.cta-content {
			padding: 3rem 1.5rem;
		}
		
		.cta-content h2 {
			font-size: 2rem;
		}
		
		.cta-content p {
			font-size: 1.1rem;
		}
	}
	
	@media (max-width: 640px) {
		.waitlist-form {
			flex-direction: column;
			gap: 1rem;
		}
		
		.waitlist-form input {
			border-radius: 8px;
			width: 100%;
		}
		
		.waitlist-form button {
			border-radius: 8px;
			width: 100%;
		}
	}
	
	@media (max-width: 480px) {
		.how-section, .marketplace-section, .cta-section {
			padding: 4rem 1rem;
		}
		
		.flow-step {
			flex-direction: column;
			gap: 1rem;
		}
		
		.step-number {
			margin-right: 0;
			margin-bottom: 1.5rem;
		}
		
		.flow-track {
			display: none;
		}
		
		.agent-processing {
			flex-direction: column;
			padding: 1rem;
		}
		
		.card-details {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.cta-content {
			padding: 2rem 1rem;
		}
		
		.cta-content h2 {
			font-size: 1.8rem;
		}
		
		.hero-text h1 {
			font-size: 2rem;
		}
		
		.hero-subtitle {
			font-size: 1.1rem;
		}
		
		.hero-actions {
			flex-direction: column;
		}
		
		.hero-cta {
			width: 100%;
		}
	}
	
	/* How It Works Section */
	.how-section {
		padding: 8rem 2rem;
		max-width: 900px;
		margin: 0 auto;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
	}
	
	.how-section.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}
	
	.section-title {
		font-size: 2.8rem;
		font-weight: 700;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	
	.section-subtitle {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.8);
		max-width: 600px;
		margin: 0 auto;
	}
	
	.flow-container {
		position: relative;
		padding: 2rem 0;
	}
	
	.flow-track {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 30px;
		width: 2px;
		background: linear-gradient(to bottom, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
	}
	
	.flow-step {
		display: flex;
		margin-bottom: 5rem;
		position: relative;
	}
	
	.flow-step:last-child {
		margin-bottom: 0;
	}
	
	.step-number {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #3B82F6, #8B5CF6);
		color: white;
		margin-right: 2rem;
		z-index: 1;
		box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
	}
	
	.step-content {
		flex: 1;
		padding-top: 0.5rem;
	}
	
	.step-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		color: white;
	}
	
	.voice-step {
		background: linear-gradient(135deg, #3B82F6, #1E40AF);
	}
	
	.agent-step {
		background: linear-gradient(135deg, #8B5CF6, #4C1D95);
	}
	
	.data-step {
		background: linear-gradient(135deg, #EC4899, #831843);
	}
	
	.step-content h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}
	
	.step-content p {
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.6;
		margin-bottom: 1.5rem;
		max-width: 600px;
	}
	
	/* Command Bubble */
	.command-bubble {
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.sound-wave {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 4px;
		height: 40px;
	}
	
	.sound-bar {
		width: 4px;
		height: 20px;
		background: #3B82F6;
		border-radius: 2px;
		animation: soundWave 1.2s ease-in-out infinite;
	}
	
	.sound-bar:nth-child(1) { animation-delay: 0s; }
	.sound-bar:nth-child(2) { animation-delay: 0.2s; }
	.sound-bar:nth-child(3) { animation-delay: 0.4s; }
	.sound-bar:nth-child(4) { animation-delay: 0.2s; }
	.sound-bar:nth-child(5) { animation-delay: 0s; }
	
	@keyframes soundWave {
		0%, 100% { height: 20px; }
		50% { height: 40px; }
	}
	
	.command-text {
		color: #60A5FA;
		font-weight: 500;
		text-align: center;
	}
	
	/* Agent Processing */
	.agent-processing {
		background: rgba(139, 92, 246, 0.1);
		border: 1px solid rgba(139, 92, 246, 0.2);
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	
	.processing-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(139, 92, 246, 0.2);
		position: relative;
	}
	
	.processing-icon:after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(139, 92, 246, 0.6);
		transform: translate(-50%, -50%);
		animation: pulse 1.5s infinite;
	}
	
	@keyframes pulse {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.8;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.6);
			opacity: 0;
		}
	}
	
	.processing-steps {
		flex: 1;
	}
	
	.processing-step {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	
	.processing-step:last-child {
		margin-bottom: 0;
	}
	
	.step-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}
	
	.step-progress {
		width: 0;
		height: 4px;
		background: linear-gradient(90deg, #8B5CF6, #EC4899);
		border-radius: 2px;
		animation: progress 1.5s forwards;
		animation-delay: var(--delay, 0s);
	}
	
	@keyframes progress {
		0% { width: 0; }
		100% { width: 100px; }
	}
	
	/* Completion Card */
	.completion-card {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: 12px;
		overflow: hidden;
	}
	
	.card-header {
		background: rgba(16, 185, 129, 0.2);
		padding: 0.75rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #10B981;
		font-weight: 600;
	}
	
	.card-body {
		padding: 1.25rem;
	}
	
	.card-body h4 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
	}
	
	.card-body p {
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 1rem;
	}
	
	.card-details {
		display: flex;
		gap: 1.5rem;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Marketplace Section */
	.marketplace-section {
		padding: 8rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
	}
	
	.marketplace-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.marketplace-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin: 3rem 0 4rem;
	}
	
	.vibe-card {
		background: rgba(17, 24, 39, 0.5);
		border: 1px solid rgba(55, 65, 81, 0.3);
		border-radius: 12px;
		padding: 2rem;
		transition: all 0.3s ease;
		position: relative;
		display: flex;
		flex-direction: column;
	}
	
	.vibe-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
		border-color: rgba(139, 92, 246, 0.3);
	}
	
	.vibe-badge {
		position: absolute;
		top: -10px;
		left: 20px;
		background: linear-gradient(135deg, #8B5CF6, #6366F1);
		color: white;
		padding: 0.4rem 1rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
	}
	
	.vibe-card h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 1.5rem 0 1rem;
	}
	
	.vibe-card p {
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.6;
		margin-bottom: 2rem;
		min-height: 4.8rem;
	}
	
	.vibe-creator {
		display: flex;
		align-items: center;
		margin-top: auto;
		margin-bottom: 1.5rem;
	}
	
	.creator-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 1rem;
	}
	
	.creator-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.creator-info {
		flex: 1;
	}
	
	.creator-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
	}
	
	.creator-title {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.6);
	}
	
	.vibe-stats {
		text-align: right;
	}
	
	.download-count {
		font-weight: 600;
		font-size: 0.9rem;
		color: #8B5CF6;
	}
	
	.rating {
		font-size: 0.8rem;
		color: #FCD34D;
	}
	
	.vibe-cta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.8rem 1.5rem;
		background: rgba(139, 92, 246, 0.1);
		border: 1px solid rgba(139, 92, 246, 0.3);
		border-radius: 8px;
		color: #8B5CF6;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.3s ease;
	}
	
	.vibe-cta:hover {
		background: rgba(139, 92, 246, 0.2);
		transform: translateY(-2px);
	}
	
	.marketplace-cta {
		text-align: center;
		background: rgba(17, 24, 39, 0.5);
		border: 1px solid rgba(55, 65, 81, 0.3);
		border-radius: 12px;
		padding: 3rem 2rem;
	}
	
	.marketplace-cta h3 {
		font-size: 1.8rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}
	
	.marketplace-cta p {
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 2rem;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.vibe-developer-cta {
		display: inline-flex;
		align-items: center;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #8B5CF6, #6366F1);
		color: white;
		font-weight: 600;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
	}
	
	.vibe-developer-cta:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(139, 92, 246, 0.4);
	}

	/* Call to Action Section */
	.cta-section {
		padding: 8rem 2rem;
		margin: 0 auto;
		text-align: center;
		background: radial-gradient(circle at top, rgba(59, 130, 246, 0.1), transparent 70%);
		opacity: 0;
		transform: translateY(30px);
		transition: all 0.8s ease-out;
	}
	
	.cta-section.visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	.cta-content {
		max-width: 600px;
		margin: 0 auto;
	}
	
	.cta-title {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}
	
	.cta-subtitle {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 3rem;
	}
	
	.waitlist-form {
		display: flex;
		max-width: 500px;
		margin: 0 auto;
		gap: 1rem;
	}
	
	.waitlist-form input {
		flex: 1;
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: white;
		font-size: 1rem;
	}
	
	.waitlist-form input:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.5);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
	}
	
	.waitlist-button {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, #3B82F6, #2563EB);
		color: white;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}
	
	.waitlist-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.section-title {
			font-size: 2.2rem;
		}
		
		.flow-step {
			flex-direction: column;
			padding-left: 30px;
		}
		
		.step-number {
			position: absolute;
			left: 0;
			top: 0;
			transform: translateX(-50%);
			margin-right: 0;
		}
		
		.step-content {
			padding-top: 0;
			padding-left: 1.5rem;
		}
		
		.waitlist-form {
			flex-direction: column;
		}
		
		.waitlist-button {
			width: 100%;
		}
		
		.marketplace-grid {
			grid-template-columns: 1fr;
		}
	}
	
	@media (max-width: 480px) {
		.section-title {
			font-size: 1.8rem;
		}
		
		.cta-title {
			font-size: 2.2rem;
		}
		
		.cta-subtitle {
			font-size: 1rem;
		}
		
		.how-section, .marketplace-section, .cta-section {
			padding: 5rem 1.5rem;
		}
	}

	/* Features Section */
	/* ... existing code ... */
</style>

