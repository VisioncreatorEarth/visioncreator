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

	const userVotesLeft: Writable<number> = writable(10);
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

	function vote(proposalId: string): void {
		if ($userVotesLeft > 0) {
			$userVotesLeft--;
			$proposals = $proposals.map((p) => (p.id === proposalId ? { ...p, votes: p.votes + 1 } : p));
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

<div class="container p-6 mx-auto space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-tertiary-100">Community Proposals</h1>
			<p class="text-tertiary-200">Votes remaining: {$userVotesLeft}</p>
		</div>
		<button
			on:click={createProposal}
			class="btn bg-gradient-to-br variant-gradient-secondary-primary"
		>
			Create Proposal
		</button>
	</div>

	<div class="grid gap-6">
		{#each $proposals as proposal}
			<div class="overflow-hidden border card border-surface-700/50 rounded-xl">
				<div class="flex">
					<!-- Left side: Votes only -->
					<div class="flex flex-col items-center w-40 p-6">
						<div class="text-center">
							<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
							<p class="text-sm text-tertiary-300">votes</p>
						</div>
						{#if proposal.state === 'voting'}
							<button
								on:click={() => vote(proposal.id)}
								disabled={$userVotesLeft === 0}
								class="w-full mt-4 btn variant-ghost-tertiary"
							>
								Vote
							</button>
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
								<p class="text-sm whitespace-pre-line text-tertiary-300">{proposal.description}</p>
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
							<div class="flex items-center justify-center gap-2 {getStateColor(proposal.state)}">
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

{#if showNewProposalModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl p-6 card bg-surface-800">
			<h2 class="mb-4 text-xl font-bold text-tertiary-100">Create New Proposal</h2>
			<div class="grid gap-4">
				<div>
					<label class="label">Title</label>
					<input
						type="text"
						bind:value={newProposal.title}
						class="input bg-surface-900"
						placeholder="Proposal title"
					/>
				</div>
				<div>
					<label class="label">Requested Amount (€)</label>
					<input
						type="number"
						bind:value={newProposal.requestedAmount}
						class="input bg-surface-900"
						placeholder="Amount in euros (500-1000€)"
					/>
				</div>
				<div>
					<label class="label">Expected Results</label>
					<textarea
						bind:value={newProposal.expectedResults}
						class="textarea bg-surface-900"
						placeholder="What measurable results will this achieve? (e.g., +500 signups/month)"
					/>
				</div>
				<div>
					<label class="label">Description</label>
					<textarea
						bind:value={newProposal.description}
						class="textarea bg-surface-900"
						placeholder="Describe your proposal in detail"
					/>
				</div>
				<div>
					<label class="label">Commitment</label>
					<textarea
						bind:value={newProposal.commitment}
						class="textarea bg-surface-900"
						placeholder="When and under what conditions should the payment be released?"
					/>
				</div>
			</div>
			<div class="flex justify-end gap-4 mt-6">
				<button on:click={() => (showNewProposalModal = false)} class="btn variant-ghost-surface">
					Cancel
				</button>
				<button
					on:click={submitProposal}
					class="btn bg-gradient-to-br variant-gradient-secondary-primary"
				>
					Submit Proposal
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.card {
		transition: transform 0.2s;
	}
	.card:hover {
		transform: translateY(-2px);
	}
</style>
