<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	// Define the parallel tracks model
	interface Milestone {
		title: string;
		description: string;
	}

	interface Track {
		id: string;
		title: string;
		color: string;
		milestones: Milestone[];
	}

	interface StatusInfo {
		color: string;
		icon: string;
		text: string;
	}

	// Constants for financial projections
	const INVESTMENT = 365; // One-time investment in euros
	const PLATFORM_PERCENTAGE = 0.5; // 50% to platform development
	const POOL_PERCENTAGE = 0.5; // 50% to community pool
	const OWNERSHIP_DISTRIBUTED = 0.3; // 30% ownership to first 10,000 members
	const TARGET_MEMBERS = 10000; // Community exit milestone

	// Calculate token distribution and pool size
	function calculatePoolSize(members: number): number {
		return members * INVESTMENT * POOL_PERCENTAGE;
	}

	function calculatePlatformFunding(members: number): number {
		return members * INVESTMENT * PLATFORM_PERCENTAGE;
	}

	function calculateTotalFunding(members: number): number {
		return members * INVESTMENT;
	}

	// Define membership milestones
	const membershipMilestones = [100, 1000, 5000, 10000];

	// Define the parallel tracks data
	const tracks: Track[] = [
		{
			id: 'platform-track',
			title: 'Platform Development',
			color: 'blue',
			milestones: [
				{
					title: 'Platform Foundation',
					description:
						'Building the core AI marketplace infrastructure, establishing technical architecture, and implementing basic functionality'
				},
				{
					title: 'Creator Tools',
					description:
						'Developing AI-powered tools for digital asset creation, implementing creator profiles and contribution tracking'
				},
				{
					title: 'Marketplace Expansion',
					description:
						'Adding advanced features, scaling infrastructure, and implementing recommendation systems as the community grows'
				},
				{
					title: 'Full-Scale Platform',
					description:
						'Completing all platform features, ensuring scalability to support thousands of creators and their digital assets'
				}
			]
		},
		{
			id: 'community-track',
			title: 'Community Ownership',
			color: 'rose',
			milestones: [
				{
					title: 'Initial Token Distribution',
					description:
						'Distributing VCR tokens to early members, setting up governance mechanisms, and establishing the community pool'
				},
				{
					title: 'Governance Framework',
					description:
						'Implementing proposal and voting systems, creating working groups, and establishing contribution metrics'
				},
				{
					title: 'Economic Infrastructure',
					description:
						'Building advanced token utility features, automating revenue sharing, and creating funding mechanisms for community projects'
				},
				{
					title: 'Community Exit',
					description:
						'Executing the transition to full DAO governance, giving complete control to the token holders and finalizing the ownership distribution'
				}
			]
		}
	];

	// Milestone projections for financial metrics (without token value)
	const milestoneProjections = membershipMilestones.map((members) => {
		return {
			members,
			poolSize: calculatePoolSize(members),
			platformFunding: calculatePlatformFunding(members),
			totalFunding: calculateTotalFunding(members)
			// tokenValue is no longer included
		};
	});

	// Core value props for different stakeholders
	const valueProps = [
		{
			title: 'For Creators',
			color: 'amber',
			items: [
				'Immediate access to AI tools for building digital assets',
				'Earn VCR tokens through platform contributions',
				'Build ownership in a growing ecosystem'
			]
		},
		{
			title: 'For Investors',
			color: 'emerald',
			items: [
				'Unique dual-investment model: financial + contribution',
				'Clear exit strategy at 10,000 member milestone',
				'30% ownership distributed through VCR tokens'
			]
		},
		{
			title: 'For Partners',
			color: 'cyan',
			items: [
				'Join an ecosystem with built-in distribution channel',
				'Leverage community resources for development',
				'Align with next-generation ownership model'
			]
		}
	];

	// Key metrics for the model
	const keyMetrics = [
		{ metric: 'One-time Investment', value: '€365', description: 'Single payment for membership' },
		{
			metric: 'Investment Split',
			value: '50/50',
			description: 'Platform development / Community pool'
		},
		{ metric: 'Ownership Distribution', value: '30%', description: 'To first 10,000 members' },
		{ metric: 'Community Treasury', value: '€1.8M+', description: 'At 10,000 members milestone' },
		{ metric: 'Community Governance', value: '100%', description: 'After DAO transformation' }
	];

	// Viewport intersection detection for animations
	let trackSections: HTMLElement[] = [];
	let investmentSection: HTMLElement;
	let valuePropSection: HTMLElement;
	let metricsSection: HTMLElement;
	let convergenceSection: HTMLElement;
	let intersectionObserver: IntersectionObserver;
	let visibleSections = new Set<string>();
	let showInvestmentModel = false;
	let showValueProps = false;
	let showMetrics = false;
	let showConvergence = false;

	onMount(() => {
		// Set up intersection observer for animation triggers
		intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && entry.target instanceof HTMLElement) {
						if (entry.target === investmentSection) {
							showInvestmentModel = true;
							return;
						}

						if (entry.target === valuePropSection) {
							showValueProps = true;
							return;
						}

						if (entry.target === metricsSection) {
							showMetrics = true;
							return;
						}

						if (entry.target === convergenceSection) {
							showConvergence = true;
							return;
						}

						const id = entry.target.dataset.id;
						if (id) {
							visibleSections.add(id);
							visibleSections = visibleSections;
						}
					}
				});
			},
			{ threshold: 0.2 }
		);

		// Observe all track sections
		trackSections.forEach((section) => {
			if (section) {
				intersectionObserver.observe(section);
			}
		});

		// Observe other sections
		if (investmentSection) {
			intersectionObserver.observe(investmentSection);
		}

		if (valuePropSection) {
			intersectionObserver.observe(valuePropSection);
		}

		if (metricsSection) {
			intersectionObserver.observe(metricsSection);
		}

		if (convergenceSection) {
			intersectionObserver.observe(convergenceSection);
		}

		return () => {
			if (intersectionObserver) {
				intersectionObserver.disconnect();
			}
		};
	});

	// Format numbers for better readability
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-US').format(Math.round(num));
	}
</script>

<svelte:head>
	<title>VisionCreator Model</title>
	<meta
		name="description"
		content="VisionCreator - Community-Powered Startup with Parallel Tracks of Development and Ownership"
	/>
</svelte:head>

<!-- Hero section -->
<section class="bg-gradient-to-b from-rose-900/20 to-transparent py-16 md:py-24">
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-3xl text-center" in:fade={{ duration: 800, delay: 200 }}>
			<h1 class="mb-6 text-4xl font-bold text-white md:text-5xl">
				The <span class="text-rose-400">Community-Powered</span> Startup
			</h1>
			<p class="mb-8 text-xl text-gray-300">
				Building and ownership on parallel tracks, converging at our 10,000 member milestone.
			</p>

			<div
				class="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6 shadow-lg backdrop-blur-sm"
			>
				<p class="text-lg italic leading-relaxed text-slate-300">
					"VisionCreator combines startup building with community ownership from day one. This isn't
					sequential phases—it's parallel tracks of building and ownership that converge at our
					community milestone."
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Investment Model Explanation -->
<section class="bg-gradient-to-b from-gray-900 to-gray-900/30 py-16" bind:this={investmentSection}>
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-10 text-center text-3xl font-bold text-rose-400" in:fade={{ duration: 800 }}>
				One Investment, Two Paths
			</h2>

			{#if showInvestmentModel}
				<div class="relative mb-20">
					<!-- Central investment circle -->
					<div
						class="relative z-10 mx-auto flex h-56 w-56 flex-col items-center justify-center rounded-full border-4 border-rose-500/30 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg shadow-rose-900/20"
						in:scale={{ delay: 200, duration: 800, start: 0.5, opacity: 0 }}
					>
						<div class="text-5xl font-bold text-rose-400">€365</div>
						<div class="mt-2 text-center text-gray-300">One-time<br />Investment</div>
					</div>

					<!-- Split arrows and destination boxes -->
					<div
						class="absolute left-0 right-0 top-[calc(50%-2rem)] flex items-center justify-between"
						in:fade={{ delay: 800, duration: 800 }}
					>
						<!-- Platform Development Arrow (Left) -->
						<div class="flex w-1/3 flex-col items-center space-y-4">
							<div class="font-bold text-blue-400">50%</div>
							<div class="h-32 w-48 rounded-tr-3xl border-r-4 border-t-4 border-blue-500/40"></div>
							<div
								class="rounded-xl border border-blue-500/30 bg-blue-900/20 p-4 shadow-lg backdrop-blur-sm"
							>
								<h3 class="mb-2 text-xl font-semibold text-blue-400">Platform Development</h3>
								<p class="text-sm text-gray-300">
									Building the AI marketplace infrastructure and creator tools
								</p>
							</div>
						</div>

						<!-- Community Pool Arrow (Right) -->
						<div class="flex w-1/3 flex-col items-center space-y-4">
							<div class="font-bold text-rose-400">50%</div>
							<div class="h-32 w-48 rounded-tl-3xl border-l-4 border-t-4 border-rose-500/40"></div>
							<div
								class="rounded-xl border border-rose-500/30 bg-rose-900/20 p-4 shadow-lg backdrop-blur-sm"
							>
								<h3 class="mb-2 text-xl font-semibold text-rose-400">Community Pool</h3>
								<p class="text-sm text-gray-300">
									Funding community projects and distributing ownership
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Investment Projections Table -->
				<div
					class="mt-16 rounded-xl border border-gray-700 bg-gray-800/30 p-6 shadow-xl backdrop-blur-sm"
					in:fly={{ y: 50, duration: 800, delay: 400 }}
				>
					<h3 class="mb-6 text-center text-2xl font-bold text-white">Milestone Projections</h3>

					<div class="overflow-x-auto">
						<table class="w-full text-left text-sm text-gray-300">
							<thead class="bg-gray-800 text-xs uppercase text-gray-400">
								<tr>
									<th class="rounded-tl-lg px-4 py-3">Members</th>
									<th class="px-4 py-3">Platform Funding</th>
									<th class="px-4 py-3">Community Pool</th>
									<th class="rounded-tr-lg px-4 py-3">Total Funding</th>
								</tr>
							</thead>
							<tbody>
								{#each milestoneProjections as projection, i}
									<tr class={i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'}>
										<td class="px-4 py-4 font-medium text-white"
											>{formatNumber(projection.members)}</td
										>
										<td class="px-4 py-4 font-mono">€{formatNumber(projection.platformFunding)}</td>
										<td class="px-4 py-4 font-mono">€{formatNumber(projection.poolSize)}</td>
										<td class="px-4 py-4 font-mono">€{formatNumber(projection.totalFunding)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="mt-6 text-center text-sm text-gray-400">
						<p>
							Early members receive a proportionally larger share of the 30% ownership allocation
							distributed to the first 10,000 members.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Parallel Tracks Visualization -->
<section class="bg-gradient-to-b from-gray-900/80 to-gray-900/30 py-16">
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-5xl">
			<h2 class="mb-16 text-center text-3xl font-bold text-white" in:fade={{ duration: 800 }}>
				Parallel Tracks, One Vision
			</h2>

			<div class="relative">
				<!-- Track lines -->
				<div class="absolute inset-x-0 top-10 flex justify-center">
					<div class="relative w-1/3">
						<div class="absolute bottom-0 left-1/2 top-0 w-2 rounded-full bg-blue-500/20"></div>
					</div>
					<div class="relative w-1/3">
						<div class="absolute bottom-0 left-1/2 top-0 w-2 rounded-full bg-rose-500/20"></div>
					</div>
				</div>

				<!-- Member milestone indicators -->
				<div class="relative">
					<div class="mb-12 py-8">
						<!-- Track headers -->
						<div class="relative z-10 mb-12 grid grid-cols-2">
							<div class="text-center">
								<h3 class="mb-2 text-2xl font-bold text-blue-400">Platform Development</h3>
								<div
									class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-500/30 bg-blue-900/30 text-blue-300"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
										/>
									</svg>
								</div>
							</div>
							<div class="text-center">
								<h3 class="mb-2 text-2xl font-bold text-rose-400">Community Ownership</h3>
								<div
									class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-rose-500/30 bg-rose-900/30 text-rose-300"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
								</div>
							</div>
						</div>

						<!-- Milestone connections -->
						{#each membershipMilestones as members, index}
							{@const lastMilestone = index === membershipMilestones.length - 1}

							<div
								class="relative mb-32"
								data-id={`milestone-${members}`}
								bind:this={trackSections[index]}
							>
								<!-- Member milestone circle -->
								<div
									class="absolute left-1/2 top-16 z-20 flex -translate-x-1/2 transform flex-col items-center"
								>
									<div
										class={`flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 bg-gradient-to-br from-slate-800 to-slate-900 ${lastMilestone ? 'border-purple-500/50' : 'border-amber-500/30'} shadow-lg shadow-amber-900/10`}
										in:scale={{ delay: 200 + index * 200, duration: 800, start: 0.5, opacity: 0 }}
									>
										<div
											class={`text-2xl font-bold ${lastMilestone ? 'text-purple-400' : 'text-amber-400'}`}
										>
											{formatNumber(members)}
										</div>
										<div class="mt-1 text-xs text-gray-300">Members</div>
									</div>

									{#if lastMilestone}
										<div
											class="mt-4 rounded-full border border-purple-500/30 bg-purple-900/30 px-4 py-1 backdrop-blur-sm"
											in:fade={{ delay: 600 + index * 200, duration: 800 }}
										>
											<span class="text-sm font-medium text-purple-300"
												>Community Exit Milestone</span
											>
										</div>
									{/if}
								</div>

								<!-- Milestone cards for each track -->
								{#if visibleSections.has(`milestone-${members}`)}
									<div class="mt-48 grid grid-cols-2 gap-8">
										<!-- Platform track milestone -->
										<div
											class="transform rounded-xl border border-blue-500/20 bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-blue-500/50"
											in:fly={{ x: -50, duration: 800, delay: 400 + index * 200 }}
										>
											<h4 class="mb-3 text-xl font-semibold text-blue-300">
												{tracks[0].milestones[index].title}
											</h4>
											<p class="text-sm leading-relaxed text-gray-300">
												{tracks[0].milestones[index].description}
											</p>
										</div>

										<!-- Community track milestone -->
										<div
											class="transform rounded-xl border border-rose-500/20 bg-gray-800/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:border-rose-500/50"
											in:fly={{ x: 50, duration: 800, delay: 400 + index * 200 }}
										>
											<h4 class="mb-3 text-xl font-semibold text-rose-300">
												{tracks[1].milestones[index].title}
											</h4>
											<p class="text-sm leading-relaxed text-gray-300">
												{tracks[1].milestones[index].description}
											</p>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Convergence Model -->
<section class="bg-gradient-to-b from-gray-900/50 to-gray-900 py-16" bind:this={convergenceSection}>
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-12 text-center text-3xl font-bold text-white" in:fade={{ duration: 800 }}>
				The Convergence
			</h2>

			{#if showConvergence}
				<div class="relative py-16" in:fade={{ duration: 1200 }}>
					<!-- Convergence diagram -->
					<div class="mb-12 flex items-end justify-center">
						<!-- Left track -->
						<div class="flex w-1/3 flex-col items-center">
							<div
								class="mb-8 flex h-48 w-48 flex-col items-center justify-center rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-900/50 to-blue-800/20 p-4"
								in:fly={{ x: -30, y: 30, duration: 800, delay: 200 }}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mb-4 h-12 w-12 text-blue-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
									/>
								</svg>
								<div class="text-center text-lg font-semibold text-blue-300">Platform Track</div>
							</div>
							<div class="h-24 w-32 rounded-br-3xl border-b-4 border-r-4 border-blue-500/40"></div>
						</div>

						<!-- Right track -->
						<div class="flex w-1/3 flex-col items-center">
							<div
								class="mb-8 flex h-48 w-48 flex-col items-center justify-center rounded-lg border border-rose-500/30 bg-gradient-to-br from-rose-900/50 to-rose-800/20 p-4"
								in:fly={{ x: 30, y: 30, duration: 800, delay: 200 }}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mb-4 h-12 w-12 text-rose-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								<div class="text-center text-lg font-semibold text-rose-300">Ownership Track</div>
							</div>
							<div class="h-24 w-32 rounded-bl-3xl border-b-4 border-l-4 border-rose-500/40"></div>
						</div>
					</div>

					<!-- Converged DAO -->
					<div
						class="mx-auto max-w-2xl"
						in:scale={{ delay: 400, duration: 1200, start: 0.5, opacity: 0 }}
					>
						<div
							class="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-indigo-900/20 p-8 text-center shadow-lg backdrop-blur-sm"
						>
							<div
								class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-purple-500/30 bg-gradient-to-br from-purple-800 to-indigo-900"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-10 w-10 text-purple-300"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
									/>
								</svg>
							</div>
							<h3 class="mb-4 text-2xl font-bold text-purple-300">Community-Owned DAO</h3>
							<p class="mb-6 text-gray-300">
								At 10,000 members, VisionCreator transforms into a fully community-governed DAO
								where token holders completely control the platform's future.
							</p>

							<div class="mt-8 grid grid-cols-3 gap-4">
								<div class="rounded-lg bg-gray-800/50 p-4">
									<div class="text-xl font-bold text-purple-300">100%</div>
									<div class="text-sm text-gray-400">Community Governance</div>
								</div>
								<div class="rounded-lg bg-gray-800/50 p-4">
									<div class="text-xl font-bold text-purple-300">30%</div>
									<div class="text-sm text-gray-400">Ownership Distributed</div>
								</div>
								<div class="rounded-lg bg-gray-800/50 p-4">
									<div class="text-xl font-bold text-purple-300">€3.65M</div>
									<div class="text-sm text-gray-400">Total Investment</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Value Proposition Section -->
<section class="bg-gradient-to-b from-gray-900 to-gray-800 py-16" bind:this={valuePropSection}>
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-10 text-center text-3xl font-bold text-white" in:fade={{ duration: 800 }}>
				The Value Proposition
			</h2>

			{#if showValueProps}
				<div class="mb-12 grid gap-6 md:grid-cols-3">
					{#each valueProps as prop, i}
						<div
							class={`border bg-gray-800/50 backdrop-blur-sm border-${prop.color}-500/20 h-full transform rounded-xl p-6 shadow-lg transition-all duration-500 hover:scale-105 hover:border-${prop.color}-500/40`}
							in:fly={{ y: 20, x: (i - 1) * 20, duration: 800, delay: 200 + i * 150 }}
						>
							<h3 class={`text-xl font-bold text-${prop.color}-400 mb-4`}>{prop.title}</h3>
							<ul class="space-y-3">
								{#each prop.items as item}
									<li class="flex items-start">
										<span class={`text-${prop.color}-400 mr-2 mt-1`}>→</span>
										<span class="text-sm text-gray-300">{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Key Metrics Section -->
<section class="bg-gradient-to-b from-gray-800 to-gray-900 py-16" bind:this={metricsSection}>
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-10 text-center text-3xl font-bold text-rose-400" in:fade={{ duration: 800 }}>
				The Numbers That Matter
			</h2>

			{#if showMetrics}
				<div class="mb-12 grid gap-4 md:grid-cols-5">
					{#each keyMetrics as metric, i}
						<div
							class="rounded-xl border border-gray-700 bg-gray-800/50 p-5 text-center shadow-lg backdrop-blur-sm"
							in:scale={{ delay: 200 + i * 100, duration: 600, start: 0.8, opacity: 0 }}
						>
							<div class="mb-2 text-2xl font-bold text-rose-400 md:text-3xl">{metric.value}</div>
							<h3 class="mb-1 text-sm font-medium text-white">{metric.metric}</h3>
							<p class="text-xs text-gray-400">{metric.description}</p>
						</div>
					{/each}
				</div>

				<div class="mt-8 text-center" in:fade={{ delay: 1000, duration: 800 }}>
					<p class="text-lg italic text-gray-300">
						"VisionCreator isn't just a startup—it's a new economic model where everyone building is
						also investing, while still accommodating passive investors who want to be part of our
						journey without active contribution."
					</p>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- Call to action -->
<section class="bg-gradient-to-b from-gray-900 to-black py-16">
	<div class="container mx-auto px-4 md:px-8">
		<div class="mx-auto max-w-3xl text-center">
			<h2 class="mb-6 text-3xl font-bold text-white">Join the Community</h2>
			<p class="mb-8 text-xl text-gray-300">
				Be among the first 10,000 members who will own and govern VisionCreator. For just €365,
				you'll secure your place in building the future of work, ownership, and community-powered
				innovation.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<a
					href="/join"
					class="rounded-md bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-400 hover:to-pink-500"
				>
					Become a Member
				</a>
				<a
					href="/presentation"
					class="rounded-md bg-gray-800 px-8 py-4 font-medium text-white transition-all hover:bg-gray-700"
				>
					Watch Our Presentation
				</a>
			</div>

			<p class="mt-6 text-gray-400">
				Early members receive more valuable token allocations than later ones.
			</p>
		</div>
	</div>
</section>
