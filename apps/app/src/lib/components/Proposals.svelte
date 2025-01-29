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
	import { createQuery } from '$lib/wundergraph';
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
		votes_count: number;
		total_tokens_staked: number;
		budget_requested: number;
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

	// Queries with proper typing
	const proposalsQuery = createQuery({
		operationName: 'queryProposals',
		enabled: true
	});

	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

	$: userId = $userQuery.data?.id as string;
	$: userTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId },
		enabled: !!userId
	});

	// State management
	const activeTab = writable<ProposalState>('idea');
	let expandedProposalId: string | null = null;
	let detailTab: 'details' | 'chat' | 'budget' = 'details';
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
	const MIN_TOTAL_VOTES_FOR_PROPOSAL = 10;
	const DRAFT_VOTE_THRESHOLD = 20;
	const voteThreshold = MIN_TOTAL_VOTES_FOR_PROPOSAL;

	// Update user tokens when data changes
	$: if ($userTokensQuery.data?.balance?.balance) {
		userTokens = Number($userTokensQuery.data.balance.balance);
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
				return 'text-tertiary-400';
			case 'draft':
				return 'text-warning-400';
			case 'decision':
				return 'text-success-400';
			default:
				return 'text-surface-400';
		}
	}

	function getStateBgColor(state: ProposalState): string {
		switch (state) {
			case 'idea':
				return 'bg-tertiary-500/20';
			case 'draft':
				return 'bg-warning-500/20';
			case 'decision':
				return 'bg-success-500/20';
			default:
				return 'bg-surface-700/20';
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
		const count = $proposalsQuery.data?.proposals.filter((p) => p.state === state).length || 0;
		return `${getStateLabel(state)} (${count})`;
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

	// Filter proposals based on active tab
	$: filteredProposals =
		$proposalsQuery.data?.proposals.filter((p) => p.state === $activeTab) || [];

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

	function getNextVoteCost(votes: number): number {
		return Math.floor(Math.pow(votes + 1, 1.5)); // Cost increases exponentially
	}

	function centerProposalInView(proposalId: string) {
		const element = document.getElementById(`proposal-${proposalId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function getProposalCardClasses(proposal: Proposal): string {
		const baseClasses = 'overflow-hidden transition-all duration-200 border card rounded-xl';
		return `${baseClasses} border-surface-700/50 ${getStateBgColor(proposal.state)} bg-opacity-5`;
	}

	function getProposalValueClasses(proposal: Proposal): string {
		return `w-[280px] shrink-0 p-6 flex flex-col ${getStateBgColor(proposal.state)}`;
	}

	// Temporary hardcoded functions until we implement the full voting system
	function handleVote(proposalId: string, isIncrease: boolean) {
		const proposal = $proposalsQuery.data?.proposals.find((p) => p.id === proposalId);
		if (!proposal) return;

		// For now, just increment/decrement the vote count locally
		const currentVotes = userVotes.get(proposalId) || 0;
		if (isIncrease) {
			userVotes.set(proposalId, currentVotes + 1);
		} else if (currentVotes > 0) {
			userVotes.set(proposalId, currentVotes - 1);
		}
		userVotes = new Map(userVotes); // Trigger reactivity
	}

	function handleProposalSelect(state: ProposalState, proposalId: string) {
		activeTab.set(state);
		setTimeout(() => {
			expandedProposalId = proposalId;
			centerProposalInView(proposalId);
		}, 0);
	}

	// Mock contributors for now
	function getRandomContributors() {
		return [
			{ data: { seed: 'user1' }, design: { highlight: false }, size: 'xs' as const },
			{ data: { seed: 'user2' }, design: { highlight: true }, size: 'xs' as const },
			{ data: { seed: 'user3' }, design: { highlight: false }, size: 'xs' as const }
		];
	}

	// Temporary function until we implement proper reset
	function resetProposal(id: string) {
		userVotes.delete(id);
		userVotes = new Map(userVotes); // Trigger reactivity
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
</script>

<div class="relative flex flex-col w-full h-full overflow-hidden">
	<!-- Left Aside -->
	<LeftAsideProposals
		selectedState={$activeTab}
		onStateSelect={(state) => activeTab.set(state)}
		states={PROPOSAL_TABS}
	/>

	<!-- Main Content Area -->
	<main class="flex-grow h-full overflow-hidden md:ml-64 md:mr-80">
		<div class="h-full overflow-y-auto">
			<div class="max-w-5xl px-4 py-6 mx-auto">
				<!-- Tabs Bar -->
				<div
					id="proposal-tabs"
					class="sticky top-0 z-10 flex items-center justify-between w-full py-4 bg-surface-900/95 backdrop-blur-sm"
				>
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

				<!-- Proposals List -->
				<div class="grid gap-6 py-6 mb-16">
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
								<div class="sticky top-0 z-10 flex items-center bg-surface-900/95 backdrop-blur-sm">
									<!-- Left side: Votes -->
									<div
										class="flex items-center justify-between w-full p-4 border-b md:w-40 md:p-6 md:border-b-0 md:border-r border-surface-700/50"
									>
										{#if proposal.state === 'idea' || proposal.state === 'draft'}
											<div class="flex items-center justify-between w-full gap-4 md:justify-center">
												<div class="flex items-center gap-4">
													<div class="text-center">
														<div
															class="flex items-center {$userQuery.data &&
															userVotes.get(proposal.id)
																? 'gap-2'
																: 'justify-center'}"
														>
															<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																{proposal.votes_count}
															</p>
															{#if $userQuery.data && userVotes.get(proposal.id)}
																<p class="text-xl font-bold md:text-2xl text-tertiary-400">
																	{userVotes.get(proposal.id)}
																</p>
															{/if}
														</div>
														<div
															class="flex items-center justify-center gap-1 text-sm text-tertiary-300"
														>
															<span>votes</span>
														</div>
													</div>
													<div class="flex flex-col gap-2">
														<button
															disabled={$userQuery.data &&
																userTokens < getNextVoteCost(userVotes.get(proposal.id) || 0)}
															on:click|stopPropagation={() => handleVote(proposal.id, true)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
															</svg>
														</button>
														<button
															disabled={!$userQuery.data || !userVotes.get(proposal.id)}
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
													{proposal.votes_count}
												</p>
												<p class="text-sm text-tertiary-300">votes</p>
											</div>
										{/if}
									</div>

									<!-- Middle: Basic Info -->
									<div
										class="items-center flex-grow hidden gap-4 p-4 border-b md:flex md:p-6 md:border-b-0 md:border-r border-surface-700/50"
									>
										<div class="flex flex-col w-full gap-2">
											<h3 class="text-lg font-semibold md:text-xl text-tertiary-100">
												{proposal.title}
											</h3>
											<div class="flex items-center -space-x-1">
												{#each getRandomContributors() as contributor}
													<Avatar me={contributor} />
												{/each}
											</div>
										</div>
									</div>

									<!-- Right side: Value -->
									<div
										class="w-full md:w-[280px] shrink-0 p-4 md:p-6 {getStateBgColor(
											proposal.state
										)}"
									>
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
											{#if proposal.state === 'idea'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.votes_count / voteThreshold) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																100,
																Math.round((proposal.votes_count / voteThreshold) * 100)
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.votes_count} / {voteThreshold} votes
													</p>
												</div>
											{:else if proposal.state === 'draft'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.votes_count / DRAFT_VOTE_THRESHOLD) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																100,
																Math.round((proposal.votes_count / DRAFT_VOTE_THRESHOLD) * 100)
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.votes_count} / {DRAFT_VOTE_THRESHOLD} votes
													</p>
												</div>
											{:else if proposal.state === 'decision'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{proposal.votes_count}
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
									<div class="flex flex-col w-16 border-r border-surface-700/50 bg-surface-900">
										<button
											class="flex flex-col items-center justify-center w-16 h-16 transition-colors {detailTab ===
											'details'
												? 'bg-surface-700/50 text-tertiary-100'
												: 'text-tertiary-300 hover:bg-surface-800/50'}"
											on:click={() => (detailTab = 'details')}
										>
											<Icon icon="mdi:text-box-outline" class="w-6 h-6" />
											<span class="mt-1 text-[10px]">Details</span>
										</button>

										{#if proposal.state === 'draft' || proposal.state === 'decision'}
											<button
												class="flex flex-col items-center justify-center w-16 h-16 transition-colors {detailTab ===
												'budget'
													? 'bg-surface-700/50 text-tertiary-100'
													: 'text-tertiary-300 hover:bg-surface-800/50'}"
												on:click={() => (detailTab = 'budget')}
											>
												<Icon icon="mdi:currency-usd" class="w-6 h-6" />
												<span class="mt-1 text-[10px]">Budget</span>
											</button>
										{/if}

										<button
											class="flex flex-col items-center justify-center w-16 h-16 transition-colors {detailTab ===
											'chat'
												? 'bg-surface-700/50 text-tertiary-100'
												: 'text-tertiary-300 hover:bg-surface-800/50'}"
											on:click={() => (detailTab = 'chat')}
										>
											<Icon icon="mdi:chat-outline" class="w-6 h-6" />
											<span class="mt-1 text-[10px]">Chat</span>
										</button>
									</div>

									<!-- Middle: Content -->
									<div
										class="flex flex-col flex-grow overflow-hidden border-r border-surface-700/50"
									>
										<!-- Scrollable Content Area -->
										<div class="flex-1 min-h-0 overflow-y-auto">
											<!-- Tab Content -->
											<div class="p-6">
												{#if detailTab === 'details'}
													<div class="flex flex-col gap-6">
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
												{:else if detailTab === 'budget' && (proposal.state === 'draft' || proposal.state === 'decision')}
													<div class="flex flex-col gap-4">
														{#if !isWorkPackageFormVisible}
															<div class="flex items-center justify-between mb-4">
																<h3 class="text-sm font-medium text-tertiary-300">
																	Work Package Offers
																</h3>
																<button
																	on:click={toggleWorkPackageForm}
																	class="px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-tertiary-200 hover:bg-tertiary-500/10 border-tertiary-500/20 hover:text-tertiary-100 hover:border-tertiary-500/30"
																>
																	<div class="flex items-center gap-2">
																		<Icon icon="mdi:plus" class="w-4 h-4" />
																		Create Offer
																	</div>
																</button>
															</div>

															<!-- Work Packages List -->
															<div class="space-y-2">
																{#each proposalWorkPackages as workPackage (workPackage.id)}
																	<div
																		class="relative p-3 transition-all duration-200 rounded-lg bg-surface-800/50 hover:bg-surface-800 group"
																	>
																		<div class="flex items-start justify-between gap-4">
																			<div class="flex-grow">
																				<div class="flex items-center justify-between mb-2">
																					<h4 class="text-lg font-medium text-tertiary-100">
																						{workPackage.title}
																					</h4>
																					<span class="text-lg font-medium text-tertiary-100"
																						>{workPackage.budget}€</span
																					>
																				</div>
																				<p class="text-sm text-tertiary-200">
																					{workPackage.deliverables}
																				</p>
																			</div>
																			<div class="flex items-center gap-4">
																				<div class="flex items-center gap-1.5">
																					<Icon
																						icon="mdi:account"
																						class="w-4 h-4 text-tertiary-300"
																					/>
																					<span class="text-sm text-tertiary-200"
																						>{workPackage.assignee}</span
																					>
																				</div>
																				<button
																					on:click={() => removeWorkPackage(workPackage.id)}
																					class="p-1.5 text-tertiary-300 transition-all rounded-lg hover:bg-tertiary-500/10 hover:text-tertiary-100"
																				>
																					<Icon icon="mdi:delete" class="w-4 h-4" />
																				</button>
																			</div>
																		</div>
																	</div>
																{/each}
															</div>
														{:else}
															<!-- Add New Work Package Form -->
															<div class="p-4 rounded-lg bg-surface-800/80">
																<div class="flex items-center justify-between mb-4">
																	<h4 class="text-sm font-medium text-tertiary-200">
																		New Work Package Offer
																	</h4>
																	<button
																		type="button"
																		on:click={toggleWorkPackageForm}
																		class="p-2 transition-colors rounded-lg text-tertiary-300 hover:bg-tertiary-500/10 hover:text-tertiary-100"
																	>
																		<Icon icon="mdi:close" class="w-5 h-5" />
																	</button>
																</div>
																<form
																	on:submit|preventDefault={handleAddWorkPackage}
																	class="flex flex-col gap-4"
																>
																	<div class="flex flex-col gap-2">
																		<label for="title" class="text-sm text-tertiary-300"
																			>Title</label
																		>
																		<input
																			type="text"
																			id="title"
																			bind:value={newWorkPackage.title}
																			class="px-3 py-2 border rounded-lg bg-surface-900 border-surface-700 text-tertiary-200"
																			required
																		/>
																	</div>
																	<div class="flex flex-col gap-2">
																		<label for="deliverables" class="text-sm text-tertiary-300"
																			>Deliverables</label
																		>
																		<textarea
																			id="deliverables"
																			bind:value={newWorkPackage.deliverables}
																			class="px-3 py-2 border rounded-lg bg-surface-900 border-surface-700 text-tertiary-200"
																			rows="3"
																			required
																		/>
																	</div>
																	<div class="flex flex-col gap-2">
																		<label for="budget" class="text-sm text-tertiary-300"
																			>Budget (€)</label
																		>
																		<input
																			type="number"
																			id="budget"
																			bind:value={newWorkPackage.budget}
																			min="0"
																			class="px-3 py-2 border rounded-lg bg-surface-900 border-surface-700 text-tertiary-200"
																			required
																		/>
																	</div>
																	<div class="flex justify-end gap-2">
																		<button
																			type="submit"
																			class="px-4 py-2 text-sm font-medium transition-colors border rounded-lg text-tertiary-200 hover:bg-tertiary-500/10 border-tertiary-500/20 hover:text-tertiary-100 hover:border-tertiary-500/30"
																		>
																			Submit Offer
																		</button>
																	</div>
																</form>
															</div>
														{/if}
														<!-- Bottom Spacing -->
														<div class="h-24" />
													</div>
												{:else if detailTab === 'chat'}
													<div class="pb-20">
														<Messages
															contextId={proposal.id}
															contextType="proposal"
															height="400px"
														/>
													</div>
												{/if}
											</div>
										</div>
									</div>

									<!-- Right side: Metrics -->
									<div class="w-[280px] shrink-0 {getStateBgColor(proposal.state)} overflow-y-auto">
										<div class="p-6 space-y-6">
											<!-- Responsible Role - In Draft and Decision States -->
											{#if proposal.state === 'draft' || proposal.state === 'decision'}
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														Responsible Role
													</h4>
													<p class="text-xl font-bold text-right text-tertiary-100">
														{proposal.responsible || 'Not assigned'}
													</p>
												</div>

												<!-- Budget -->
												<div>
													<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
														{proposal.state === 'draft' ? 'Requested Budget' : 'Decision Budget'}
													</h4>
													<p class="text-lg font-bold text-right text-tertiary-100">
														{proposal.budget_requested || 0}€
													</p>
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

											<div class="pb-20" />
										</div>
									</div>
								</div>
							</div>
						{/if}
					{:else}
						{#each filteredProposals as proposal}
							<div id="proposal-{proposal.id}" class={getProposalCardClasses(proposal)}>
								<div
									class="flex flex-col items-start cursor-pointer md:flex-row md:items-center hover:bg-surface-800/50"
									on:click={() => {
										expandedProposalId = proposal.id;
										requestAnimationFrame(() => {
											centerProposalInView(proposal.id);
										});
									}}
								>
									<!-- Left side: Votes -->
									<div
										class="flex items-center justify-between w-full p-4 border-b md:w-40 md:p-6 md:border-b-0 md:border-r border-surface-700/50"
									>
										{#if proposal.state === 'idea' || proposal.state === 'draft'}
											<div class="flex items-center justify-between w-full gap-4 md:justify-center">
												<div class="flex items-center gap-4">
													<div class="text-center">
														<div
															class="flex items-center {$userQuery.data &&
															userVotes.get(proposal.id)
																? 'gap-2'
																: 'justify-center'}"
														>
															<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																{proposal.votes_count}
															</p>
															{#if $userQuery.data && userVotes.get(proposal.id)}
																<p class="text-xl font-bold md:text-2xl text-tertiary-400">
																	{userVotes.get(proposal.id)}
																</p>
															{/if}
														</div>
														<div
															class="flex items-center justify-center gap-1 text-sm text-tertiary-300"
														>
															<span>votes</span>
														</div>
													</div>
													<div class="flex flex-col gap-2">
														<button
															disabled={$userQuery.data &&
																userTokens < getNextVoteCost(userVotes.get(proposal.id) || 0)}
															on:click|stopPropagation={() => handleVote(proposal.id, true)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
															</svg>
														</button>
														<button
															disabled={!$userQuery.data || !userVotes.get(proposal.id)}
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
													{proposal.votes_count}
												</p>
												<p class="text-sm text-tertiary-300">votes</p>
											</div>
										{/if}
									</div>

									<!-- Middle: Basic Info -->
									<div
										class="items-center flex-grow hidden gap-4 p-4 border-b md:flex md:p-6 md:border-b-0 md:border-r border-surface-700/50"
									>
										<div class="flex flex-col w-full gap-2">
											<h3 class="text-lg font-semibold md:text-xl text-tertiary-100">
												{proposal.title}
											</h3>
											<div class="flex items-center -space-x-1">
												{#each getRandomContributors() as contributor}
													<Avatar me={contributor} />
												{/each}
											</div>
										</div>
									</div>

									<!-- Right side: Value -->
									<div
										class="w-full md:w-[280px] shrink-0 p-4 md:p-6 {getStateBgColor(
											proposal.state
										)}"
									>
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
											{#if proposal.state === 'idea'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.votes_count / voteThreshold) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																100,
																Math.round((proposal.votes_count / voteThreshold) * 100)
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.votes_count} / {voteThreshold} votes
													</p>
												</div>
											{:else if proposal.state === 'draft'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.votes_count / DRAFT_VOTE_THRESHOLD) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																100,
																Math.round((proposal.votes_count / DRAFT_VOTE_THRESHOLD) * 100)
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.votes_count} / {DRAFT_VOTE_THRESHOLD} votes
													</p>
												</div>
											{:else if proposal.state === 'decision'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{proposal.votes_count}
													</p>
													<p class="text-sm text-tertiary-300">total votes</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</main>

	<!-- Right Aside -->
	<RightAsideProposals onProposalSelect={handleProposalSelect} {voteThreshold} />
</div>

<style>
	:global(.proposal-card) {
		@apply overflow-hidden rounded-xl bg-surface-900/50 border border-surface-700/50;
	}
</style>
