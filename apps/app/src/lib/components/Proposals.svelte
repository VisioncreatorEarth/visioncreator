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

2. State Management:
   All state is managed in the proposalStore.ts file, including:
   - Proposals data and their states
   - User voting and token management
   - Budget calculations and pool metrics
   - Dashboard metrics
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import {
		proposals,
		currentUser,
		poolMetrics,
		proposalValues,
		dashboardMetrics,
		activeTab,
		setActiveTab,
		type ProposalState,
		type Proposal,
		vote,
		resetProposal,
		cycleProposalState,
		adjustVisionCreators,
		getStateColor,
		getStateIcon,
		getStateLabel,
		getStateBgColor,
		getNextVoteCost,
		MIN_TOTAL_VOTES_FOR_PROPOSAL,
		IDEA_VOTE_THRESHOLD_PERCENTAGE,
		checkProposalStateTransitions,
		PROPOSAL_TABS,
		rejectProposal
	} from '$lib/stores/proposalStore';
	import Messages from './Messages.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let showNewProposalModal = false;
	let expandedProposalId: string | null = null;
	let detailTab: 'chat' | 'details' | 'todos' = 'chat';

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

	// Calculate vote threshold (10%)
	$: voteThreshold = Math.ceil($poolMetrics.totalActiveVotes * IDEA_VOTE_THRESHOLD_PERCENTAGE);

	// Watch for state transitions including idea threshold
	$: {
		const updatedProposals = checkProposalStateTransitions(
			$proposals,
			voteThreshold,
			$proposalValues
		);
		if (JSON.stringify(updatedProposals) !== JSON.stringify($proposals)) {
			$proposals = updatedProposals;
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
					{#each PROPOSAL_TABS as state}
						<button
							class={getTabClasses(state)}
							on:click={() => {
								expandedProposalId = null;
								setActiveTab(state);
							}}
							aria-selected={$activeTab === state}
						>
							<div class="flex items-center gap-2">
								<Icon icon={getStateIcon(state)} class="w-4 h-4" />
								{getStateLabel(state)}
							</div>
						</button>
					{/each}
				</div>

				<!-- Proposals List -->
				<div class="grid gap-6 py-6">
					{#if expandedProposalId}
						{@const proposal = $proposals.find((p) => p.id === expandedProposalId)}
						{#if proposal}
							<div class="mb-4">
								<button
									on:click={() => {
										expandedProposalId = null;
										// Update URL to remove the id parameter
										goto(`/me?view=Proposals`, { replaceState: true });
									}}
									class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
								>
									<Icon icon="mdi:arrow-left" class="w-5 h-5" />
									Back to List
								</button>
							</div>
							<div id="proposal-{proposal.id}" class={getProposalCardClasses(proposal)}>
								<!-- Proposal Header -->
								<div class="flex items-center">
									<!-- Left side: Votes -->
									<div class="flex flex-col items-center w-40 p-6">
										{#if proposal.state === 'idea' || proposal.state === 'offer' || proposal.state === 'draft'}
											<div class="flex items-center justify-center gap-4">
												<div class="text-center">
													<div
														class="flex items-center {$currentUser.proposalsVoted.get(proposal.id)
															? 'gap-2'
															: 'justify-center'}"
													>
														<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
														{#if $currentUser.proposalsVoted.get(proposal.id)}
															<p class="text-2xl font-bold text-tertiary-400">
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
												<div class="flex flex-col gap-1">
													<button
														on:click|stopPropagation={() => vote(proposal.id, true)}
														disabled={$currentUser.tokens <
															getNextVoteCost($currentUser.proposalsVoted.get(proposal.id) || 0)}
														class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
													>
														<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
															<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
														</svg>
													</button>
													<button
														on:click|stopPropagation={() => vote(proposal.id, false)}
														disabled={($currentUser.proposalsVoted.get(proposal.id) || 0) === 0}
														class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
													>
														<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
															<path fill="currentColor" d="M19 13H5v-2h14v2z" />
														</svg>
													</button>
												</div>
											</div>
										{:else}
											<div class="text-center">
												<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
												<p class="text-sm text-tertiary-300">votes</p>
											</div>
										{/if}
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
												<p class="text-sm text-tertiary-300">responsible {proposal.author}</p>
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
											{#if proposal.state === 'offer'}
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
												<p class="text-sm text-tertiary-300">
													{proposal.state === 'draft' ? 'requested budget' : 'locked value'}
												</p>
											{/if}
										</div>
									</div>
								</div>

								<!-- Expanded Content -->
								<div class="flex border-t border-surface-700/50">
									<!-- Middle: Content -->
									<div class="flex-grow p-6 border-r border-surface-700/50">
										<!-- Detail View Tabs -->
										<div class="flex items-center justify-between mb-6">
											<div class="flex gap-2">
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
												{#if proposal.state !== 'idea'}
													<button
														class="px-4 py-2 text-sm font-medium transition-colors rounded-lg {detailTab ===
														'todos'
															? 'bg-tertiary-500/20 text-tertiary-100'
															: 'hover:bg-tertiary-500/10 text-tertiary-300'}"
														on:click={() => (detailTab = 'todos')}
													>
														<div class="flex items-center gap-2">
															<Icon icon="mdi:checkbox-marked" class="w-4 h-4" />
															Todos
														</div>
													</button>
												{/if}
											</div>
										</div>

										<!-- Tab Content -->
										{#if detailTab === 'details'}
											<div class="flex flex-col gap-6">
												<div class="flex flex-col gap-2">
													<h3 class="text-sm font-medium text-tertiary-300">Project Overview</h3>
													<p
														class="text-base leading-relaxed whitespace-pre-line text-tertiary-100"
													>
														{proposal.description}
													</p>
												</div>

												<div class="flex flex-col gap-2">
													<h3 class="text-sm font-medium text-tertiary-300">
														Expected Results & Success Metrics
													</h3>
													<p class="text-base leading-relaxed text-tertiary-100">
														{proposal.expectedResults}
													</p>
												</div>

												<div class="flex flex-col gap-2">
													<h3 class="text-sm font-medium text-tertiary-300">
														Commitment & Deliverables
													</h3>
													<p class="text-base leading-relaxed text-tertiary-100">
														{proposal.commitment}
													</p>
												</div>

												<div class="flex flex-col gap-2">
													<h3 class="text-sm font-medium text-tertiary-300">
														Timeline & Milestones
													</h3>
													<div
														class="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-800/50"
													>
														<Icon icon="mdi:calendar" class="w-5 h-5 text-tertiary-300" />
														<p class="text-base text-tertiary-100">
															Estimated delivery: {proposal.estimatedDelivery}
														</p>
													</div>
												</div>

												{#if proposal.draftDetails}
													<div class="flex flex-col gap-2">
														<h3 class="text-sm font-medium text-tertiary-300">
															Technical Implementation
														</h3>
														<p class="text-base leading-relaxed text-tertiary-100">
															{proposal.draftDetails.timeToRealization}
														</p>
													</div>

													<div class="flex flex-col gap-2">
														<h3 class="text-sm font-medium text-tertiary-300">
															Definition of Done
														</h3>
														<p class="text-base leading-relaxed text-tertiary-100">
															{proposal.draftDetails.definitionOfDone}
														</p>
													</div>

													<div class="flex flex-col gap-2">
														<h3 class="text-sm font-medium text-tertiary-300">
															Risks & Mitigation
														</h3>
														<p class="text-base leading-relaxed text-tertiary-100">
															{proposal.draftDetails.risks}
														</p>
													</div>

													{#if proposal.draftDetails.dependencies.length > 0}
														<div class="flex flex-col gap-2">
															<h3 class="text-sm font-medium text-tertiary-300">Dependencies</h3>
															<ul class="space-y-2">
																{#each proposal.draftDetails.dependencies as dependency}
																	<li class="flex items-center gap-2 text-base text-tertiary-100">
																		<Icon
																			icon="mdi:link-variant"
																			class="w-5 h-5 text-tertiary-300"
																		/>
																		{dependency}
																	</li>
																{/each}
															</ul>
														</div>
													{/if}
												{/if}
											</div>
										{:else if detailTab === 'chat'}
											<Messages contextId={proposal.id} contextType="proposal" height="400px" />
										{:else if detailTab === 'todos'}
											<div class="space-y-1">
												<div
													class="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg bg-surface-800/50 hover:bg-surface-700/50"
												>
													<input
														type="checkbox"
														class="w-5 h-5 rounded-md text-tertiary-500 bg-surface-700/50 border-surface-600"
														checked
													/>
													<span class="flex-grow text-sm line-through text-tertiary-400"
														>Set up project repository</span
													>
													<div class="flex items-center gap-3">
														<div class="flex items-center gap-2">
															<div
																class="flex items-center justify-center w-6 h-6 rounded-full bg-tertiary-500/10"
															>
																<span class="text-xs font-medium text-tertiary-300">JD</span>
															</div>
															<span class="text-xs text-tertiary-400">2d ago</span>
														</div>
														<span
															class="px-2 py-0.5 text-xs font-medium rounded-full bg-tertiary-500/10 text-tertiary-300"
															>Frontend</span
														>
													</div>
												</div>

												<div
													class="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg bg-surface-800/50 hover:bg-surface-700/50"
												>
													<input
														type="checkbox"
														class="w-5 h-5 rounded-md text-tertiary-500 bg-surface-700/50 border-surface-600"
													/>
													<span class="flex-grow text-sm text-tertiary-200"
														>Implement hero section</span
													>
													<div class="flex items-center gap-3">
														<div class="flex items-center gap-2">
															<div
																class="flex items-center justify-center w-6 h-6 rounded-full bg-tertiary-500/10"
															>
																<span class="text-xs font-medium text-tertiary-300">JS</span>
															</div>
															<span class="text-xs text-tertiary-400">5d left</span>
														</div>
														<span
															class="px-2 py-0.5 text-xs font-medium rounded-full bg-tertiary-500/10 text-tertiary-300"
															>Design</span
														>
													</div>
												</div>

												<div
													class="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg bg-surface-800/50 hover:bg-surface-700/50"
												>
													<input
														type="checkbox"
														class="w-5 h-5 rounded-md text-tertiary-500 bg-surface-700/50 border-surface-600"
													/>
													<span class="flex-grow text-sm text-tertiary-200"
														>Add responsive design</span
													>
													<div class="flex items-center gap-3">
														<div class="flex items-center gap-2">
															<div
																class="flex items-center justify-center w-6 h-6 rounded-full bg-surface-700/50"
															>
																<Icon icon="mdi:account" class="w-5 h-5 text-tertiary-400" />
															</div>
															<span class="text-xs text-tertiary-300"
																>responsible {proposal.author}</span
															>
														</div>
														<span
															class="px-2 py-0.5 text-xs font-medium rounded-full bg-tertiary-500/10 text-tertiary-300"
															>Frontend</span
														>
													</div>
												</div>
											</div>
										{/if}
									</div>

									<!-- Right side: Metrics -->
									<div class="w-[280px] shrink-0 {getStateBgColor(proposal.state)}">
										{#if proposal.state !== 'idea'}
											<div class="p-4 border-b border-surface-700/50">
												<div class="flex items-center justify-between gap-2">
													<button
														on:click|stopPropagation={() => cycleProposalState(proposal.id)}
														class="flex items-center justify-center flex-grow gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10"
													>
														<Icon icon="mdi:arrow-right-circle" class="w-5 h-5" />
														Next State
													</button>
													<button
														on:click|stopPropagation={() => rejectProposal(proposal.id)}
														class="flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-error-500/20 bg-error-500/10"
													>
														<Icon icon="mdi:close-circle" class="w-5 h-5 text-error-400" />
													</button>
												</div>
											</div>
										{/if}
										<div class="p-6 space-y-4">
											<!-- Summary Section -->
											<div>
												<h4 class="mb-1 text-xs font-medium text-right text-tertiary-200">
													Summary
												</h4>
												<p class="text-xs text-right text-tertiary-300">
													{proposal.description.length > 120
														? proposal.description.slice(0, 120) + '...'
														: proposal.description}
												</p>
											</div>

											{#if proposal.state === 'idea'}
												<div>
													<h4 class="mb-1 text-xs font-medium text-right text-tertiary-200">
														Expected Results
													</h4>
													<p class="text-xs text-right text-tertiary-300">
														{proposal.expectedResults}
													</p>
												</div>
											{:else}
												<div>
													<h4 class="mb-1 text-xs font-medium text-right text-tertiary-200">
														Expected Results
													</h4>
													<p class="text-xs text-right text-tertiary-300">
														{proposal.expectedResults}
													</p>
												</div>
												<div>
													<h4 class="mb-1 text-xs font-medium text-right text-tertiary-200">
														Commitment
													</h4>
													<p class="text-xs text-right text-tertiary-300">
														{proposal.commitment}
													</p>
												</div>
												<div>
													<h4 class="mb-1 text-xs font-medium text-right text-tertiary-200">
														Estimated Delivery
													</h4>
													<p class="text-xs text-right text-tertiary-300">
														{proposal.estimatedDelivery}
													</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/if}
					{:else}
						{#each filteredAndSortedProposals as proposal}
							<div id="proposal-{proposal.id}" class={getProposalCardClasses(proposal)}>
								<div
									class="flex items-center cursor-pointer hover:bg-surface-800/50"
									on:click={() => {
										expandedProposalId = proposal.id;
										requestAnimationFrame(() => {
											centerProposalInView(proposal.id);
										});
									}}
								>
									<!-- Left side: Votes -->
									<div class="flex flex-col items-center w-40 p-6">
										{#if proposal.state === 'idea' || proposal.state === 'offer' || proposal.state === 'draft'}
											<div class="flex items-center justify-center gap-4">
												<div class="text-center">
													<div
														class="flex items-center {$currentUser.proposalsVoted.get(proposal.id)
															? 'gap-2'
															: 'justify-center'}"
													>
														<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
														{#if $currentUser.proposalsVoted.get(proposal.id)}
															<p class="text-2xl font-bold text-tertiary-400">
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
												<div class="flex flex-col gap-1">
													<button
														on:click|stopPropagation={() => vote(proposal.id, true)}
														disabled={$currentUser.tokens <
															getNextVoteCost($currentUser.proposalsVoted.get(proposal.id) || 0)}
														class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
													>
														<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
															<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
														</svg>
													</button>
													<button
														on:click|stopPropagation={() => vote(proposal.id, false)}
														disabled={($currentUser.proposalsVoted.get(proposal.id) || 0) === 0}
														class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
													>
														<svg class="w-5 h-5 text-tertiary-300" viewBox="0 0 24 24">
															<path fill="currentColor" d="M19 13H5v-2h14v2z" />
														</svg>
													</button>
												</div>
											</div>
										{:else}
											<div class="text-center">
												<p class="text-4xl font-bold text-tertiary-100">{proposal.votes}</p>
												<p class="text-sm text-tertiary-300">votes</p>
											</div>
										{/if}
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
												<p class="text-sm text-tertiary-300">responsible {proposal.author}</p>
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
											{#if proposal.state === 'offer'}
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
												<p class="text-sm text-tertiary-300">
													{proposal.state === 'draft' ? 'requested budget' : 'locked value'}
												</p>
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
							<p class="text-xs text-tertiary-300">Tokens Available</p>
						</div>
					</div>
				</div>

				{#if $currentUser.proposalsVoted.size > 0}
					<div class="p-4 border rounded-lg border-surface-700/50">
						<h4 class="mb-4 text-sm font-semibold text-tertiary-200">My Voted Proposals</h4>
						<div class="space-y-2">
							{#each Array.from($currentUser.proposalsVoted.entries()) as [proposalId, votes]}
								{#if votes > 0}
									{@const proposal = $proposals.find((p) => p.id === proposalId)}
									{#if proposal}
										<div
											class="flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-800/50 {getStateBgColor(
												proposal.state
											)}"
											on:click={() => {
												setActiveTab(proposal.state);
												// Ensure we set expandedProposalId after the tab change
												setTimeout(() => {
													expandedProposalId = proposal.id;
													requestAnimationFrame(() => {
														centerProposalInView(proposal.id);
													});
												}, 0);
											}}
										>
											<div class="flex items-center gap-2">
												<Icon
													icon={getStateIcon(proposal.state)}
													class="w-4 h-4 {getStateColor(proposal.state)}"
												/>
												<p class="text-sm text-tertiary-300">{proposal.title}</p>
											</div>
											<span class="text-sm font-medium {getStateColor(proposal.state)}">
												{#if proposal.state === 'offer'}
													{Math.round(
														(($proposalValues.find((p) => p.id === proposal.id)?.value || 0) /
															proposal.budgetRequested) *
															100
													)}%
												{:else if proposal.state === 'idea'}
													{Math.round((proposal.votes / voteThreshold) * 100)}%
												{/if}
											</span>
										</div>
									{/if}
								{/if}
							{/each}
						</div>
					</div>
				{/if}
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
