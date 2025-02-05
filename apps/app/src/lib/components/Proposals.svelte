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
	import type { Operations } from '@wundergraph/sdk/client';
	import type { QueryObserverResult } from '@tanstack/svelte-query';
	import type { Readable } from 'svelte/store';
	import Messages from './Messages.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Avatar from './Avatar.svelte';
	import { marked } from 'marked';
	import LeftAsideProposals from './LeftAsideProposals.svelte';
	import RightAsideProposals from './RightAsideProposals.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import { writable } from 'svelte/store';
	import ProposalDetailView from './ProposalDetailView.svelte';
	import ProposalHeaderItem from './ProposalHeaderItem.svelte';
	import type {
		Proposal,
		ProposalState,
		VoterInfo,
		User,
		TokenTransaction,
		Profile,
		UserTokens
	} from '$lib/types/proposals';

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

	interface UserTokens {
		balance: {
			balance: number;
		};
		transactions: TokenTransaction[];
	}

	type UserQueryResult = QueryObserverResult<User | undefined>;

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

	// Create a single query for the current proposal's voters
	$: currentProposalVotersQuery = createQuery<Operations['getProposalVoters']>({
		operationName: 'getProposalVoters',
		input: { proposalId: expandedProposalId || '' },
		enabled: !!expandedProposalId,
		refetchInterval: 1000
	}) as unknown as WundergraphQuery<Operations['getProposalVoters']>;

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
	const VALID_TAGS = ['startup', 'distribution', 'product'] as const;
	type ValidTag = (typeof VALID_TAGS)[number];

	// Update the state thresholds
	const STATE_THRESHOLDS = {
		idea: 10, // 10 votes to move from idea to draft
		draft: 20, // 20 votes (not 19) to move from draft to pending
		decision: 30 // 30 votes to move from decision to implementation
	};

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

	// Update filteredProposals with proper typing
	$: filteredProposals = (($proposalsQuery.data?.proposals as Proposal[]) || [])
		.filter((p: Proposal) => p.state === $activeTab)
		.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));

	// Update URL parameter handling with proper typing
	$: if ($page.url.searchParams.get('id')) {
		const proposalId = $page.url.searchParams.get('id');
		if (proposalId) {
			const proposal = $proposalsQuery.data?.proposals.find(
				(p: { id: string }) => p.id === proposalId
			);
			if (proposal) {
				activeTab.set(proposal.state as ProposalState);
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
				await proposalsQuery.refetch?.();
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
					[
						proposalsQuery.refetch?.(),
						currentProposalVotersQuery.refetch?.(),
						userTokensQuery.refetch?.()
					].filter(Boolean)
				);

				// If the proposal was the expanded one, close it
				if (expandedProposalId === proposalId) {
					expandedProposalId = null;
				}
			}
		} catch (error) {
			console.error('Failed to handle decision:', error);
		}
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
								<ProposalDetailView
									{proposal}
									onClose={() => {
										expandedProposalId = null;
										goto(`/me?view=Proposals`, { replaceState: true });
									}}
									onVote={handleVote}
									onDecision={handleDecision}
									{userQuery}
									{getVotersForProposal}
									{canVote}
									{canUnstakeVote}
									{getVoteDisplay}
									{isAdmin}
									{getTimeAgo}
									{getStateColor}
									{getStateBgColor}
									{getStateIcon}
									{getStateLabel}
									{userTokens}
									{getNextVoteCost}
								/>
							{/if}
						{:else}
							{#each filteredProposals as proposal (proposal.id)}
								<div
									id="proposal-{proposal.id}"
									class={getProposalCardClasses(proposal)}
									on:click={() => {
										handleProposalSelect(proposal.state, proposal.id);
										centerProposalInView(proposal.id);
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
