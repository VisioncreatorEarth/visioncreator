<!--
HOW THIS COMPONENT WORKS:

This is the profile area of the proposals view that:
- Shows user profile and voting information using real user data from queryMe
- Displays voted proposals list with quadratic voting information
- Calculates total asset value using dynamic token price from queryOrgaStats
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

	interface VoterInfo {
		id: string;
		name: string | null;
		votes: number;
		tokens: number;
	}

	// Query organization stats for token price
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
	let userTokens = 0;

	// Update user tokens when data changes
	$: if ($userTokensQuery.data?.balance?.balance) {
		userTokens = $userTokensQuery.data.balance.balance;
	}

	// Get current token price from orgaStats
	$: currentTokenPrice = $orgaStatsQuery.data?.currentTokenPrice || 1.0;

	// Calculate total assets value using dynamic token price
	$: totalShares =
		Number($userTokensQuery.data?.balance?.balance || 0) +
		Number($userTokensQuery.data?.balance?.staked_balance || 0);
	$: totalAssetsValue = totalShares * currentTokenPrice;

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

<!-- Mobile Toggle Button -->
<button
	class="fixed z-50 p-2 transition-colors rounded-full shadow-xl bottom-6 left-4 bg-surface-800 hover:bg-surface-700 lg:hidden"
	on:click={toggleMenu}
>
	<Icon icon={isOpen ? 'mdi:close' : 'mdi:account'} class="w-6 h-6 text-tertiary-300" />
</button>

<!-- Overlay when menu is open on mobile/tablet -->
{#if isOpen && typeof window !== 'undefined' && window.innerWidth < 1024}
	<div
		class="fixed inset-0 z-40 bg-surface-800/50 backdrop-blur-sm"
		on:click={() => activeSidePanel.close()}
		transition:fly={{ duration: 200, opacity: 0 }}
	/>
{/if}

<!-- Aside Container -->
<div
	class="aside-panel left-0 z-50 transition-transform duration-200 border-r {isOpen
		? 'translate-x-0'
		: '-translate-x-full'} {typeof window !== 'undefined' && window.innerWidth >= 1024
		? 'lg:translate-x-0 w-[280px]'
		: 'w-[280px]'}"
>
	<div class="flex flex-col h-full overflow-hidden bg-surface-900/95 backdrop-blur-sm">
		<!-- Main Content Area -->
		<div class="flex-1 overflow-y-auto">
			<div class="p-6 space-y-6">
				<!-- User Profile -->
				<div class="flex items-center gap-4">
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
				<div class="p-4 border rounded-lg border-surface-700/50">
					<h4 class="mb-4 text-sm font-semibold text-tertiary-200">Total Assets Value</h4>
					<div class="flex flex-col gap-2">
						<div>
							<p class="text-2xl font-bold text-tertiary-100">€{totalAssetsValue.toFixed(2)}</p>
							<p class="text-xs text-tertiary-300">Total value of all shares</p>
						</div>
					</div>
				</div>

				<!-- Shares Distribution -->
				<div class="p-4 border rounded-lg border-surface-700/50">
					<h4 class="mb-4 text-sm font-semibold text-tertiary-200">My Shares</h4>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-2xl font-bold text-tertiary-100">{userTokens}</p>
							<p class="text-xs text-tertiary-300">Free to use</p>
						</div>
						<div>
							<p class="text-2xl font-bold text-tertiary-100">
								{$userTokensQuery.data?.balance?.staked_balance || 0}
							</p>
							<p class="text-xs text-tertiary-300">Locked in votes</p>
						</div>
					</div>
				</div>

				<!-- Voted Proposals -->
				{#if userVotes.size > 0}
					<div class="p-4 border rounded-lg border-surface-700/50">
						<h4 class="mb-4 text-sm font-semibold text-tertiary-200">My Voted Proposals</h4>
						<div class="space-y-2">
							{#each Array.from(userVotes.entries()) as [proposalId, voteInfo]}
								{#if voteInfo.votes > 0}
									{@const proposal = $proposals.find((p) => p.id === proposalId)}
									{#if proposal}
										<div
											class="flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer hover:bg-surface-800/50 {getStateBgColor(
												proposal.state
											)}"
											on:click={() => {
												onProposalSelect(proposal.state, proposal.id);
												if (window.innerWidth < 768) {
													activeSidePanel.close();
												}
											}}
										>
											<div class="flex items-center gap-2">
												<Icon
													icon={getStateIcon(proposal.state)}
													class="w-4 h-4 {getStateColor(proposal.state)}"
												/>
												<div class="flex flex-col">
													<p class="text-sm text-tertiary-300">{proposal.title}</p>
													<p class="text-xs text-tertiary-400">
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

		<!-- Close Button at Bottom -->
		{#if typeof window !== 'undefined' && window.innerWidth < 1024}
			<div class="p-4 border-t border-surface-700/50">
				<button
					class="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors rounded-lg hover:bg-surface-800"
					on:click={() => activeSidePanel.close()}
				>
					<Icon icon="mdi:close" class="w-5 h-5 text-tertiary-300" />
					<span class="text-sm font-medium text-tertiary-300">Close Menu</span>
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
