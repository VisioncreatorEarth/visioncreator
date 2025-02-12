<!--
HOW THIS COMPONENT WORKS:

This is the profile area of the proposals view that:
- Shows user profile and voting information using real user data from queryMe
- Displays voted proposals list with quadratic voting information
- Calculates total asset value using dynamic VCE token price from queryOrgaStats
- Shows VCE token balances (free and locked)
- Is collapsible on mobile with a toggle button
- Uses Tailwind for responsive design
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { fly } from 'svelte/transition';
	import Avatar from './Avatar.svelte';
	import { createQuery } from '$lib/wundergraph';
	import {
		proposals,
		getStateColor,
		getStateIcon,
		getStateBgColor,
		type ProposalState,
		dashboardMetrics
	} from '$lib/stores/proposalStore';
	import { activeSidePanel } from '$lib/stores/sidePanelStore';
	import type { Operations } from 'generated-wundergraph';

	export let onProposalSelect: (state: ProposalState, proposalId: string) => void;
	export let voteThreshold: number;

	// Add proper typing for user data
	interface User {
		id: string;
		name: string;
		onboarded: boolean;
	}

	interface TokenBalances {
		VCE: {
			balance: number;
			staked_balance: number;
		};
	}

	interface VoterInfo {
		id: string;
		name: string | null;
		votes: number;
		tokens: number;
	}

	// Query organization stats for token prices
	const orgaStatsQuery = createQuery({
		operationName: 'queryOrgaStats',
		refetchInterval: 30000 // Refetch every 30 seconds
	});

	// Add user data queries with proper typing
	const userQuery = createQuery<Operations['queryMe']>({
		operationName: 'queryMe',
		enabled: true
	});

	// Add reactive statements for typed user data
	$: userData = $userQuery.data
		? {
				id: $userQuery.data.id as string,
				name: $userQuery.data.name as string,
				onboarded: $userQuery.data.onboarded as boolean
		  }
		: null;

	$: userTokensQuery = createQuery<Operations['getUserTokens']>({
		operationName: 'getUserTokens',
		input: { userId: userData?.id || '' },
		enabled: !!userData?.id
	});

	// Add new state for user votes
	let userVotes = new Map<string, VoterInfo>();
	let userTokens = {
		VCE: 0
	};

	// Update user tokens when data changes
	$: if ($userTokensQuery.data?.balances) {
		userTokens = {
			VCE: $userTokensQuery.data.balances.VCE.balance || 0
		};
	}

	// Update the token price calculation to match ProposalDashboard
	$: stats = $orgaStatsQuery.data || {
		totalActiveVCs: 0,
		totalTokens: 0,
		currentTokenPrice: 1.0
	};

	// Replace the current token price calculation
	$: currentTokenPrice = stats.currentTokenPrice;

	// Calculate total assets value using both VCE and EURe
	$: totalShares =
		Number($userTokensQuery.data?.balances.VCE.balance || 0) +
		Number($userTokensQuery.data?.balances.VCE.staked_balance || 0);

	// Update total assets calculation to use the same price
	$: totalAssetsValue =
		totalShares * stats.currentTokenPrice +
		Number($userTokensQuery.data?.balances.EURe?.balance || 0);

	function toggleMenu() {
		if ($activeSidePanel === 'left') {
			activeSidePanel.close();
		} else {
			activeSidePanel.openLeft();
		}
	}

	$: isOpen = $activeSidePanel === 'left';

	// Calculate quadratic cost for next vote
	function getNextVoteCost(currentVotes: number): number {
		return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
	}

	// Format vote information for display
	function formatVoteInfo(votes: number, tokens: number): string {
		return `${votes} votes (${tokens} tokens)`;
	}
</script>

<!-- Single Mobile Toggle Button - Smaller with profile icon -->
<button
	class="flex fixed z-50 justify-center items-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 bg-surface-800 hover:bg-surface-700 lg:hidden"
	style="bottom: calc(1.5rem + env(safe-area-inset-bottom, 1rem)); left: 1rem;"
	on:click|stopPropagation={toggleMenu}
>
	<Icon icon="mdi:account" class="w-5 h-5 text-tertiary-300" />
</button>

<!-- Overlay with proper z-index -->
{#if isOpen && typeof window !== 'undefined' && window.innerWidth < 1024}
	<div
		class="fixed inset-0 z-[90] bg-surface-900/40 backdrop-blur-sm"
		on:click|stopPropagation={() => activeSidePanel.close()}
		transition:fly={{ duration: 200, opacity: 0 }}
	/>
{/if}

<!-- Aside Container -->
<div
	class="fixed left-0 z-[95] h-[100dvh] w-[280px] transition-transform duration-200 border-r border-surface-700/50 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'} {typeof window !== 'undefined' && window.innerWidth >= 1024
		? 'lg:translate-x-0'
		: ''}"
>
	<div class="flex flex-col h-full bg-surface-900/95 backdrop-blur-sm">
		<!-- Main Content Area -->
		<div class="flex-1 overflow-y-auto">
			<div class="p-6 space-y-6">
				<!-- User Profile Header -->
				<div
					class="flex items-center gap-4 p-4 border rounded-lg border-surface-700/50 bg-surface-800/50"
				>
					{#if userData}
						<Avatar
							me={{
								data: { seed: userData.id },
								design: { highlight: false },
								size: 'md'
							}}
						/>
						<div>
							<h3 class="text-xl font-semibold text-tertiary-100">{userData.name}</h3>
							<p class="text-sm text-tertiary-300">Visioncreator</p>
						</div>
					{/if}
				</div>

				<!-- Total Assets Value -->
				<div class="p-4 border rounded-lg border-surface-700/50 bg-surface-800/50">
					<div class="flex items-center justify-between mb-2">
						<h4 class="text-xs font-medium tracking-wider uppercase text-tertiary-300">
							Total Assets Value
						</h4>
						<div class="px-2 py-0.5 rounded-full bg-success-500/10">
							<span class="text-xs font-medium text-success-400">+5.7%</span>
						</div>
					</div>
					<div>
						<p class="text-2xl font-bold text-tertiary-100">€{totalAssetsValue.toFixed(2)}</p>
					</div>
				</div>

				<!-- Token Balances Grid -->
				<div class="grid gap-3">
					<!-- VCE Tokens -->
					<div class="p-4 border rounded-lg border-surface-700/50 bg-surface-800/50">
						<h4 class="mb-2 text-xs font-medium tracking-wider uppercase text-tertiary-300">
							VCE Tokens
						</h4>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xl font-bold text-tertiary-100">{userTokens.VCE}</p>
								<p class="mt-0.5 text-xs text-tertiary-300">Available</p>
							</div>
							<div>
								<p class="text-xl font-bold text-tertiary-100">
									{$userTokensQuery.data?.balances.VCE.staked_balance || 0}
								</p>
								<p class="mt-0.5 text-xs text-tertiary-300">Voted</p>
							</div>
						</div>
					</div>

					<!-- EURe Tokens -->
					<div class="p-4 border rounded-lg border-surface-700/50 bg-surface-800/50">
						<h4 class="mb-2 text-xs font-medium tracking-wider uppercase text-tertiary-300">
							EURe Balance
						</h4>
						<div>
							<p class="text-xl font-bold text-tertiary-100">
								{$userTokensQuery.data?.balances.EURe.balance || 0}
							</p>
						</div>
					</div>
				</div>

				<!-- Voted Proposals -->
				{#if userVotes.size > 0}
					<div class="p-6 border rounded-lg border-surface-700/50 bg-surface-800/50">
						<h4 class="mb-4 text-sm font-medium tracking-wider uppercase text-tertiary-300">
							Active Votes
						</h4>
						<div class="space-y-3">
							{#each Array.from(userVotes.entries()) as [proposalId, voteInfo]}
								{#if voteInfo.votes > 0}
									{@const proposal = $proposals.find((p) => p.id === proposalId)}
									{#if proposal}
										<div
											class="flex items-center justify-between p-3 transition-colors rounded-lg cursor-pointer hover:bg-surface-700/50 {getStateBgColor(
												proposal.state
											)}"
											on:click={() => {
												onProposalSelect(proposal.state, proposal.id);
												if (window.innerWidth < 768) {
													activeSidePanel.close();
												}
											}}
										>
											<div class="flex items-center gap-3">
												<Icon
													icon={getStateIcon(proposal.state)}
													class="w-5 h-5 {getStateColor(proposal.state)}"
												/>
												<div>
													<p class="font-medium text-tertiary-200">{proposal.title}</p>
													<p class="text-sm text-tertiary-400">
														{formatVoteInfo(voteInfo.votes, voteInfo.tokens)}
													</p>
												</div>
											</div>
											<div class="text-right">
												<span class="text-sm font-medium {getStateColor(proposal.state)}">
													Next: {getNextVoteCost(voteInfo.votes)}
												</span>
											</div>
										</div>
									{/if}
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Bottom area with close button -->
		{#if typeof window !== 'undefined' && window.innerWidth < 1024}
			<div
				class="p-4 border-t border-surface-700/50"
				style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 1rem));"
			>
				<button
					class="flex items-center justify-center w-10 h-10 transition-colors rounded-full hover:bg-surface-800"
					on:click|stopPropagation={() => activeSidePanel.close()}
				>
					<Icon icon="mdi:close" class="w-5 h-5 text-tertiary-300" />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.proposal-card) {
		@apply overflow-hidden rounded-xl bg-surface-900/50 border border-surface-700/50;
	}
</style>
