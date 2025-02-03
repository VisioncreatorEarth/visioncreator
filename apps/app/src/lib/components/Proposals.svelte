<!--
HOW THIS SYSTEM WORKS:

1. Overview:
   This is a community-driven proposal and voting system where members can:
   - Submit and vote on ideas (initial stage)
   - Track proposal progress
   - Manage budget allocations

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
	import { writable, derived } from 'svelte/store';

	// Define types
	type ProposalState = 'idea' | 'draft' | 'decision';

	interface Proposal {
		id: string;
		title: string;
		author: string;
		details: string | null;
		benefits: string | null;
		pain: string | null;
		video_id: string | null;
		state: ProposalState;
		vote_count: number;
		token_count: number;
		responsible: string | null;
		created_at: string;
		updated_at: string;
	}

	interface WorkPackage {
		id: string;
		proposalId: string;
		title: string;
		deliverables: string;
		budget: number;
		assignee: string;
	}

	interface User {
		id: string;
		name: string;
		onboarded: boolean;
	}

	interface TokenBalance {
		balance: {
			balance: number;
			staked_balance: number;
		};
		transactions: Array<{
			id: string;
			amount: number;
			transaction_type: string;
			created_at: string;
		}>;
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

	// Add response type for updateVotes mutation
	interface UpdateVotesResponse {
		success: boolean;
		message: string;
		transaction: TokenTransaction;
	}

	interface Transaction {
		from_user_id: string;
		amount: number;
		transaction_type: 'stake' | 'unstake';
	}

	interface Profile {
		id: string;
		name: string | null;
	}

	interface VoterInfo {
		id: string;
		name: string | null;
		votes: number;
		tokens: number;
	}

	interface VoterQueryResult {
		id: string;
		query: ReturnType<typeof createQuery>;
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

	// Mock work packages (to be replaced with DB later)
	let workPackages: WorkPackage[] = [
		{
			id: '1',
			proposalId: '1',
			title: 'Initial Development',
			deliverables: 'Basic functionality implementation',
			budget: 5000,
			assignee: 'John Doe'
		},
		{
			id: '2',
			proposalId: '1',
			title: 'UI/UX Design',
			deliverables: 'Design system and components',
			budget: 3000,
			assignee: 'Jane Smith'
		}
	];

	$: proposalWorkPackages = workPackages.filter((wp) => wp.proposalId === expandedProposalId);

	// Constants
	const PROPOSAL_TABS: ProposalState[] = ['idea', 'draft', 'decision'];

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

		console.log('=== Frontend Vote Calculation Debug Log ===');
		console.log('Current User ID:', userId);
		console.log('Raw Transactions:', transactions);

		// Filter transactions for current user and valid proposal_id
		const userTransactions = transactions.filter(
			(tx) => tx.from_user_id === userId && tx.proposal_id !== null
		);

		console.log('Filtered User Transactions:', userTransactions);

		// Create a temporary map to track running totals
		const proposalTotals = new Map<string, number>();

		// Process transactions in chronological order (oldest first)
		userTransactions
			.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
			.forEach((tx) => {
				if (tx.proposal_id) {
					const currentStaked = proposalTotals.get(tx.proposal_id) || 0;
					const change = tx.transaction_type === 'stake' ? tx.amount : -tx.amount;
					const newAmount = Math.max(0, currentStaked + change); // Prevent negative amounts

					console.log(`Proposal ${tx.proposal_id} Transaction:`, {
						type: tx.transaction_type,
						amount: tx.amount,
						currentStaked,
						change,
						newAmount,
						timestamp: tx.created_at,
						userId: tx.from_user_id
					});

					proposalTotals.set(tx.proposal_id, newAmount);
				}
			});

		// Update the reactive store with final totals
		userStakedTokens = new Map(proposalTotals);

		console.log('Final User Staked Tokens:', Object.fromEntries(userStakedTokens));
		console.log('=== End Frontend Vote Calculation Debug Log ===');
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
			case 'decision':
				return 'text-success-400';
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
			case 'decision':
				return 'bg-success-500/10';
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
			case 'decision':
				return 'heroicons:check-circle';
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
			.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)) || [];

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
		vote_count: number;
		token_count: number;
		responsible: string | null;
		created_at: string;
		updated_at: string;
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

	// Work package functions
	function toggleWorkPackageForm() {
		isWorkPackageFormVisible = !isWorkPackageFormVisible;
		if (!isWorkPackageFormVisible) {
			const userData = $userQuery.data as User;
			// Reset form when hiding
			newWorkPackage = {
				title: '',
				deliverables: '',
				budget: 0,
				assignee: userData?.name || ''
			};
		}
	}

	function handleAddWorkPackage() {
		if (expandedProposalId && $userQuery.data) {
			const userData = $userQuery.data as User;
			const newPackage: WorkPackage = {
				id: crypto.randomUUID(),
				proposalId: expandedProposalId,
				...newWorkPackage,
				assignee: userData.name
			};
			workPackages = [...workPackages, newPackage];

			// Reset form and hide it
			newWorkPackage = {
				title: '',
				deliverables: '',
				budget: 0,
				assignee: userData.name
			};
			isWorkPackageFormVisible = false;
		}
	}

	function removeWorkPackage(packageId: string) {
		workPackages = workPackages.filter((wp) => wp.id !== packageId);
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
</script>

<div class="relative flex w-full h-full overflow-hidden">
	<!-- Left Aside -->
	<LeftAsideProposals
		selectedState={$activeTab}
		onStateSelect={(state) => activeTab.set(state)}
		states={PROPOSAL_TABS}
	/>

	<!-- Main Content Area -->
	<main class="flex-grow h-full overflow-hidden md:ml-64 md:mr-80">
		<div class="h-full">
			<!-- Tabs Bar - Fixed to top -->
			<div
				id="proposal-tabs"
				class="sticky top-0 z-10 w-full px-4 py-4 bg-surface-800/50 backdrop-blur-sm"
			>
				<div class="max-w-5xl mx-auto">
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
				</div>
			</div>

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
											class="flex items-center justify-between w-40 p-4 shrink-0 md:p-6 md:border-r border-surface-700/50"
										>
											{#if proposal.state === 'idea' || proposal.state === 'draft'}
												<div class="flex items-center justify-center w-full gap-4">
													<div class="flex items-center gap-4">
														<div class="relative text-center">
															<div class="flex items-center justify-center">
																<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																	{proposal.vote_count || 0}
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
														<div class="flex flex-col gap-2">
															<button
																disabled={!$userQuery.data ||
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
																	!getVotersForProposal(proposal.id).find(
																		(v) => v.id === $userQuery.data?.id
																	)?.votes}
																on:click|stopPropagation={() => handleVote(proposal.id, false)}
																class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
															>
																<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																	<path fill="currentColor" d="M19 13H5v-2h14v2z" />
																</svg>
															</button>
														</div>
													</div>
												</div>
											{:else}
												<div class="w-full text-center">
													<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
														{proposal.vote_count || 0}
													</p>
													<p class="text-sm text-tertiary-300">votes</p>
													<p class="text-xs text-tertiary-400">
														{proposal.token_count || 0} tokens
													</p>
												</div>
											{/if}
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
											class="w-full md:w-[280px] shrink-0 p-4 md:p-6 {getStateBgColor(
												proposal.state
											)} relative"
										>
											<div class="absolute top-0 right-0">
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
												{#if proposal.state === 'idea'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{Math.round((proposal.vote_count / 10) * 100)}%
														</p>
														<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
															<div
																class="h-full transition-all duration-300 bg-tertiary-500"
																style="width: {Math.min((proposal.vote_count / 10) * 100, 100)}%"
															/>
														</div>
														<p class="text-sm text-tertiary-300">
															{proposal.vote_count} votes
														</p>
													</div>
												{:else if proposal.state === 'draft'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{Math.round((proposal.vote_count / 20) * 100)}%
														</p>
														<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
															<div
																class="h-full transition-all duration-300 bg-tertiary-500"
																style="width: {Math.min((proposal.vote_count / 20) * 100, 100)}%"
															/>
														</div>
														<p class="text-sm text-tertiary-300">
															{proposal.vote_count} votes
														</p>
													</div>
												{:else if proposal.state === 'decision'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{proposal.vote_count}
														</p>
														<p class="text-sm text-tertiary-300">total votes</p>
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
														<div class="text-right">
															<p class="text-sm font-medium text-tertiary-100">
																{proposal.author?.name || 'Not assigned'}
															</p>
															<p class="text-xs text-tertiary-300">Creator</p>
														</div>
														<div class="flex-shrink-0">
															<Avatar
																me={{
																	data: { seed: proposal.author?.name || proposal.author },
																	design: { highlight: false },
																	size: 'sm'
																}}
																class="rounded-full"
															/>
														</div>
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

												<!-- Pain Point -->
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														Pain Point
													</h4>
													<p class="text-sm text-right text-tertiary-300">
														{proposal.pain || 'Not defined yet'}
													</p>
												</div>

												<!-- Expected Benefits -->
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														Expected Benefits
													</h4>
													<p class="text-sm text-right text-tertiary-300">
														{proposal.benefits || 'Not defined yet'}
													</p>
												</div>
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
										class="flex items-center justify-between w-40 p-4 border-b shrink-0 md:w-40 md:p-6 md:border-b-0 md:border-r border-surface-700/50"
									>
										{#if proposal.state === 'idea' || proposal.state === 'draft'}
											<div class="flex items-center justify-center w-full gap-4">
												<div class="flex items-center gap-4">
													<div class="relative text-center">
														<div class="flex items-center justify-center">
															<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																{proposal.vote_count || 0}
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
													<div class="flex flex-col gap-2">
														<button
															disabled={!$userQuery.data ||
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
																!getVotersForProposal(proposal.id).find(
																	(v) => v.id === $userQuery.data?.id
																)?.votes}
															on:click|stopPropagation={() => handleVote(proposal.id, false)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13H5v-2h14v2z" />
															</svg>
														</button>
													</div>
												</div>
											</div>
										{:else}
											<div class="w-full text-center">
												<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
													{proposal.vote_count || 0}
												</p>
												<p class="text-sm text-tertiary-300">votes</p>
												<p class="text-xs text-tertiary-400">
													{proposal.token_count || 0} tokens
												</p>
											</div>
										{/if}
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
									{#if !expandedProposalId}
										<div
											class="w-[280px] shrink-0 p-4 md:p-6 {getStateBgColor(
												proposal.state
											)} relative"
										>
											<div class="absolute top-0 right-0">
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
												{#if proposal.state === 'idea'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{Math.round((proposal.vote_count / 10) * 100)}%
														</p>
														<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
															<div
																class="h-full transition-all duration-300 bg-tertiary-500"
																style="width: {Math.min((proposal.vote_count / 10) * 100, 100)}%"
															/>
														</div>
														<p class="text-sm text-tertiary-300">
															{proposal.vote_count} votes
														</p>
													</div>
												{:else if proposal.state === 'draft'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{Math.round((proposal.vote_count / 20) * 100)}%
														</p>
														<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
															<div
																class="h-full transition-all duration-300 bg-tertiary-500"
																style="width: {Math.min((proposal.vote_count / 20) * 100, 100)}%"
															/>
														</div>
														<p class="text-sm text-tertiary-300">
															{proposal.vote_count} votes
														</p>
													</div>
												{:else if proposal.state === 'decision'}
													<div class="flex flex-col items-end gap-1">
														<p class="text-2xl font-bold text-tertiary-100">
															{proposal.vote_count}
														</p>
														<p class="text-sm text-tertiary-300">total votes</p>
													</div>
												{/if}
											</div>
										</div>
									{:else}
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
														<div class="text-right">
															<p class="text-sm font-medium text-tertiary-100">
																{proposal.author?.name || 'Not assigned'}
															</p>
															<p class="text-xs text-tertiary-300">Creator</p>
														</div>
														<div class="flex-shrink-0">
															<Avatar
																me={{
																	data: { seed: proposal.author?.name || proposal.author },
																	design: { highlight: false },
																	size: 'sm'
																}}
																class="rounded-full"
															/>
														</div>
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

												<!-- Pain Point -->
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														Pain Point
													</h4>
													<p class="text-sm text-right text-tertiary-300">
														{proposal.pain || 'Not defined yet'}
													</p>
												</div>

												<!-- Expected Benefits -->
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														Expected Benefits
													</h4>
													<p class="text-sm text-right text-tertiary-300">
														{proposal.benefits || 'Not defined yet'}
													</p>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</main>

	<!-- Right Aside -->
	<aside
		class="fixed top-0 bottom-0 right-0 overflow-y-auto border-l w-80 border-surface-700/50 bg-surface-800/50 {getStateBgColor(
			'idea'
		)}"
	>
		<RightAsideProposals onProposalSelect={handleProposalSelect} voteThreshold={10} />
	</aside>
</div>

<style>
	:global(.proposal-card) {
		@apply overflow-hidden rounded-xl bg-surface-900/50 border border-surface-700/50;
	}
</style>
