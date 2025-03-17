<script lang="ts">
	// Test edit to fix tool calling issues - Debug test
	import Avatar from '$lib/Avatar.svelte';
	import { onMount, tick } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import CustomCursor from '$lib/CustomCursor.svelte';
	import ProcessAnimation from '$lib/ProcessAnimation.svelte';

	// Seeds for generating consistent avatars
	const seeds = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace', 'henry'];

	// Navigation links
	const navLinks = [
		{ label: 'About', url: '/#about' },
		{ label: 'Solution', url: '/#solution' },
		{ label: 'Process', url: '/#process' },
		{ label: 'Join', url: 'https://visioncreator.io/join' }
	];

	// Define sections with proper TypeScript interface
	interface Section {
		id: string;
		title: string;
		subtitle?: string;
		content?: string[];
		callToAction?: string;
		accent?: boolean;
		hasListItems?: boolean;
		listItems?: string[];
		hasSubslides?: boolean;
		subslides?: {
			id: string;
			title: string;
			content: string;
		}[];
	}

	// Define sections
	const sections: Section[] = [
		{
			id: 'hero',
			title: 'Own What You Help Build',
			subtitle: 'A new way to work, earn, and build in the digital economy.',
			callToAction: 'Explore'
		},
		{
			id: 'outdated',
			title: 'THE OUTDATED NATURE OF WORK',
			subtitle: "In today's digital age, traditional work models are hopelessly outdated.",
			content: [
				'Employee: You trade time for money with no ownership or freedom.',
				'Self-Employed: You gain independence but remain chained to trading time for money, with endless stress.'
			],
			callToAction: '',
			accent: true
		},
		{
			id: 'choice',
			title: 'A MISERABLE CHOICE',
			subtitle: 'You face a dilemma:',
			content: [
				'Employee: Create value for someone else\'s vision, trading your time for a paycheck while never fully realizing your potential or building lasting equity.',
				'Self-Employed: Shoulder overwhelming responsibility with little time to breathe.'
			],
			callToAction: ""
		},
		{
			id: 'why',
			title: 'WHY THIS MATTERS',
			subtitle: "This isn't just inconvenient—it degrades your quality of life.",
			content: ['You spend a huge part of your day at work. It should:'],
			hasListItems: true,
			listItems: ['Enhance your well-being.', 'Secure your financial future.'],
			callToAction: ''
		},
		{
			id: 'new-way',
			title: 'A NEW WAY FORWARD',
			subtitle: '',
			content: [
				'Imagine a work model that lets you build assets, collaborate freely, and enjoy income that flows without constant work. Visioncreator is this new way—a path to ownership, freedom, and fulfillment for you.'
			],
			accent: true
		},
		{
			id: 'deserve',
			title: 'WHAT YOU DESERVE',
			subtitle: 'You deserve an organisation form that feels like home. It should offer:',
			hasSubslides: true,
			subslides: [
				{
					id: 'belonging',
					title: 'Belonging',
					content: 'Be part of a community that values you.'
				},
				{
					id: 'autonomy',
					title: 'Autonomy & Agency',
					content: 'Pursue your purpose without restrictions.'
				},
				{
					id: 'security',
					title: 'Financial Security',
					content: 'Build lasting value for yourself and others.'
				},
				{
					id: 'expression',
					title: 'Authentic Expression',
					content: 'Align your work with your true vision.'
				}
			]
		},
		{
			id: 'solution',
			title: 'A NEW WAY TO WORK AND LIVE',
			subtitle: '',
			content: [
				"Imagine being a co-owner, not just a participant. Visioncreator is a Decentralized Autonomous Organization where power belongs to everyone. You propose ideas, vote on decisions, and shape our future together—no bosses, just collective wisdom. Your voice matters in every feature, resource, and goal we set. This isn't just a platform; it's a revolution in collaborative work and life."
			],
			accent: true
		},
		{
			id: 'dao',
			title: 'GOT AN IDEA? SHARE IT!',
			subtitle: '',
			content: [
				"Have an idea or a way to make something better? Post it on our idea board! Whether it's a new feature or a small tweak, this is your chance to shape Visioncreator."
			]
		},
		{
			id: 'implementation',
			title: 'DISCUSS AND VOTE',
			subtitle: '',
			content: [
				'Your idea kicks off a conversation. We discuss it together as a collective, share feedback, and then vote. Get enough votes, and your idea turns into a draft—ready to take the next step.'
			]
		},
		{
			id: 'your-role',
			title: 'FROM DRAFT TO REALITY',
			subtitle: '',
			content: [
				"Now it's yours to run with. Define your draft, set a budget (say, 1500 euros), and take full responsibility to execute it. You're the leader, backed by the community."
			]
		},
		{
			id: 'lifestyle',
			title: 'SUCCESS PAYS OFF',
			subtitle: '',
			content: [
				"Once it's done, we vote again. If it's a win, you get paid—not just in euros, but also in token shares that boost your ownership in Visioncreator."
			]
		},
		{
			id: 'hominio',
			title: 'INTRODUCING HOMINIO',
			subtitle: '',
			content: [
				"We're building our first project with this new kind of organization form.",
				'Hominio is where we begin our journey together.'
			],
			callToAction: 'Be among the founding members.',
			accent: true
		},
		{
			id: 'join',
			title: 'BUILD YOUR FUTURE',
			subtitle: '',
			content: ['Ready to stop building for others and start building for yourself?'],
			callToAction: 'Join Visioncreator today and step into the future of work.',
			accent: true
		}
	];

	// Reactive variables
	let mounted = false;
	let memberCount = 27;
	let scrollY = 0;
	let windowHeight = 0;
	let documentHeight = 0;
	let sectionElements: HTMLElement[] = [];
	let progressPercentage = 0;
	let showWelcome = true;
	let currentSection = 0;
	let currentSubslideIndices: { [key: string]: number } = {};

	// Idea process states for visualization
	const processStates: Record<string, string> = {
		dao: 'idea',
		implementation: 'vote',
		'your-role': 'draft',
		lifestyle: 'reward'
	};

	// Calculate progress
	function updateProgress() {
		if (documentHeight <= windowHeight) {
			progressPercentage = 100;
			return;
		}

		progressPercentage = Math.min(
			100,
			Math.max(0, (scrollY / (documentHeight - windowHeight)) * 100)
		);

		// Hide welcome screen when scrolling down
		if (scrollY > 100 && showWelcome) {
			showWelcome = false;
		}
	}

	// Initialize intersection observer
	function initObserver() {
		const options = {
			root: null,
			rootMargin: '-20% 0px',
			threshold: 0.3
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const id = entry.target.id;

				if (entry.isIntersecting) {
					const index = sections.findIndex((section) => section.id === id);
					if (index >= 0) {
						currentSection = index;

						// Update URL hash without triggering scroll
						const newUrl = window.location.pathname + `#${id}`;
						history.replaceState(null, '', newUrl);
					}
				}
			});
		}, options);

		sectionElements.forEach((el) => observer.observe(el));

		return observer;
	}

	// Scroll to section
	function scrollToSection(index: number) {
		const section = sectionElements[index];
		if (section) {
			section.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// Navigate subslides
	function nextSubslide(sectionId: string) {
		if (!currentSubslideIndices[sectionId]) {
			currentSubslideIndices[sectionId] = 0;
		}

		const section = sections.find((s) => s.id === sectionId);
		if (section?.hasSubslides && section.subslides) {
			const maxIndex = section.subslides.length - 1;
			currentSubslideIndices[sectionId] = Math.min(maxIndex, currentSubslideIndices[sectionId] + 1);
		}
	}

	function prevSubslide(sectionId: string) {
		if (!currentSubslideIndices[sectionId]) {
			currentSubslideIndices[sectionId] = 0;
		}

		currentSubslideIndices[sectionId] = Math.max(0, currentSubslideIndices[sectionId] - 1);
	}

	// Start presentation and hide welcome screen
	function startPresentation() {
		showWelcome = false;
		setTimeout(() => {
			scrollToSection(0);
		}, 100);
	}

	onMount(() => {
		// Initialize current subslide indices
		sections.forEach((section) => {
			if (section.hasSubslides) {
				currentSubslideIndices[section.id] = 0;
			}
		});

		// Get section elements
		sectionElements = sections.map((section) => document.getElementById(section.id) as HTMLElement);

		// Set initial dimensions
		windowHeight = window.innerHeight;
		documentHeight = document.body.scrollHeight;

		// Handle initial hash
		if (window.location.hash) {
			const id = window.location.hash.substring(1);
			const index = sections.findIndex((section) => section.id === id);
			if (index >= 0) {
				showWelcome = false;
				setTimeout(() => {
					scrollToSection(index);
				}, 100);
			}
		}

		// Set up observer
		const observer = initObserver();

		// Event listeners
		const handleScroll = () => {
			scrollY = window.scrollY;
			updateProgress();
		};

		const handleResize = () => {
			windowHeight = window.innerHeight;
			documentHeight = document.body.scrollHeight;
			updateProgress();
		};

		window.addEventListener('scroll', handleScroll);
		window.addEventListener('resize', handleResize);

		// Initial update
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleResize);
			observer.disconnect();
		};
	});
</script>

<!-- Custom Cursor Component -->
<CustomCursor />

<svelte:head>
	<title>Visioncreator | Own Your Future</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window bind:scrollY />

<div class="page-container universe-theme">
	<!-- Progress bar -->
	<div class="progress-container">
		<div class="progress-bar" style="width: {progressPercentage}%"></div>
	</div>

	<!-- Scroll to top button -->
	{#if scrollY > windowHeight && !showWelcome}
		<button
			class="scroll-top-button"
			on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			aria-label="Scroll to top"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M18 15l-6-6-6 6" />
			</svg>
		</button>
	{/if}

	<!-- Welcome screen -->
	{#if showWelcome}
		<div class="welcome-screen" transition:fade={{ duration: 300 }}>
			<div class="glow-background spec-background">
				<div class="glow glow-1"></div>
				<div class="glow glow-2"></div>
				<div class="grid-lines"></div>
				
				<!-- Adding particles to welcome screen -->
				<div class="particles">
					<div class="particle p1"></div>
					<div class="particle p2"></div>
					<div class="particle p3"></div>
					<div class="particle p4"></div>
					<div class="particle p5"></div>
					<div class="particle p6"></div>
					<div class="particle p7"></div>
					<div class="particle p8"></div>
					<div class="particle p9"></div>
					<div class="particle p10"></div>
					<div class="particle p11"></div>
					<div class="particle p12"></div>
					<div class="particle p13"></div>
					<div class="particle p14"></div>
					<div class="particle p15"></div>
				</div>

				<!-- 3D floating elements -->
				<div class="floating-elements">
					<div class="floating-cube cube-1"></div>
					<div class="floating-cube cube-2"></div>
					<div class="floating-tech tech-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5z"></path>
							<path d="M2 17l10 5 10-5"></path>
							<path d="M2 12l10 5 10-5"></path>
						</svg>
					</div>
					<div class="floating-tech tech-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect width="8" height="8" x="2" y="2" rx="1"></rect>
							<path d="M14 2c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1h-2"></path>
							<rect width="8" height="8" x="14" y="14" rx="1"></rect>
							<path d="M10 14c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1h2"></path>
						</svg>
					</div>
				</div>
			</div>

			<!-- New modern welcome content inspired by Specify, with Svelte transitions -->
			<div class="welcome-content modern-content">
				<div class="header-badge" in:fly={{ y: -20, duration: 500 }}>
					New
				</div>
				
				<h1 class="modern-title" in:fade={{ duration: 800, delay: 300 }}>
					<span class="gradient-text">Own What You Help Build</span>
					<span class="subtitle-text">Visioncreator</span>
				</h1>
				
				<p class="modern-description" in:fade={{ duration: 800, delay: 500 }}>
					The old system is broken. Create a life of value, freedom, and abundance through collaborative entrepreneurship.
				</p>

				<div class="feature-cards">
					{#each ['Ownership', 'Autonomy', 'Security'] as feature, i}
						<div class="feature-card" in:fly={{ y: 30, duration: 600, delay: 600 + i * 100 }}>
							<div class="feature-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
							<h3>{feature}</h3>
							<p>
								{#if feature === 'Ownership'}
									Co-own the organization instead of just working for it
								{:else if feature === 'Autonomy'}
									Pursue your purpose without traditional restrictions
								{:else}
									Build lasting value for yourself and others
								{/if}
							</p>
						</div>
					{/each}
				</div>

				<div class="cta-group" in:scale={{ duration: 600, delay: 1000, start: 0.9 }}>
					<button class="btn-primary" on:click={startPresentation}>
						Start Building
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</button>
					<button class="btn-secondary" on:click={startPresentation}>Explore</button>
				</div>
				
				<div class="companies" in:fade={{ duration: 800, delay: 1200 }}>
					<p class="trusted-by">Already trusted by forward-thinking teams</p>
					<div class="company-logos">
						<div class="company-logo"></div>
						<div class="company-logo"></div>
						<div class="company-logo"></div>
						<div class="company-logo"></div>
					</div>
				</div>
				
				<!-- Join CTA at the bottom of the welcome screen -->
				<div class="join-cta" in:fade={{ duration: 800, delay: 1400 }}>
					<button class="btn-primary-large" on:click={startPresentation}>
						Explore
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main section content -->
	<main class="sections-container modern-sections">
		<!-- Single global glow background -->
		<div class="glow-background spec-background">
			<div class="glow glow-1"></div>
			<div class="glow glow-2"></div>
			<div class="grid-lines"></div>
			
			<!-- Adding the missing particles -->
			<div class="particles">
				<div class="particle p1"></div>
				<div class="particle p2"></div>
				<div class="particle p3"></div>
				<div class="particle p4"></div>
				<div class="particle p5"></div>
				<div class="particle p6"></div>
				<div class="particle p7"></div>
				<div class="particle p8"></div>
				<div class="particle p9"></div>
				<div class="particle p10"></div>
				<div class="particle p11"></div>
				<div class="particle p12"></div>
				<div class="particle p13"></div>
				<div class="particle p14"></div>
				<div class="particle p15"></div>
			</div>
		</div>

		<!-- Modern header with fixed navigation -->
		<header class="modern-header" in:fly={{ y: -100, duration: 800, easing: quintOut }}>
			<div class="logo">
				<img src="/logo.png" alt="Visioncreator Logo" class="logo-image" />
				<span class="logo-text">Visioncreator</span>
			</div>
			<nav class="modern-nav">
				{#each navLinks as link}
					<a href={link.url} class="nav-link">{link.label}</a>
				{/each}
			</nav>
			<div class="header-actions">
				<button class="btn-outline">Sign In</button>
				<button class="btn-primary">Build With Us</button>
			</div>
		</header>

		{#each sections as section, i}
			<section id={section.id} class="section" class:accent={section.accent}>
				<div class="section-content" class:accent-content={section.accent}>
					{#if section.id === 'hero'}
						<div class="hero-section">
							<div class="hero-personal">
								<div class="hero-image-container" in:scale={{ duration: 800, delay: 200 }}>
									<img src="/images/chielo_-43.JPG" alt="Chieloka Jairus" class="hero-image" />
									<div class="image-overlay"></div>
								</div>
								
								<div class="hero-story">
									<h1 class="hero-title" in:fly={{ y: -20, duration: 600, delay: 300 }}>
										Own What You Help Build
									</h1>
									
									<div class="hero-intro" in:fly={{ y: 20, duration: 600, delay: 450 }}>
										<p class="personal-quote">
											"I was tired of building value for others without sharing in the ownership."
										</p>
										<p class="personal-story">
											After years of watching my work enrich companies while I remained stuck in the same position,
											I knew there had to be a better way. This is the solution I wish I had found years ago.
										</p>
									</div>
									
									<div class="hero-description" in:fly={{ y: 20, duration: 600, delay: 550 }}>
										<p>A new way to work, earn, and build in the digital economy.</p>
									</div>
									
									<div class="hero-cta" in:fly={{ y: 20, duration: 600, delay: 700 }}>
										<button class="btn-primary-large">
											Explore
										</button>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'outdated'}
						<div class="problem-section">
							<div class="problem-subtitle" in:fly={{ y: 20, duration: 500, delay: 400 }}>
								<p>In today's digital age, traditional work models are hopelessly outdated.</p>
							</div>

							<div class="personal-experience" in:fly={{ y: 20, duration: 500, delay: 450 }}>
								<p>
									For years, I felt trapped in this system - creating value that I couldn't own, 
									investing my time and talent into projects where success meant someone else's profit.
								</p>
							</div>
							
							<div class="comparison-cards">
								<div class="comparison-card" in:fly={{ x: -30, duration: 500, delay: 500 }}>
									<div class="comparison-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
											<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
										</svg>
									</div>
									<h3>Employee</h3>
									<ul class="comparison-list">
										<li>Trade time for money with no ownership</li>
										<li>Limited growth potential and income ceiling</li>
										<li>Building someone else's dream</li>
										<li>Security is an illusion (layoffs, restructuring)</li>
										<li>Little control over your daily schedule</li>
									</ul>
									<div class="personal-note">
										<p>"I watched my work make millions for companies while I remained on the same salary."</p>
									</div>
								</div>
								
								<div class="comparison-card" in:fly={{ x: 30, duration: 500, delay: 600 }}>
									<div class="comparison-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
											<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
											<line x1="12" y1="19" x2="12" y2="23"></line>
											<line x1="8" y1="23" x2="16" y2="23"></line>
										</svg>
									</div>
									<h3>Self-Employed</h3>
									<ul class="comparison-list">
										<li>Endless stress and responsibility</li>
										<li>Still trading time for money</li>
										<li>Dealing with unstable income</li>
										<li>No real freedom (clients become your bosses)</li>
										<li>Burnout from wearing too many hats</li>
									</ul>
									<div class="personal-note">
										<p>"Going solo meant more freedom but also meant living project-to-project with no stability."</p>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'choice'}
						<div class="dilemma-section">
							<div class="dilemma-subtitle" in:fly={{ y: 20, duration: 500, delay: 400 }}>
								<p>You face a dilemma:</p>
							</div>
							
							<div class="dilemma-paths">
								<div class="dilemma-path employee" in:fly={{ x: -30, duration: 500, delay: 500 }}>
									<div class="path-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
											<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
										</svg>
									</div>
									<h3>Employee</h3>
									<p>Create value for someone else's vision, trading your time for a paycheck while never fully realizing your potential or building lasting equity.</p>
									<p class="path-consequence">Result: Financial ceiling, minimal autonomy, and a sense of unfulfillment.</p>
								</div>
								
								<div class="path-divider" in:scale={{ start: 0.5, duration: 400, delay: 700 }}>
									<span>OR</span>
								</div>
								
								<div class="dilemma-path self-employed" in:fly={{ x: 30, duration: 500, delay: 600 }}>
									<div class="path-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
											<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
											<line x1="12" y1="19" x2="12" y2="23"></line>
											<line x1="8" y1="23" x2="16" y2="23"></line>
										</svg>
									</div>
									<h3>Self-Employed</h3>
									<p>Shoulder overwhelming responsibility with little support, constantly trading time for money, chained to your business, and unable to truly scale.</p>
									<p class="path-consequence">Result: Burnout, isolation, and trading one boss for many clients.</p>
								</div>
							</div>
							
							<div class="dilemma-conclusion" in:fly={{ y: 20, duration: 500, delay: 800 }}>
								<p><span class="highlight"></span></p>
							</div>
						</div>
					{:else if section.id === 'why'}
						<div class="why-section">
							<div class="why-subtitle" in:fly={{ y: 20, duration: 500, delay: 400 }}>
								<p>This isn't just inconvenient—it degrades your quality of life.</p>
							</div>
							
							<div class="why-content" in:fly={{ y: 20, duration: 500, delay: 500 }}>
								<p>You spend a huge part of your day at work. It should:</p>
							</div>
							
							<div class="why-items">
								<div class="why-item interactive" in:fly={{ x: -20, duration: 500, delay: 600 }}>
									<div class="item-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
											<path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
											<path d="M9 9h.01"></path>
											<path d="M15 9h.01"></path>
										</svg>
									</div>
									<p>Enhance your well-being.</p>
								</div>
								
								<div class="why-item interactive" in:fly={{ x: 20, duration: 500, delay: 700 }}>
									<div class="item-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
										</svg>
									</div>
									<p>Secure your financial future.</p>
								</div>
							</div>
							
							<div class="why-conclusion" in:fly={{ y: 20, duration: 500, delay: 900 }}>
								<p class="highlight-text"></p>
							</div>
						</div>
					{:else if section.id === 'dao'}
						<ProcessAnimation step="idea" />
						
						<!-- Example idea cards with interactive elements -->
						<div class="idea-cards" in:fade={{ duration: 600, delay: 400 }}>
							<div class="idea-card interactive" in:fly={{ y: 20, duration: 600, delay: 500 }}>
								<div class="idea-header">
									<div class="idea-avatar"></div>
									<div class="idea-author">John D.</div>
								</div>
								<h4>Improve Onboarding Flow</h4>
								<p>Create a more intuitive onboarding experience for new members with interactive tutorials.</p>
								<div class="idea-footer">
									<div class="idea-votes">
										<span class="vote-count">12</span>
										<span class="vote-label">votes</span>
									</div>
									<button class="vote-button interactive">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 8v8m0-8l-4 4m4-4l4 4"></path>
										</svg>
										Vote
									</button>
								</div>
							</div>
							
							<div class="idea-card interactive" in:fly={{ y: 20, duration: 600, delay: 600 }}>
								<div class="idea-header">
									<div class="idea-avatar"></div>
									<div class="idea-author">Alice M.</div>
								</div>
								<h4>Centralized Documentation Hub</h4>
								<p>Build a searchable knowledge base for all project documentation and guidelines.</p>
								<div class="idea-footer">
									<div class="idea-votes">
										<span class="vote-count">8</span>
										<span class="vote-label">votes</span>
									</div>
									<button class="vote-button interactive">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 8v8m0-8l-4 4m4-4l4 4"></path>
										</svg>
										Vote
									</button>
								</div>
							</div>
							
							<div class="idea-card interactive" in:fly={{ y: 20, duration: 600, delay: 700 }}>
								<div class="idea-header">
									<div class="idea-avatar"></div>
									<div class="idea-author">Mark T.</div>
								</div>
								<h4>Community Events Calendar</h4>
								<p>Create a dedicated calendar feature for upcoming events, workshops, and collaborative sessions.</p>
								<div class="idea-footer">
									<div class="idea-votes">
										<span class="vote-count">6</span>
										<span class="vote-label">votes</span>
									</div>
									<button class="vote-button interactive">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 8v8m0-8l-4 4m4-4l4 4"></path>
										</svg>
										Vote
									</button>
								</div>
							</div>
						</div>
					{:else if section.id === 'solution'}
						<div class="solution-cards" in:fade={{ duration: 600, delay: 400 }}>
							<div class="solution-card interactive" in:fly={{ y: 20, duration: 600, delay: 500 }}>
								<div class="solution-icon">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
										<path d="M13.73 21a2 2 0 01-3.46 0"></path>
									</svg>
								</div>
								<h4>Propose & Vote</h4>
								<p>Share your ideas and vote on platform decisions. Every voice has equal power to shape our future.</p>
								<div class="solution-tag">Decentralized Decision-Making</div>
							</div>
							
							<div class="solution-card interactive" in:fly={{ y: 20, duration: 600, delay: 600 }}>
								<div class="solution-icon">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
										<circle cx="8.5" cy="7" r="4"></circle>
										<path d="M20 8v6"></path>
										<path d="M23 11h-6"></path>
									</svg>
								</div>
								<h4>Join the Collective</h4>
								<p>Become a co-owner of Visioncreator and contribute based on your unique skills and interests.</p>
								<div class="solution-tag">Collaborative Ownership</div>
							</div>
							
							<div class="solution-card interactive" in:fly={{ y: 20, duration: 600, delay: 700 }}>
								<div class="solution-icon">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
									</svg>
								</div>
								<h4>Build Your Security</h4>
								<p>Earn not just payment for your work, but ownership tokens that increase in value as we grow together.</p>
								<div class="solution-tag">Long-term Asset Building</div>
							</div>
						</div>
					{:else if section.id === 'implementation'}
						<ProcessAnimation step="vote" />
					{:else if section.id === 'your-role'}
						<ProcessAnimation step="draft" />
						
						<div class="budget-calculator interactive" in:fade={{ duration: 600, delay: 400 }}>
							<div class="budget-header" in:fly={{ y: 20, duration: 500, delay: 500 }}>
								<h4>Draft Your Project Budget</h4>
								<p>Take ownership of your idea by defining its scope and resources</p>
							</div>
							
							<div class="budget-sliders" in:fly={{ y: 20, duration: 500, delay: 600 }}>
								<div class="budget-slider">
									<div class="slider-label">
										<span>Development Time</span>
										<span class="slider-value">2 weeks</span>
									</div>
									<div class="slider-track">
										<div class="slider-fill" style="width: 40%"></div>
										<div class="slider-thumb" style="left: 40%"></div>
									</div>
								</div>
								
								<div class="budget-slider">
									<div class="slider-label">
										<span>Complexity</span>
										<span class="slider-value">Medium</span>
									</div>
									<div class="slider-track">
										<div class="slider-fill" style="width: 50%"></div>
										<div class="slider-thumb" style="left: 50%"></div>
									</div>
								</div>
								
								<div class="budget-slider">
									<div class="slider-label">
										<span>Team Size</span>
										<span class="slider-value">3 people</span>
									</div>
									<div class="slider-track">
										<div class="slider-fill" style="width: 60%"></div>
										<div class="slider-thumb" style="left: 60%"></div>
									</div>
								</div>
							</div>
							
							<div class="budget-result" in:fly={{ y: 20, duration: 500, delay: 800 }}>
								<div class="budget-amount">€1,500</div>
								<div class="budget-estimate">Estimated Budget</div>
								<button class="budget-submit interactive">Submit Draft</button>
							</div>
							
							<div class="budget-rewards" in:fly={{ y: 20, duration: 500, delay: 900 }}>
								<div class="reward-item">
									<div class="reward-icon">€</div>
									<div class="reward-info">
										<span class="reward-value">€1,500</span>
										<span class="reward-label">Payment Upon Completion</span>
									</div>
								</div>
								
								<div class="reward-item">
									<div class="reward-icon">VC</div>
									<div class="reward-info">
										<span class="reward-value">+5.7%</span>
										<span class="reward-label">Ownership Tokens</span>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'lifestyle'}
						<ProcessAnimation step="reward" />
						
						<div class="token-showcase" in:fade={{ duration: 600, delay: 400 }}>
							<div class="token-trophies" in:fly={{ y: 20, duration: 500, delay: 500 }}>
								<div class="trophy-container">
									<div class="trophy euro-trophy interactive">
										<div class="trophy-icon">€</div>
										<div class="trophy-glow"></div>
									</div>
									<div class="trophy-label">Direct Payment</div>
									<div class="trophy-amount">€1,500</div>
									<div class="trophy-description">Immediate compensation for your completed work</div>
								</div>
								
								<div class="token-divider">
									<span>+</span>
								</div>
								
								<div class="trophy-container">
									<div class="trophy vc-trophy interactive">
										<div class="trophy-icon">VC</div>
										<div class="trophy-glow"></div>
									</div>
									<div class="trophy-label">Ownership Tokens</div>
									<div class="trophy-amount">+5.7%</div>
									<div class="trophy-description">Increased stake in Visioncreator's future growth</div>
								</div>
							</div>
							
							<div class="token-benefits" in:fly={{ y: 20, duration: 500, delay: 700 }}>
								<h4>Benefits of Ownership</h4>
								<div class="benefits-list">
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
											</svg>
										</div>
										<div class="benefit-text">Grow your stake as the platform grows</div>
									</div>
									
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
										<div class="benefit-text">Earn passive income through profit sharing</div>
									</div>
									
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
											</svg>
										</div>
										<div class="benefit-text">Participate in governance decisions</div>
									</div>
									
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"></path>
											</svg>
										</div>
										<div class="benefit-text">Build long-term wealth and security</div>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'hominio'}
						<div class="hominio-container" in:fade={{ duration: 600, delay: 400 }}>
							<div class="vision-statement" in:fly={{ y: 20, duration: 600, delay: 500 }}>
								<p class="vision-intro" in:fly={{ y: 20, duration: 600, delay: 500 }}>
									<strong>Imagine a world where every organization is built and owned by its community.</strong>
								</p>
								<p class="vision-description" in:fly={{ y: 20, duration: 600, delay: 700 }}>
									Where everyone who becomes an owner, and success is shared by all.
								</p>
								<p class="vision-content" in:fly={{ y: 20, duration: 600, delay: 900 }}>
									At Visioncreator, we're getting a step closer to bring this vision into reality. 
									Where we invest together, build together and own together.
								</p>
							</div>
							
							<div class="introducing-text" in:fly={{ y: 20, duration: 600, delay: 1000 }}>
								<h3 class="introducing-title">Introducing our first community built and owned project</h3>
							</div>
							
							<div class="hominio-logo-large interactive" in:scale={{ duration: 700, delay: 1100 }}>
								<h2 class="hominio-title">HOMINIO</h2>
								<div class="logo-glow-large"></div>
							</div>

							<div class="hominio-description" in:fly={{ y: 20, duration: 500, delay: 1300 }}>
								<p>Our first project is the technical infrastructure that enables new organization forms to come to life.</p>
							</div>
						</div>
					{:else if section.id === 'join'}
						<div class="join-section text-center">
							<div class="join-content" in:fly={{ y: 20, duration: 600, delay: 400 }}>
								<p>Ready to stop building for others and start building for yourself?</p>
							</div>
							
							<div class="join-buttons" in:fly={{ y: 20, duration: 600, delay: 600 }}>
								<button class="btn-primary-large">Build With Us</button>
								<button class="btn-outline-large">Learn More</button>
							</div>
						</div>
					{:else if section.id === 'new-way'}
						<div class="minimalist-container" in:fade={{ duration: 800, delay: 300 }}>
							<div class="minimalist-content">
								<div class="path-icon" in:scale={{ duration: 700, delay: 500, start: 0.7 }}>
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M9 6l6 6-6 6"></path>
									</svg>
									<div class="path-glow"></div>
								</div>
								
								<div class="minimalist-statement" in:fly={{ y: 20, duration: 600, delay: 600 }}>
									<p class="statement-text">Imagine a work model that lets you build assets, collaborate freely, and enjoy income that flows without constant work.</p>
								</div>
								
								<div class="minimalist-highlight" in:fly={{ y: 20, duration: 600, delay: 800 }}>
									<h3>Visioncreator is this new way—</h3>
									<div class="highlight-line"></div>
									<h4>a path to ownership, freedom, and fulfillment for you.</h4>
								</div>
							</div>
						</div>
					{:else if section.id === 'deserve'}
						<div class="deserve-container" in:fade={{ duration: 800, delay: 300 }}>
							<div class="deserve-content">
								<div class="deserve-statement" in:fly={{ y: 20, duration: 600, delay: 600 }}>
									<p class="statement-text">You deserve an organisation form that feels like home. It should offer:</p>
								</div>
								
								<div class="deserve-list">
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 800 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</div>
										<div class="deserve-text">Belonging</div>
										<div class="deserve-description">Be part of a community that values you.</div>
									</div>
									
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 900 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
										<div class="deserve-text">Autonomy & Agency</div>
										<div class="deserve-description">Pursue your purpose without restrictions.</div>
									</div>
									
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 1000 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
											</svg>
										</div>
										<div class="deserve-text">Financial Security</div>
										<div class="deserve-description">Build lasting value for yourself and others.</div>
									</div>
									
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 1100 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"></path>
											</svg>
										</div>
										<div class="deserve-text">Authentic Expression</div>
										<div class="deserve-description">Align your work with your true vision.</div>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'problem'}
						<div class="problem-section">
							<div class="problem-subtitle" in:fly={{ y: 20, duration: 500, delay: 400 }}>
								<p>In today's digital age, traditional work models are hopelessly outdated.</p>
							</div>
							
							<div class="comparison-cards">
								<div class="comparison-card" in:fly={{ x: -30, duration: 500, delay: 500 }}>
									<div class="comparison-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
											<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
										</svg>
									</div>
									<h3>Employee</h3>
									<ul class="comparison-list">
										<li>Trade time for money with no ownership</li>
										<li>Limited growth potential and income ceiling</li>
										<li>Building someone else's dream</li>
										<li>Security is an illusion (layoffs, restructuring)</li>
										<li>Little control over your daily schedule</li>
									</ul>
								</div>
								
								<div class="comparison-card" in:fly={{ x: 30, duration: 500, delay: 600 }}>
									<div class="comparison-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
											<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
											<line x1="12" y1="19" x2="12" y2="23"></line>
											<line x1="8" y1="23" x2="16" y2="23"></line>
										</svg>
									</div>
									<h3>Self-Employed</h3>
									<ul class="comparison-list">
										<li>Endless stress and responsibility</li>
										<li>Still trading time for money</li>
										<li>Dealing with unstable income</li>
										<li>No real freedom (clients become your bosses)</li>
										<li>Burnout from wearing too many hats</li>
									</ul>
								</div>
							</div>
							
							<div class="problem-cta" in:fly={{ y: 20, duration: 500, delay: 800 }}>
								<p>Neither path fits your life in the modern world. <span class="highlight">You deserve better.</span></p>
							</div>
						</div>
					{:else if section.id === 'dilemma'}
						<div class="dilemma-section">
							<div class="dilemma-subtitle" in:fly={{ y: 20, duration: 500, delay: 400 }}>
								<p>You face a dilemma:</p>
							</div>
							
							<div class="dilemma-paths">
								<div class="dilemma-path employee" in:fly={{ x: -30, duration: 500, delay: 500 }}>
									<div class="path-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
											<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
										</svg>
									</div>
									<h3>Employee</h3>
									<p>Create value for someone else's vision, trading your time for a paycheck while never fully realizing your potential or building lasting equity.</p>
									<p class="path-consequence">Result: Financial ceiling, minimal autonomy, and a sense of unfulfillment.</p>
								</div>
								
								<div class="path-divider" in:scale={{ start: 0.5, duration: 400, delay: 700 }}>
									<span>OR</span>
								</div>
								
								<div class="dilemma-path self-employed" in:fly={{ x: 30, duration: 500, delay: 600 }}>
									<div class="path-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
											<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
											<line x1="12" y1="19" x2="12" y2="23"></line>
											<line x1="8" y1="23" x2="16" y2="23"></line>
										</svg>
									</div>
									<h3>Self-Employed</h3>
									<p>Shoulder overwhelming responsibility with little support, constantly trading time for money, chained to your business, and unable to truly scale.</p>
									<p class="path-consequence">Result: Burnout, isolation, and trading one boss for many clients.</p>
								</div>
							</div>
							
							<div class="dilemma-conclusion" in:fly={{ y: 20, duration: 500, delay: 800 }}>
								<p><span class="highlight"></span></p>
							</div>
						</div>
					{:else if section.id === 'why'}
						<div class="why-section">
							<div class="why-subtitle" in:fly={{ y: 20, duration: 500, delay: 400 }}>
								<p>This isn't just inconvenient—it degrades your quality of life.</p>
							</div>
							
							<div class="why-content" in:fly={{ y: 20, duration: 500, delay: 500 }}>
								<p>You spend a huge part of your day at work. It should:</p>
							</div>
							
							<div class="why-items">
								<div class="why-item interactive" in:fly={{ x: -20, duration: 500, delay: 600 }}>
									<div class="item-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
											<path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
											<path d="M9 9h.01"></path>
											<path d="M15 9h.01"></path>
										</svg>
									</div>
									<p>Enhance your well-being.</p>
								</div>
								
								<div class="why-item interactive" in:fly={{ x: 20, duration: 500, delay: 700 }}>
									<div class="item-icon">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
										</svg>
									</div>
									<p>Secure your financial future.</p>
								</div>
							</div>
							
							<div class="why-conclusion" in:fly={{ y: 20, duration: 500, delay: 900 }}>
								<p class="highlight-text"></p>
							</div>
						</div>
					{:else if section.id === 'dao'}
						<ProcessAnimation step="idea" />
						
						<!-- Example idea cards with interactive elements -->
						<div class="idea-cards" in:fade={{ duration: 600, delay: 400 }}>
							<div class="idea-card interactive" in:fly={{ y: 20, duration: 600, delay: 500 }}>
								<div class="idea-header">
									<div class="idea-avatar"></div>
									<div class="idea-author">John D.</div>
								</div>
								<h4>Improve Onboarding Flow</h4>
								<p>Create a more intuitive onboarding experience for new members with interactive tutorials.</p>
								<div class="idea-footer">
									<div class="idea-votes">
										<span class="vote-count">12</span>
										<span class="vote-label">votes</span>
									</div>
									<button class="vote-button interactive">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 8v8m0-8l-4 4m4-4l4 4"></path>
										</svg>
										Vote
									</button>
								</div>
							</div>
							
							<div class="idea-card interactive" in:fly={{ y: 20, duration: 600, delay: 600 }}>
								<div class="idea-header">
									<div class="idea-avatar"></div>
									<div class="idea-author">Alice M.</div>
								</div>
								<h4>Centralized Documentation Hub</h4>
								<p>Build a searchable knowledge base for all project documentation and guidelines.</p>
								<div class="idea-footer">
									<div class="idea-votes">
										<span class="vote-count">8</span>
										<span class="vote-label">votes</span>
									</div>
									<button class="vote-button interactive">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 8v8m0-8l-4 4m4-4l4 4"></path>
										</svg>
										Vote
									</button>
								</div>
							</div>
							
							<div class="idea-card interactive" in:fly={{ y: 20, duration: 600, delay: 700 }}>
								<div class="idea-header">
									<div class="idea-avatar"></div>
									<div class="idea-author">Mark T.</div>
								</div>
								<h4>Community Events Calendar</h4>
								<p>Create a dedicated calendar feature for upcoming events, workshops, and collaborative sessions.</p>
								<div class="idea-footer">
									<div class="idea-votes">
										<span class="vote-count">6</span>
										<span class="vote-label">votes</span>
									</div>
									<button class="vote-button interactive">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M12 8v8m0-8l-4 4m4-4l4 4"></path>
										</svg>
										Vote
									</button>
								</div>
							</div>
						</div>
					{:else if section.id === 'solution'}
						<div class="solution-cards" in:fade={{ duration: 600, delay: 400 }}>
							<div class="solution-card interactive" in:fly={{ y: 20, duration: 600, delay: 500 }}>
								<div class="solution-icon">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
										<path d="M13.73 21a2 2 0 01-3.46 0"></path>
									</svg>
								</div>
								<h4>Propose & Vote</h4>
								<p>Share your ideas and vote on platform decisions. Every voice has equal power to shape our future.</p>
								<div class="solution-tag">Decentralized Decision-Making</div>
							</div>
							
							<div class="solution-card interactive" in:fly={{ y: 20, duration: 600, delay: 600 }}>
								<div class="solution-icon">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
										<circle cx="8.5" cy="7" r="4"></circle>
										<path d="M20 8v6"></path>
										<path d="M23 11h-6"></path>
									</svg>
								</div>
								<h4>Join the Collective</h4>
								<p>Become a co-owner of Visioncreator and contribute based on your unique skills and interests.</p>
								<div class="solution-tag">Collaborative Ownership</div>
							</div>
							
							<div class="solution-card interactive" in:fly={{ y: 20, duration: 600, delay: 700 }}>
								<div class="solution-icon">
									<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
									</svg>
								</div>
								<h4>Build Your Security</h4>
								<p>Earn not just payment for your work, but ownership tokens that increase in value as we grow together.</p>
								<div class="solution-tag">Long-term Asset Building</div>
							</div>
						</div>
					{:else if section.id === 'implementation'}
						<ProcessAnimation step="vote" />
					{:else if section.id === 'your-role'}
						<ProcessAnimation step="draft" />
						
						<div class="budget-calculator interactive" in:fade={{ duration: 600, delay: 400 }}>
							<div class="budget-header" in:fly={{ y: 20, duration: 500, delay: 500 }}>
								<h4>Draft Your Project Budget</h4>
								<p>Take ownership of your idea by defining its scope and resources</p>
							</div>
							
							<div class="budget-sliders" in:fly={{ y: 20, duration: 500, delay: 600 }}>
								<div class="budget-slider">
									<div class="slider-label">
										<span>Development Time</span>
										<span class="slider-value">2 weeks</span>
									</div>
									<div class="slider-track">
										<div class="slider-fill" style="width: 40%"></div>
										<div class="slider-thumb" style="left: 40%"></div>
									</div>
								</div>
								
								<div class="budget-slider">
									<div class="slider-label">
										<span>Complexity</span>
										<span class="slider-value">Medium</span>
									</div>
									<div class="slider-track">
										<div class="slider-fill" style="width: 50%"></div>
										<div class="slider-thumb" style="left: 50%"></div>
									</div>
								</div>
								
								<div class="budget-slider">
									<div class="slider-label">
										<span>Team Size</span>
										<span class="slider-value">3 people</span>
									</div>
									<div class="slider-track">
										<div class="slider-fill" style="width: 60%"></div>
										<div class="slider-thumb" style="left: 60%"></div>
									</div>
								</div>
							</div>
							
							<div class="budget-result" in:fly={{ y: 20, duration: 500, delay: 800 }}>
								<div class="budget-amount">€1,500</div>
								<div class="budget-estimate">Estimated Budget</div>
								<button class="budget-submit interactive">Submit Draft</button>
							</div>
							
							<div class="budget-rewards" in:fly={{ y: 20, duration: 500, delay: 900 }}>
								<div class="reward-item">
									<div class="reward-icon">€</div>
									<div class="reward-info">
										<span class="reward-value">€1,500</span>
										<span class="reward-label">Payment Upon Completion</span>
									</div>
								</div>
								
								<div class="reward-item">
									<div class="reward-icon">VC</div>
									<div class="reward-info">
										<span class="reward-value">+5.7%</span>
										<span class="reward-label">Ownership Tokens</span>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'lifestyle'}
						<ProcessAnimation step="reward" />
						
						<div class="token-showcase" in:fade={{ duration: 600, delay: 400 }}>
							<div class="token-trophies" in:fly={{ y: 20, duration: 500, delay: 500 }}>
								<div class="trophy-container">
									<div class="trophy euro-trophy interactive">
										<div class="trophy-icon">€</div>
										<div class="trophy-glow"></div>
									</div>
									<div class="trophy-label">Direct Payment</div>
									<div class="trophy-amount">€1,500</div>
									<div class="trophy-description">Immediate compensation for your completed work</div>
								</div>
								
								<div class="token-divider">
									<span>+</span>
								</div>
								
								<div class="trophy-container">
									<div class="trophy vc-trophy interactive">
										<div class="trophy-icon">VC</div>
										<div class="trophy-glow"></div>
									</div>
									<div class="trophy-label">Ownership Tokens</div>
									<div class="trophy-amount">+5.7%</div>
									<div class="trophy-description">Increased stake in Visioncreator's future growth</div>
								</div>
							</div>
							
							<div class="token-benefits" in:fly={{ y: 20, duration: 500, delay: 700 }}>
								<h4>Benefits of Ownership</h4>
								<div class="benefits-list">
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
											</svg>
										</div>
										<div class="benefit-text">Grow your stake as the platform grows</div>
									</div>
									
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
										<div class="benefit-text">Earn passive income through profit sharing</div>
									</div>
									
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
											</svg>
										</div>
										<div class="benefit-text">Participate in governance decisions</div>
									</div>
									
									<div class="benefit-item interactive">
										<div class="benefit-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"></path>
											</svg>
										</div>
										<div class="benefit-text">Build long-term wealth and security</div>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'hominio'}
						<div class="hominio-container" in:fade={{ duration: 600, delay: 400 }}>
							<div class="vision-statement" in:fly={{ y: 20, duration: 600, delay: 500 }}>
								<p class="vision-intro" in:fly={{ y: 20, duration: 600, delay: 500 }}>
									<strong>Imagine a world where every organization is built and owned by its community.</strong>
								</p>
								<p class="vision-description" in:fly={{ y: 20, duration: 600, delay: 700 }}>
									Where everyone who becomes an owner, and success is shared by all.
								</p>
								<p class="vision-content" in:fly={{ y: 20, duration: 600, delay: 900 }}>
									At Visioncreator, we're getting a step closer to bring this vision into reality. 
									Where we invest together, build together and own together.
								</p>
							</div>
							
							<div class="introducing-text" in:fly={{ y: 20, duration: 600, delay: 1000 }}>
								<h3 class="introducing-title">Introducing our first community built and owned project</h3>
							</div>
							
							<div class="hominio-logo-large interactive" in:scale={{ duration: 700, delay: 1100 }}>
								<h2 class="hominio-title">HOMINIO</h2>
								<div class="logo-glow-large"></div>
							</div>

							<div class="hominio-description" in:fly={{ y: 20, duration: 500, delay: 1300 }}>
								<p>Our first project is the technical infrastructure that enables new organization forms to come to life.</p>
							</div>
						</div>
					{:else if section.id === 'join'}
						<div class="join-section text-center">
							<div class="join-content" in:fly={{ y: 20, duration: 600, delay: 400 }}>
								<p>Ready to stop building for others and start building for yourself?</p>
							</div>
							
							<div class="join-buttons" in:fly={{ y: 20, duration: 600, delay: 600 }}>
								<button class="btn-primary-large">Build With Us</button>
								<button class="btn-outline-large">Learn More</button>
							</div>
						</div>
					{:else if section.id === 'new-way'}
						<div class="minimalist-container" in:fade={{ duration: 800, delay: 300 }}>
							<div class="minimalist-content">
								<div class="path-icon" in:scale={{ duration: 700, delay: 500, start: 0.7 }}>
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M9 6l6 6-6 6"></path>
									</svg>
									<div class="path-glow"></div>
								</div>
								
								<div class="minimalist-statement" in:fly={{ y: 20, duration: 600, delay: 600 }}>
									<p class="statement-text">Imagine a work model that lets you build assets, collaborate freely, and enjoy income that flows without constant work.</p>
								</div>
								
								<div class="minimalist-highlight" in:fly={{ y: 20, duration: 600, delay: 800 }}>
									<h3>Visioncreator is this new way—</h3>
									<div class="highlight-line"></div>
									<h4>a path to ownership, freedom, and fulfillment for you.</h4>
								</div>
							</div>
						</div>
					{:else if section.id === 'deserve'}
						<div class="deserve-container" in:fade={{ duration: 800, delay: 300 }}>
							<div class="deserve-content">
								<div class="deserve-statement" in:fly={{ y: 20, duration: 600, delay: 600 }}>
									<p class="statement-text">You deserve an organisation form that feels like home. It should offer:</p>
								</div>
								
								<div class="deserve-list">
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 800 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</div>
										<div class="deserve-text">Belonging</div>
										<div class="deserve-description">Be part of a community that values you.</div>
									</div>
									
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 900 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
										<div class="deserve-text">Autonomy & Agency</div>
										<div class="deserve-description">Pursue your purpose without restrictions.</div>
									</div>
									
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 1000 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
											</svg>
										</div>
										<div class="deserve-text">Financial Security</div>
										<div class="deserve-description">Build lasting value for yourself and others.</div>
									</div>
									
									<div class="deserve-item interactive" in:fly={{ y: 20, duration: 600, delay: 1100 }}>
										<div class="deserve-icon">
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
												<path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"></path>
											</svg>
										</div>
										<div class="deserve-text">Authentic Expression</div>
										<div class="deserve-description">Align your work with your true vision.</div>
									</div>
								</div>
							</div>
						</div>
					{:else if section.id === 'vision'}
						<!-- Vision section removed as requested -->
					{/if}

					{#if section.callToAction && !['new-way', 'deserve', 'solution', 'dao', 'implementation', 'your-role', 'lifestyle', 'hominio', 'join', 'vision'].includes(section.id)}
						<div class="cta-button">
							<button class="interactive">{section.callToAction}</button>
						</div>
					{/if}
				</div>
			</section>
		{/each}
	</main>
</div>

<style>
	/* Global styles */
	:global(body) {
		background-color: #050510;
		color: #efefef;
		font-family: 'Inter', sans-serif;
		line-height: 1.5;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		position: relative;
		background-image: 
			radial-gradient(1px 1px at 10% 10%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 50% 10%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 80% 40%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 90% 60%, rgba(255, 255, 255, 0.4) 1px, transparent 0),
			radial-gradient(1px 1px at 75% 85%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 30% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 0);
		background-repeat: repeat;
		background-size: 250px 250px;
	}

	/* Main container */
	.landing-page {
		position: relative;
		width: 100%;
		min-height: 100vh;
		background-color: #000;
		color: #fff;
	}

	/* Progress Bar */
	.progress-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 3px;
		background: rgba(255, 255, 255, 0.1);
		z-index: 1000;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(to right, #7c3aed, #3b82f6);
		width: 0%;
		transition: width 0.3s ease;
	}

	/* Section styling */
	.sections-container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		position: relative;
	}

	.section {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		width: 100%;
		padding: 40px 20px;
		margin-bottom: 40px;
		box-sizing: border-box;
		position: relative;
		backdrop-filter: blur(3px);
		border-radius: 8px;
	}

	.section-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 800px;
		width: 100%;
		margin: 0 auto;
		z-index: 1;
	}

	/* Glow background effects - preserve existing space theme */
	.glow-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: -1; /* Changed from 1 to -1 to fix z-index conflict */
		background-color: #070014;
		/* Very subtle stars - barely visible like in Specify */
		background-image: 
			radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 160px 120px, rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0));
		background-repeat: repeat;
		background-size: 350px 350px;
	}

	.glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.3; /* Increased from 0.2 */
		animation: float 20s infinite ease-in-out;
	}

	.glow-1 {
		width: 50vw;
		height: 50vw;
		background: radial-gradient(circle, rgba(124, 58, 237, 0.8), rgba(139, 92, 246, 0.3));
		top: 20%;
		left: -10%;
		animation-delay: -5s;
	}

	.glow-2 {
		width: 60vw;
		height: 60vw;
		background: radial-gradient(circle, rgba(91, 33, 182, 0.8), rgba(124, 58, 237, 0.3));
		bottom: 10%;
		right: -20%;
		animation-delay: -10s;
	}

	/* Modern Typography styling based on reference images */
	h2 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		line-height: 1.2;
		background: linear-gradient(to right, #fff, #d4d4d8);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.subtitle {
		font-size: 1.25rem;
		opacity: 0.9;
		max-width: 800px;
		margin-bottom: 2rem;
	}

	/* Content blocks styling */
	.content-block {
		background: rgba(30, 30, 40, 0.5);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 2rem;
		margin: 1.5rem 0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
	}

	.content-block:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
	}

	/* Button styling */
	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(90deg, #7c3aed, #4f46e5);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
		cursor: pointer;
		margin-top: 1rem;
	}

	.btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
	}

	.btn.secondary {
		background: transparent;
		border: 2px solid rgba(79, 70, 229, 0.6);
		color: rgba(255, 255, 255, 0.9);
		box-shadow: none;
	}

	.btn.secondary:hover {
		background: rgba(79, 70, 229, 0.1);
	}

	.btn.secondary:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.btn-outline {
		background: transparent;
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.btn-outline:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.5);
	}

	/* Welcome screen */
	.welcome-screen {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.welcome-content {
		position: relative;
		z-index: 10;
		text-align: center;
	}

	.welcome-title {
		font-size: 5rem;
		font-weight: 700;
		margin-bottom: 2rem;
		line-height: 1;
	}

	.title-line {
		background: linear-gradient(to right, #ffffff, #b3b3ff);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: 0 0 30px rgba(179, 179, 255, 0.5);
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
	}

	.creator-text {
		position: relative;
		color: #7c3aed;
		text-shadow: 0 0 20px rgba(124, 58, 237, 0.8);
		background: linear-gradient(to right, #7c3aed, #3b82f6);
		-webkit-background-clip: text;
		background-clip: text;
		margin-left: -0.2em;
	}

	.creator-text::after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 0;
		width: 100%;
		height: 3px;
		background: linear-gradient(90deg, #7c3aed, #3b82f6);
		border-radius: 3px;
	}

	.title-subtitle {
		font-size: 2.5rem;
		font-weight: 300;
		background: linear-gradient(to right, #64ffda, #4f46e5);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		margin-top: 0.5rem;
		letter-spacing: 0.02em;
	}

	/* Floating particles animation */
	.particles {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 3; /* Ensure particles are visible */
	}

	.particle {
		position: absolute;
		width: 6px;
		height: 6px;
		background: rgba(124, 58, 237, 0.5); /* Slightly more visible purple */
		border-radius: 50%;
		pointer-events: none;
		opacity: 0.7; /* Increased opacity */
		box-shadow: 0 0 8px rgba(124, 58, 237, 0.6); /* Add glow */
	}

	@keyframes float-slow {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(100px, 50px);
		}
		50% {
			transform: translate(50px, 100px);
		}
		75% {
			transform: translate(-50px, 50px);
		}
	}

	@keyframes float-medium {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(-70px, 30px);
		}
		66% {
			transform: translate(30px, -50px);
		}
	}

	@keyframes float-fast {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(40px, -30px);
		}
	}

	.p1,
	.p6,
	.p11 {
		top: 20%;
		left: 10%;
		animation: float-slow 22s infinite ease-in-out;
	}

	.p2,
	.p7,
	.p12 {
		top: 30%;
		left: 30%;
		animation: float-medium 18s infinite ease-in-out;
	}

	.p3,
	.p8,
	.p13 {
		top: 70%;
		left: 60%;
		animation: float-fast 15s infinite ease-in-out;
	}

	.p4,
	.p9,
	.p14 {
		top: 40%;
		left: 80%;
		animation: float-slow 25s infinite ease-in-out;
	}

	.p5,
	.p10,
	.p15 {
		top: 80%;
		left: 20%;
		animation: float-medium 20s infinite ease-in-out;
	}

	/* Hero Section */
	.hero-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
	}

	.hero-personal {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 2.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero-image-container {
		position: relative;
		width: 350px;
		height: 350px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		box-shadow: 0 0 25px rgba(100, 255, 218, 0.15);
	}

	.hero-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		transition: transform 0.5s ease;
	}

	.hero-image-container:hover .hero-image {
		transform: scale(1.05);
	}

	.image-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(100, 255, 218, 0.1), rgba(0, 0, 0, 0));
		z-index: 1;
	}

	.hero-story {
		text-align: left;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.personal-quote {
		font-size: 1.5rem;
		font-style: italic;
		margin-bottom: 0.5rem;
		color: #64ffda;
		font-weight: 500;
	}

	.personal-story {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
		color: #a8b2d1;
	}

	/* Responsive adjustments */
	@media (max-width: 900px) {
		.hero-personal {
			flex-direction: column;
			gap: 2rem;
		}

		.hero-image-container {
			width: 280px;
			height: 280px;
		}

		.hero-story {
			text-align: center;
		}
	}

	.hero-title {
		font-size: 3.5rem;
		font-weight: 800;
		background: linear-gradient(to right, #ffffff, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: 2rem;
		line-height: 1.2;
	}
	
	.hero-description {
		margin-bottom: 3rem;
	}
	
	.hero-description p {
		font-size: 1.5rem;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.5;
		font-weight: 400;
	}
	
	.hero-cta {
		margin-top: 1rem;
	}
	
	.btn-primary-large {
		background: linear-gradient(45deg, #7c3aed, #8b5cf6);
		color: white;
		border: none;
		border-radius: 30px;
		padding: 1rem 2.5rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 5px 15px rgba(124, 58, 237, 0.4);
	}
	
	.btn-primary-large:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.5);
		background: linear-gradient(45deg, #8b5cf6, #7c3aed);
	}
	
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}
		
		.hero-description p {
			font-size: 1.2rem;
		}
		
		.btn-primary-large {
			padding: 0.8rem 2rem;
			font-size: 1rem;
		}
	}

	/* Why Section */
	.why-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.why-subtitle p {
		font-size: 1.6rem;
		font-weight: 500;
		color: var(--primary-text, #ffffff);
		margin-bottom: 1rem;
	}
	
	.why-content p {
		font-size: 1.3rem;
		color: var(--secondary-text, rgba(255, 255, 255, 0.8));
		margin-bottom: 2rem;
	}
	
	.why-items {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		justify-content: space-between;
		margin: 1rem 0 2rem;
	}
	
	.why-item {
		flex: 1;
		min-width: 250px;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.why-item.interactive:hover {
		transform: translateY(-5px);
		border-color: rgba(124, 58, 237, 0.6);
		cursor: pointer;
	}
	
	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(124, 58, 237, 0.9);
	}
	
	.why-conclusion {
		margin-top: 1rem;
	}
	
	.highlight-text {
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--primary-text, #ffffff);
		border-left: 3px solid rgba(124, 58, 237, 0.9);
		padding-left: 1rem;
	}

	/* Animations */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-30px) scale(1.05);
		}
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(10px);
		}
	}

	.arrow-down {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 1rem auto;
		color: rgba(255, 255, 255, 0.6);
		animation: bounce 2s infinite;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.section {
			padding: 2rem 1rem;
		}

		.section-content {
			padding: 1rem;
		}

		h2 {
			font-size: 2.25rem;
		}

		.subtitle {
			font-size: 1.1rem;
		}

		.welcome-title {
			font-size: 3.5rem;
		}
	}

	/* Cards and specialized content areas similar to reference images */
	.feature-card {
		background: rgba(20, 20, 30, 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(124, 58, 237, 0.2);
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.feature-card:hover {
		transform: translateY(-5px);
		border-color: rgba(124, 58, 237, 0.5);
		box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
	}

	.feature-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 10px;
		margin-bottom: 1rem;
		color: #a78bfa;
	}

	.feature-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: white;
	}

	.feature-card p {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.cta-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 3rem;
	}

	.btn-primary {
		background: linear-gradient(90deg, #7c3aed, #4f46e5);
		color: white;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
		position: relative;
		overflow: hidden;
	}

	.btn-primary:before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0),
			rgba(255, 255, 255, 0.2),
			rgba(255, 255, 255, 0)
		);
		transition: left 0.7s ease;
	}

	.btn-primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 25px rgba(124, 58, 237, 0.4);
	}

	.btn-primary:hover:before {
		left: 100%;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.05);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.btn-outline {
		background: transparent;
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.btn-outline:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.5);
	}

	.companies {
		text-align: center;
	}

	.trusted-by {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 1rem;
	}

	.company-logos {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.company-logo {
		width: 90px;
		height: 35px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 5px;
		opacity: 0.6;
		transition: all 0.3s ease;
	}

	.company-logo:hover {
		opacity: 0.8;
		transform: scale(1.05);
	}

	/* Modern header styling */
	.modern-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		padding: 1rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(10, 10, 15, 0.8);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(124, 58, 237, 0.1);
		z-index: 100;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-image {
		height: 28px;
		width: auto;
		display: block;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
	}

	.modern-nav {
		display: flex;
		gap: 2rem;
	}

	.nav-link {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		position: relative;
		transition: all 0.3s ease;
	}

	.nav-link:after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 0;
		width: 0;
		height: 2px;
		background: linear-gradient(90deg, #7c3aed, #4f46e5);
		transition: width 0.3s ease;
	}

	.nav-link:hover {
		color: white;
	}

	.nav-link:hover:after {
		width: 100%;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	.modern-sections {
		padding-top: 70px; /* Space for the fixed header */
	}

	/* Background elements and effects */
	.floating-tech {
		position: absolute;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(59, 130, 246, 0.15);
		backdrop-filter: blur(5px);
		border: 1px solid rgba(59, 130, 246, 0.3);
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
		color: rgba(255, 255, 255, 0.8);
		animation: float 20s infinite ease-in-out;
	}

	.tech-1 {
		top: 40%;
		left: 15%;
		animation-delay: -3s;
	}

	.tech-2 {
		bottom: 30%;
		right: 20%;
		animation-delay: -12s;
	}

	/* Add subtle particles */
	.particles {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: 1;
	}

	.particle {
		position: absolute;
		display: block;
		pointer-events: none;
		width: 2px;
		height: 2px;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 50%;
	}

	.p1 { top: 20%; left: 10%; animation: particleAnimation 60s infinite linear; }
	.p2 { top: 80%; left: 40%; animation: particleAnimation 85s infinite linear; }
	.p3 { top: 40%; left: 90%; animation: particleAnimation 70s infinite linear; }
	.p4 { top: 60%; left: 80%; animation: particleAnimation 90s infinite linear; }
	.p5 { top: 90%; left: 20%; animation: particleAnimation 65s infinite linear; }
	.p6 { top: 30%; left: 50%; animation: particleAnimation 55s infinite linear; }
	.p7 { top: 70%; left: 60%; animation: particleAnimation 75s infinite linear; }
	.p8 { top: 10%; left: 30%; animation: particleAnimation 80s infinite linear; }
	.p9 { top: 50%; left: 70%; animation: particleAnimation 60s infinite linear; }
	.p10 { top: 45%; left: 25%; animation: particleAnimation 85s infinite linear; }
	.p11 { top: 75%; left: 15%; animation: particleAnimation 70s infinite linear; }
	.p12 { top: 85%; left: 85%; animation: particleAnimation 65s infinite linear; }
	.p13 { top: 35%; left: 5%; animation: particleAnimation 55s infinite linear; }
	.p14 { top: 15%; left: 75%; animation: particleAnimation 75s infinite linear; }
	.p15 { top: 55%; left: 45%; animation: particleAnimation 80s infinite linear; }
	
	@keyframes particleAnimation {
		0% {
			transform: translateY(0) translateX(0);
		}
		25% {
			transform: translateY(100px) translateX(100px);
		}
		50% {
			transform: translateY(0) translateX(200px);
		}
		75% {
			transform: translateY(-100px) translateX(100px);
		}
		100% {
			transform: translateY(0) translateX(0);
		}
	}
	
	@keyframes float {
		0%, 100% {
			transform: translateY(0) translateX(0);
		}
		25% {
			transform: translateY(-20px) translateX(10px);
		}
		50% {
			transform: translateY(10px) translateX(-15px);
		}
		75% {
			transform: translateY(15px) translateX(5px);
		}
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: translateY(-50%) scale(1);
			opacity: 0.8;
		}
		50% {
			transform: translateY(-50%) scale(1.2);
			opacity: 1;
		}
	}
	
	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-10px);
		}
		60% {
			transform: translateY(-5px);
		}
	}
	
	/* Responsive adjustments */
	@media (max-width: 768px) {
		.gradient-text {
			font-size: 3rem;
		}
		
		.subtitle-text {
			font-size: 1.2rem;
		}
		
		.feature-cards {
			flex-direction: column;
			align-items: center;
		}
		
		.modern-nav {
			display: none;
		}
	}

	/* Additional button styles */
	.btn-primary-large {
		background: linear-gradient(90deg, #7c3aed, #4f46e5);
		color: white;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		padding: 1rem 2rem;
		font-size: 1.1rem;
		transition: all 0.3s ease;
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
		position: relative;
		overflow: hidden;
		cursor: pointer;
		margin-top: 2rem;
	}
	
	.btn-primary-large:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 25px rgba(124, 58, 237, 0.4);
	}
	
	.join-cta {
		margin-top: 2rem;
	}

	/* Add interactive class for cursor effects */
	.interactive {
		cursor: pointer;
	}
	
	/* Make buttons and links interactive for the custom cursor */
	button, a, .section-title, .cta-button {
		cursor: none; /* Hide default cursor on interactive elements */
	}
	
	.section-content {
		position: relative;
		z-index: 5; /* Ensure content is above animations */
	}
	
	/* Add styles for idea cards to match the cursor interactions */
	.idea-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		margin: 2rem 0;
	}
	
	.idea-card {
		background: rgba(20, 20, 30, 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(124, 58, 237, 0.2);
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	
	.idea-card:hover {
		transform: translateY(-5px) scale(1.02);
		border-color: rgba(124, 58, 237, 0.5);
		box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
	}
	
	.idea-header {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.idea-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(124, 58, 237, 0.3);
		margin-right: 0.75rem;
		position: relative;
		overflow: hidden;
	}
	
	.idea-avatar::before {
		content: '';
		position: absolute;
		width: 20px;
		height: 20px;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		top: 26px;
		left: 50%;
		transform: translateX(-50%);
	}
	
	.idea-avatar::after {
		content: '';
		position: absolute;
		width: 16px;
		height: 16px;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
	}
	
	.idea-author {
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
	}
	
	.idea-card h4 {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: white;
	}
	
	.idea-card p {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		line-height: 1.5;
		margin-bottom: 1.5rem;
		flex-grow: 1;
	}
	
	.idea-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
		border-top: 1px solid rgba(124, 58, 237, 0.2);
		padding-top: 1rem;
	}
	
	.idea-votes {
		display: flex;
		flex-direction: column;
	}
	
	.vote-count {
		font-size: 1.1rem;
		font-weight: 700;
		color: white;
	}
	
	.vote-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
	}
	
	.vote-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(124, 58, 237, 0.2);
		border: 1px solid rgba(124, 58, 237, 0.4);
		color: white;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}
	
	.vote-button:hover {
		background: rgba(124, 58, 237, 0.3);
		border-color: rgba(124, 58, 237, 0.6);
		transform: translateY(-2px);
	}

	/* Solution cards */
	.solution-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin: 2rem 0;
	}

	.solution-card {
		background: rgba(25, 25, 35, 0.7);
		border: 1px solid rgba(124, 58, 237, 0.2);
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
		backdrop-filter: blur(10px);
	}

	.solution-card:hover {
		transform: translateY(-5px);
		border-color: rgba(124, 58, 237, 0.6);
		box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3);
	}

	.solution-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: linear-gradient(to right, #7c3aed, #8b5cf6);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.solution-card:hover::before {
		opacity: 1;
	}

	.solution-icon {
		width: 48px;
		height: 48px;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		color: #a78bfa;
		border: 1px solid rgba(124, 58, 237, 0.3);
		transition: all 0.3s ease;
	}

	.solution-card:hover .solution-icon {
		background: rgba(124, 58, 237, 0.2);
		transform: scale(1.05);
	}

	.solution-card h4 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		color: #fff;
	}

	.solution-card p {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
		flex-grow: 1;
	}

	.solution-tag {
		display: inline-block;
		background: rgba(124, 58, 237, 0.1);
		color: #a78bfa;
		padding: 0.4rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		border: 1px solid rgba(124, 58, 237, 0.2);
		transition: all 0.3s ease;
	}

	.solution-card:hover .solution-tag {
		background: rgba(124, 58, 237, 0.2);
		border-color: rgba(124, 58, 237, 0.4);
	}

	/* Budget calculator */
	.budget-calculator {
		background: rgba(25, 25, 35, 0.7);
		border: 1px solid rgba(124, 58, 237, 0.2);
		border-radius: 16px;
		padding: 2rem;
		margin: 2rem 0;
		backdrop-filter: blur(10px);
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	.budget-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.budget-header h4 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #fff;
		margin-bottom: 0.5rem;
	}

	.budget-header p {
		color: rgba(255, 255, 255, 0.7);
		font-size: 1rem;
	}

	.budget-sliders {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.budget-slider {
		width: 100%;
	}

	.slider-label {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.9rem;
	}

	.slider-value {
		font-weight: 600;
		color: #a78bfa;
	}

	.slider-track {
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		position: relative;
		cursor: pointer;
	}

	.slider-fill {
		height: 100%;
		background: linear-gradient(to right, #7c3aed, #8b5cf6);
		border-radius: 4px;
	}

	.slider-thumb {
		width: 20px;
		height: 20px;
		background: #fff;
		border: 3px solid #7c3aed;
		border-radius: 50%;
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		cursor: grab;
		box-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
		transition: all 0.2s ease;
	}

	.slider-thumb:hover {
		transform: translate(-50%, -50%) scale(1.1);
		box-shadow: 0 0 15px rgba(124, 58, 237, 0.7);
	}

	.budget-result {
		text-align: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 12px;
		border: 1px solid rgba(124, 58, 237, 0.3);
	}

	.budget-amount {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.5rem;
		background: linear-gradient(to right, #7c3aed, #8b5cf6);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.budget-estimate {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 1rem;
	}

	.budget-submit {
		background: linear-gradient(to right, #7c3aed, #8b5cf6);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 30px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
	}

	.budget-submit:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
	}

	.budget-rewards {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.reward-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.reward-icon {
		width: 40px;
		height: 40px;
		background: rgba(124, 58, 237, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		color: #a78bfa;
		border: 1px solid rgba(124, 58, 237, 0.4);
	}

	.reward-info {
		display: flex;
		flex-direction: column;
	}

	.reward-value {
		font-weight: 700;
		color: white;
		font-size: 1.1rem;
	}

	.reward-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Token showcase */
	.token-showcase {
		background: rgba(25, 25, 35, 0.7);
		border: 1px solid rgba(124, 58, 237, 0.2);
		border-radius: 16px;
		padding: 2rem;
		margin: 2rem 0;
		backdrop-filter: blur(10px);
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.token-trophies {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.trophy-container {
		text-align: center;
		width: 220px;
	}

	.trophy {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		position: relative;
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.trophy:hover {
		transform: translateY(-5px) scale(1.05);
	}

	.euro-trophy {
		background: linear-gradient(145deg, #3b82f6, #1d4ed8);
		box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
		border: 2px solid rgba(59, 130, 246, 0.5);
	}

	.vc-trophy {
		background: linear-gradient(145deg, #7c3aed, #4c1d95);
		box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.5);
		border: 2px solid rgba(124, 58, 237, 0.5);
	}

	.trophy-icon {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		position: relative;
		z-index: 2;
	}

	.trophy-glow {
		position: absolute;
		width: 130px;
		height: 130px;
		border-radius: 50%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1;
		filter: blur(15px);
		opacity: 0.6;
		pointer-events: none;
		transition: all 0.3s ease;
	}

	.euro-trophy .trophy-glow {
		background: radial-gradient(circle, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0));
	}

	.vc-trophy .trophy-glow {
		background: radial-gradient(circle, rgba(124, 58, 237, 0.8), rgba(91, 33, 182, 0));
	}

	.trophy:hover .trophy-glow {
		width: 150px;
		height: 150px;
		opacity: 0.8;
	}

	.trophy-label {
		font-size: 1rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 0.5rem;
	}

	.trophy-amount {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.euro-trophy + .trophy-label + .trophy-amount {
		color: #3b82f6;
	}

	.vc-trophy + .trophy-label + .trophy-amount {
		color: #7c3aed;
	}

	.trophy-description {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.5;
	}

	.token-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 300;
	}

	.token-benefits h4 {
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 1.5rem;
		color: white;
	}

	.benefits-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.benefit-item {
		display: flex;
		align-items: center;
		background: rgba(124, 58, 237, 0.1);
		border: 1px solid rgba(124, 58, 237, 0.2);
		border-radius: 12px;
		padding: 1rem;
		transition: all 0.3s ease;
	}

	.benefit-item:hover {
		background: rgba(124, 58, 237, 0.15);
		border-color: rgba(124, 58, 237, 0.4);
		transform: translateY(-3px);
	}

	.benefit-icon {
		width: 40px;
		height: 40px;
		background: rgba(124, 58, 237, 0.2);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 1rem;
		color: #a78bfa;
		flex-shrink: 0;
	}

	.benefit-text {
		font-size: 1rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.9);
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.token-trophies {
			flex-direction: column;
			gap: 3rem;
		}
		
		.token-divider {
			transform: rotate(90deg);
		}
	}
	
	/* Hominio styles */
	.hominio-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		text-align: center;
		gap: 1.5rem;
	}

	.introducing-text {
		margin-bottom: 1rem;
		width: 100%;
	}

	.introducing-title {
		font-size: 1.35rem;
		color: #a8b2d1;
		font-weight: 500;
		letter-spacing: 0.5px;
		margin-bottom: 1rem;
		position: relative;
		display: inline-block;
	}

	.introducing-title::after {
		content: '';
		position: absolute;
		width: 100%;
		height: 2px;
		bottom: -5px;
		left: 0;
		background: linear-gradient(to right, #64ffda, #0a192f);
		transform: scaleX(0);
		transform-origin: bottom right;
		transition: transform 0.3s;
	}

	.introducing-title:hover::after {
		transform: scaleX(1);
		transform-origin: bottom left;
	}

	.vision-statement {
		margin-bottom: 3rem;
		max-width: 800px;
	}

	.vision-intro {
		font-size: 2rem;
		line-height: 1.4;
		margin-bottom: 1.5rem;
		background: linear-gradient(to right, #ffffff, #b3b3ff);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.vision-description {
		font-size: 1.5rem;
		line-height: 1.5;
		margin-bottom: 2rem;
		color: #e0e0ff;
	}

	.vision-content {
		font-size: 1.4rem;
		line-height: 1.6;
		color: #a78bfa;
		max-width: 700px;
		margin: 0 auto;
	}

	.hominio-logo-large {
		position: relative;
		margin: 3rem auto;
		padding: 2rem;
		transition: transform 0.3s ease;
	}

	.hominio-logo-large:hover {
		transform: scale(1.05);
	}

	.hominio-title {
		font-size: 5rem;
		font-weight: 700;
		letter-spacing: 0.5rem;
		margin: 0;
		background: linear-gradient(to right, #ffffff, #a78bfa);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		position: relative;
		z-index: 2;
	}

	.logo-glow-large {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(124, 58, 237, 0.6), rgba(59, 130, 246, 0) 70%);
		filter: blur(25px);
		z-index: 1;
	}

	.hominio-description p {
		font-size: 1.5rem;
		line-height: 1.5;
		color: #e0e0ff;
		max-width: 700px;
		margin: 0 auto 3rem;
	}

	.hominio-stats {
		display: flex;
		justify-content: center;
		gap: 3rem;
		margin-bottom: 3rem;
	}

	.stat-item {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 16px;
		padding: 1.5rem;
		min-width: 140px;
		transition: transform 0.3s ease, background 0.3s ease;
	}

	.stat-item:hover {
		transform: translateY(-5px);
		background: rgba(255, 255, 255, 0.1);
	}

	.stat-value {
		font-size: 2.5rem;
		font-weight: 700;
		color: #a78bfa;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 1rem;
		color: #e0e0ff;
	}

	.hominio-button {
		background: linear-gradient(to right, #7c3aed, #8b5cf6);
		color: white;
		font-size: 1.2rem;
		font-weight: 600;
		padding: 1rem 2rem;
		border-radius: 50px;
		border: none;
		cursor: pointer;
		transition: transform 0.3s ease, opacity 0.3s ease;
		box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
	}

	.hominio-button:hover {
		transform: translateY(-2px);
		opacity: 0.9;
	}

	@media (max-width: 768px) {
		.vision-intro {
			font-size: 1.5rem;
		}

		.vision-description, .vision-content, .hominio-description p {
			font-size: 1.2rem;
		}

		.hominio-title {
			font-size: 3.5rem;
		}

		.hominio-stats {
			flex-direction: column;
			gap: 1.5rem;
		}
	}

	/* Join section styles */
	.join-showcase {
		max-width: 900px;
		margin: 2rem auto;
		position: relative;
	}
	
	.join-spotlight {
		background: rgba(25, 25, 35, 0.5);
		border: 1px solid rgba(124, 58, 237, 0.3);
		border-radius: 20px;
		padding: 3rem;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		backdrop-filter: blur(10px);
	}
	
	.spotlight-glow {
		position: absolute;
		width: 300px;
		height: 300px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(124, 58, 237, 0.4), rgba(91, 33, 182, 0));
		filter: blur(70px);
		opacity: 0.7;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1;
		animation: pulse-glow 6s infinite alternate ease-in-out;
	}
	
	@keyframes pulse-glow {
		0% {
			opacity: 0.5;
			width: 250px;
			height: 250px;
		}
		100% {
			opacity: 0.8;
			width: 350px;
			height: 350px;
		}
	}
	
	.spotlight-text {
		text-align: center;
		max-width: 700px;
		position: relative;
		z-index: 2;
	}
	
	.spotlight-text h2 {
		font-size: 2.5rem;
		font-weight: 800;
		margin-bottom: 1.5rem;
		background: linear-gradient(to right, #fff, #e5e7eb);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	
	.spotlight-text p {
		font-size: 1.2rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
	}
	
	.join-actions {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
	}
	
	.join-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border-radius: 30px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.join-button.primary {
		background: linear-gradient(to right, #7c3aed, #8b5cf6);
		color: white;
		border: none;
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
	}
	
	.join-button.primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 25px rgba(124, 58, 237, 0.5);
	}
	
	.join-button.secondary {
		background: transparent;
		color: white;
		border: 1px solid rgba(124, 58, 237, 0.5);
	}
	
	.join-button.secondary:hover {
		background: rgba(124, 58, 237, 0.1);
		border-color: rgba(124, 58, 237, 0.7);
		transform: translateY(-3px);
	}
	
	/* Responsive adjustments for Hominio and Join sections */
	@media (max-width: 768px) {
		.hominio-stats {
			flex-direction: column;
			align-items: center;
			gap: 1.5rem;
		}
		
		.join-actions {
			flex-direction: column;
		}
		
		.spotlight-text h2 {
			font-size: 2rem;
		}
	}

	/* Minimalist styles for "new-way" section */
	.minimalist-container {
		max-width: 800px;
		margin: 3rem auto;
		padding: 0 1rem;
	}
	
	.minimalist-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	
	.path-icon {
		position: relative;
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		color: rgba(124, 58, 237, 0.9);
	}
	
	.path-glow {
		position: absolute;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(124, 58, 237, 0.3), rgba(124, 58, 237, 0));
		filter: blur(15px);
		opacity: 0.7;
		animation: pulse-subtle 4s infinite alternate ease-in-out;
	}
	
	@keyframes pulse-subtle {
		0% {
			opacity: 0.5;
			transform: scale(0.9);
		}
		100% {
			opacity: 0.8;
			transform: scale(1.1);
		}
	}
	
	.minimalist-statement {
		max-width: 700px;
		margin-bottom: 2.5rem;
	}
	
	.statement-text {
		font-size: 1.5rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 300;
	}
	
	.minimalist-highlight {
		position: relative;
	}
	
	.minimalist-highlight h3 {
		font-size: 1.8rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: white;
	}
	
	.highlight-line {
		width: 60px;
		height: 2px;
		background: linear-gradient(to right, rgba(124, 58, 237, 0), rgba(124, 58, 237, 1), rgba(124, 58, 237, 0));
		margin: 0 auto 1.5rem;
	}
	
	.minimalist-highlight h4 {
		font-size: 1.3rem;
		font-weight: 400;
		color: rgba(255, 255, 255, 0.85);
	}
	
	/* Deserve section styles */
	.deserve-container {
		max-width: 800px;
		margin: 3rem auto;
		padding: 0 1rem;
	}
	
	.deserve-content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.deserve-statement {
		text-align: center;
		max-width: 700px;
		margin-bottom: 3rem;
	}
	
	.deserve-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 2rem;
		width: 100%;
	}
	
	.deserve-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 220px;
		text-align: center;
		transition: all 0.3s ease;
		padding: 1.5rem 1rem;
		border-radius: 12px;
		background: rgba(124, 58, 237, 0.05);
		border: 1px solid transparent;
	}
	
	.deserve-item:hover {
		transform: translateY(-5px);
		background: rgba(124, 58, 237, 0.1);
		border-color: rgba(124, 58, 237, 0.2);
	}
	
	.deserve-icon {
		width: 60px;
		height: 60px;
		background: rgba(124, 58, 237, 0.1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		color: rgba(124, 58, 237, 0.9);
		border: 1px solid rgba(124, 58, 237, 0.3);
		transition: all 0.3s ease;
	}
	
	.deserve-item:hover .deserve-icon {
		background: rgba(124, 58, 237, 0.2);
		border-color: rgba(124, 58, 237, 0.5);
		box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
	}
	
	.deserve-text {
		font-size: 1rem;
		font-weight: 500;
		color: white;
		margin-bottom: 0.5rem;
	}
	
	.deserve-description {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.5;
	}
	
	/* Responsive adjustments for minimalist sections */
	@media (max-width: 768px) {
		.statement-text {
			font-size: 1.2rem;
		}
		
		.minimalist-highlight h3 {
			font-size: 1.5rem;
		}
		
		.minimalist-highlight h4 {
			font-size: 1.1rem;
		}
		
		.deserve-list {
			gap: 1.5rem;
		}
		
		.deserve-item {
			width: 150px;
		}
	}

	/* Why Section */
	.why-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.why-subtitle p {
		font-size: 1.6rem;
		font-weight: 500;
		color: var(--primary-text, #ffffff);
		margin-bottom: 1rem;
	}
	
	.why-content p {
		font-size: 1.3rem;
		color: var(--secondary-text, rgba(255, 255, 255, 0.8));
		margin-bottom: 2rem;
	}
	
	.why-items {
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		justify-content: space-between;
		margin: 1rem 0 2rem;
	}
	
	.why-item {
		flex: 1;
		min-width: 250px;
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.why-item.interactive:hover {
		transform: translateY(-5px);
		border-color: rgba(124, 58, 237, 0.6);
		cursor: pointer;
	}
	
	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(124, 58, 237, 0.9);
	}
	
	.why-conclusion {
		margin-top: 1rem;
	}
	
	.highlight-text {
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--primary-text, #ffffff);
		border-left: 3px solid rgba(124, 58, 237, 0.9);
		padding-left: 1rem;
	}

	/* Dilemma Section */
	.dilemma-section {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.dilemma-subtitle p {
		font-size: 1.8rem;
		font-weight: 600;
		color: #fff;
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.dilemma-paths {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		margin: 1rem 0;
	}
	
	.dilemma-path {
		flex: 1;
		max-width: 350px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		padding: 1.8rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.dilemma-path:hover {
		transform: translateY(-5px);
		border-color: rgba(124, 58, 237, 0.4);
	}
	
	.dilemma-path.employee:before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: linear-gradient(to right, #6366f1, #8b5cf6);
		opacity: 0.8;
	}
	
	.dilemma-path.self-employed:before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 4px;
		background: linear-gradient(to right, #8b5cf6, #ec4899);
		opacity: 0.8;
	}
	
	.path-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(124, 58, 237, 0.1);
		color: #a78bfa;
		margin-bottom: 0.5rem;
		border: 1px solid rgba(124, 58, 237, 0.3);
	}
	
	.dilemma-path h3 {
		font-size: 1.4rem;
		font-weight: 700;
		color: #fff;
		margin-bottom: 0.5rem;
	}
	
	.dilemma-path p {
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.6;
	}
	
	.path-consequence {
		margin-top: auto;
		font-style: italic;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.6);
		padding-top: 1rem;
		border-top: 1px dashed rgba(124, 58, 237, 0.3);
	}
	
	.path-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: rgba(124, 58, 237, 0.1);
		border: 1px solid rgba(124, 58, 237, 0.3);
	}
	
	.path-divider span {
		font-weight: 700;
		color: #a78bfa;
	}
	
	.dilemma-conclusion {
		text-align: center;
		max-width: 700px;
		margin: 1rem auto 0;
	}
	
	.dilemma-conclusion p {
		font-size: 1.5rem;
		line-height: 1.5;
		color: #fff;
	}
	
	.dilemma-conclusion .highlight,
	.problem-cta .highlight {
		font-weight: 700;
		color: rgba(124, 58, 237, 0.9);
		display: inline-block;
	}
	
	@media (max-width: 768px) {
		.dilemma-paths {
			flex-direction: column;
			gap: 2rem;
		}
		
		.dilemma-path {
			max-width: 100%;
		}
		
		.path-divider {
			margin: 0.5rem 0;
		}
	}

	/* Problem Section Styles */
	.problem-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		gap: 2rem;
	}

	.problem-subtitle p {
		font-size: 1.8rem;
		font-weight: 600;
		color: #fff;
		text-align: center;
		margin-bottom: 1.5rem;
	}
	
	.personal-experience {
		max-width: 800px;
		margin: 0 auto 1rem;
		font-size: 1.2rem;
		line-height: 1.6;
		text-align: center;
		color: #a8b2d1;
		padding: 0.5rem 1.5rem;
		border-left: 3px solid #64ffda;
		border-right: 3px solid #64ffda;
		font-style: italic;
	}

	.comparison-cards {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin: 1rem 0;
		width: 100%;
	}
	
	.comparison-card {
		flex: 1;
		max-width: 350px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		padding: 1.8rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.comparison-card:hover {
		transform: translateY(-5px);
		border-color: rgba(124, 58, 237, 0.4);
		box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.2);
	}
	
	.comparison-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(124, 58, 237, 0.1);
		color: #a78bfa;
		margin-bottom: 0.5rem;
		border: 1px solid rgba(124, 58, 237, 0.3);
	}
	
	.comparison-card h3 {
		font-size: 1.4rem;
		font-weight: 700;
		color: #fff;
		margin-bottom: 0.5rem;
	}
	
	.comparison-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.comparison-list li {
		position: relative;
		padding-left: 1.5rem;
		margin-bottom: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.5;
	}
	
	.comparison-list li:before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5rem;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(124, 58, 237, 0.7);
	}

	.personal-note {
		margin-top: 1.5rem;
		padding: 1rem;
		background: rgba(100, 255, 218, 0.05);
		border-radius: 4px;
		font-style: italic;
		color: #64ffda;
		position: relative;
	}

	.personal-note:before {
		content: '"';
		position: absolute;
		top: 0;
		left: 0.5rem;
		font-size: 2rem;
		color: rgba(100, 255, 218, 0.3);
	}
	
	@media (max-width: 768px) {
		.comparison-cards {
			flex-direction: column;
			align-items: center;
			gap: 2rem;
		}
		
		.comparison-card {
			max-width: 100%;
		}
	}

	/* Vision Section - Black Universe Theme */
	.vision-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
		padding: 2.5rem;
		background: rgba(10, 10, 15, 0.7);
		border: 1px solid rgba(20, 20, 30, 0.4);
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		position: relative;
		overflow: hidden;
	}
	
	/* Star-like dots in background */
	.vision-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 50% 10%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 80% 40%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 75% 85%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 30% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 0);
		background-repeat: repeat;
		background-size: 250px 250px;
		opacity: 0.3;
		z-index: -1;
	}
	
	.vision-statement {
		text-align: center;
		max-width: 700px;
		margin: 0 auto 2rem;
	}
	
	.vision-statement h2 {
		font-size: 2.2rem;
		margin-bottom: 1.5rem;
		color: #fff;
		font-weight: 700;
		letter-spacing: 1px;
	}
	
	.vision-intro {
		font-size: 1.8rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 1.5rem;
		line-height: 1.4;
	}
	
	.vision-intro strong {
		position: relative;
	}
	
	.vision-intro strong::after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 0;
		width: 100%;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(51, 204, 204, 0.5), transparent);
	}
	
	.vision-description {
		font-size: 1.3rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
		line-height: 1.5;
	}
	
	.vision-content {
		text-align: center;
		max-width: 700px;
		margin: 0 auto 2rem;
		padding: 1.8rem;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 12px;
		border: 1px solid rgba(30, 30, 40, 0.6);
	}
	
	.vision-content p {
		font-size: 1.2rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.85);
	}
	
	.vision-conclusion {
		text-align: center;
		max-width: 700px;
		margin: 1rem auto 0;
	}
	
	.vision-conclusion p {
		font-size: 1.5rem;
		line-height: 1.5;
		color: #fff;
		font-weight: 500;
	}
	
	/* Subtle teal accent on the last word */
	.vision-conclusion p::after {
		content: '';
		display: block;
		width: 80px;
		height: 2px;
		background: linear-gradient(90deg, transparent, rgba(51, 204, 204, 0.7), transparent);
		margin: 1.5rem auto 0;
	}
	
	@media (max-width: 768px) {
		.vision-section {
			padding: 1.8rem;
		}
		
		.vision-statement h2 {
			font-size: 1.8rem;
		}
		
		.vision-intro {
			font-size: 1.5rem;
		}
		
		.vision-description {
			font-size: 1.1rem;
		}
		
		.vision-content p {
			font-size: 1rem;
		}
		
		.vision-conclusion p {
			font-size: 1.2rem;
		}
	}

	h1, h2, h3, h4, h5, h6 {
		margin: 0 0 1rem 0;
	}

	h2 {
		background: linear-gradient(90deg, #fff, rgba(51, 204, 204, 0.8));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		letter-spacing: 1px;
	}

	/* Update the problem section */
	.problem-statement {
		font-size: 3rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 2rem;
		text-align: center;
	}

	/* Add custom styles for the universe theme */
	.universe-theme button.interactive {
		background-color: rgba(51, 204, 204, 0.3);
		color: white;
		border: 1px solid rgba(51, 204, 204, 0.5);
		border-radius: 4px;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
	}

	.universe-theme button.interactive:hover {
		background-color: rgba(51, 204, 204, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 0 15px rgba(51, 204, 204, 0.3);
	}

	.universe-theme .section-text {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(10, 10, 15, 0.4);
		padding: 24px;
		border-radius: 12px;
		border: 1px solid rgba(30, 40, 50, 0.3);
	}

	.universe-theme .cta-button button {
		background: linear-gradient(135deg, rgba(51, 204, 204, 0.5), rgba(20, 184, 166, 0.5));
		border: 1px solid rgba(51, 204, 204, 0.6);
		box-shadow: 0 0 20px rgba(51, 204, 204, 0.2);
	}

	.universe-theme .cta-button button:hover {
		background: linear-gradient(135deg, rgba(51, 204, 204, 0.7), rgba(20, 184, 166, 0.7));
		box-shadow: 0 0 25px rgba(51, 204, 204, 0.4);
	}

	.universe-theme .benefit-card {
		background: rgba(10, 10, 20, 0.6);
		border: 1px solid rgba(51, 204, 204, 0.2);
		transition: all 0.3s ease;
	}
	
	.universe-theme .benefit-card:hover {
		transform: translateY(-5px);
		border-color: rgba(51, 204, 204, 0.4);
		box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
	}

	.universe-theme .benefit-icon {
		background: rgba(51, 204, 204, 0.2);
	}

	.universe-theme .reality-statement {
		border-left: 3px solid rgba(51, 204, 204, 0.6);
		background: rgba(10, 10, 20, 0.4);
		padding: 1.5rem 2rem;
		border-radius: 0 8px 8px 0;
	}

	.universe-theme .deserving-statement {
		text-align: center;
		padding: 1.5rem;
		background: rgba(10, 10, 20, 0.5);
		border: 1px solid rgba(51, 204, 204, 0.15);
		border-radius: 8px;
	}

	.universe-theme h2 {
		background: linear-gradient(90deg, #fff, rgba(51, 204, 204, 0.8));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		letter-spacing: 1px;
	}

	.universe-theme .problem-statement {
		background: linear-gradient(90deg, #fff, rgba(51, 204, 204, 0.8));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	/* Add background blur to sections */
	.landing-page {
		position: relative;
		min-height: 100vh;
		background-color: #000;
		overflow-x: hidden;
	}

	/* Add the starry background */
	.page-container::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: 
			radial-gradient(1px 1px at 10% 10%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 20% 30%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 40% 70%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 50% 10%, rgba(255, 255, 255, 0.2) 1px, transparent 0),
			radial-gradient(1px 1px at 80% 40%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 90% 60%, rgba(255, 255, 255, 0.4) 1px, transparent 0),
			radial-gradient(1px 1px at 75% 85%, rgba(255, 255, 255, 0.3) 1px, transparent 0),
			radial-gradient(1px 1px at 30% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 0);
		background-repeat: repeat;
		background-size: 250px 250px;
		z-index: -1;
		pointer-events: none;
	}

	/* Update button styles with teal accents */
	button.interactive {
		background-color: #7c3aed;
		color: white;
		border: none;
		padding: 12px 24px;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	button.interactive:hover {
		background-color: #6d28d9;
		transform: translateY(-2px);
	}

	/* Update progress bar */
	.progress-bar {
		height: 4px;
		background-color: #7c3aed;
		transition: width 0.2s ease;
		z-index: 20;
	}

	/* Update progress bar */
	.progress-bar {
		height: 4px;
		background: linear-gradient(90deg, rgba(51, 204, 204, 0.7), rgba(51, 204, 204, 0.9)) !important;
		box-shadow: 0 0 10px rgba(51, 204, 204, 0.5);
		transition: width 0.2s ease;
		z-index: 20;
	}
</style>
