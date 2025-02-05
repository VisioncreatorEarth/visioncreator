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
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Messages from './Messages.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Avatar from './Avatar.svelte';
	import { marked } from 'marked';
	import LeftAsideProposals from './LeftAsideProposals.svelte';
	import RightAsideProposals from './RightAsideProposals.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import { writable } from 'svelte/store';

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

	// Add transaction type
	interface TokenTransaction {
		id: string;
		proposal_id: string | null;
		transaction_type: 'stake' | 'unstake' | 'mint' | 'transfer';
		amount: number;
		created_at: string;
		from_user_id: string;
	}

	// Add interface for Profile
	interface Profile {
		id: string;
		name: string | null;
		onboarded: boolean;
	}

	interface VoterInfo {
		id: string;
		name: string | null;
		votes: number;
		tokens: number;
	}

	// Queries with proper typing
	const proposalsQuery = createQuery({
		operationName: 'queryProposals',
		enabled: true,
		refetchInterval: 1000
	});

	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

	$: userId = $userQuery.data?.id as string;
	$: userTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId: userData?.id || '' },
		enabled: !!userData?.id,
		refetchInterval: 500 // Faster refresh for token updates
	});

	// Create a single query for the current proposal's voters
	$: currentProposalVotersQuery = createQuery({
		operationName: 'getProposalVoters',
		input: { proposalId: expandedProposalId || '' },
		enabled: !!expandedProposalId,
		refetchInterval: 1000
	});

	// State management
	const activeTab = writable<ProposalState>('idea');
	let expandedProposalId: string | null = null;
	let detailTab: 'details' | 'chat' = 'details';
	let userTokens = 0;
	let userVotes = new Map<string, number>();
	let isWorkPackageFormVisible = false;

	// Work package form state
	let newWorkPackage = {
		title: '',
		deliverables: '',
		budget: 0,
		assignee: ''
	};

	// Constants
	const PROPOSAL_TABS: ProposalState[] = ['idea', 'draft', 'pending', 'accepted', 'rejected'];

	// Update the state thresholds
	const STATE_THRESHOLDS = {
		idea: 10, // 10 votes to move from idea to draft
		draft: 20, // 20 votes (not 19) to move from draft to pending
		decision: 30 // 30 votes to move from decision to implementation
	};

	// Add updateVotes mutation
	const updateVotesMutation = createMutation({
		operationName: 'updateVotes'
	});

	// Update user tokens when data changes
	$: if ($userTokensQuery.data?.balance?.balance) {
		userTokens = Number($userTokensQuery.data.balance.balance);
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
		const userId = $userQuery.data.id as string;

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

	// Update assignee when user data loads
	$: if ($userQuery.data) {
		const userData = $userQuery.data as User;
		newWorkPackage.assignee = userData.name;
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

	function getStateTextClasses(proposal: Proposal): string {
		return `flex items-center gap-2 ${getStateColor(proposal.state)}`;
	}

	// Make tab classes reactive to activeTab changes
	function getTabClasses(state: ProposalState): string {
		const baseClasses = 'px-4 py-2 text-sm font-medium transition-colors rounded-lg';
		const stateColor = getStateColor(state);
		const isActive = $activeTab === state;
		const bgColor = isActive ? getStateBgColor(state) : 'hover:bg-surface-700/20';
		return `${baseClasses} ${stateColor} ${bgColor}`;
	}

	// Filter and sort proposals based on active tab
	$: filteredProposals =
		$proposalsQuery.data?.proposals
			.filter((p) => p.state === $activeTab)
			.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0)) || [];

	// Handle URL parameters for proposal selection
	$: if ($page.url.searchParams.get('id')) {
		const proposalId = $page.url.searchParams.get('id');
		if (proposalId) {
			const proposal = $proposalsQuery.data?.proposals.find((p) => p.id === proposalId);
			if (proposal) {
				activeTab.set(proposal.state);
				setTimeout(() => {
					expandedProposalId = proposalId;
				}, 0);
			}
		}
	}

	// Reset expanded view when tab changes
	$: if ($activeTab) {
		expandedProposalId = null;
	}

	// Add quadratic voting helper function
	function getNextVoteCost(currentVotes: number): number {
		return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
	}

	// Update the interface definitions
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

	interface VoterInfo {
		id: string;
		name: string | null;
		votes: number;
		tokens: number;
	}

	// Update handleVote function
	async function handleVote(proposalId: string, isIncrease: boolean) {
		if (!$userQuery.data?.id) return;

		const userId = $userQuery.data.id as string;
		const voters = getVotersForProposal(proposalId);
		const userVoteInfo = voters.find((v) => v.id === userId);
		const currentVotes = userVoteInfo?.votes || 0;

		try {
			const result = await $updateVotesMutation.mutateAsync({
				proposalId,
				userId,
				action: isIncrease ? 'stake' : 'unstake',
				amount: 1
			});

			if (result?.success) {
				// Immediately update local state
				votersStore.update((store) => {
					const newStore = new Map(store);
					const currentVoters = newStore.get(proposalId) || [];
					const updatedVoters = currentVoters.map((voter) => {
						if (voter.id === userId) {
							const newVotes = isIncrease ? currentVotes + 1 : currentVotes - 1;
							const newTokens = isIncrease
								? voter.tokens + getQuadraticCost(currentVotes)
								: voter.tokens - getQuadraticCost(currentVotes - 1);
							return {
								...voter,
								votes: newVotes,
								tokens: newTokens
							};
						}
						return voter;
					});
					newStore.set(proposalId, updatedVoters);
					return newStore;
				});

				// Immediately refetch all relevant data
				await Promise.all([
					$userTokensQuery.refetch(),
					$proposalsQuery.refetch(),
					$currentProposalVotersQuery.refetch(),
					...[...($votersQueriesStore.values() || [])].map((query) => query.refetch())
				]);

				// Force refresh of specific proposal's voters
				const query = $votersQueriesStore.get(proposalId);
				if (query) {
					const newQuery = createQuery({
						operationName: 'getProposalVoters',
						input: { proposalId },
						enabled: true,
						refetchInterval: 500
					});
					$votersQueriesStore.set(proposalId, newQuery);
				}
			}
		} catch (error) {
			console.error('Failed to update vote:', error);
		}
	}

	// Update the proposal card display to show quadratic voting info
	function getVoteDisplay(proposal: Proposal, voter?: VoterInfo) {
		const currentVotes = voter?.votes || 0;
		const currentTokens = voter?.tokens || 0;
		const nextVoteCost = getNextVoteCost(currentVotes);
		// Calculate tokens that would be returned on unstake
		const unstakeReturn = currentVotes > 0 ? getQuadraticCost(currentVotes - 1) : 0;

		return {
			votes: currentVotes,
			tokens: currentTokens,
			nextCost: nextVoteCost,
			unstakeReturn
		};
	}

	// Helper function to calculate quadratic cost for a specific vote number
	function getQuadraticCost(voteNumber: number): number {
		return Math.pow(voteNumber + 1, 2) - Math.pow(voteNumber, 2);
	}

	function handleProposalSelect(state: ProposalState, proposalId: string) {
		activeTab.set(state);
		setTimeout(() => {
			expandedProposalId = proposalId;
			centerProposalInView(proposalId);
		}, 0);
	}

	// Format voter data for Avatar component
	function formatVoterForAvatar(voter: VoterInfo) {
		return {
			data: { seed: voter.name || voter.id },
			design: { highlight: voter.id === userId },
			size: 'xs' as const
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

	// Update expanded proposal handling without refetch
	$: if (expandedProposalId) {
		const query = $votersQueriesStore.get(expandedProposalId);
		if (query) {
			// Force a new query instance to trigger a refresh
			$votersQueriesStore.set(
				expandedProposalId,
				createQuery({
					operationName: 'getProposalVoters',
					input: { proposalId: expandedProposalId },
					enabled: true,
					refetchInterval: 1000
				})
			);
		}
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

	function getProposalValueClasses(proposal: Proposal): string {
		return `w-[280px] shrink-0 p-6 flex flex-col ${getStateBgColor(proposal.state)}`;
	}

	// Update the userQuery data access
	$: userData = $userQuery.data
		? {
				id: $userQuery.data.id as string,
				name: $userQuery.data.name as string,
				onboarded: $userQuery.data.onboarded as boolean
		  }
		: null;

	// Add author profile query store
	$: authorProfileQuery = createQuery({
		operationName: 'getProfile',
		input: { userId: expandedProposal?.author || '' },
		enabled: !!expandedProposal?.author
	});

	// Add expanded proposal reactive variable
	$: expandedProposal = expandedProposalId
		? $proposalsQuery.data?.proposals.find((p) => p.id === expandedProposalId)
		: null;

	// Add author profile reactive variable
	$: authorProfile = $authorProfileQuery.data as Profile | undefined;

	// Add new proposal form state
	let showNewProposalForm = false;
	let newProposal = {
		title: '',
		details: '',
		tags: [] as string[]
	};

	// Add tag selection helper
	const VALID_TAGS = ['startup', 'distribution', 'product'] as const;
	type ValidTag = (typeof VALID_TAGS)[number];

	function toggleTag(tag: ValidTag) {
		if (newProposal.tags.includes(tag)) {
			newProposal.tags = newProposal.tags.filter((t) => t !== tag);
		} else {
			newProposal.tags = [...newProposal.tags, tag];
		}
	}

	// Add create proposal mutation
	const createProposalMutation = createMutation({
		operationName: 'createProposal'
	});

	// Add handleCreateProposal function
	async function handleCreateProposal() {
		if (!newProposal.title || !newProposal.details) return;

		try {
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
				// Refresh proposals
				await $proposalsQuery.refetch();
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

	// Add this helper function for countdown display
	function getCountdownDisplay(): string {
		// Hardcoded 1 day countdown for now
		return '23:59:59';
	}

	// Add this helper to check if voting is allowed
	function canVote(proposal: Proposal, currentVotes: number): boolean {
		if (proposal.state === 'pending') return false;
		return currentVotes < 20;
	}

	// Add the decision mutation
	const handleDecisionMutation = createMutation({
		operationName: 'handleProposalDecision'
	});

	// Add handleDecision function
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
				await Promise.all([
					$proposalsQuery.refetch?.(),
					$currentProposalVotersQuery.refetch?.(),
					$userTokensQuery.refetch?.()
				]);

				// If the proposal was the expanded one, close it
				if (expandedProposalId === proposalId) {
					expandedProposalId = null;
				}
			}
		} catch (error) {
			console.error('Failed to handle decision:', error);
		}
	}

	// Add isAdmin helper function
	function isAdmin(userId: string): boolean {
		return userId === '00000000-0000-0000-0000-000000000001';
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

	function formatDate(date: string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<!-- Left Aside -->
	<LeftAsideProposals
		selectedState={$activeTab}
		onStateSelect={(state) => activeTab.set(state)}
		states={PROPOSAL_TABS}
	/>

	<!-- Main Content Area -->
	<main class="flex-grow h-full overflow-hidden">
		<div class="h-full">
			<!-- Tabs Bar - Fixed to top -->
			<div id="proposal-tabs" class="sticky top-0 z-10 w-full bg-surface-800/50 backdrop-blur-sm">
				<div class="max-w-5xl px-4 py-4 mx-auto">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							{#if expandedProposalId}
								<button
									on:click={() => {
										expandedProposalId = null;
										goto(`/me?view=Proposals`, { replaceState: true });
									}}
									class="flex items-center gap-2 px-4 py-2 mr-2 text-sm font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
								>
									<Icon icon="mdi:arrow-left" class="w-5 h-5" />
									Back to List
								</button>
							{/if}
							{#each PROPOSAL_TABS as state}
								<button
									class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {$activeTab ===
									state
										? getStateBgColor(state) + ' ' + getStateColor(state)
										: 'hover:bg-surface-700/20 text-surface-300'}"
									on:click={() => {
										expandedProposalId = null;
										activeTab.set(state);
									}}
									aria-selected={$activeTab === state}
								>
									<div class="flex items-center gap-2">
										<Icon icon={getStateIcon(state)} class="w-4 h-4" />
										{getTabLabel(state)}
									</div>
								</button>
							{/each}
						</div>
						{#if !expandedProposalId}
							<button
								on:click={() => (showNewProposalForm = true)}
								class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10 text-tertiary-300"
							>
								<Icon icon="mdi:plus" class="w-5 h-5" />
								Add New Idea
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Update the form to show token requirement -->
			{#if showNewProposalForm}
				<div class="max-w-5xl mx-auto">
					<div class="px-4 py-4">
						<div class="p-6 border rounded-lg border-surface-700/50 bg-surface-800/50">
							<div class="flex items-center justify-between mb-4">
								<div>
									<h3 class="text-lg font-medium text-tertiary-100">Create New Idea</h3>
									<p class="mt-1 text-sm text-tertiary-300">
										Creating a new idea requires 1 token for initial stake
									</p>
								</div>
								<button
									on:click={() => (showNewProposalForm = false)}
									class="p-2 rounded-lg hover:bg-surface-700/50"
								>
									<Icon icon="mdi:close" class="w-5 h-5 text-tertiary-300" />
								</button>
							</div>

							<!-- Add token balance warning if insufficient -->
							{#if $userTokensQuery.data?.balance?.balance < 1}
								<div class="p-4 mb-4 border rounded-lg border-error-500/20 bg-error-500/10">
									<div class="flex items-start gap-3">
										<Icon icon="mdi:alert-circle" class="w-5 h-5 mt-0.5 text-error-400" />
										<div>
											<p class="font-medium text-error-400">Insufficient Tokens</p>
											<p class="mt-1 text-sm text-error-300">
												You need at least 1 token to create a new idea. Your current balance: {$userTokensQuery
													.data?.balance?.balance || 0} tokens
											</p>
										</div>
									</div>
								</div>
							{/if}

							<form on:submit|preventDefault={handleCreateProposal} class="space-y-4">
								<div>
									<label for="title" class="block mb-2 text-sm font-medium text-tertiary-200">
										Title
									</label>
									<input
										type="text"
										id="title"
										bind:value={newProposal.title}
										class="w-full px-4 py-2 text-sm border rounded-lg bg-surface-900 border-surface-700 text-tertiary-100 focus:border-tertiary-500 focus:ring-1 focus:ring-tertiary-500"
										placeholder="Enter your idea title"
										required
									/>
								</div>

								<!-- Add tag selection -->
								<div>
									<label class="block mb-2 text-sm font-medium text-tertiary-200">
										Tags (Optional)
									</label>
									<div class="flex flex-wrap gap-2">
										{#each VALID_TAGS as tag}
											<button
												type="button"
												class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {newProposal.tags.includes(
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

								<div>
									<label for="details" class="block mb-2 text-sm font-medium text-tertiary-200">
										Details
									</label>
									<textarea
										id="details"
										bind:value={newProposal.details}
										class="w-full h-32 px-4 py-2 text-sm border rounded-lg bg-surface-900 border-surface-700 text-tertiary-100 focus:border-tertiary-500 focus:ring-1 focus:ring-tertiary-500"
										placeholder="Describe your idea in detail (Markdown supported)"
										required
									/>
								</div>
								<div class="flex justify-end gap-3">
									<button
										type="button"
										on:click={() => (showNewProposalForm = false)}
										class="px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-surface-700 text-tertiary-300"
									>
										Cancel
									</button>
									<button
										type="submit"
										class="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-tertiary-500 hover:bg-tertiary-600"
										disabled={$createProposalMutation.isLoading ||
											($userTokensQuery.data?.balance?.balance || 0) < 1}
									>
										{#if $createProposalMutation.isLoading}
											Creating...
										{:else}
											Create Proposal (1 token)
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
					<div class="grid gap-4 px-4 pt-4">
						{#if expandedProposalId}
							{@const proposal = $proposalsQuery.data?.proposals.find(
								(p) => p.id === expandedProposalId
							)}
							{#if proposal}
								<div
									id="proposal-{proposal.id}"
									class="{getProposalCardClasses(proposal)} flex flex-col h-[calc(100vh-12rem)]"
								>
									<!-- Proposal Header -->
									<div class="sticky top-0 z-10 flex items-stretch bg-surface-800/50">
										<!-- Left side: Votes -->
										<div
											class="flex items-center justify-between w-40 p-4 border-r shrink-0 md:w-40 md:p-6 border-surface-700/50"
										>
											<div class="flex items-center justify-center w-full gap-4">
												<div class="flex items-center gap-4">
													<div class="relative text-center">
														<div class="flex items-center justify-center">
															<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																{proposal.total_votes || 0}
															</p>
															{#if $userQuery.data}
																{@const voteInfo = getVoteDisplay(
																	proposal,
																	getVotersForProposal(proposal.id).find(
																		(v) => v.id === $userQuery.data.id
																	)
																)}
																{#if voteInfo.tokens > 0}
																	<div
																		class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-medium bg-tertiary-500/20 text-tertiary-300 rounded-full"
																	>
																		{voteInfo.tokens}
																	</div>
																{/if}
															{/if}
														</div>
														<div class="text-sm text-tertiary-300">
															<span>votes</span>
														</div>
													</div>
													{#if proposal.state !== 'pending' && proposal.state !== 'accepted' && proposal.state !== 'rejected'}
														<div class="flex flex-col gap-2">
															<button
																disabled={!$userQuery.data ||
																	!canVote(
																		proposal,
																		getVotersForProposal(proposal.id).find(
																			(v) => v.id === $userQuery.data?.id
																		)?.votes || 0
																	) ||
																	userTokens <
																		getNextVoteCost(
																			getVotersForProposal(proposal.id).find(
																				(v) => v.id === $userQuery.data?.id
																			)?.votes || 0
																		)}
																on:click|stopPropagation={() => handleVote(proposal.id, true)}
																class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
															>
																<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																	<path
																		fill="currentColor"
																		d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
																	/>
																</svg>
															</button>

															<button
																disabled={!$userQuery.data ||
																	!canUnstakeVote(
																		proposal,
																		getVotersForProposal(proposal.id).find(
																			(v) => v.id === $userQuery.data?.id
																		)
																	)}
																on:click|stopPropagation={() => handleVote(proposal.id, false)}
																class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
															>
																<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																	<path fill="currentColor" d="M19 13H5v-2h14v2z" />
																</svg>
															</button>
														</div>
													{/if}
												</div>
											</div>
										</div>

										<!-- Middle: Basic Info -->
										<div class="flex-grow min-w-0 p-4 border-r md:p-6 border-surface-700/50">
											<div class="flex flex-col min-h-[80px] justify-center">
												<h3
													class="mb-4 text-lg font-semibold truncate md:text-xl text-tertiary-100"
												>
													{proposal.title}
												</h3>
												<div class="flex flex-wrap items-center gap-4">
													{#each getVotersForProposal(proposal.id) as voter (voter.id)}
														<div class="relative">
															<Avatar me={formatVoterForAvatar(voter)} />
															<div
																class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-medium bg-tertiary-500/20 text-tertiary-300 rounded-full"
															>
																{voter.votes}
															</div>
														</div>
													{/each}
												</div>
											</div>
										</div>

										<!-- Right side: Value -->
										<div
											class="w-[280px] shrink-0 p-4 md:p-6 {getStateBgColor(
												proposal.state
											)} relative"
										>
											<div class="absolute top-0 right-0 flex items-start gap-2">
												{#if proposal.tags && proposal.tags.length > 0}
													{#each proposal.tags as tag}
														<div
															class="px-2 py-1 text-xs font-medium rounded-b-lg bg-tertiary-500/10 text-tertiary-300"
														>
															{tag}
														</div>
													{/each}
												{/if}
												<div
													class="inline-flex items-center gap-2 px-3 py-1.5 rounded-bl-lg bg-surface-900/20"
												>
													<Icon
														icon={getStateIcon(proposal.state)}
														class="w-4 h-4 {getStateColor(proposal.state)}"
													/>
													<span class="text-sm font-medium {getStateColor(proposal.state)}"
														>{getStateLabel(proposal.state)}</span
													>
												</div>
											</div>
											<div class="mt-8 text-right">
												{#if proposal.state === 'pending' && $userQuery.data?.id && isAdmin($userQuery.data.id)}
													<div class="flex justify-end gap-2">
														<button
															on:click|stopPropagation={() => handleDecision(proposal.id, 'veto')}
															class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-error-300 hover:bg-error-500/20 bg-error-500/10"
															disabled={$handleDecisionMutation.isLoading}
														>
															<div class="flex items-center gap-2">
																<Icon icon="heroicons:x-mark" class="w-5 h-5" />
																Veto
															</div>
														</button>
														<button
															on:click|stopPropagation={() => handleDecision(proposal.id, 'pass')}
															class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-success-300 hover:bg-success-500/20 bg-success-500/10"
															disabled={$handleDecisionMutation.isLoading}
														>
															<div class="flex items-center gap-2">
																<Icon icon="heroicons:check" class="w-5 h-5" />
																Pass
															</div>
														</button>
													</div>
												{:else if proposal.state === 'accepted' || proposal.state === 'rejected'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{getTimeAgo(proposal.decided_at)}
														</p>
														<p class="text-sm text-tertiary-300">Decision on February 5, 2025</p>
													</div>
												{:else if proposal.state === 'idea'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{Math.round((proposal.total_votes / STATE_THRESHOLDS.idea) * 100)}%
														</p>
														<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
															<div
																class="h-full transition-all duration-300 bg-tertiary-500"
																style="width: {Math.min(
																	(proposal.total_votes / STATE_THRESHOLDS.idea) * 100,
																	100
																)}%"
															/>
														</div>
														<p class="text-sm text-tertiary-300">
															{proposal.total_votes} of {STATE_THRESHOLDS.idea} votes
														</p>
													</div>
												{:else if proposal.state === 'draft'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{Math.round((proposal.total_votes / STATE_THRESHOLDS.draft) * 100)}%
														</p>
														<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
															<div
																class="h-full transition-all duration-300 bg-tertiary-500"
																style="width: {Math.min(
																	(proposal.total_votes / STATE_THRESHOLDS.draft) * 100,
																	100
																)}%"
															/>
														</div>
														<p class="text-sm text-tertiary-300">
															{proposal.total_votes} of {STATE_THRESHOLDS.draft} votes
														</p>
													</div>
												{/if}
											</div>
										</div>
									</div>

									<!-- Expanded Content -->
									<div class="flex flex-1 overflow-hidden border-t border-surface-700/50">
										<!-- Left: Vertical Navigation -->
										<div
											class="flex flex-col w-16 border-r border-surface-700/50 bg-surface-800/50"
										>
											<button
												class="flex flex-col items-center justify-center w-16 h-16 transition-colors {detailTab ===
												'details'
													? 'bg-surface-700 text-tertiary-100'
													: 'text-tertiary-300 hover:bg-surface-700/50'}"
												on:click={() => (detailTab = 'details')}
											>
												<Icon icon="mdi:text-box-outline" class="w-6 h-6" />
												<span class="mt-1 text-[10px]">Details</span>
											</button>

											<button
												class="flex flex-col items-center justify-center w-16 h-16 transition-colors {detailTab ===
												'chat'
													? 'bg-surface-700 text-tertiary-100'
													: 'text-tertiary-300 hover:bg-surface-700/50'}"
												on:click={() => (detailTab = 'chat')}
											>
												<Icon icon="mdi:chat-outline" class="w-6 h-6" />
												<span class="mt-1 text-[10px]">Chat</span>
											</button>
										</div>

										<!-- Middle: Content -->
										<div
											class="flex flex-col flex-grow overflow-hidden border-r border-surface-700/50 bg-surface-800/50"
										>
											<div class="flex-1 overflow-y-auto">
												{#if detailTab === 'details'}
													<div class="flex flex-col gap-6 p-6">
														<!-- Video Player (if video_id exists) -->
														{#if proposal.video_id}
															<div class="w-full overflow-hidden rounded-lg bg-surface-800">
																<VideoPlayer videoId={proposal.video_id} />
															</div>
														{/if}

														<div class="flex flex-col gap-2">
															<h3 class="text-sm font-medium text-tertiary-300">
																Project Overview
															</h3>
															<div class="pb-20 prose prose-invert max-w-none">
																{#if proposal.details}
																	{@html marked(proposal.details)}
																{:else}
																	<p class="text-tertiary-300">
																		No project overview available yet. Click to edit and add
																		details.
																	</p>
																{/if}
															</div>
														</div>
													</div>
												{:else if detailTab === 'chat'}
													<div class="relative h-full">
														<Messages
															contextId={proposal.id}
															contextType="proposal"
															className="h-full"
														/>
													</div>
												{/if}
											</div>
										</div>

										<!-- Right side: Details -->
										<div
											class="w-[280px] shrink-0 {getStateBgColor(proposal.state)} overflow-y-auto"
										>
											<div class="p-6 space-y-6">
												<!-- Author -->
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														Author
													</h4>
													<div class="flex items-center justify-end gap-3">
														<p class="text-sm font-medium text-tertiary-100">
															{authorProfile?.name || 'Not assigned'}
														</p>
														<Avatar
															me={{
																data: { seed: authorProfile?.name || proposal.author || '' },
																design: { highlight: false },
																size: 'sm'
															}}
														/>
													</div>
												</div>

												<!-- Responsible Person -->
												{#if proposal.responsible}
													<div>
														<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
															Responsible
														</h4>
														<div class="flex items-center justify-end gap-3">
															<div class="text-right">
																<p class="text-sm font-medium text-tertiary-100">
																	{proposal.responsible?.name || 'Not assigned'}
																</p>
																<p class="text-xs text-tertiary-300">Lead</p>
															</div>
															<div class="flex-shrink-0">
																<Avatar
																	me={{
																		data: {
																			seed: proposal.responsible?.name || proposal.responsible
																		},
																		design: { highlight: false },
																		size: 'sm'
																	}}
																	class="rounded-full"
																/>
															</div>
														</div>
													</div>
												{/if}

												<!-- Metadata fields - Only show for non-idea states -->
												{#if proposal.state !== 'idea'}
													<!-- Pain Point from metadata -->
													<div>
														<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
															Pain Point
														</h4>
														<p class="text-sm text-right text-tertiary-300">
															{proposal.metadata?.pain || 'Not defined yet'}
														</p>
													</div>

													<!-- Expected Benefits from metadata -->
													<div>
														<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
															Expected Benefits
														</h4>
														<p class="text-sm text-right text-tertiary-300">
															{proposal.metadata?.benefits || 'Not defined yet'}
														</p>
													</div>

													<!-- Additional metadata fields -->
													{#each Object.entries(proposal.metadata || {}) as [key, value]}
														{#if !['pain', 'benefits'].includes(key) && value !== null && value !== undefined}
															<div>
																<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
																	{key.charAt(0).toUpperCase() + key.slice(1)}
																</h4>
																<p class="text-sm text-right text-tertiary-300">
																	{value}
																</p>
															</div>
														{/if}
													{/each}
												{/if}
											</div>
										</div>
									</div>
								</div>
							{/if}
						{:else}
							{#each filteredProposals as proposal (proposal.id)}
								<div
									id="proposal-{proposal.id}"
									class="{getProposalCardClasses(proposal)} flex"
									on:click={() => {
										handleProposalSelect(proposal.state, proposal.id);
										centerProposalInView(proposal.id);
									}}
								>
									<!-- Left side: Votes -->
									<div
										class="flex items-center justify-between w-40 p-4 border-r shrink-0 md:w-40 md:p-6 border-surface-700/50"
									>
										<div class="flex items-center justify-center w-full gap-4">
											<div class="flex items-center gap-4">
												<div class="relative text-center">
													<div class="flex items-center justify-center">
														<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
															{proposal.total_votes || 0}
														</p>
														{#if $userQuery.data}
															{@const voteInfo = getVoteDisplay(
																proposal,
																getVotersForProposal(proposal.id).find(
																	(v) => v.id === $userQuery.data.id
																)
															)}
															{#if voteInfo.tokens > 0}
																<div
																	class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-medium bg-tertiary-500/20 text-tertiary-300 rounded-full"
																>
																	{voteInfo.tokens}
																</div>
															{/if}
														{/if}
													</div>
													<div class="text-sm text-tertiary-300">
														<span>votes</span>
													</div>
												</div>
												{#if proposal.state !== 'pending' && proposal.state !== 'accepted' && proposal.state !== 'rejected'}
													<div class="flex flex-col gap-2">
														<button
															disabled={!$userQuery.data ||
																!canVote(
																	proposal,
																	getVotersForProposal(proposal.id).find(
																		(v) => v.id === $userQuery.data?.id
																	)?.votes || 0
																) ||
																userTokens <
																	getNextVoteCost(
																		getVotersForProposal(proposal.id).find(
																			(v) => v.id === $userQuery.data?.id
																		)?.votes || 0
																	)}
															on:click|stopPropagation={() => handleVote(proposal.id, true)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
															</svg>
														</button>

														<button
															disabled={!$userQuery.data ||
																!canUnstakeVote(
																	proposal,
																	getVotersForProposal(proposal.id).find(
																		(v) => v.id === $userQuery.data?.id
																	)
																)}
															on:click|stopPropagation={() => handleVote(proposal.id, false)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13H5v-2h14v2z" />
															</svg>
														</button>
													</div>
												{/if}
											</div>
										</div>
									</div>

									<!-- Middle: Basic Info -->
									<div class="flex-grow min-w-0 p-4 border-r md:p-6 border-surface-700/50">
										<div class="flex flex-col min-h-[80px] justify-center">
											<h3 class="mb-4 text-lg font-semibold truncate md:text-xl text-tertiary-100">
												{proposal.title}
											</h3>
											<div class="flex flex-wrap items-center gap-4">
												{#each getVotersForProposal(proposal.id) as voter (voter.id)}
													<div class="relative">
														<Avatar me={formatVoterForAvatar(voter)} />
														<div
															class="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs font-medium bg-tertiary-500/20 text-tertiary-300 rounded-full"
														>
															{voter.votes}
														</div>
													</div>
												{/each}
											</div>
										</div>
									</div>

									<!-- Right side: Value -->
									<div
										class="w-[280px] shrink-0 p-4 md:p-6 {getStateBgColor(proposal.state)} relative"
									>
										<div class="absolute top-0 right-0 flex items-start gap-2">
											{#if proposal.tags && proposal.tags.length > 0}
												{#each proposal.tags as tag}
													<div
														class="px-2 py-1 text-xs font-medium rounded-b-lg bg-tertiary-500/10 text-tertiary-300"
													>
														{tag}
													</div>
												{/each}
											{/if}
											<div
												class="inline-flex items-center gap-2 px-3 py-1.5 rounded-bl-lg bg-surface-900/20"
											>
												<Icon
													icon={getStateIcon(proposal.state)}
													class="w-4 h-4 {getStateColor(proposal.state)}"
												/>
												<span class="text-sm font-medium {getStateColor(proposal.state)}"
													>{getStateLabel(proposal.state)}</span
												>
											</div>
										</div>
										<div class="mt-8 text-right">
											{#if proposal.state === 'pending' && $userQuery.data?.id && isAdmin($userQuery.data.id)}
												<div class="flex justify-end gap-2">
													<button
														on:click|stopPropagation={() => handleDecision(proposal.id, 'veto')}
														class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-error-300 hover:bg-error-500/20 bg-error-500/10"
														disabled={$handleDecisionMutation.isLoading}
													>
														<div class="flex items-center gap-2">
															<Icon icon="heroicons:x-mark" class="w-5 h-5" />
															Veto
														</div>
													</button>
													<button
														on:click|stopPropagation={() => handleDecision(proposal.id, 'pass')}
														class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-success-300 hover:bg-success-500/20 bg-success-500/10"
														disabled={$handleDecisionMutation.isLoading}
													>
														<div class="flex items-center gap-2">
															<Icon icon="heroicons:check" class="w-5 h-5" />
															Pass
														</div>
													</button>
												</div>
											{:else if proposal.state === 'accepted' || proposal.state === 'rejected'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{getTimeAgo(proposal.decided_at)}
													</p>
													<p class="text-sm text-tertiary-300">Decision on February 5, 2025</p>
												</div>
											{:else if proposal.state === 'idea'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.total_votes / STATE_THRESHOLDS.idea) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																(proposal.total_votes / STATE_THRESHOLDS.idea) * 100,
																100
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.total_votes} of {STATE_THRESHOLDS.idea} votes
													</p>
												</div>
											{:else if proposal.state === 'draft'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.total_votes / STATE_THRESHOLDS.draft) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																(proposal.total_votes / STATE_THRESHOLDS.draft) * 100,
																100
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.total_votes} of {STATE_THRESHOLDS.draft} votes
													</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Right Aside -->
	<RightAsideProposals onProposalSelect={handleProposalSelect} voteThreshold={10} />
</div>

<style>
	:global(.proposal-card) {
		@apply overflow-hidden rounded-xl bg-surface-900/50 border border-surface-700/50;
	}

	:global(.aside-overlay) {
		@apply fixed inset-0 bg-surface-900/50 backdrop-blur-sm;
	}

	:global(.aside-panel) {
		@apply fixed top-0 h-screen bg-surface-900 border-surface-700/50 shadow-2xl;
	}
</style>
