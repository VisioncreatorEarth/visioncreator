<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import Icon from '@iconify/svelte';

	type ProposalState = 'voting' | 'doing' | 'pending_payout' | 'done';

	interface Proposal {
		id: string;
		title: string;
		author: string;
		requestedAmount: number;
		expectedResults: string;
		commitment: string;
		votes: number;
		description: string;
		state: ProposalState;
		estimatedDelivery: string;
	}

	// Add user profile type
	interface UserProfile {
		id: string;
		name: string;
		votesAvailable: number;
		votesUsed: number;
		proposalsCreated: number;
		proposalsVoted: Set<string>;
		proposalVoteCounts: Map<string, number>; // Track votes per proposal
	}

	const currentUser: Writable<UserProfile> = writable({
		id: '1',
		name: 'Samuel Andert',
		votesAvailable: 100,
		votesUsed: 0,
		proposalsCreated: 1,
		proposalsVoted: new Set(),
		proposalVoteCounts: new Map()
	});

	const proposals: Writable<Proposal[]> = writable([
		{
			id: '1',
			title: 'Modern Landing Page Development',
			author: 'David Chen',
			requestedAmount: 800,
			expectedResults: '+500 new signups/month, 40% conversion rate improvement',
			commitment:
				'Payment released upon successful deployment with A/B test showing >35% conversion improvement',
			votes: 24,
			description:
				'Design and develop a high-converting landing page using modern web technologies (SvelteKit, Tailwind). The landing page will feature interactive components, dynamic content loading, and mobile-first responsive design. Key features include: personalized user journey flows, integrated analytics dashboard for real-time conversion tracking, A/B testing infrastructure for continuous optimization, and seamless integration with our existing authentication system. The design will follow atomic design principles, ensuring consistent branding and maximum reusability of components.',
			state: 'doing',
			estimatedDelivery: '3 weeks'
		},
		{
			id: '2',
			title: 'VisionCreator Launch Event',
			author: 'Maria Garcia',
			requestedAmount: 1000,
			expectedResults: '100+ attendees, 20 new active pioneers, 5 potential partnerships',
			commitment:
				'Payment released after successful event completion with minimum 80 verified attendees',
			votes: 31,
			description:
				'Organize a startup networking event to showcase VisionCreator. This comprehensive event will include multiple interactive workshops, keynote presentations from successful entrepreneurs, and dedicated networking sessions. We will secure a premium venue in the city center, arrange professional video coverage, and implement a sophisticated registration system. The event will feature live demonstrations of the platform, success story presentations from early adopters, and interactive Q&A sessions. Post-event activities include follow-up networking opportunities, resource sharing, and community building initiatives.',
			state: 'voting',
			estimatedDelivery: '2 weeks'
		},
		{
			id: '3',
			title: 'Community Task Board Development',
			author: 'Alex Kumar',
			requestedAmount: 600,
			expectedResults: '30% improved task completion rate, 50% faster project initialization',
			commitment: 'Payment released upon deployment with all features tested and documented',
			votes: 28,
			description:
				'Build an interactive task board for community projects using SvelteKit and Tailwind. This comprehensive project management tool will include real-time collaboration features, customizable workflow states, and detailed progress tracking. Key features include: drag-and-drop task management, real-time updates using websockets, integrated commenting system, file attachment support, and automated progress tracking. The board will also feature advanced filtering options, priority management, deadline tracking, and integration with popular calendar systems. Mobile responsiveness and offline support will ensure seamless usage across all devices.',
			state: 'pending_payout',
			estimatedDelivery: '4 weeks'
		},
		{
			id: '4',
			title: 'Vision Pitch Video Production',
			author: 'Sarah Miller',
			requestedAmount: 750,
			expectedResults: '40% better conversion rate, 2x faster onboarding understanding',
			commitment: 'Payment released upon delivery of final video with positive community feedback',
			votes: 42,
			description:
				'Create a professional pitch video explaining the VisionCreator concept. This comprehensive video production will include professional script writing, custom animations, professional voice-over recording, and multiple language support. The video will feature high-quality motion graphics, real user testimonials, and detailed platform demonstrations. We will create multiple versions optimized for different platforms (website, social media, presentations) and include interactive elements for deeper engagement. The production process includes storyboarding, multiple revision rounds, professional sound design, and careful attention to brand guidelines.',
			state: 'done',
			estimatedDelivery: '1 week'
		},
		{
			id: '5',
			title: 'Social Media Growth Partnership',
			author: 'Tom Wilson',
			requestedAmount: 900,
			expectedResults: '10k new followers, 25% engagement rate, 100 qualified leads/month',
			commitment: 'Revenue sharing: 20% of converted leads for 6 months, minimum 3 posts/week',
			votes: 35,
			description:
				'Launch a comprehensive social media campaign across Twitter, LinkedIn, and Instagram. This strategic growth initiative will include daily content creation, community engagement, and targeted lead generation. We will develop a content calendar focusing on educational content, success stories, and platform features. The campaign includes creation of viral-optimized content, engagement with industry influencers, and development of lead magnets. We will implement advanced analytics tracking, A/B test different content types, and optimize posting schedules based on engagement data. The partnership includes regular performance reports, strategy adjustments, and collaborative content creation with community members.',
			state: 'voting',
			estimatedDelivery: '3 weeks'
		}
	]);

	let showNewProposalModal = false;
	let newProposal: Partial<Proposal> = {};

	// Add dashboard metrics
	const dashboardMetrics = {
		poolAmount: 4458,
		visionCreators: 17,
		monthlyIncome: 0
	};

	function getStateColor(state: ProposalState): string {
		switch (state) {
			case 'voting':
				return 'text-tertiary-300';
			case 'doing':
				return 'text-primary-400';
			case 'pending_payout':
				return 'text-warning-400';
			case 'done':
				return 'text-success-400';
			default:
				return 'text-tertiary-300';
		}
	}

	function getStateIcon(state: ProposalState): string {
		switch (state) {
			case 'voting':
				return 'mdi:vote';
			case 'doing':
				return 'mdi:progress-wrench';
			case 'pending_payout':
				return 'mdi:cash-clock';
			case 'done':
				return 'mdi:check-circle';
			default:
				return 'mdi:help-circle';
		}
	}

	function getStateLabel(state: ProposalState): string {
		switch (state) {
			case 'voting':
				return 'Voting';
			case 'doing':
				return 'In Progress';
			case 'pending_payout':
				return 'Pending Payout';
			case 'done':
				return 'Completed';
			default:
				return 'Unknown';
		}
	}

	function getStateBgColor(state: ProposalState): string {
		switch (state) {
			case 'voting':
				return 'bg-surface-700/30';
			case 'doing':
				return 'bg-primary-900/20';
			case 'pending_payout':
				return 'bg-warning-900/20';
			case 'done':
				return 'bg-success-900/20';
			default:
				return 'bg-surface-700/30';
		}
	}

	function calculateQuadraticCost(currentVotes: number): number {
		return (currentVotes + 1) * (currentVotes + 1);
	}

	function vote(proposalId: string, isIncrease: boolean): void {
		$currentUser = { ...$currentUser };
		const currentVoteCount = $currentUser.proposalVoteCounts.get(proposalId) || 0;

		if (isIncrease) {
			const cost = calculateQuadraticCost(currentVoteCount);
			if ($currentUser.votesAvailable >= cost) {
				$currentUser.votesAvailable -= cost;
				$currentUser.votesUsed += cost;
				$currentUser.proposalVoteCounts.set(proposalId, currentVoteCount + 1);
				$currentUser.proposalsVoted.add(proposalId);

				$proposals = $proposals.map((p) =>
					p.id === proposalId ? { ...p, votes: p.votes + 1 } : p
				);
			}
		} else if (currentVoteCount > 0) {
			const cost = calculateQuadraticCost(currentVoteCount - 1);
			$currentUser.votesAvailable += cost;
			$currentUser.votesUsed -= cost;
			$currentUser.proposalVoteCounts.set(proposalId, currentVoteCount - 1);
			if (currentVoteCount - 1 === 0) {
				$currentUser.proposalsVoted.delete(proposalId);
			}

			$proposals = $proposals.map((p) => (p.id === proposalId ? { ...p, votes: p.votes - 1 } : p));
		}
	}

	function createProposal(): void {
		showNewProposalModal = true;
		newProposal = {
			id: Math.random().toString(36).substr(2, 9),
			votes: 0,
			state: 'voting'
		};
	}

	function submitProposal(): void {
		if (newProposal.title && newProposal.requestedAmount) {
			$proposals = [...$proposals, newProposal as Proposal];
			showNewProposalModal = false;
			newProposal = {};
		}
	}
</script>

<div class="flex w-screen h-screen overflow-hidden">
	<!-- Company Stats Sidebar -->
	<div
		class="fixed top-0 left-0 h-screen p-6 border-r w-80 border-surface-700/50 bg-surface-800/30"
	>
		<div class="space-y-6">
			<div class="flex items-center gap-4">
				<img src="/logo.png" alt="Visioncreator Logo" class="w-16 h-16 rounded-full" />
				<h1 class="text-2xl font-bold text-tertiary-100">Visioncreator GmbH</h1>
			</div>

			<div class="space-y-4">
				<div class="p-4 border rounded-lg border-surface-700/50">
					<div class="space-y-6">
						<div>
							<p class="text-3xl font-bold text-tertiary-100">{dashboardMetrics.poolAmount}€</p>
							<p class="text-sm text-tertiary-300">Community Contribution Pool</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">{dashboardMetrics.visionCreators}</p>
							<p class="text-sm text-tertiary-300">Visioncreators Invested</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">{dashboardMetrics.monthlyIncome}€</p>
							<p class="text-sm text-tertiary-300">Monthly Income Stream</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-grow w-full overflow-y-auto">
		<div class="max-w-5xl p-6 mx-auto space-y-8">
			<div class="grid gap-6">
				{#each $proposals as proposal}
					<div class="overflow-hidden border card border-surface-700/50 rounded-xl">
						<div class="flex">
							<!-- Left side: Votes -->
							<div class="flex flex-col items-center w-40 p-6">
								<div class="text-center">
									<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
									<p class="text-sm text-tertiary-300">votes</p>
								</div>
								{#if proposal.state === 'voting'}
									<div class="flex flex-col items-center w-full gap-2 mt-4">
										<button
											on:click={() => vote(proposal.id, true)}
											disabled={$currentUser.votesAvailable <
												calculateQuadraticCost(
													$currentUser.proposalVoteCounts.get(proposal.id) || 0
												)}
											class="flex items-center justify-center w-12 h-12 transition-colors rounded-lg hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
										>
											<svg class="w-8 h-8 text-tertiary-300" viewBox="0 0 24 24">
												<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
											</svg>
										</button>
										<span class="text-2xl font-bold text-tertiary-100">
											{$currentUser.proposalVoteCounts.get(proposal.id) || 0}
										</span>
										<button
											on:click={() => vote(proposal.id, false)}
											disabled={!$currentUser.proposalVoteCounts.get(proposal.id)}
											class="flex items-center justify-center w-12 h-12 transition-colors rounded-lg hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
										>
											<svg class="w-8 h-8 text-tertiary-300" viewBox="0 0 24 24">
												<path fill="currentColor" d="M19 13H5v-2h14v2z" />
											</svg>
										</button>
										<p class="text-xs text-center text-tertiary-400">
											Next vote costs: {calculateQuadraticCost(
												$currentUser.proposalVoteCounts.get(proposal.id) || 0
											)}
										</p>
									</div>
								{/if}
							</div>

							<!-- Middle: Content -->
							<div class="flex-grow p-6 space-y-6 border-l border-r border-surface-700/50">
								<div class="flex items-center gap-4">
									<div
										class="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full bg-surface-700/50"
									>
										<Icon icon="mdi:account" class="w-6 h-6 text-tertiary-300" />
									</div>
									<div>
										<h3 class="text-xl font-semibold text-tertiary-100">{proposal.title}</h3>
										<p class="text-sm text-tertiary-300">by {proposal.author}</p>
									</div>
								</div>

								<div class="space-y-6">
									<div>
										<h4 class="font-semibold text-tertiary-200">Commitment</h4>
										<p class="text-sm text-tertiary-300">{proposal.commitment}</p>
									</div>
									<div class="pr-12">
										<h4 class="font-semibold text-tertiary-200">Description</h4>
										<p class="text-sm whitespace-pre-line text-tertiary-300">
											{proposal.description}
										</p>
									</div>
								</div>
							</div>

							<!-- Right side: Metrics -->
							<div
								class="w-[280px] shrink-0 flex flex-col justify-between {getStateBgColor(
									proposal.state
								)}"
							>
								<div class="p-8 space-y-8">
									<div class="text-right">
										<p class="text-2xl font-bold text-tertiary-100">{proposal.requestedAmount}€</p>
										<p class="text-sm text-tertiary-300">requested</p>
									</div>
									<div>
										<h4 class="mb-2 text-sm font-semibold text-right text-tertiary-200">
											Expected Results
										</h4>
										<p class="text-sm text-right text-tertiary-300">{proposal.expectedResults}</p>
									</div>
									<div class="text-right">
										<h4 class="mb-2 text-sm font-semibold text-tertiary-200">Estimated Delivery</h4>
										<p class="text-sm text-tertiary-300">{proposal.estimatedDelivery}</p>
									</div>
								</div>
								<div class="w-full p-2 text-center bg-surface-900/50">
									<div
										class="flex items-center justify-center gap-2 {getStateColor(proposal.state)}"
									>
										<Icon icon={getStateIcon(proposal.state)} class="w-5 h-5" />
										<span class="text-sm font-medium">{getStateLabel(proposal.state)}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- User Sidebar -->
	<div
		class="fixed top-0 right-0 h-screen p-6 border-l w-80 border-surface-700/50 bg-surface-800/30"
	>
		<div class="space-y-6">
			<div class="flex items-center gap-4">
				<div class="flex items-center justify-center w-16 h-16 rounded-full bg-surface-700/50">
					<Icon icon="mdi:account" class="w-8 h-8 text-tertiary-300" />
				</div>
				<div>
					<h3 class="text-xl font-semibold text-tertiary-100">{$currentUser.name}</h3>
					<p class="text-sm text-tertiary-300">Visioncreator</p>
				</div>
			</div>

			<div class="space-y-4">
				<div class="p-4 border rounded-lg border-surface-700/50">
					<h4 class="mb-4 text-sm font-semibold text-tertiary-200">Voting Power</h4>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-2xl font-bold text-tertiary-100">{$currentUser.votesAvailable}</p>
							<p class="text-xs text-tertiary-300">Available</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-tertiary-100">{$currentUser.votesUsed}</p>
							<p class="text-xs text-tertiary-300">Used</p>
						</div>
					</div>
				</div>

				<div class="p-4 border rounded-lg border-surface-700/50">
					<h4 class="mb-4 text-sm font-semibold text-tertiary-200">Activity</h4>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-2xl font-bold text-tertiary-100">{$currentUser.proposalsVoted.size}</p>
							<p class="text-xs text-tertiary-300">Proposals Voted</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-tertiary-100">{$currentUser.proposalsCreated}</p>
							<p class="text-xs text-tertiary-300">Proposals Created</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.card {
		transition: transform 0.2s;
	}
	.card:hover {
		transform: translateY(-2px);
	}
</style>
