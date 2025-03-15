<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	interface Section {
		id: string;
		title: string;
		message: string;
		accent?: boolean;
	}

	// Core messages for each slide
	const sections: Section[] = [
		{
			id: 'intro',
			title: 'The Story',
			message: 'Traditional work models no longer inspire visionary creators like you.',
			accent: true
		},
		{
			id: 'pain',
			title: 'The Dilemma',
			message: 'Neither working for others nor solo entrepreneurship feels truly fulfilling.'
		},
		{
			id: 'why',
			title: 'The Impact',
			message: 'Work should enhance your wellbeing, not degrade your quality of life.'
		},
		{
			id: 'needs',
			title: 'The Needs',
			message: 'Work should provide belonging, autonomy, security, and self-expression.'
		},
		{
			id: 'achieve',
			title: 'The Ingredients',
			message:
				'True fulfillment requires community, freedom, value creation, and authentic expression.'
		},
		{
			id: 'question',
			title: 'The Question',
			message: 'Could such a harmonious vision really come to life?',
			accent: true
		},
		{
			id: 'solution',
			title: 'The Answer',
			message: 'Welcome to Vision Creator—the future of economic organizations.'
		},
		{
			id: 'principles',
			title: 'The Framework',
			message: 'Align your external actions with your inner vision through collaborative ownership.'
		},
		{
			id: 'governance',
			title: 'The Governance',
			message: 'Democratic decision-making ensures every voice is valued.'
		},
		{
			id: 'reality',
			title: 'The Reality',
			message: 'Vision Creator is operational with real legal ownership and community rewards.'
		},
		{
			id: 'action',
			title: 'The Future',
			message: 'Stop building for others and start building for yourself.',
			accent: true
		}
	];

	// Reactive variables
	let currentSection = 0;
	let scrollY = 0;
	let windowHeight = 0;
	let documentHeight = 0;
	let sectionElements: HTMLElement[] = [];
	let progressPercentage = 0;
	let showWelcome = true;

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
			rootMargin: '0px',
			threshold: 0.5
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const id = entry.target.id;

				if (entry.isIntersecting) {
					const index = sections.findIndex((section) => section.id === id);
					if (index >= 0) {
						currentSection = index;
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

	// Start presentation and hide welcome screen
	function startPresentation() {
		showWelcome = false;
		scrollToSection(0);
	}

	onMount(() => {
		// Get section elements
		sectionElements = sections.map((section) => document.getElementById(section.id) as HTMLElement);

		// Set initial dimensions
		windowHeight = window.innerHeight;
		documentHeight = document.body.scrollHeight;

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
	<title>Vision Creator | Own Your Future</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window bind:scrollY />

<div class="grok-presentation">
	<!-- Progress bar -->
	<div class="progress-container">
		<div class="progress-bar" style="width: {progressPercentage}%"></div>
	</div>

	<!-- Navigation -->
	<nav class="navigation" class:hidden={showWelcome}>
		<ul>
			{#each sections as section, i}
				<li class:active={i === currentSection}>
					<button on:click={() => scrollToSection(i)} aria-label="Navigate to {section.title}">
						<span class="nav-indicator"></span>
						<span class="nav-text">{section.title}</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Scroll to top button -->
	{#if scrollY > 300 && !showWelcome}
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
			<div class="starfield">
				<div class="node-network"></div>
			</div>

			<div class="welcome-content">
				<div class="welcome-title" in:fade={{ duration: 800, delay: 200 }}>
					<div class="title-line">Vision</div>
					<div class="title-line highlight">Creator</div>
				</div>
				<p in:fade={{ duration: 800, delay: 400 }}>Own Your Future</p>

				<button
					class="action-button"
					on:click={startPresentation}
					in:fade={{ duration: 800, delay: 600 }}
				>
					Start
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
			</div>
		</div>
	{/if}

	<!-- Section content -->
	<main>
		{#each sections as section, i}
			<section
				id={section.id}
				class="section"
				class:active={i === currentSection}
				class:accent={section.accent}
			>
				<div class="starfield">
					<div class="node-network"></div>
				</div>

				<div class="section-content" in:fade={{ duration: 1000 }}>
					<h2>{section.title}</h2>
					<p>{section.message}</p>

					{#if section.id === 'action'}
						<button class="action-button" in:fade={{ duration: 800, delay: 600 }}>
							Join Now
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
					{/if}
				</div>
			</section>
		{/each}
	</main>
</div>

<style>
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
		background-color: #000;
		color: #ffffff;
		overflow-x: hidden;
	}

	.grok-presentation {
		position: relative;
		width: 100%;
		min-height: 100vh;
		overflow-x: hidden;
	}

	/* Progress bar */
	.progress-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 2px;
		z-index: 1000;
		background: rgba(64, 64, 64, 0.3);
	}

	.progress-bar {
		height: 100%;
		background: rgba(255, 255, 255, 0.6);
		transition: width 0.1s;
	}

	/* Navigation */
	.navigation {
		position: fixed;
		top: 50%;
		right: 2rem;
		transform: translateY(-50%);
		z-index: 900;
		transition: opacity 0.3s ease;
	}

	.navigation.hidden {
		opacity: 0;
		pointer-events: none;
	}

	.navigation ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.navigation li {
		position: relative;
	}

	.navigation button {
		background: none;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: 0.3rem;
		transition: all 0.3s ease;
		color: rgba(255, 255, 255, 0.4);
	}

	.navigation button:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	.navigation .nav-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		margin-right: 0.5rem;
		transition: all 0.3s ease;
	}

	.navigation .nav-text {
		opacity: 0;
		transform: translateX(0.5rem);
		transition: all 0.3s ease;
		white-space: nowrap;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.navigation button:hover .nav-text {
		opacity: 1;
		transform: translateX(0);
	}

	.navigation li.active .nav-indicator {
		background: rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}

	.navigation li.active button {
		color: rgba(255, 255, 255, 0.9);
	}

	/* Sections */
	.section {
		min-height: 100vh;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	/* Starfield background */
	.starfield {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #000000 0%, #0a0a14 100%);
		overflow: hidden;
		z-index: 1;
	}

	.node-network {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: radial-gradient(
				1px 1px at 20px 30px,
				rgba(255, 255, 255, 0.3),
				rgba(0, 0, 0, 0)
			),
			radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
			radial-gradient(1px 1px at 160px 120px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0));
		background-repeat: repeat;
		background-size: 200px 200px;
	}

	.section.accent .starfield {
		background: linear-gradient(135deg, #000000 0%, #0a1025 100%);
	}

	/* Section content */
	.section-content {
		position: relative;
		z-index: 10;
		max-width: 800px;
		text-align: center;
		padding: 2rem;
	}

	.section-content h2 {
		font-size: 2rem;
		font-weight: 300;
		margin-bottom: 2rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.section-content p {
		font-size: 3.5rem;
		font-weight: 600;
		line-height: 1.2;
		margin: 0;
		color: rgba(255, 255, 255, 0.9);
	}

	.section.accent .section-content p {
		background: linear-gradient(to right, #ffffff, #b3b3ff);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
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
		color: #ffffff;
	}

	.title-line.highlight {
		background: linear-gradient(to right, #ffffff, #b3b3ff);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.welcome-content p {
		font-size: 1.5rem;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 3rem;
		letter-spacing: 0.05em;
	}

	/* Buttons */
	.action-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 2rem;
		font-weight: 500;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 3rem;
	}

	.action-button:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.action-button svg {
		transition: transform 0.3s ease;
	}

	.action-button:hover svg {
		transform: translateX(3px);
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

	/* Media queries */
	@media (max-width: 768px) {
		.navigation {
			bottom: 1rem;
			top: auto;
			right: 50%;
			transform: translateX(50%);
		}

		.navigation ul {
			flex-direction: row;
		}

		.navigation .nav-text {
			display: none;
		}

		.section-content p {
			font-size: 2.5rem;
		}

		.welcome-title {
			font-size: 3.5rem;
		}
	}
</style>
