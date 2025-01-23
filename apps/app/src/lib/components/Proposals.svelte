<!--
HOW THIS SYSTEM WORKS:

1. Overview:
   This is a community-driven proposal and voting system where members can:
   - Submit and vote on ideas (initial stage)
   - Convert ideas to proposals once they reach 10% vote threshold
   - Vote on proposals using tokens
   - Track proposal progress
   - Move proposals through different states
   - Manage budget allocations

2. Voting Process:
   Stage 1 - Ideas:
   - Community members can submit and vote on ideas
   - Ideas need to reach 10% of total active votes to become proposals
   - Ideas don't have budget allocations
   - Voting on ideas uses the same tokens as proposals

   Stage 2 - Proposals:
   - Each user has tokens they can use to vote
   - More votes = larger share of the voting pool
   - When voting on a proposal:
     * Adding a vote increases the proposal's budget allocation
     * Removing a vote decreases the allocation
     * Budget is automatically distributed based on vote percentages
     * If a proposal gets more budget than requested, excess is redistributed

3. Proposal States:
   - Idea: Initial stage, needs 10% votes to advance
   - Proposal: Open for community votes and budget allocation
   - Pending Approval: Reached requested budget, waiting for review
   - In Progress: Work has started
   - Review: Work completed, waiting for verification
   - Completed: Fully delivered and paid

4. Budget System:
   - There's a main "Community Contribution Pool" calculated from number of VisionCreators
   - This pool is divided into three parts:
     * Voting Pool: Available for active voting proposals
     * Locked Pool: For proposals in progress
     * Delivered Pool: For completed proposals

5. Budget Allocation Rules:
   - Each proposal has a fixed requested budget
   - Can't allocate more than requested budget to any proposal
   - Excess budget is automatically redistributed to other voting proposals
   - Once a proposal reaches its requested budget, it moves to "Pending Approval"

6. State Transitions:
   - Automatic: 
     * Idea → Proposal (when 10% vote threshold reached)
     * Proposal → Pending Approval (when budget reached)
   - Manual: Through state cycle button for other states
   - Cycle: In Progress → Review → Completed

7. Visual Feedback:
   - Progress bars show % of requested budget or votes needed
   - Color coding for different states
   - Real-time updates of budget allocations
   - Clear indicators for voting power and proposal status
-->

<script lang="ts">
	import { writable, derived } from 'svelte/store';
	import type { Writable } from 'svelte/store';
	import Icon from '@iconify/svelte';

	type ProposalState =
		| 'idea'
		| 'proposal'
		| 'pending_approval'
		| 'doing'
		| 'pending_payout'
		| 'done';

	const PROPOSAL_STATES: ProposalState[] = [
		'idea',
		'proposal',
		'pending_approval',
		'doing',
		'pending_payout',
		'done'
	];

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
		budgetRequested: number;
	}

	interface UserProfile {
		id: string;
		name: string;
		tokens: number;
		proposalsVoted: Map<string, number>;
	}

	const currentUser: Writable<UserProfile> = writable({
		id: '1',
		name: 'Samuel Andert',
		tokens: 25,
		proposalsVoted: new Map()
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
			estimatedDelivery: '3 weeks',
			budgetRequested: 700
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
			state: 'proposal',
			estimatedDelivery: '2 weeks',
			budgetRequested: 1200
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
			estimatedDelivery: '4 weeks',
			budgetRequested: 900
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
			estimatedDelivery: '1 week',
			budgetRequested: 1000
		},
		{
			id: '5',
			title: 'Social Media Brand Update',
			author: 'Sophie Anderson',
			votes: 6,
			expectedResults: '40% increase in profile visits, 25% higher engagement rate',
			commitment:
				'Payment released upon completion of all platform updates with community approval',
			description:
				'Comprehensive social media brand refresh across all major platforms.\n\n' +
				'Deliverables:\n' +
				'• Custom banner designs for each platform\n' +
				'• Optimized bio and intro texts\n' +
				'• Brand style guide for social content\n' +
				'• Platform-specific content templates\n' +
				'• Analytics baseline and tracking setup\n\n' +
				'Including A/B testing of different messaging approaches.',
			state: 'proposal',
			estimatedDelivery: '1 week',
			budgetRequested: 600
		},
		{
			id: '6',
			title: 'Community Invite System Development',
			author: 'Marcus Chen',
			votes: 8,
			expectedResults: '200% increase in referrals, 40% higher retention of referred users',
			commitment: 'Payment released upon successful deployment and first month of operation',
			description:
				'Gamified invite system with incentive mechanics.\n\n' +
				'Core Features:\n' +
				'• Multi-tier reward structure\n' +
				'• Automated tracking and distribution\n' +
				'• Custom invite links and QR codes\n' +
				'• Referral analytics dashboard\n' +
				'• Integration with existing user system\n\n' +
				'Focus on sustainable growth and quality referrals.',
			state: 'proposal',
			estimatedDelivery: '3 weeks',
			budgetRequested: 1400
		},
		{
			id: '7',
			title: 'Governance Model Update',
			author: 'Elena Rodriguez',
			votes: 7,
			expectedResults: '50% faster decision making, 30% higher community participation',
			commitment: 'Payment released after successful implementation and first governance cycle',
			description:
				'Modernized governance system with enhanced participation mechanics.\n\n' +
				'Key Components:\n' +
				'• Streamlined proposal process\n' +
				'• Weighted voting mechanisms\n' +
				'• Automated execution of approved proposals\n' +
				'• Transparent tracking system\n' +
				'• Community feedback loops\n\n' +
				'Including comprehensive documentation and onboarding materials.',
			state: 'proposal',
			estimatedDelivery: '4 weeks',
			budgetRequested: 1800
		},
		{
			id: '8',
			title: 'Proposal Video Requirement System',
			author: 'Chris Taylor',
			votes: 4,
			expectedResults: '60% better proposal understanding, 45% higher engagement on proposals',
			commitment: 'Payment released upon system implementation and first 5 successful submissions',
			description:
				'Integrated video submission and distribution system for proposals.\n\n' +
				'System Features:\n' +
				'• Video upload and processing pipeline\n' +
				'• Automated social media distribution\n' +
				'• Engagement tracking and analytics\n' +
				'• Video guidelines and templates\n' +
				'• Quality control mechanisms\n\n' +
				'Including creator guidelines and best practices documentation.',
			state: 'proposal',
			estimatedDelivery: '2 weeks',
			budgetRequested: 900
		},
		{
			id: '10',
			title: 'Community Newsletter System',
			author: 'Rachel Kim',
			votes: 2,
			expectedResults: 'Increased community engagement and awareness',
			commitment: 'Weekly newsletter delivery with community highlights',
			description:
				'Weekly newsletter system to keep the community informed.\n\n' +
				'Features:\n' +
				'• Automated content aggregation\n' +
				'• Community contribution highlights\n' +
				'• Project updates and milestones\n' +
				'• Upcoming events calendar\n' +
				'• Member spotlights\n\n' +
				'Focus on celebrating community achievements and fostering engagement.',
			state: 'idea',
			estimatedDelivery: '1 week',
			budgetRequested: 400
		},
		{
			id: '11',
			title: 'Community Mentorship Program',
			author: 'David Park',
			votes: 1,
			expectedResults: 'Knowledge sharing and skill development within community',
			commitment: 'Monthly mentorship sessions and progress tracking',
			description:
				'Structured mentorship program connecting experienced members with newcomers.\n\n' +
				'Program Components:\n' +
				'• Mentor-mentee matching system\n' +
				'• Goal setting framework\n' +
				'• Progress tracking tools\n' +
				'• Resource sharing platform\n' +
				'• Success story showcase\n\n' +
				'Building stronger connections through knowledge sharing.',
			state: 'idea',
			estimatedDelivery: '2 weeks',
			budgetRequested: 600
		},
		{
			id: '12',
			title: 'Community Hackathon Event',
			author: 'Lisa Wang',
			votes: 3,
			expectedResults: 'Innovation boost and new project initiatives',
			commitment: 'Weekend-long event with prizes and showcases',
			description:
				'48-hour hackathon focused on community improvements.\n\n' +
				'Event Structure:\n' +
				'• Team formation support\n' +
				'• Project idea workshops\n' +
				'• Mentorship sessions\n' +
				'• Demo presentations\n' +
				'• Prize categories\n\n' +
				'Fostering innovation and collaboration within the community.',
			state: 'idea',
			estimatedDelivery: '3 weeks',
			budgetRequested: 1200
		},
		{
			id: '13',
			title: 'Community Podcast Series',
			author: 'Michael Chen',
			votes: 1,
			expectedResults: 'Broader reach and deeper community insights',
			commitment: 'Bi-weekly episodes featuring community members',
			description:
				'Regular podcast highlighting community stories and insights.\n\n' +
				'Content Focus:\n' +
				'• Member success stories\n' +
				'• Project deep dives\n' +
				'• Industry trends\n' +
				'• Community updates\n' +
				'• Guest interviews\n\n' +
				'Sharing our community story with the world.',
			state: 'idea',
			estimatedDelivery: '2 weeks',
			budgetRequested: 800
		},
		{
			id: '14',
			title: 'Community Learning Hub',
			author: 'Sarah Johnson',
			votes: 2,
			expectedResults: 'Centralized knowledge sharing and skill development',
			commitment: 'Launch with 10 initial courses and weekly updates',
			description:
				'Online learning platform for community skill sharing.\n\n' +
				'Platform Features:\n' +
				'• Course creation tools\n' +
				'• Interactive workshops\n' +
				'• Resource library\n' +
				'• Progress tracking\n' +
				'• Certification system\n\n' +
				'Empowering community growth through education.',
			state: 'idea',
			estimatedDelivery: '4 weeks',
			budgetRequested: 1500
		}
	]);

	let showNewProposalModal = false;
	let newProposal: Partial<Proposal> = {};

	// Update dashboard metrics to be writable
	const dashboardMetrics = writable({
		visionCreators: 17
	});

	interface ProposalValue {
		id: string;
		value: number;
	}

	// Remove the fixed state values function as we'll use budgetRequested instead
	function getFixedStateValue(state: ProposalState, budgetRequested: number): number {
		if (state === 'proposal') return 0;
		return budgetRequested;
	}

	// Calculate dynamic prices for voting proposals with redistribution
	function calculateVotingValues(proposals: Proposal[], votingPool: number): Map<string, number> {
		const votingProposals = proposals.filter((p) => p.state === 'proposal');
		const totalVotes = votingProposals.reduce((sum, p) => sum + p.votes, 0);
		if (totalVotes === 0) return new Map(votingProposals.map((p) => [p.id, 0]));

		// First pass: Calculate initial allocations
		let remainingPool = votingPool;
		const allocations = new Map<string, number>();
		const overAllocated = new Map<string, number>();

		// Calculate initial values
		votingProposals.forEach((proposal) => {
			const rawValue = Math.round((proposal.votes / totalVotes) * votingPool);
			if (rawValue > proposal.budgetRequested) {
				allocations.set(proposal.id, proposal.budgetRequested);
				overAllocated.set(proposal.id, rawValue - proposal.budgetRequested);
				remainingPool -= proposal.budgetRequested;
			} else {
				allocations.set(proposal.id, rawValue);
				remainingPool -= rawValue;
			}
		});

		// Calculate total excess budget
		const excessBudget = Array.from(overAllocated.values()).reduce((sum, value) => sum + value, 0);
		if (excessBudget === 0) return allocations;

		// Redistribute excess budget to remaining proposals that aren't at their limit
		const eligibleProposals = votingProposals.filter(
			(p) => !overAllocated.has(p.id) && (allocations.get(p.id) || 0) < p.budgetRequested
		);

		if (eligibleProposals.length > 0) {
			const eligibleVotes = eligibleProposals.reduce((sum, p) => sum + p.votes, 0);
			eligibleProposals.forEach((proposal) => {
				const currentAllocation = allocations.get(proposal.id) || 0;
				const additionalAllocation = Math.round((proposal.votes / eligibleVotes) * excessBudget);
				const newAllocation = Math.min(
					currentAllocation + additionalAllocation,
					proposal.budgetRequested
				);
				allocations.set(proposal.id, newAllocation);
			});
		}

		return allocations;
	}

	// Create derived store for pool metrics
	const poolMetrics = derived([dashboardMetrics, proposals], ([$dashboardMetrics, $proposals]) => {
		// Calculate total delivered amount
		const delivered = $proposals
			.filter((p) => p.state === 'done')
			.reduce((sum, p) => sum + p.budgetRequested, 0);

		// Calculate initial total pool (now subtracting delivered amount)
		const total = Math.max(
			0,
			Math.round($dashboardMetrics.visionCreators * 365 * 0.75) - delivered
		);

		// Calculate locked amount (in progress and pending)
		const locked = $proposals
			.filter(
				(p) => p.state === 'doing' || p.state === 'pending_payout' || p.state === 'pending_approval'
			)
			.reduce((sum, p) => sum + p.budgetRequested, 0);

		// Calculate remaining voting pool
		const voting = Math.max(0, total - locked);

		const totalActiveVotes = $proposals
			.filter((p) => p.state === 'proposal')
			.reduce((sum, p) => sum + p.votes, 0);

		return {
			totalContributionPool: total,
			votingPool: voting,
			lockedPool: locked,
			deliveredPool: delivered,
			totalActiveVotes
		};
	});

	// Create derived store for proposal values
	const proposalValues = derived([proposals, poolMetrics], ([$proposals, $poolMetrics]) => {
		const votingValues = calculateVotingValues($proposals, $poolMetrics.votingPool);

		return $proposals.map((proposal) => ({
			id: proposal.id,
			value:
				proposal.state === 'proposal'
					? votingValues.get(proposal.id) || 0
					: getFixedStateValue(proposal.state, proposal.budgetRequested)
		}));
	});

	// Calculate vote threshold (increase to 10%)
	$: voteThreshold = Math.ceil($poolMetrics.totalActiveVotes * 0.1);

	// Update filtered and sorted proposals to only sort by votes
	$: filteredAndSortedProposals = $proposals
		.filter((p) => p.state === activeFilter)
		.sort((a, b) => b.votes - a.votes);

	// Watch for state transitions including idea threshold
	$: {
		const updatedProposals = $proposals.map((p) => {
			if (p.state === 'idea' && p.votes >= voteThreshold) {
				return { ...p, state: 'proposal' as ProposalState };
			} else if (p.state === 'proposal') {
				const proposalValue = $proposalValues.find((v) => v.id === p.id)?.value || 0;
				if (proposalValue >= p.budgetRequested) {
					return { ...p, state: 'pending_approval' as ProposalState };
				}
			}
			return p;
		});

		if (JSON.stringify(updatedProposals) !== JSON.stringify($proposals)) {
			$proposals = updatedProposals;
		}
	}

	// Replace expanded state tracking
	let expandedProposalId: string | null = null;
	let activeFilter: ProposalState = 'proposal';

	function toggleProposal(id: string) {
		expandedProposalId = expandedProposalId === id ? null : id;
		// Add smooth scrolling when proposal is expanded
		if (expandedProposalId) {
			setTimeout(() => {
				const element = document.getElementById(`proposal-${id}`);
				const tabsHeight = document.getElementById('proposal-tabs')?.offsetHeight || 0;
				if (element) {
					const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
					window.scrollTo({
						top: elementTop - tabsHeight - 16, // 16px for some padding
						behavior: 'smooth'
					});
				}
			}, 0);
		}
	}

	// Update voting function to handle increment/decrement
	function vote(proposalId: string, isIncrease: boolean): void {
		const proposal = $proposals.find((p) => p.id === proposalId);
		if (!proposal) return;

		if (isIncrease && $currentUser.tokens > 0) {
			$currentUser.tokens -= 1;
			const currentVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
			$currentUser.proposalsVoted.set(proposalId, currentVotes + 1);
			$proposals = $proposals.map((p) => (p.id === proposalId ? { ...p, votes: p.votes + 1 } : p));
		} else if (!isIncrease && proposal.votes > 0) {
			const currentVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
			if (currentVotes > 0) {
				$currentUser.tokens += 1;
				$currentUser.proposalsVoted.set(proposalId, currentVotes - 1);
				$proposals = $proposals.map((p) =>
					p.id === proposalId ? { ...p, votes: p.votes - 1 } : p
				);
			}
		}
	}

	// Add function to adjust VisionCreators count
	function adjustVisionCreators(increment: boolean): void {
		$dashboardMetrics.visionCreators = increment
			? $dashboardMetrics.visionCreators + 1
			: Math.max(0, $dashboardMetrics.visionCreators - 1);
	}

	// Add function to cycle through states for non-voting proposals
	function cycleProposalState(proposalId: string): void {
		const states: ProposalState[] = ['doing', 'pending_payout', 'done'];
		$proposals = $proposals.map((p) => {
			if (p.id === proposalId && p.state !== 'proposal') {
				const currentIndex = states.indexOf(p.state);
				const nextIndex = (currentIndex + 1) % states.length;
				return { ...p, state: states[nextIndex] };
			}
			return p;
		});
	}

	// Update state styling functions
	function getStateColor(state: ProposalState): string {
		switch (state) {
			case 'proposal':
				return 'text-tertiary-300';
			case 'pending_approval':
				return 'text-secondary-400';
			case 'doing':
				return 'text-primary-400';
			case 'pending_payout':
				return 'text-warning-400';
			case 'done':
				return 'text-success-400';
			case 'idea':
				return 'text-tertiary-300';
			default:
				return 'text-tertiary-300';
		}
	}

	function getStateIcon(state: ProposalState): string {
		switch (state) {
			case 'proposal':
				return 'mdi:vote';
			case 'pending_approval':
				return 'mdi:clock-check';
			case 'doing':
				return 'mdi:progress-wrench';
			case 'pending_payout':
				return 'mdi:cash-clock';
			case 'done':
				return 'mdi:check-circle';
			case 'idea':
				return 'mdi:lightbulb';
			default:
				return 'mdi:help-circle';
		}
	}

	function getStateLabel(state: ProposalState): string {
		switch (state) {
			case 'proposal':
				return 'Proposal';
			case 'pending_approval':
				return 'Pending Approval';
			case 'doing':
				return 'In Progress';
			case 'pending_payout':
				return 'Review';
			case 'done':
				return 'Completed';
			case 'idea':
				return 'Idea';
			default:
				return 'Unknown';
		}
	}

	function getStateBgColor(state: ProposalState): string {
		switch (state) {
			case 'proposal':
				return 'bg-surface-700/30';
			case 'pending_approval':
				return 'bg-secondary-900/20';
			case 'doing':
				return 'bg-primary-900/20';
			case 'pending_payout':
				return 'bg-warning-900/20';
			case 'done':
				return 'bg-success-900/20';
			case 'idea':
				return 'bg-tertiary-900/20';
			default:
				return 'bg-surface-700/30';
		}
	}

	function resetProposal(proposalId: string): void {
		$proposals = $proposals.map((p) => {
			if (p.id === proposalId) {
				// Return all votes to user
				const userVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
				$currentUser.tokens += userVotes;
				$currentUser.proposalsVoted.delete(proposalId);

				// Reset proposal to initial state
				return {
					...p,
					votes: 0,
					state: 'idea' as ProposalState
				};
			}
			return p;
		});
	}

	function getTabClasses(state: ProposalState): string {
		const baseClasses = 'px-4 py-2 text-sm font-medium transition-colors rounded-lg';
		const activeClasses =
			activeFilter === state
				? `${getStateBgColor(state)} ${getStateColor(state)}`
				: 'hover:bg-surface-700/30';
		return `${baseClasses} ${activeClasses}`;
	}

	function getProposalCardClasses(proposal: Proposal): string {
		const baseClasses =
			'overflow-hidden transition-all duration-200 border card border-surface-700/50 rounded-xl';
		return baseClasses;
	}

	function getProposalValueClasses(proposal: Proposal): string {
		return `w-[280px] shrink-0 p-6 flex flex-col ${getStateBgColor(proposal.state)}`;
	}

	function getStateTextClasses(proposal: Proposal): string {
		return `flex items-center gap-2 ${getStateColor(proposal.state)}`;
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
					<div class="space-y-4">
						<div>
							<p class="text-3xl font-bold text-tertiary-100">
								{$poolMetrics.totalContributionPool}€
							</p>
							<p class="text-sm text-tertiary-300">Community Contribution Pool</p>
						</div>
						<div>
							<p class="text-lg font-bold text-tertiary-100">
								{$poolMetrics.votingPool}€
							</p>
							<p class="text-sm text-tertiary-300">Available in Voting Pool</p>
						</div>
						<div>
							<p class="text-lg font-bold text-tertiary-100">
								{$poolMetrics.lockedPool}€
							</p>
							<p class="text-sm text-tertiary-300">Locked Pool</p>
						</div>
						<div>
							<p class="text-lg font-bold text-tertiary-100">
								{$poolMetrics.deliveredPool}€
							</p>
							<p class="text-sm text-tertiary-300">Delivered</p>
						</div>
						<div>
							<p class="text-lg font-bold text-tertiary-100">
								{$poolMetrics.totalActiveVotes}
							</p>
							<p class="text-sm text-tertiary-300">Total Active Votes</p>
						</div>
						<div class="flex items-center justify-between">
							<div>
								<p class="text-lg font-bold text-tertiary-100">
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
		<div class="w-full">
			<div class="relative max-w-5xl px-6 mx-auto">
				<!-- Tabs Bar -->
				<div
					id="proposal-tabs"
					class="sticky top-0 z-10 flex w-full gap-2 py-4 bg-surface-900/95 backdrop-blur-sm"
				>
					{#each PROPOSAL_STATES as state}
						<button class={getTabClasses(state)} on:click={() => (activeFilter = state)}>
							<div class="flex items-center gap-2">
								<Icon icon={getStateIcon(state)} class="w-4 h-4" />
								{getStateLabel(state)}
							</div>
						</button>
					{/each}
				</div>

				<!-- Proposals List -->
				<div class="grid gap-6 py-6">
					{#each filteredAndSortedProposals as proposal}
						<div id="proposal-{proposal.id}" class={getProposalCardClasses(proposal)}>
							<!-- Collapsed Header (always visible) -->
							<div
								class="flex items-center cursor-pointer hover:bg-surface-800/50"
								on:click={() => toggleProposal(proposal.id)}
							>
								<!-- Left side: Votes -->
								<div class="flex flex-col items-center w-40 p-6">
									<div class="text-center">
										<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
										<p class="text-sm text-tertiary-300">votes</p>
									</div>
								</div>

								<!-- Middle: Basic Info -->
								<div
									class="flex items-center flex-grow gap-4 p-6 border-l border-r border-surface-700/50"
								>
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
								</div>

								<!-- Right side: Value -->
								<div class={getProposalValueClasses(proposal)}>
									<div class="flex items-center justify-between mb-2">
										<button
											on:click|stopPropagation={() => resetProposal(proposal.id)}
											class="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
										>
											<Icon icon="mdi:refresh" class="w-4 h-4" />
											Reset
										</button>
										<div class={getStateTextClasses(proposal)}>
											<Icon icon={getStateIcon(proposal.state)} class="w-5 h-5" />
											<span class="text-sm font-medium">{getStateLabel(proposal.state)}</span>
										</div>
									</div>
									<div class="text-right">
										{#if proposal.state === 'proposal'}
											<div class="flex flex-col items-end gap-1">
												<p class="text-2xl font-bold text-tertiary-100">
													{Math.round(
														(($proposalValues.find((p) => p.id === proposal.id)?.value || 0) /
															proposal.budgetRequested) *
															100
													)}%
												</p>
												<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
													<div
														class="h-full transition-all duration-300 bg-tertiary-500"
														style="width: {Math.min(
															100,
															Math.round(
																(($proposalValues.find((p) => p.id === proposal.id)?.value || 0) /
																	proposal.budgetRequested) *
																	100
															)
														)}%"
													/>
												</div>
												<p class="text-sm text-tertiary-300">
													{$proposalValues.find((p) => p.id === proposal.id)?.value}€ / {proposal.budgetRequested}€
												</p>
											</div>
										{:else if proposal.state === 'idea'}
											<div class="flex flex-col items-end gap-1">
												<p class="text-2xl font-bold text-tertiary-100">
													{Math.round((proposal.votes / voteThreshold) * 100)}%
												</p>
												<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
													<div
														class="h-full transition-all duration-300 bg-tertiary-500"
														style="width: {Math.min(
															100,
															Math.round((proposal.votes / voteThreshold) * 100)
														)}%"
													/>
												</div>
												<p class="text-sm text-tertiary-300">
													{proposal.votes} / {voteThreshold} votes
												</p>
											</div>
										{:else}
											<p class="text-2xl font-bold text-tertiary-100">
												{proposal.budgetRequested}€
											</p>
											<p class="text-sm text-tertiary-300">locked value</p>
										{/if}
									</div>
								</div>
							</div>

							<!-- Expanded Content -->
							{#if expandedProposalId === proposal.id}
								<div class="flex border-t border-surface-700/50">
									<!-- Left side: Voting Controls -->
									<div class="flex flex-col items-center w-40 p-6">
										{#if proposal.state === 'proposal' || proposal.state === 'idea'}
											<div class="flex flex-col items-center w-full gap-2">
												<button
													on:click|stopPropagation={() => vote(proposal.id, true)}
													disabled={$currentUser.tokens < 1}
													class="flex items-center justify-center w-12 h-12 transition-colors rounded-lg hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
												>
													<svg class="w-8 h-8 text-tertiary-300" viewBox="0 0 24 24">
														<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
													</svg>
												</button>
												<span class="text-2xl font-bold text-tertiary-100">
													{$currentUser.proposalsVoted.get(proposal.id) || 0}
												</span>
												<button
													on:click|stopPropagation={() => vote(proposal.id, false)}
													disabled={($currentUser.proposalsVoted.get(proposal.id) || 0) === 0}
													class="flex items-center justify-center w-12 h-12 transition-colors rounded-lg hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
												>
													<svg class="w-8 h-8 text-tertiary-300" viewBox="0 0 24 24">
														<path fill="currentColor" d="M19 13H5v-2h14v2z" />
													</svg>
												</button>
											</div>
										{:else if proposal.state === 'pending_approval' || proposal.state === 'doing' || proposal.state === 'pending_payout' || proposal.state === 'done'}
											<button
												on:click|stopPropagation={() => cycleProposalState(proposal.id)}
												class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
											>
												<Icon icon="mdi:arrow-right-circle" class="w-5 h-5" />
												Next State
											</button>
										{/if}
									</div>

									<!-- Middle: Content -->
									<div class="flex-grow p-6 space-y-6 border-l border-r border-surface-700/50">
										<div class="pr-12">
											<h4 class="font-semibold text-tertiary-200">Description</h4>
											<p class="text-sm whitespace-pre-line text-tertiary-300">
												{proposal.description}
											</p>
										</div>
									</div>

									<!-- Right side: Metrics -->
									<div class="w-[280px] shrink-0 {getStateBgColor(proposal.state)}">
										<div class="p-8 space-y-8">
											{#if proposal.state !== 'idea'}
												<div>
													<h4 class="mb-2 text-sm font-semibold text-right text-tertiary-200">
														Commitment
													</h4>
													<p class="text-sm text-right text-tertiary-300">
														{proposal.commitment}
													</p>
												</div>
											{/if}
											<div>
												<h4 class="mb-2 text-sm font-semibold text-right text-tertiary-200">
													Expected Results
												</h4>
												<p class="text-sm text-right text-tertiary-300">
													{proposal.expectedResults}
												</p>
											</div>
											{#if proposal.state !== 'idea'}
												<div class="text-right">
													<h4 class="mb-2 text-sm font-semibold text-tertiary-200">
														Estimated Delivery
													</h4>
													<p class="text-sm text-tertiary-300">{proposal.estimatedDelivery}</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
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
							<p class="text-2xl font-bold text-tertiary-100">{$currentUser.tokens}</p>
							<p class="text-xs text-tertiary-300">Available</p>
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
