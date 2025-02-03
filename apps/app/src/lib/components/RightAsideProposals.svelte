<!--
HOW THIS COMPONENT WORKS:

This is the right aside area of the proposals view that:
- Shows user profile and voting information using real user data from queryMe
- Displays voted proposals list with quadratic voting information
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
		type ProposalState
	} from '$lib/stores/proposalStore';

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

	// Add user data queries with proper typing
	const userQuery = createQuery({
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

	$: userTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId: userData?.id || '' },
		enabled: !!userData?.id
	});

	// Add new state for user votes
	let userVotes = new Map<string, VoterInfo>();
	let userTokens = 0;

	// Update user tokens when data changes
	$: if ($userTokensQuery.data?.balance) {
		userTokens = ($userTokensQuery.data.balance as { balance: number }).balance;
	}

	let isOpen = false;

	function toggleMenu() {
		isOpen = !isOpen;
	}

	// Calculate quadratic cost for next vote
	function getNextVoteCost(currentVotes: number): number {
		return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
	}

	// Format vote information for display
	function formatVoteInfo(votes: number, tokens: number): string {
		return `${votes} votes (${tokens} tokens)`;
	}
</script>

<!-- Mobile Toggle Button (Bottom Right) -->
<button
	class="fixed z-50 p-2 transition-colors rounded-full shadow-xl bottom-6 right-4 bg-surface-800 hover:bg-surface-700 md:hidden"
	on:click={toggleMenu}
>
	<Icon icon="mdi:account" class="w-6 h-6 text-tertiary-300" />
</button>

<!-- Aside Container -->
<aside
	class="fixed top-0 right-0 z-40 h-screen transition-transform md:translate-x-0 bg-surface-900 {isOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	class:w-80={isOpen}
	class:w-0={!isOpen}
	class:md:w-80={true}
>
	{#if isOpen || (typeof window !== 'undefined' && window.innerWidth >= 768)}
		<div
			class="h-full p-6 overflow-y-auto border-l border-surface-700/50"
			transition:fly={{ x: 100, duration: 200 }}
		>
			<div class="space-y-6">
				<!-- User Profile -->
				{#if userData}
					<div class="flex items-center gap-4">
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
					</div>
				{/if}

				<!-- Voting Power -->
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
													isOpen = false;
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
	{/if}
</aside>

<style>
	:global(.proposal-card) {
		@apply overflow-hidden rounded-xl bg-surface-900/50 border border-surface-700/50;
	}
</style>
