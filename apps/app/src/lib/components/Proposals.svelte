<!--
HOW THIS SYSTEM WORKS:

1. Overview:
   This is a community-driven proposal and voting system where members can:
   - Submit and vote on ideas (initial stage)
   - Track proposal progress through states (idea -> draft -> pending -> decision)
   - Manage budget allocations
   - Vote and unvote in any state (no hard limits)

2. State Management:
   - Proposals are fetched from the database using the queryProposals endpoint
   - User data and tokens are managed through respective queries
   - Work items are temporarily managed through local state (to be moved to DB later)
   - Real-time updates through query refetching

3. Layout Structure:
   - Desktop: Two-column grid layout (280px left profile, 1fr main content)
   - Mobile/Tablet: Full-width with collapsible left profile panel
   - Responsive breakpoints handle layout transitions
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from '@iconify/svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import ProposalDetailView from './ProposalDetailView.svelte';
	import ProposalHeaderItem from './ProposalHeaderItem.svelte';
	import ProposalDashboard from './ProposalDashboard.svelte';
	import ProposalProfile from './ProposalProfile.svelte';
	import { view as defaultView } from '$lib/views/Default';
	import { asidePanels } from '$lib/stores/asidePanelStore';

	// Define types
	type ProposalState = 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';

	interface Proposal {
		id: string;
		title: string;
		author: string;
		details: string | null;
		benefits: string | null;
		pain: string | null;
		video_id: string | null;
		state: ProposalState;
		total_votes: number;
		total_tokens_staked: number;
		responsible: string | null;
		created_at: string;
		updated_at: string;
		tags?: string[];
		metadata?: Record<string, string | null>;
		decided_at?: string;
	}

	interface User {
		id: string;
		name: string;
		onboarded: boolean;
	}

	interface TokenTransaction {
		id: string;
		proposal_id: string | null;
		transaction_type: 'stake' | 'unstake' | 'mint' | 'transfer';
		amount: number;
		created_at: string;
		from_user_id: string;
	}

	interface VoterInfo {
		id: string;
		name: string | null;
		votes: number;
		tokens: number;
	}

	// Update the queries to handle refetch
	type WundergraphQuery<T> = {
		data?: T;
		refetch?: () => Promise<void>;
	};

	// Queries with proper typing
	const proposalsQuery = createQuery<Operations['queryProposals']>({
		operationName: 'queryProposals',
		enabled: true,
		refetchInterval: 1000
	}) as unknown as WundergraphQuery<Operations['queryProposals']>;

	const userQuery = createQuery<Operations['queryMe']>({
		operationName: 'queryMe',
		enabled: true
	}) as unknown as WundergraphQuery<Operations['queryMe']>;

	$: userId = $userQuery.data?.id;
	$: userTokensQuery = createQuery<Operations['getUserTokens']>({
		operationName: 'getUserTokens',
		input: { userId: userId || '' },
		enabled: !!userId,
		refetchInterval: 500
	}) as unknown as WundergraphQuery<Operations['getUserTokens']>;

	// State management
	const activeTab = writable<ProposalState>('idea');
	let userTokens = 0;

	// Constants
	const PROPOSAL_TABS: ProposalState[] = ['idea', 'draft', 'pending', 'accepted', 'rejected'];
	const VALID_TAGS = ['startup', 'distribution', 'product'] as const;
	type ValidTag = (typeof VALID_TAGS)[number];

	// Add mutations with proper typing
	const updateVotesMutation = createMutation<Operations['updateVotes']>({
		operationName: 'updateVotes'
	});

	const handleDecisionMutation = createMutation<Operations['handleProposalDecision']>({
		operationName: 'handleProposalDecision'
	});

	const createProposalMutation = createMutation<Operations['createProposal']>({
		operationName: 'createProposal'
	});

	// Update user tokens when data changes to specifically track VCE tokens
	$: if ($userTokensQuery.data?.balances) {
		userTokens = $userTokensQuery.data.balances.VCE.balance || 0;
		console.log('Current VCE balance:', userTokens); // Debug log
	}

	// Get user's staked tokens for each proposal
	$: userStakedTokens = new Map<string, number>();
	$: if ($userTokensQuery.data?.transactions && $userQuery.data?.id) {
		const transactions = (
			$userTokensQuery.data.transactions as unknown[] as TokenTransaction[]
		).filter((tx): tx is TokenTransaction => {
			return (
				typeof tx === 'object' &&
				tx !== null &&
				'id' in tx &&
				'proposal_id' in tx &&
				'transaction_type' in tx &&
				'amount' in tx &&
				'created_at' in tx &&
				'from_user_id' in tx
			);
		});
		const userId = $userQuery.data.id;

		// Filter transactions for current user and valid proposal_id
		const userTransactions = transactions.filter(
			(tx) => tx.from_user_id === userId && tx.proposal_id !== null
		);

		// Create a temporary map to track running totals
		const proposalTotals = new Map<string, number>();

		// Process transactions in chronological order (oldest first)
		userTransactions
			.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
			.forEach((tx) => {
				if (tx.proposal_id) {
					const currentStaked = proposalTotals.get(tx.proposal_id) || 0;
					const change = tx.transaction_type === 'stake' ? tx.amount : -tx.amount;
					const newAmount = Math.max(0, currentStaked + change);
					proposalTotals.set(tx.proposal_id, newAmount);
				}
			});

		// Update the reactive store with final totals
		userStakedTokens = new Map(proposalTotals);
	}

	// Helper functions
	function getStateColor(state: ProposalState): string {
		switch (state) {
			case 'idea':
				return 'text-secondary-300';
			case 'draft':
				return 'text-teal-300';
			case 'pending':
				return 'text-primary-300';
			case 'accepted':
				return 'text-success-400';
			case 'rejected':
				return 'text-error-400';
			default:
				return 'text-surface-400';
		}
	}

	function getStateBgColor(state: ProposalState): string {
		switch (state) {
			case 'idea':
				return 'bg-secondary-500/10';
			case 'draft':
				return 'bg-teal-500/10';
			case 'pending':
				return 'bg-primary-500/10';
			case 'accepted':
				return 'bg-success-500/10';
			case 'rejected':
				return 'bg-error-500/10';
			default:
				return 'bg-surface-700/10';
		}
	}

	function getStateLabel(state: ProposalState): string {
		return state.charAt(0).toUpperCase() + state.slice(1);
	}

	function getStateIcon(state: ProposalState): string {
		switch (state) {
			case 'idea':
				return 'heroicons:light-bulb';
			case 'draft':
				return 'heroicons:document-text';
			case 'pending':
				return 'heroicons:clock';
			case 'accepted':
				return 'heroicons:check-circle';
			case 'rejected':
				return 'heroicons:x-circle';
			default:
				return 'heroicons:question-mark-circle';
		}
	}

	function getTabLabel(state: ProposalState): string {
		return getStateLabel(state);
	}

	// Update filteredProposals with proper typing
	$: filteredProposals = (($proposalsQuery.data?.proposals as Proposal[]) || [])
		.filter((p: Proposal) => p.state === $activeTab)
		.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));

	// Update URL parameter handling
	$: {
		const params = $page.url.searchParams;
		const state = params.get('state');
		if (state && PROPOSAL_TABS.includes(state as ProposalState)) {
			activeTab.set(state as ProposalState);
		}
	}

	// Update the quadratic voting helper functions
	function getNextVoteCost(currentVotes: number): number {
		// Next vote will cost: (n+1)^2 - n^2
		// For example:
		// Vote 1: 1^2 - 0^2 = 1
		// Vote 2: 2^2 - 1^2 = 3
		// Vote 3: 3^2 - 2^2 = 5
		return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
	}

	function getQuadraticCost(voteNumber: number): number {
		// Total cost for n votes is n^2
		return Math.pow(voteNumber, 2);
	}

	// Update handleVote function to properly handle quadratic costs
	async function handleVote(proposalId: string, isIncrease: boolean) {
		if (!$userQuery.data?.id) return;

		const userId = $userQuery.data.id;
		const voters = getVotersForProposal(proposalId);
		const userVoteInfo = voters.find((v) => v.id === userId);
		const currentVotes = userVoteInfo?.votes || 0;

		// Calculate costs
		const nextCost = isIncrease
			? getNextVoteCost(currentVotes)
			: getQuadraticCost(currentVotes - 1);

		console.log('Vote attempt:', {
			isIncrease,
			currentVotes,
			userTokens,
			nextCost
		});

		// Check if user has enough tokens for voting
		if (isIncrease && userTokens < nextCost) {
			console.error('Insufficient tokens for voting', {
				available: userTokens,
				required: nextCost
			});
			return;
		}

		try {
			const result = await $updateVotesMutation.mutateAsync({
				proposalId,
				userId,
				action: isIncrease ? 'stake' : 'unstake',
				amount: nextCost // Pass the correct quadratic cost
			});

			if (result?.success) {
				// Force immediate refetch of token balance and data
				await Promise.all(
					[$userTokensQuery.refetch?.(), $proposalsQuery.refetch?.()].filter(Boolean)
				);
			}
		} catch (error) {
			console.error('Failed to update vote:', error);
		}
	}

	// Update the proposal card display to show quadratic voting info
	function getVoteDisplay(proposal: Proposal, voter?: VoterInfo) {
		const currentVotes = voter?.votes || 0;
		const currentTokens = voter?.tokens_staked_vce || 0; // Use VCE-specific token count
		const nextVoteCost = getNextVoteCost(currentVotes);
		const unstakeReturn = currentVotes > 0 ? getQuadraticCost(currentVotes - 1) : 0;

		return {
			votes: currentVotes,
			tokens: currentTokens,
			nextCost: nextVoteCost,
			unstakeReturn
		};
	}

	// Add a store to manage voters queries for all visible proposals
	const votersQueriesStore = writable(new Map<string, ReturnType<typeof createQuery>>());

	// Add this at the top level with other stores
	const votersStore = writable(new Map<string, VoterInfo[]>());

	// Update the votersQueriesStore subscription for better reactivity
	$: if ($proposalsQuery.data?.proposals) {
		$proposalsQuery.data.proposals.forEach((proposal) => {
			if (!$votersQueriesStore.has(proposal.id)) {
				const query = createQuery({
					operationName: 'getProposalVoters',
					input: { proposalId: proposal.id },
					enabled: true,
					refetchInterval: 1000
				});

				query.subscribe((queryResult) => {
					if (queryResult?.data?.voters) {
						votersStore.update((store) => {
							const newStore = new Map(store);
							newStore.set(proposal.id, queryResult.data.voters);
							return newStore;
						});
					}
				});

				$votersQueriesStore.set(proposal.id, query);
			}
		});
	}

	// Function to get voters for a proposal
	function getVotersForProposal(proposalId: string): VoterInfo[] {
		return $votersStore.get(proposalId) || [];
	}

	// Add back the missing utility functions
	function centerProposalInView(proposalId: string) {
		const element = document.getElementById(`proposal-${proposalId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function getProposalCardClasses(proposal: Proposal): string {
		const baseClasses = 'overflow-hidden transition-all duration-200 border card rounded-xl';
		return `${baseClasses} border-surface-700/50 bg-surface-900/50`;
	}

	// Update the userQuery data access
	$: userData = $userQuery.data
		? {
				id: $userQuery.data.id as string,
				name: $userQuery.data.name as string,
				onboarded: $userQuery.data.onboarded as boolean
		  }
		: null;

	// Add new proposal form state
	let showNewProposalForm = false;
	let newProposal = {
		title: '',
		details: '',
		tags: [] as ValidTag[]
	};

	// Add tag selection helper
	function toggleTag(tag: ValidTag) {
		if (newProposal.tags.includes(tag)) {
			newProposal.tags = newProposal.tags.filter((t) => t !== tag);
		} else {
			newProposal.tags = [...newProposal.tags, tag];
		}
	}

	// Update handleCreateProposal function to handle refetch properly
	async function handleCreateProposal() {
		if (!newProposal.title || !newProposal.details) return;

		try {
			// Check VCE token balance first
			const vceBalance = $userTokensQuery.data?.balances.VCE.balance || 0;
			if (vceBalance < 1) {
				throw new Error('Insufficient VCE tokens for proposal creation');
			}

			const result = await $createProposalMutation.mutateAsync({
				title: newProposal.title,
				details: newProposal.details,
				tags: newProposal.tags
			});

			if (result?.success) {
				// Reset form
				newProposal = {
					title: '',
					details: '',
					tags: []
				};
				showNewProposalForm = false;

				// Force immediate refetch of relevant data
				await Promise.all([$userTokensQuery.refetch(), $proposalsQuery.refetch()]);
			}
		} catch (error) {
			console.error('Failed to create proposal:', error);
		}
	}

	// Update canUnstakeVote to allow voting in all states
	function canUnstakeVote(proposal: Proposal, voter?: VoterInfo): boolean {
		if (!voter) return false;
		// If user is the author and has only 1 vote left, prevent unstaking
		if (proposal.author === voter.id && voter.votes <= 1) return false;
		// Otherwise allow unstaking if they have votes
		return voter.votes > 0;
	}

	// Add isAdmin helper function
	function isAdmin(userId: string): boolean {
		return userId === '00000000-0000-0000-0000-000000000001';
	}

	// Update handleDecision function to handle refetch properly
	async function handleDecision(proposalId: string, decision: 'veto' | 'pass') {
		if (!$userQuery.data?.id) return;

		try {
			const result = await $handleDecisionMutation.mutateAsync({
				proposalId,
				decision,
				adminId: $userQuery.data.id
			});

			if (result?.success) {
				// Refresh all relevant data
				await Promise.all(
					[proposalsQuery.refetch?.(), userTokensQuery.refetch?.()].filter(Boolean)
				);
			}
		} catch (error) {
			console.error('Failed to handle decision:', error);
		}
	}

	// Add this helper to check if voting is allowed
	function canVote(proposal: Proposal, currentVotes: number): boolean {
		if (proposal.state === 'pending') return false;
		return currentVotes < 20;
	}

	// Update the getTimeAgo function to be more concise
	function getTimeAgo(date: string): string {
		const now = new Date();
		const past = new Date(date);
		const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

		const intervals = {
			y: 31536000,
			m: 2592000,
			w: 604800,
			d: 86400,
			h: 3600,
			min: 60
		};

		for (const [unit, seconds] of Object.entries(intervals)) {
			const interval = Math.floor(diffInSeconds / seconds);
			if (interval >= 1) {
				return `${interval}${unit} ago`;
			}
		}

		return 'just now';
	}

	// Update the handleOpenDefaultView function
	function handleOpenDefaultView() {
		if (browser) {
			goto(`/me?view=Proposals&modal=Default`, { replaceState: true });
		}
	}

	// Helper function to parse props (same as in ActionModal)
	function parseUrlProps(propsString: string | null): Record<string, string> {
		if (!propsString) return {};
		try {
			return propsString.split(',').reduce((acc, pair) => {
				const [key, value] = pair.split('=');
				acc[key] = value;
				return acc;
			}, {} as Record<string, string>);
		} catch (e) {
			console.error('Failed to parse props:', e);
			return {};
		}
	}

	// Remove internal toggle logic and use store
	$: showProfile = $asidePanels.left === 'ProposalProfile';
</script>

<!-- Root Container -->
<div class="h-full bg-surface-900">
	<!-- Main Grid Layout - No more aside, just the content -->
	<div class="h-full">
		<!-- Main Content Area -->
		<div class="flex flex-col h-full">
			<!-- Header -->
			<div class="flex-none border-b border-surface-700/50">
				<ProposalDashboard />
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-hidden">
				<!-- Tabs Bar - Fixed to top -->
				<div id="proposal-tabs" class="sticky top-0 z-10 w-full bg-surface-800/50 backdrop-blur-sm">
					<div class="max-w-5xl px-4 py-2 mx-auto">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex items-center gap-1 overflow-x-auto sm:gap-2 thin-scrollbar">
								{#each PROPOSAL_TABS as state}
									<button
										class="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors rounded-lg whitespace-nowrap {$activeTab ===
										state
											? getStateBgColor(state) + ' ' + getStateColor(state)
											: 'hover:bg-surface-700/20 text-surface-300'}"
										on:click={() => activeTab.set(state)}
										aria-selected={$activeTab === state}
									>
										<div class="flex items-center gap-1 sm:gap-2">
											<Icon icon={getStateIcon(state)} class="w-3 h-3 sm:w-4 sm:h-4" />
											{getTabLabel(state)}
										</div>
									</button>
								{/each}
							</div>

							<!-- Create Proposal Button -->
							{#if userData}
								<button
									class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-6xl sm:text-base btn bg-gradient-to-br variant-gradient-secondary-primary hover:scale-105"
									on:click={() => (showNewProposalForm = true)}
								>
									<Icon icon="heroicons:plus-circle" class="w-5 h-5" />
									<span>Add New Idea</span>
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Create New Proposal Form -->
				{#if showNewProposalForm}
					<div
						class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center bg-surface-900/95"
					>
						<div
							class="w-full max-w-2xl max-h-[calc(100vh-16rem)] overflow-y-auto rounded-3xl bg-surface-800 border border-surface-600/50 shadow-2xl"
						>
							<div class="p-8 sm:p-10">
								<div class="flex items-center justify-between mb-6">
									<h3 class="text-xl font-bold sm:text-2xl text-tertiary-100">Create New Idea</h3>
									<button
										on:click={() => (showNewProposalForm = false)}
										class="p-2 rounded-lg hover:bg-surface-700"
									>
										<Icon icon="mdi:close" class="w-6 h-6 text-tertiary-300" />
									</button>
								</div>
								<p class="mb-4 text-sm sm:text-base text-tertiary-300">
									Creating a new idea requires 1 token for initial stake
								</p>

								<form on:submit|preventDefault={handleCreateProposal} class="space-y-6">
									<div>
										<input
											type="text"
											bind:value={newProposal.title}
											placeholder="Title of your idea"
											class="w-full px-6 py-3 text-base transition-all duration-300 ease-in-out border rounded-full outline-none sm:text-lg bg-surface-900 border-surface-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 placeholder:text-surface-300/60"
											required
										/>
									</div>

									<div class="space-y-2">
										<textarea
											bind:value={newProposal.details}
											class="w-full h-64 px-6 py-4 text-base transition-all duration-300 ease-in-out border outline-none sm:text-lg rounded-xl bg-surface-900 border-surface-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 placeholder:text-surface-300/60"
											placeholder="Please describe your proposal and answer one or more of the following questions:

- What are the main tasks and todos you want to accomplish?
- What budget do you think your proposal would need and why?

And explain how your proposal addresses one or more of these aspects:
- How does this help to increase the MRR (Monthly Recurring Revenue)?
- How can this generate new co-creating Visioncreators and therefore more investments?
- How does this increase the overall perceived value of our Visioncreator token?
- How does this generate a new asset opportunity or income stream opportunity for Visioncreators?
- Is this a completely new product/startup idea? If so, describe the vision."
											required
										/>
									</div>

									<div>
										<label class="block mb-3 text-sm font-medium sm:text-base text-tertiary-200">
											Tags (Optional)
										</label>
										<div class="flex flex-wrap gap-2">
											{#each VALID_TAGS as tag}
												<button
													type="button"
													class="px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-colors {newProposal.tags.includes(
														tag
													)
														? 'bg-tertiary-500/20 text-tertiary-300 border-tertiary-500'
														: 'bg-surface-700/50 text-surface-300 hover:bg-surface-700 border-surface-600'} border"
													on:click={() => toggleTag(tag)}
												>
													{tag}
												</button>
											{/each}
										</div>
									</div>

									<div class="flex justify-end gap-4 pt-6">
										<button
											type="button"
											on:click={() => (showNewProposalForm = false)}
											class="px-6 py-2.5 text-sm font-medium transition-colors rounded-lg sm:text-base hover:bg-surface-700 text-tertiary-300"
										>
											Cancel
										</button>
										<button
											type="submit"
											class="px-6 py-2.5 text-sm sm:text-base btn bg-gradient-to-br variant-gradient-secondary-primary"
											disabled={$createProposalMutation.isLoading ||
												($userTokensQuery.data?.balances.VCE.balance || 0) < 1}
										>
											{#if $createProposalMutation.isLoading}
												<div class="flex items-center justify-center gap-2">
													<svg
														class="w-5 h-5 animate-spin"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															class="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															stroke-width="4"
														/>
														<path
															class="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														/>
													</svg>
													<span>Processing...</span>
												</div>
											{:else}
												Create Proposal
											{/if}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				{/if}

				<!-- Scrollable Content Area -->
				<div class="h-[calc(100vh-4rem)] overflow-y-auto">
					<div class="max-w-5xl mx-auto">
						<!-- Proposals List -->
						<div class="grid gap-4 px-4 pt-4 pb-64 sm:pb-48">
							{#each filteredProposals as proposal (proposal.id)}
								<div
									id="proposal-{proposal.id}"
									class={getProposalCardClasses(proposal)}
									on:click={() => {
										const url = new URL(window.location.href);
										url.searchParams.set('modal', 'ProposalDetail');
										url.searchParams.set('props', `id=${proposal.id}`);
										goto(url.toString(), { replaceState: true });
									}}
								>
									<ProposalHeaderItem
										{proposal}
										{userData}
										{getVotersForProposal}
										{canVote}
										{canUnstakeVote}
										{getVoteDisplay}
										onVote={handleVote}
										{userTokens}
										{getNextVoteCost}
										onDecision={handleDecision}
										{isAdmin}
										{getTimeAgo}
									/>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.proposal-system) {
		@apply h-full overflow-hidden bg-surface-900;
	}

	:global(.proposal-card) {
		@apply overflow-hidden rounded-xl bg-surface-900/50 border border-surface-700/50;
	}

	:global(.aside-overlay) {
		@apply fixed inset-0 bg-surface-900/50 backdrop-blur-sm;
	}

	:global(.aside-panel) {
		@apply fixed top-0 h-screen bg-surface-900 border-surface-700/50 shadow-2xl;
	}

	.thin-scrollbar {
		scrollbar-width: thin;
		-ms-overflow-style: none;
	}
	.thin-scrollbar::-webkit-scrollbar {
		height: 4px;
	}
	.thin-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.thin-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}
</style>
