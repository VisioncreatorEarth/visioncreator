<script lang="ts">
	// Test edit to fix tool calling issues - Debug test
	import Avatar from '$lib/Avatar.svelte';
	import { onMount, tick } from 'svelte';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

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
			title: 'We Need a New Way to Work',
			subtitle: 'A New Way to Work',
			accent: true,
			callToAction: 'Join the movement towards a new paradigm of work'
		},
		{
			id: 'outdated',
			title: 'THE OUTDATED NATURE OF WORK',
			subtitle: "In today's digital age, traditional work models are hopelessly outdated.",
			content: [
				'Employee: You trade time for money with no ownership or freedom.',
				'Self-Employed: You gain independence but remain chained to trading time for money, with endless stress.'
			],
			callToAction: 'Neither path fits your life in the modern world. You deserve better.',
			accent: true
		},
		{
			id: 'choice',
			title: 'A MISERABLE CHOICE',
			subtitle: 'You face a dilemma:',
			content: [
				'Employee: Create value for someone else, never fully realizing your potential.',
				'Self-Employed: Shoulder overwhelming responsibility with little time to breathe.'
			],
			callToAction:
				"Neither option feels fulfilling in the digital age. It's time for a new way forward."
		},
		{
			id: 'why',
			title: 'WHY THIS MATTERS',
			subtitle: "This isn't just inconvenient—it degrades your quality of life.",
			content: ['You spend a huge part of your day at work. It should:'],
			hasListItems: true,
			listItems: ['Enhance your well-being.', 'Secure your financial future.'],
			callToAction:
				'Instead, you feel disconnected and unfulfilled. You deserve work that aligns with who you are.'
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
			title: 'JOIN THE REVOLUTION',
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

<div class="landing-page">
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
					<span class="gradient-text">Visioncreator</span>
					<span class="subtitle-text">A New Way to Work</span>
				</h1>
				
				<p class="modern-description" in:fade={{ duration: 800, delay: 500 }}>
					Build ownership through contribution with a revolutionary organization structure
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
						Explore
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
					<button class="btn-secondary" on:click={startPresentation}>Learn More</button>
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
				<span class="logo-text">VC</span>
			</div>
			<nav class="modern-nav">
				{#each navLinks as link}
					<a href={link.url} class="nav-link">{link.label}</a>
				{/each}
			</nav>
			<div class="header-actions">
				<button class="btn-outline">Sign In</button>
				<button class="btn-primary">Join Now</button>
			</div>
		</header>

		{#each sections as section, i}
			<section
				id={section.id}
				class="section"
				class:active={i === currentSection}
				class:accent={section.accent}
				style="--section-index: {i}"
			>
				<div class="section-content">
					{#if section.id === 'hero'}
						<!-- Hero section with centered content -->
						<div class="hero-container">
							<h2 class="split-text" in:fly={{ y: 20, duration: 800, delay: 100 }}>
								<span class="text-animate-wrapper">
									<span class="text-animate">{section.title}</span>
								</span>
							</h2>
							<p class="subtitle hero-subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
								<span class="gradient-text">{section.subtitle}</span>
							</p>

							<div class="hero-visual">
								<div class="orbit-container">
									<div class="orbit">
										<div class="planet">
											<span>You</span>
										</div>
									</div>
									<div class="orbit-center">
										<span>VC</span>
									</div>
								</div>
							</div>

							{#if section.callToAction}
								<div class="call-to-action hero-cta" in:fade={{ duration: 800, delay: 400 }}>
									<p>{section.callToAction}</p>
								</div>
							{/if}

							<div
								class="arrow-down pulse-animation"
								in:fade={{ duration: 400, delay: 800 }}
								aria-label="Scroll down to next section"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<polyline points="19 12 12 19 5 12"></polyline>
								</svg>
							</div>
						</div>
					{:else if section.id === 'outdated'}
						<!-- Custom layout for outdated section -->
						<div class="split-layout">
							<div class="split-content">
								<h2 in:fly={{ y: 20, duration: 800, delay: 100 }} class="accent-heading">
									{section.title}
								</h2>
								<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
									{section.subtitle}
								</p>

								<div class="comparison-container" in:fade={{ duration: 600, delay: 300 }}>
									<div class="comparison-card employee">
										<div class="card-icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
												<circle cx="12" cy="7" r="4"></circle>
											</svg>
										</div>
										<h3>Employee</h3>
										<div class="card-divider"></div>
										<p>You trade time for money with no ownership or freedom.</p>
										<div class="limitation-indicator">
											<span class="limitation-text">Limited potential</span>
											<div class="limitation-bar">
												<div class="limitation-fill" style="width: 35%"></div>
											</div>
										</div>
									</div>
									<div class="comparison-divider">VS</div>
									<div class="comparison-card self-employed">
										<div class="card-icon">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
												<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
											</svg>
										</div>
										<h3>Self-Employed</h3>
										<div class="card-divider"></div>
										<p>
											You gain independence but remain chained to trading time for money, with
											endless stress.
										</p>
										<div class="limitation-indicator">
											<span class="limitation-text">Freedom vs Security</span>
											<div class="limitation-bar">
												<div class="limitation-fill" style="width: 50%"></div>
											</div>
										</div>
									</div>
								</div>

								{#if section.callToAction}
									<div class="call-to-action highlight" in:fade={{ duration: 800, delay: 600 }}>
										<p>{section.callToAction}</p>
									</div>
								{/if}
							</div>
							<div class="split-visual">
								<div class="model-visual" in:scale={{ duration: 800, delay: 500, start: 0.8 }}>
									<div class="model-old broken-system"></div>
									<div class="model-arrow">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="48"
											height="48"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<line x1="5" y1="12" x2="19" y2="12"></line>
											<polyline points="12 5 19 12 12 19"></polyline>
										</svg>
									</div>
									<div class="model-new new-approach"></div>
								</div>
							</div>
						</div>
					{:else if section.id === 'choice'}
						<!-- Choice section custom layout -->
						<div class="choice-container">
							<h2 in:fly={{ y: 20, duration: 800, delay: 100 }} class="accent-heading">
								{section.title}
							</h2>

							{#if section.subtitle}
								<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
									{section.subtitle}
								</p>
							{/if}

							<div class="choice-layout">
								<div class="paths-container" in:fade={{ duration: 600, delay: 300 }}>
									<div class="path-option hoverable">
										<div class="path-icon employee-icon glow-on-hover">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
												<circle cx="12" cy="7" r="4"></circle>
											</svg>
										</div>
										<div class="path-content">
											<h3>Employee</h3>
											<p>Create value for someone else, never fully realizing your potential.</p>
											<div class="restrictions">
												<span class="restriction">Limited freedom</span>
												<span class="restriction">No ownership</span>
												<span class="restriction">Capped income</span>
											</div>
										</div>
									</div>

									<div class="path-divider">
										<div class="divider-circle"></div>
										<div class="divider-line"></div>
										<div class="divider-circle"></div>
									</div>

									<div class="path-option hoverable">
										<div class="path-icon self-employed-icon glow-on-hover">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
												<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
											</svg>
										</div>
										<div class="path-content">
											<h3>Self-Employed</h3>
											<p>Shoulder overwhelming responsibility with little time to breathe.</p>
											<div class="restrictions">
												<span class="restriction">Constant stress</span>
												<span class="restriction">No security</span>
												<span class="restriction">Limited scale</span>
											</div>
										</div>
									</div>
								</div>

								<div class="third-path">
									<div class="third-path-connector">
										<div class="connector-line"></div>
										<div class="connector-arrow">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="32"
												height="32"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<polyline points="6 9 12 15 18 9"></polyline>
											</svg>
										</div>
									</div>

									<div class="third-option">
										<div class="third-badge">New Way</div>
										<h3>Visioncreator</h3>
										<p>A new model that combines freedom, ownership, and security</p>
									</div>
								</div>

								{#if section.callToAction}
									<div
										class="call-to-action better-way highlight"
										in:fade={{ duration: 800, delay: 600 }}
									>
										<p>{section.callToAction}</p>
									</div>
								{/if}
							</div>

							<div
								class="arrow-down"
								in:fade={{ duration: 400, delay: 700 }}
								aria-label="Scroll down to next section"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<polyline points="19 12 12 19 5 12"></polyline>
								</svg>
							</div>
						</div>
					{:else if section.id === 'why'}
						<!-- Why This Matters section -->
						<div class="why-matters-container">
							<h2 in:fly={{ y: 20, duration: 800, delay: 100 }} class="accent-heading">
								{section.title}
							</h2>

							{#if section.subtitle}
								<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
									{section.subtitle}
								</p>
							{/if}

							{#if section.content && section.content.length > 0}
								<div class="content-block impact-block" in:fade={{ duration: 600, delay: 300 }}>
									<div class="impact-visual">
										<div class="impact-chart">
											<div class="chart-segment work">
												<span>Work</span>
											</div>
											<div class="chart-segment sleep">
												<span>Sleep</span>
											</div>
											<div class="chart-segment other">
												<span>Other</span>
											</div>
										</div>
										<div class="chart-center">
											<div class="chart-label">Your Life</div>
										</div>
									</div>

									<div class="impact-content">
										{#each section.content as paragraph}
											<p>{paragraph}</p>
										{/each}

										{#if section.hasListItems && section.listItems && section.listItems.length > 0}
											<ul class="list-items impact-list">
												{#each section.listItems as item, index}
													<li
														class="impact-item"
														in:fly={{ x: 20, duration: 400, delay: 400 + 100 * index }}
													>
														<div class="item-icon">
															{#if index === 0}
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
																	<path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6 8 8 0 0 0 13 6.326"
																	></path>
																	<path d="M13.5 14h.5a2 2 0 0 0 2-2"></path>
																	<path d="M10 9.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>
																	<path d="M15 9.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>
																</svg>
															{:else}
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
																	<path d="M12 2v2"></path>
																	<path d="M12 8v2"></path>
																	<path d="M12 14v2"></path>
																	<path d="M12 20v2"></path>
																	<path d="M19 5l-1.73 1"></path>
																	<path d="M16.27 8l-1.73 1"></path>
																	<path d="M9.46 13l-1.73 1"></path>
																	<path d="M6.73 16l-1.73 1"></path>
																	<path d="M5 5l1.73 1"></path>
																	<path d="M7.73 8l1.73 1"></path>
																	<path d="M14.54 13l1.73 1"></path>
																	<path d="M17.27 16l1.73 1"></path>
																	<circle cx="12" cy="12" r="3"></circle>
																</svg>
															{/if}
														</div>
														<span>{item}</span>
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								</div>
							{/if}

							{#if section.callToAction}
								<div
									class="call-to-action highlight impact-cta"
									in:fade={{ duration: 800, delay: 600 }}
								>
									<p>{section.callToAction}</p>
									<div class="impact-arrow">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="36"
											height="36"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path
												d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
											></path>
											<path d="m9 12 2 2 4-4"></path>
										</svg>
									</div>
								</div>
							{/if}
						</div>
					{:else if section.id === 'new-way'}
						<!-- New Way Forward section -->
						<h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>

						{#if section.subtitle}
							<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
								{section.subtitle}
							</p>
						{/if}

						<div class="new-way-content" in:fade={{ duration: 600, delay: 300 }}>
							{#if section.content && section.content.length > 0}
								<div class="content-block" in:fade={{ duration: 600, delay: 300 }}>
									{#each section.content as paragraph}
										<p>{paragraph}</p>
									{/each}
								</div>
							{/if}
						</div>

						{#if section.callToAction}
							<div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
								<p>{section.callToAction}</p>
							</div>
						{/if}
					{:else if section.id === 'deserve'}
						<!-- Deserve section with subslides -->
						<h2 in:fly={{ y: 20, duration: 800, delay: 100 }} class="accent-heading">
							{section.title}
						</h2>

						{#if section.subtitle}
							<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
								{section.subtitle}
							</p>
						{/if}

						{#if section.hasSubslides && section.subslides && section.subslides.length > 0}
							<div
								class="subslides-container modern-slides"
								in:fade={{ duration: 600, delay: 300 }}
							>
								<!-- Using index if not initialized -->
								{#if !currentSubslideIndices[section.id]}
									<!-- svelte-ignore missing-declaration -->
									{(currentSubslideIndices[section.id] = 0)}
								{/if}

								<div class="subslides-navigation">
									<button
										class="subslide-nav-btn modern-nav-btn"
										on:click={() => prevSubslide(section.id)}
										disabled={currentSubslideIndices[section.id] === 0}
										aria-label="Previous slide"
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
											<path d="m15 18-6-6 6-6" />
										</svg>
									</button>

									<div class="subslides-wrapper">
										{#each section.subslides as subslide, j}
											{#if j === currentSubslideIndices[section.id]}
												<div class="subslide modern-subslide" in:fade={{ duration: 300 }}>
													<div class="slide-icon">
														{#if subslide.id === 'belonging'}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="48"
																height="48"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path d="M18 8a6 6 0 0 0-6-6 6 6 0 0 0-6 6 8 8 0 0 0 13 6.326"
																></path>
																<path d="M13.5 14h.5a2 2 0 0 0 2-2"></path>
																<path d="M10 9.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>
																<path d="M15 9.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"></path>
															</svg>
														{:else if subslide.id === 'autonomy'}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="48"
																height="48"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
																<path d="m9 12 2 2 4-4"></path>
															</svg>
														{:else if subslide.id === 'security'}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="48"
																height="48"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path
																	d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1 5-5 10 10 0 0 0-10 0Z"
																></path>
																<path d="M12 2v8"></path>
																<path d="m4.93 4.93 5.66 5.66"></path>
																<path d="M2 12h8"></path>
																<path d="m4.93 19.07 5.66-5.66"></path>
															</svg>
														{:else}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="48"
																height="48"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path
																	d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
																></path>
																<path d="m8 14 2.5-2.5C11.5 10.5 13 10 16 8"></path>
																<path d="M8 10c4 0 6.608 2.186 8 4"></path>
															</svg>
														{/if}
													</div>
													<h3 class="highlight-text">{subslide.title}</h3>
													<p>{subslide.content}</p>
													<div class="slide-accent"></div>
												</div>
											{/if}
										{/each}
									</div>

									<button
										class="subslide-nav-btn modern-nav-btn"
										on:click={() => nextSubslide(section.id)}
										disabled={currentSubslideIndices[section.id] ===
											(section.subslides?.length || 0) - 1}
										aria-label="Next slide"
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
											<path d="m9 18 6-6-6-6" />
										</svg>
									</button>
								</div>

								<div class="subslides-indicators modern-indicators">
									{#each section.subslides as _, j}
										<button
											class="subslide-indicator"
											class:active={j === currentSubslideIndices[section.id]}
											on:click={() => {
												currentSubslideIndices[section.id] = j;
											}}
											aria-label="Go to slide {j + 1}"
										></button>
									{/each}
								</div>
							</div>
						{/if}
					{:else if section.id === 'solution'}
						<!-- Solution section with feature cards -->
						<h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>

						{#if section.subtitle}
							<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
								{section.subtitle}
							</p>
						{/if}

						<div class="solution-features" in:fade={{ duration: 600, delay: 300 }}>
							<div class="feature-card">
								<div class="feature-icon">
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
										<path d="M12 2v4"></path><path d="M12 18v4"></path><path
											d="m4.93 4.93 2.83 2.83"
										></path><path d="m16.24 16.24 2.83 2.83"></path><path d="M2 12h4"></path><path
											d="M18 12h4"
										></path><path d="m4.93 19.07 2.83-2.83"></path><path d="m16.24 7.76 2.83-2.83"
										></path>
									</svg>
								</div>
								<h3>Shared Resources</h3>
								<p>
									Leverage collective expertise, tools, and connections without starting from zero.
								</p>
							</div>

							<div class="feature-card">
								<div class="feature-icon">
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
										<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle
											cx="9"
											cy="7"
											r="4"
										></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path
											d="M16 3.13a4 4 0 0 1 0 7.75"
										></path>
									</svg>
								</div>
								<h3>Built-in Community</h3>
								<p>Work alongside like-minded builders who support your vision and growth.</p>
							</div>

							<div class="feature-card">
								<div class="feature-icon">
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
										<path d="m22 9-10 13L2 9l10-5 10 5Z"></path><path d="M12 12v5"></path>
									</svg>
								</div>
								<h3>Aligned Incentives</h3>
								<p>
									Build real ownership through contribution, with interests aligned for mutual
									success.
								</p>
							</div>
						</div>

						{#if section.callToAction}
							<div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
								<p>{section.callToAction}</p>
							</div>
						{/if}
					{:else if section.id === 'dao' || section.id === 'implementation' || section.id === 'your-role' || section.id === 'lifestyle'}
						<!-- Process flow sections with visual indicator -->
						<div class="process-section">
							<h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>

							{#if section.subtitle}
								<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
									{section.subtitle}
								</p>
							{/if}

							<div class="process-visualization" in:fade={{ duration: 600, delay: 300 }}>
								<div class="process-steps">
									<div
										class="process-step {processStates['dao'] === 'idea' ? 'active' : ''}"
										class:current={section.id === 'dao'}
									>
										<div class="step-icon">
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
												<circle cx="12" cy="12" r="10"></circle>
												<path d="M12 16v-4"></path>
												<path d="M12 8h.01"></path>
											</svg>
										</div>
										<span>Idea</span>
									</div>
									<div class="process-connector"></div>
									<div
										class="process-step {processStates['implementation'] === 'vote'
											? 'active'
											: ''}"
										class:current={section.id === 'implementation'}
									>
										<div class="step-icon">
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
												<path d="m9 11 3 3L22 4"></path>
												<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
											</svg>
										</div>
										<span>Vote</span>
									</div>
									<div class="process-connector"></div>
									<div
										class="process-step {processStates['your-role'] === 'draft' ? 'active' : ''}"
										class:current={section.id === 'your-role'}
									>
										<div class="step-icon">
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
												<path
													d="M12 19c-2.3 0-6.4-.2-8.1-.6-.7-.2-1.2-.7-1.4-1.4-.3-1.1-.5-3.4-.5-5s.2-3.9.5-5c.2-.7.7-1.2 1.4-1.4C5.6 5.2 9.7 5 12 5s6.4.2 8.1.6c.7.2 1.2.7 1.4 1.4.3 1.1.5 3.4.5 5s-.2 3.9-.5 5c-.2.7-.7 1.2-1.4 1.4-1.7.4-5.8.6-8.1.6 0 0 0 0 0 0z"
												></path>
												<polygon points="12 16 14 13 12 10 10 13"></polygon>
											</svg>
										</div>
										<span>Draft</span>
									</div>
									<div class="process-connector"></div>
									<div
										class="process-step {processStates['lifestyle'] === 'reward' ? 'active' : ''}"
										class:current={section.id === 'lifestyle'}
									>
										<div class="step-icon">
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
												<circle cx="12" cy="8" r="7"></circle>
												<polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
											</svg>
										</div>
										<span>Reward</span>
									</div>
								</div>
							</div>

							{#if section.id === 'dao'}
								<!-- Example idea card for the idea section -->
								<div class="idea-card" in:fade={{ duration: 600, delay: 300 }}>
									<div class="idea-header">
										<span class="idea-label">Idea</span>
										<span class="idea-stars">★ 5</span>
									</div>
									<div class="idea-content">
										<h3>Improve the onboarding process</h3>
									</div>
									<div class="idea-footer">
										<div class="idea-avatar"></div>
										<span>Posted by you</span>
									</div>
									<button class="add-idea-btn">+ Add New Idea</button>
								</div>
							{/if}

							{#if section.id === 'implementation'}
								<!-- Voting progress for implementation section -->
								<div class="vote-progress" in:fade={{ duration: 600, delay: 300 }}>
									<div class="progress-bar-container">
										<div class="progress-fill" style="width: 75%"></div>
									</div>
									<div class="vote-count">9 of 12 votes</div>
									<div class="vote-avatars">
										<div class="vote-avatar"></div>
										<div class="vote-avatar"></div>
										<div class="vote-avatar"></div>
										<div class="vote-avatar"></div>
									</div>
								</div>
							{/if}

							{#if section.id === 'your-role'}
								<!-- Draft proposal for the your-role section -->
								<div class="draft-proposal" in:fade={{ duration: 600, delay: 300 }}>
									<h3>Draft Proposal</h3>
									<div class="proposal-lines">
										<div class="proposal-line"></div>
										<div class="proposal-line"></div>
										<div class="proposal-line"></div>
										<div class="proposal-line short"></div>
									</div>
									<div class="budget-box">
										<span>Budget: €1500</span>
									</div>
									<div class="proposal-lines">
										<div class="proposal-line"></div>
										<div class="proposal-line short"></div>
									</div>
								</div>
							{/if}

							{#if section.id === 'lifestyle'}
								<!-- Reward visualization for the lifestyle section -->
								<div class="reward-visualization" in:fade={{ duration: 600, delay: 300 }}>
									<div class="reward-tokens">
										<div class="token euro">€</div>
										<div class="token vcr">VCR</div>
									</div>
									<div class="ownership-stake">
										<span>Ownership Stake</span>
									</div>
								</div>
							{/if}

							{#if section.content && section.content.length > 0}
								<div
									class="content-block presentation-content"
									in:fade={{ duration: 600, delay: 400 }}
								>
									{#each section.content as paragraph}
										<p>{paragraph}</p>
									{/each}
								</div>
							{/if}
						</div>
					{:else if section.id === 'process'}
						<!-- This section is no longer used per the presentation images -->
						<div>
							<!-- Placeholder for empty process section -->
						</div>
					{:else if section.id === 'hominio'}
						<!-- Hominio section with special styling -->
						<div class="hominio-section">
							<h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>

							{#if section.subtitle}
								<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
									{section.subtitle}
								</p>
							{/if}

							{#if section.content && section.content.length > 0}
								<div class="content-block accent-content" in:fade={{ duration: 600, delay: 300 }}>
									{#each section.content as paragraph}
										<p>{paragraph}</p>
									{/each}
								</div>
							{/if}

							{#if section.callToAction}
								<div class="call-to-action special-cta" in:fade={{ duration: 800, delay: 600 }}>
									<p>{section.callToAction}</p>
									<a href="/join" class="btn accent-btn">Join as a Founder</a>
								</div>
							{/if}
						</div>
					{:else if section.id === 'join'}
						<!-- Join section with more impactful CTA -->
						<div class="join-section">
							<h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>

							{#if section.subtitle}
								<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
									{section.subtitle}
								</p>
							{/if}

							{#if section.content && section.content.length > 0}
								<div class="content-block revolutionary" in:fade={{ duration: 600, delay: 300 }}>
									<p class="big-text">{section.content[0]}</p>
								</div>
							{/if}

							<div class="join-cta" in:fade={{ duration: 800, delay: 500 }}>
								<p>{section.callToAction}</p>

								<div class="join-buttons">
									<a href="/join" class="btn glow-btn">Join VisionCreator</a>
									<a href="#outdated" class="btn secondary">Learn More</a>
								</div>
							</div>
						</div>
					{:else}
						<!-- Default section layout -->
						<h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>

						{#if section.subtitle}
							<p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>
								{section.subtitle}
							</p>
						{/if}

						{#if section.content && section.content.length > 0}
							<div class="content-block" in:fade={{ duration: 600, delay: 300 }}>
								{#each section.content as paragraph}
									<p>{paragraph}</p>
								{/each}
							</div>
						{/if}

						{#if section.callToAction}
							<div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
								<p>{section.callToAction}</p>
							</div>
						{/if}
					{/if}
				</div>
			</section>
		{/each}
	</main>
</div>

<style>
	/* Global styles */
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
		color: #fff;
		background-color: #000;
		overflow-x: hidden;
		line-height: 1.6;
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
		position: relative;
		width: 100%;
		height: 100%;
		z-index: 2; /* Ensure sections appear over the background */
	}

	.section {
		position: relative;
		min-height: 100vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		padding: 4rem 2rem;
		box-sizing: border-box;
		transition: all 0.5s ease;
		z-index: 2; /* Ensure section content appears above the background */
	}

	.section-content {
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		position: relative;
		z-index: 10;
		padding: 2rem;
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

	/* Hero section enhancements */
	.hero-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0 1rem;
	}

	.split-text {
		overflow: hidden;
		position: relative;
		text-align: center;
	}

	.text-animate-wrapper {
		display: inline-block;
		overflow: hidden;
	}

	.text-animate {
		display: inline-block;
		animation: reveal 1.2s cubic-bezier(0.77, 0, 0.175, 1) forwards;
	}

	@keyframes reveal {
		0% {
			transform: translateY(100%);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.gradient-text {
		background: linear-gradient(to right, #7c3aed, #3b82f6);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		font-weight: 600;
	}

	.hero-subtitle {
		font-size: 1.75rem;
		margin-bottom: 2.5rem;
	}

	.pulse-animation {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.7;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Orbit visualization for hero */
	.hero-visual {
		margin: 3rem 0;
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.orbit-container {
		position: relative;
		width: 200px;
		height: 200px;
	}

	.orbit-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, #7c3aed, #3b82f6);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 30px rgba(124, 58, 237, 0.5);
		z-index: 2;
	}

	.orbit-center span {
		color: white;
		font-weight: 700;
		font-size: 1.2rem;
	}

	.orbit {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 1px solid rgba(124, 58, 237, 0.3);
		border-radius: 50%;
		animation: rotate 15s linear infinite;
	}

	@keyframes rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.planet {
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
	}

	.planet span {
		color: white;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.hero-cta {
		margin-top: 2rem;
	}

	/* Scroll to top button */
	.scroll-top-button {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 900;
		transition: all 0.3s ease;
	}

	.scroll-top-button:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
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
	}

	.logo-text {
		font-size: 1.5rem;
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
</style>
