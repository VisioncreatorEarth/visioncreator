<!--
HOW THIS SYSTEM WORKS:

1. Overview:
   This is a community-driven proposal and voting system where members can:
   - Submit and vote on ideas (initial stage)
   - Track proposal progress
   - Manage budget allocations

2. State Management:
   All state is managed in the proposalStore.ts file, including:
   - Proposals data and their states (currently only showing 'idea' state)
   - User voting and token management
   - Budget calculations and pool metrics
   - Dashboard metrics

Note: Currently only showing 'idea' state while keeping all state definitions for future use.
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import {
		proposals,
		currentUser,
		activeTab,
		setActiveTab,
		type ProposalState,
		type Proposal,
		type WorkPackage,
		workPackages,
		addWorkPackage,
		removeWorkPackage,
		calculateTotalBudget,
		vote,
		resetProposal,
		getStateColor,
		getStateIcon,
		getStateLabel,
		getTabLabel,
		getStateBgColor,
		getNextVoteCost,
		MIN_TOTAL_VOTES_FOR_PROPOSAL,
		DRAFT_VOTE_THRESHOLD,
		checkProposalStateTransitions,
		PROPOSAL_TABS
	} from '$lib/stores/proposalStore';
	import Messages from './Messages.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Avatar from './Avatar.svelte';
	import { marked } from 'marked';
	import LeftAsideProposals from './LeftAsideProposals.svelte';
	import RightAsideProposals from './RightAsideProposals.svelte';

	let expandedProposalId: string | null = null;
	let detailTab: 'details' | 'chat' | 'budget' = 'details';

	// Add new state for form visibility
	let isWorkPackageFormVisible = false;

	// Handle URL parameters for proposal selection
	$: if ($page.url.searchParams.get('id')) {
		const proposalId = $page.url.searchParams.get('id');
		if (proposalId) {
			const proposal = $proposals.find((p) => p.id === proposalId);
			if (proposal) {
				// First set the active tab
				setActiveTab(proposal.state);
				// Then wait for the tab change to complete before expanding
				setTimeout(() => {
					expandedProposalId = proposalId;
					// Center the proposal after the DOM updates
					requestAnimationFrame(() => {
						centerProposalInView(proposalId);
					});
				}, 0);
			}
		}
	}

	// Make tab classes reactive to activeTab changes
	$: getTabClasses = (state: ProposalState) => {
		const baseClasses = 'px-4 py-2 text-sm font-medium transition-colors rounded-lg';
		const stateColor = getStateColor(state);
		const isActive = $activeTab === state;
		const bgColor = isActive ? getStateBgColor(state) : 'hover:bg-surface-700/20';
		return `${baseClasses} ${stateColor} ${bgColor}`;
	};

	// Update filtered and sorted proposals to use activeTab
	$: filteredAndSortedProposals = $proposals
		.filter((p) => p.state === $activeTab)
		.sort((a, b) => b.votes - a.votes);

	// Reset expanded view when tab changes
	$: if ($activeTab) {
		expandedProposalId = null;
	}

	// Fixed vote threshold (10 votes)
	const MINIMUM_VOTES_REQUIRED = 10;
	$: voteThreshold = MINIMUM_VOTES_REQUIRED;

	// Watch for state transitions with fixed vote threshold
	$: {
		const updatedProposals = checkProposalStateTransitions(
			$proposals,
			MIN_TOTAL_VOTES_FOR_PROPOSAL
		);
		if (JSON.stringify(updatedProposals) !== JSON.stringify($proposals)) {
			$proposals = updatedProposals;
		}
	}

	// Add new reactive statement for work packages
	$: proposalWorkPackages = $workPackages.filter((wp) => wp.proposalId === expandedProposalId);

	// Add new form state
	let newWorkPackage = {
		title: '',
		deliverables: '',
		budget: 0,
		assignee: $currentUser.name
	};

	// Add function to toggle form visibility
	function toggleWorkPackageForm() {
		isWorkPackageFormVisible = !isWorkPackageFormVisible;
		if (!isWorkPackageFormVisible) {
			// Reset form when hiding
			newWorkPackage = {
				title: '',
				deliverables: '',
				budget: 0,
				assignee: $currentUser.name
			};
		}
	}

	function handleAddWorkPackage() {
		if (expandedProposalId) {
			addWorkPackage({
				...newWorkPackage,
				proposalId: expandedProposalId
			});
			// Reset form and hide it
			newWorkPackage = {
				title: '',
				deliverables: '',
				budget: 0,
				assignee: $currentUser.name
			};
			isWorkPackageFormVisible = false;
		}
	}

	// Helper function to center proposal in view
	function centerProposalInView(proposalId: string) {
		const element = document.getElementById(`proposal-${proposalId}`);
		const tabsHeight = document.getElementById('proposal-tabs')?.offsetHeight || 0;
		if (element) {
			const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
			const windowHeight = window.innerHeight;
			const elementHeight = element.offsetHeight;
			const targetScroll = elementTop - tabsHeight - (windowHeight - elementHeight) / 2;
			window.scrollTo({
				top: targetScroll,
				behavior: 'smooth'
			});
		}
	}

	// Watch for any changes that might affect proposal position
	$: {
		if (expandedProposalId) {
			requestAnimationFrame(() => {
				centerProposalInView(expandedProposalId as string);
			});
		}
	}

	function toggleProposal(id: string) {
		expandedProposalId = expandedProposalId === id ? null : id;
		if (expandedProposalId) {
			requestAnimationFrame(() => {
				centerProposalInView(expandedProposalId as string);
			});
		}
	}

	function getProposalCardClasses(proposal: Proposal): string {
		const baseClasses = 'overflow-hidden transition-all duration-200 border card rounded-xl';
		return `${baseClasses} border-surface-700/50 ${getStateBgColor(proposal.state)} bg-opacity-5`;
	}

	function getProposalValueClasses(proposal: Proposal): string {
		return `w-[280px] shrink-0 p-6 flex flex-col ${getStateBgColor(proposal.state)}`;
	}

	function getStateTextClasses(proposal: Proposal): string {
		return `flex items-center gap-2 ${getStateColor(proposal.state)}`;
	}

	// Add mock contributors data (we'll use this for demonstration)
	const mockContributors = [
		{ data: { seed: 'user1' }, design: { highlight: false }, size: 'xs' as const },
		{ data: { seed: 'user2' }, design: { highlight: true }, size: 'xs' as const },
		{ data: { seed: 'user3' }, design: { highlight: false }, size: 'xs' as const },
		{ data: { seed: 'user4' }, design: { highlight: true }, size: 'xs' as const }
	];

	// Function to get random number of contributors for each proposal
	function getRandomContributors() {
		const numContributors = Math.floor(Math.random() * 3) + 2; // 2-4 contributors
		return Array(numContributors)
			.fill(null)
			.map((_, i) => ({
				data: { seed: `contributor${i}` },
				design: { highlight: false },
				size: '2xs' as const
			}));
	}

	// Handle proposal selection
	function handleProposalSelect(state: ProposalState, proposalId: string) {
		setActiveTab(state);
		setTimeout(() => {
			expandedProposalId = proposalId;
			requestAnimationFrame(() => {
				centerProposalInView(proposalId);
			});
		}, 0);
	}
</script>

<div class="relative flex flex-col w-full h-full overflow-hidden">
	<!-- Left Aside -->
	<LeftAsideProposals
		selectedState={$activeTab}
		onStateSelect={setActiveTab}
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
						<button
							class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {$activeTab ===
							'idea'
								? 'bg-tertiary-900/20 text-tertiary-200'
								: 'hover:bg-tertiary-900/10 text-tertiary-300'}"
							on:click={() => {
								expandedProposalId = null;
								setActiveTab('idea');
							}}
							aria-selected={$activeTab === 'idea'}
						>
							<div class="flex items-center gap-2">
								<Icon icon={getStateIcon('idea')} class="w-4 h-4" />
								{getTabLabel('idea')}
							</div>
						</button>
						<button
							class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {$activeTab ===
							'draft'
								? 'bg-blue-900/20 text-blue-200'
								: 'hover:bg-blue-900/10 text-blue-300'}"
							on:click={() => {
								expandedProposalId = null;
								setActiveTab('draft');
							}}
							aria-selected={$activeTab === 'draft'}
						>
							<div class="flex items-center gap-2">
								<Icon icon={getStateIcon('draft')} class="w-4 h-4" />
								{getTabLabel('draft')}
							</div>
						</button>
						<button
							class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {$activeTab ===
							'decision'
								? 'bg-green-900/20 text-green-200'
								: 'hover:bg-green-900/10 text-green-300'}"
							on:click={() => {
								expandedProposalId = null;
								setActiveTab('decision');
							}}
							aria-selected={$activeTab === 'decision'}
						>
							<div class="flex items-center gap-2">
								<Icon icon={getStateIcon('decision')} class="w-4 h-4" />
								{getTabLabel('decision')}
							</div>
						</button>
					</div>
				</div>

				<!-- Proposals List -->
				<div class="grid gap-6 py-6 mb-16">
					{#if expandedProposalId}
						{@const proposal = $proposals.find((p) => p.id === expandedProposalId)}
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
															class="flex items-center {$currentUser.proposalsVoted.get(proposal.id)
																? 'gap-2'
																: 'justify-center'}"
														>
															<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																{proposal.votes}
															</p>
															{#if $currentUser.proposalsVoted.get(proposal.id)}
																<p class="text-xl font-bold md:text-2xl text-tertiary-400">
																	{$currentUser.proposalsVoted.get(proposal.id)}
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
															disabled={$currentUser.tokens <
																getNextVoteCost($currentUser.proposalsVoted.get(proposal.id) || 0)}
															on:click|stopPropagation={() => vote(proposal.id, true)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
															</svg>
														</button>
														<button
															disabled={!$currentUser.proposalsVoted.get(proposal.id)}
															on:click|stopPropagation={() => vote(proposal.id, false)}
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
													{proposal.votes}
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
											{:else if proposal.state === 'draft'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.votes / DRAFT_VOTE_THRESHOLD) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																100,
																Math.round((proposal.votes / DRAFT_VOTE_THRESHOLD) * 100)
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.votes} / {DRAFT_VOTE_THRESHOLD} votes
													</p>
												</div>
											{:else if proposal.state === 'decision'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{proposal.votes}
													</p>
													<p class="text-sm text-tertiary-300">total votes</p>
												</div>
											{/if}
										</div>
									</div>
								</div>

								<!-- Expanded Content -->
								<div class="flex flex-1 overflow-hidden border-t border-surface-700/50">
									<!-- Middle: Content -->
									<div
										class="flex flex-col flex-grow overflow-hidden border-r border-surface-700/50"
									>
										<!-- Detail View Tabs - Sticky -->
										<div
											class="sticky top-0 z-20 border-b bg-surface-900/95 backdrop-blur-sm border-surface-700/50"
										>
											<div class="flex items-center justify-between p-6">
												<div class="flex gap-2">
													<button
														class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {detailTab ===
														'details'
															? 'bg-tertiary-500/20 text-tertiary-100'
															: 'hover:bg-tertiary-500/10 text-tertiary-300'}"
														on:click={() => (detailTab = 'details')}
													>
														<div class="flex items-center gap-2">
															<Icon icon="mdi:information" class="w-4 h-4" />
															Details
														</div>
													</button>
													{#if proposal.state === 'draft' || proposal.state === 'decision'}
														<button
															class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {detailTab ===
															'budget'
																? 'bg-tertiary-500/20 text-tertiary-100'
																: 'hover:bg-tertiary-500/10 text-tertiary-300'}"
															on:click={() => (detailTab = 'budget')}
														>
															<div class="flex items-center gap-2">
																<Icon icon="mdi:currency-eur" class="w-4 h-4" />
																Budget
															</div>
														</button>
													{/if}
													<button
														class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {detailTab ===
														'chat'
															? 'bg-tertiary-500/20 text-tertiary-100'
															: 'hover:bg-tertiary-500/10 text-tertiary-300'}"
														on:click={() => (detailTab = 'chat')}
													>
														<div class="flex items-center gap-2">
															<Icon icon="mdi:chat" class="w-4 h-4" />
															Chat
														</div>
													</button>
												</div>
											</div>
										</div>

										<!-- Scrollable Content Area -->
										<div class="flex-1 min-h-0 p-6 overflow-y-auto">
											<!-- Tab Content -->
											{#if detailTab === 'details'}
												<div class="flex flex-col gap-6">
													<div class="flex flex-col gap-2">
														<h3 class="text-sm font-medium text-tertiary-300">Project Overview</h3>
														<div class="pb-20 prose prose-invert max-w-none">
															{#if proposal.details}
																{@html marked(proposal.details)}
															{:else}
																<p class="text-tertiary-300">
																	No project overview available yet. Click to edit and add details.
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
																				on:click={() =>
																					removeWorkPackage(workPackage.id, proposal.id)}
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
																	<label for="title" class="text-sm text-tertiary-300">Title</label>
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
													<Messages contextId={proposal.id} contextType="proposal" height="400px" />
												</div>
											{/if}
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
														{proposal.budgetRequested || 0}€
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
						{#each filteredAndSortedProposals as proposal}
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
															class="flex items-center {$currentUser.proposalsVoted.get(proposal.id)
																? 'gap-2'
																: 'justify-center'}"
														>
															<p class="text-3xl font-bold md:text-4xl text-tertiary-100">
																{proposal.votes}
															</p>
															{#if $currentUser.proposalsVoted.get(proposal.id)}
																<p class="text-xl font-bold md:text-2xl text-tertiary-400">
																	{$currentUser.proposalsVoted.get(proposal.id)}
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
															disabled={$currentUser.tokens <
																getNextVoteCost($currentUser.proposalsVoted.get(proposal.id) || 0)}
															on:click|stopPropagation={() => vote(proposal.id, true)}
															class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
														>
															<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
																<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
															</svg>
														</button>
														<button
															disabled={!$currentUser.proposalsVoted.get(proposal.id)}
															on:click|stopPropagation={() => vote(proposal.id, false)}
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
													{proposal.votes}
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
											{:else if proposal.state === 'draft'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{Math.round((proposal.votes / DRAFT_VOTE_THRESHOLD) * 100)}%
													</p>
													<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
														<div
															class="h-full transition-all duration-300 bg-tertiary-500"
															style="width: {Math.min(
																100,
																Math.round((proposal.votes / DRAFT_VOTE_THRESHOLD) * 100)
															)}%"
														/>
													</div>
													<p class="text-sm text-tertiary-300">
														{proposal.votes} / {DRAFT_VOTE_THRESHOLD} votes
													</p>
												</div>
											{:else if proposal.state === 'decision'}
												<div class="flex flex-col items-end gap-1">
													<p class="text-2xl font-bold text-tertiary-100">
														{proposal.votes}
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
