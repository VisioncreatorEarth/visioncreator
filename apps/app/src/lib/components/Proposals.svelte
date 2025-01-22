<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import Icon from '@iconify/svelte';

	type ProposalState = 'voting' | 'doing' | 'pending_payout' | 'done';

	interface Proposal {
		id: string;
		title: string;
		author: string;
		votes: number;
		description: string;
		expectedResults: string;
		commitment: string;
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
		votesAvailable: 25,
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
			votes: 3,
			expectedResults: '+500 new signups/month, 40% conversion rate improvement',
			commitment:
				'Payment released upon successful deployment with A/B test showing >35% conversion improvement',
			description:
				'High-converting landing page development using SvelteKit and Tailwind.\n\n' +
				'Key Features:\n' +
				'• Interactive components and dynamic content loading\n' +
				'• Mobile-first responsive design\n' +
				'• Personalized user journey flows\n' +
				'• Real-time conversion tracking\n' +
				'• A/B testing infrastructure\n\n' +
				'Following atomic design principles for consistent branding and maximum component reusability.',
			state: 'doing',
			estimatedDelivery: '3 weeks'
		},
		{
			id: '2',
			title: 'Visioncreator Launch Event',
			author: 'Maria Garcia',
			votes: 5,
			expectedResults: '100+ attendees, 20 new active pioneers, 5 potential partnerships',
			commitment:
				'Payment released after successful event completion with minimum 80 verified attendees',
			description:
				'Premium startup networking event to showcase Visioncreator.\n\n' +
				'Event Components:\n' +
				'• Interactive workshops and keynote presentations\n' +
				'• Live platform demonstrations\n' +
				'• Professional video coverage\n' +
				'• Dedicated networking sessions\n\n' +
				'Post-event: Follow-up networking, resource sharing, and community building initiatives.',
			state: 'voting',
			estimatedDelivery: '2 weeks'
		},
		{
			id: '3',
			title: 'Community Task Board Development',
			author: 'Alex Kumar',
			votes: 2,
			expectedResults: '30% improved task completion rate, 50% faster project initialization',
			commitment: 'Payment released upon deployment with all features tested and documented',
			description:
				'Interactive task board development using SvelteKit and Tailwind.\n\n' +
				'Core Features:\n' +
				'• Real-time collaboration with websockets\n' +
				'• Drag-and-drop task management\n' +
				'• Integrated commenting system\n' +
				'• Advanced filtering and priority management\n' +
				'• Mobile responsiveness and offline support',
			state: 'pending_payout',
			estimatedDelivery: '4 weeks'
		},
		{
			id: '4',
			title: 'Vision Pitch Video Production',
			author: 'Sarah Miller',
			votes: 4,
			expectedResults: '40% better conversion rate, 2x faster onboarding understanding',
			commitment: 'Payment released upon delivery of final video with positive community feedback',
			description:
				'Professional pitch video production for Visioncreator.\n\n' +
				'Deliverables:\n' +
				'• Custom animations and motion graphics\n' +
				'• Professional voice-over recording\n' +
				'• Platform demonstrations and user testimonials\n' +
				'• Multiple platform-optimized versions\n\n' +
				'Including multiple revision rounds and professional sound design.',
			state: 'done',
			estimatedDelivery: '1 week'
		},
		{
			id: '5',
			title: 'Social Media Growth Partnership',
			author: 'Tom Wilson',
			votes: 1,
			expectedResults: '10k new followers, 25% engagement rate, 100 qualified leads/month',
			commitment: 'Revenue sharing: 20% of converted leads for 6 months, minimum 3 posts/week',
			description:
				'Strategic social media campaign across major platforms.\n\n' +
				'Campaign Elements:\n' +
				'• Daily educational content creation\n' +
				'• Community engagement strategy\n' +
				'• Lead generation system\n' +
				'• Influencer collaborations\n' +
				'• Performance analytics and optimization',
			state: 'voting',
			estimatedDelivery: '3 weeks'
		}
	]);

	let showNewProposalModal = false;
	let newProposal: Partial<Proposal> = {};

	// Update dashboard metrics to be writable
	const dashboardMetrics = writable({
		visionCreators: 17
	});

	// Update reactive statements to include dependencies
	$: totalContributionPool = Math.round($dashboardMetrics.visionCreators * 365 * 0.75);

	$: deliveredPool = $proposals
		.filter((p) => p.state === 'done')
		.reduce((sum, p) => sum + calculateLockedValue(p.state), 0);

	$: lockedPool = $proposals
		.filter((p) => p.state === 'doing' || p.state === 'pending_payout')
		.reduce((sum, p) => sum + calculateLockedValue(p.state), 0);

	$: votingPool = totalContributionPool - lockedPool - deliveredPool;

	$: poolMetrics = {
		totalContributionPool,
		votingPool,
		lockedPool,
		deliveredPool
	};

	// Make proposalValues depend on both proposals and votingPool
	$: proposalValues = $proposals.map((proposal) => ({
		id: proposal.id,
		value: calculateDynamicPrice(proposal.votes, proposal.state, votingPool)
	}));

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
		if (newProposal.title && newProposal.expectedResults) {
			$proposals = [...$proposals, newProposal as Proposal];
			showNewProposalModal = false;
			newProposal = {};
		}
	}

	// Calculate fixed value for a non-voting proposal based on its state
	function getFixedStateValue(state: ProposalState): number {
		switch (state) {
			case 'doing':
				return 450;
			case 'pending_payout':
				return 650;
			case 'done':
				return 750;
			default:
				return 0;
		}
	}

	// Calculate locked value for a non-voting proposal
	function calculateLockedValue(proposalState: ProposalState): number {
		if (proposalState === 'voting') return 0;
		return getFixedStateValue(proposalState);
	}

	// Update calculateDynamicPrice to take votingPool as parameter
	function calculateDynamicPrice(
		proposalVotes: number,
		proposalState: ProposalState,
		currentVotingPool: number
	): number {
		// If proposal is not in voting state, return its fixed value
		if (proposalState !== 'voting') {
			return calculateLockedValue(proposalState);
		}

		// For voting proposals, calculate based on voting pool
		const votingProposals = $proposals.filter((p) => p.state === 'voting');
		const totalVotingVotes = votingProposals.reduce((sum, p) => sum + p.votes, 0);

		if (totalVotingVotes === 0) return 0;
		return Math.round((proposalVotes / totalVotingVotes) * currentVotingPool);
	}

	// Add function to adjust VisionCreators count
	function adjustVisionCreators(increment: boolean): void {
		$dashboardMetrics.visionCreators = increment
			? $dashboardMetrics.visionCreators + 1
			: Math.max(0, $dashboardMetrics.visionCreators - 1);
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
							<p class="text-3xl font-bold text-tertiary-100">
								{Math.round($dashboardMetrics.visionCreators * 365 * 0.75)}€
							</p>
							<p class="text-sm text-tertiary-300">Community Contribution Pool</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">
								{poolMetrics.votingPool}€
							</p>
							<p class="text-sm text-tertiary-300">Voting Pool</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">
								{poolMetrics.lockedPool}€
							</p>
							<p class="text-sm text-tertiary-300">Locked Pool</p>
						</div>
						<div>
							<p class="text-3xl font-bold text-tertiary-100">
								{poolMetrics.deliveredPool}€
							</p>
							<p class="text-sm text-tertiary-300">Delivered</p>
						</div>
						<div class="flex items-center justify-between">
							<div>
								<p class="text-3xl font-bold text-tertiary-100">
									{$dashboardMetrics.visionCreators}
								</p>
								<p class="text-sm text-tertiary-300">Visioncreators Invested</p>
							</div>
							<div class="flex flex-col gap-2">
								<button
									on:click={() => adjustVisionCreators(true)}
									class="flex items-center justify-center w-8 h-8 transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
								>
									<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
										<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
									</svg>
								</button>
								<button
									on:click={() => adjustVisionCreators(false)}
									class="flex items-center justify-center w-8 h-8 transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
								>
									<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
										<path fill="currentColor" d="M19 13H5v-2h14v2z" />
									</svg>
								</button>
							</div>
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
										<p class="text-2xl font-bold text-tertiary-100">
											{proposalValues.find((p) => p.id === proposal.id)?.value}€
										</p>
										<p class="text-sm text-tertiary-300">
											{proposal.state === 'voting' ? 'current value' : 'locked value'}
										</p>
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
