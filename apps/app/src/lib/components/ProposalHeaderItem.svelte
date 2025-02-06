<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component displays the header area for a single proposal:
   - Mobile: Compact stacked layout with optimized spacing
   - Tablet/Desktop: Three-column layout (votes, content, state)
   - Maintains consistent styling across all views
   - Adapts voting controls for touch interfaces
   - Uses VCE tokens only for voting and staking

2. Props:
   - proposal: The proposal data to display
   - userData: Current user data for vote checks
   - getVotersForProposal: Function to get voters
   - canVote: Function to check if voting is allowed
   - canUnstakeVote: Function to check if unstaking is allowed
   - getVoteDisplay: Function to get vote display info
   - onVote: Callback for vote actions
   - userTokens: Current user's VCE token balance
   - getNextVoteCost: Function to calculate next vote cost
   - onDecision: Callback for admin decisions
   - isAdmin: Function to check if user is admin
   - getTimeAgo: Function to format time
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import Avatar from './Avatar.svelte';
	import type { Proposal, VoterInfo } from '$lib/types/proposals';

	// Props
	export let proposal: Proposal;
	export let userData: { id: string; name: string; onboarded: boolean } | null;
	export let getVotersForProposal: (proposalId: string) => VoterInfo[];
	export let canVote: (proposal: Proposal, currentVotes: number) => boolean;
	export let canUnstakeVote: (proposal: Proposal, voter?: VoterInfo) => boolean;
	export let getVoteDisplay: (proposal: Proposal, voter?: VoterInfo) => any;
	export let onVote: (proposalId: string, isIncrease: boolean) => void;
	export let userTokens: number;
	export let getNextVoteCost: (currentVotes: number) => number;
	export let onDecision: (proposalId: string, decision: 'veto' | 'pass') => void;
	export let isAdmin: (userId: string) => boolean;
	export let getTimeAgo: (date: string) => string;

	// State thresholds for progress bars
	const STATE_THRESHOLDS = {
		idea: 10,
		draft: 20,
		decision: 30
	};

	// Helper functions
	function getStateColor(state: Proposal['state']): string {
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

	function getStateBgColor(state: Proposal['state']): string {
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

	function getStateIcon(state: Proposal['state']): string {
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

	function getStateLabel(state: Proposal['state']): string {
		return state.charAt(0).toUpperCase() + state.slice(1);
	}

	function formatVoterForAvatar(voter: VoterInfo) {
		return {
			data: { seed: voter.name || voter.id },
			design: { highlight: voter.id === userData?.id },
			size: 'xs' as const
		};
	}
</script>

<div class="flex flex-col md:flex-row md:items-stretch">
	<!-- Left side: Votes -->
	<div class="items-center justify-between hidden w-40 p-6 border-r md:flex border-surface-700/50">
		<div class="flex items-center gap-4">
			<div class="relative text-center">
				<div class="flex items-center justify-center">
					<p class="text-4xl font-bold text-tertiary-100">
						{proposal.total_votes || 0}
					</p>
					{#if userData}
						{@const voter = getVotersForProposal(proposal.id).find((v) => v.id === userData.id)}
						{#if voter?.tokens > 0}
							<div
								class="absolute flex items-center justify-center w-6 h-6 text-xs font-medium border rounded-full shadow-lg -top-2 -right-2 bg-tertiary-500 text-surface-900 border-tertiary-400/30"
							>
								{voter.tokens}
							</div>
						{/if}
					{/if}
				</div>
				<div class="text-sm text-tertiary-400">votes</div>
			</div>
			{#if proposal.state !== 'pending' && proposal.state !== 'accepted' && proposal.state !== 'rejected'}
				<div class="flex flex-col gap-2">
					<button
						disabled={!userData ||
							!canVote(
								proposal,
								getVotersForProposal(proposal.id).find((v) => v.id === userData?.id)?.votes || 0
							) ||
							userTokens <
								getNextVoteCost(
									getVotersForProposal(proposal.id).find((v) => v.id === userData?.id)?.votes || 0
								)}
						on:click|stopPropagation={(e) => {
							e.stopPropagation();
							onVote(proposal.id, true);
						}}
						class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
					>
						<Icon icon="mdi:plus" class="w-5 h-5 text-tertiary-300" />
					</button>
					<button
						disabled={!userData ||
							!canUnstakeVote(
								proposal,
								getVotersForProposal(proposal.id).find((v) => v.id === userData?.id)
							)}
						on:click|stopPropagation={() => onVote(proposal.id, false)}
						class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/10"
					>
						<Icon icon="mdi:minus" class="w-5 h-5 text-tertiary-300" />
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Layout -->
	<div class="flex flex-col md:hidden">
		<!-- First Row: Title and Tags -->
		<div class="flex flex-col p-2 bg-surface-800/95">
			<div class="flex items-start justify-between">
				<h3 class="flex-1 mr-4 text-base font-semibold truncate text-tertiary-100">
					{proposal.title}
				</h3>
				{#if proposal.tags && proposal.tags.length > 0}
					<div class="flex gap-1 shrink-0">
						{#each proposal.tags as tag}
							<div
								class="px-1.5 py-0.5 text-[10px] font-medium rounded-lg bg-tertiary-500/10 text-tertiary-300"
							>
								{tag}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Second Row: Votes, Buttons, and Avatars -->
		<div class="flex items-center gap-4 p-2 bg-surface-800/95">
			<!-- Vote count -->
			<div class="flex items-center pl-2 relative">
				<span class="text-4xl font-bold text-tertiary-100">{proposal.total_votes || 0}</span>
				{#if userData}
					{@const voter = getVotersForProposal(proposal.id).find((v) => v.id === userData.id)}
					{#if voter?.tokens > 0}
						<div
							class="absolute flex items-center justify-center w-5 h-5 text-xs font-medium border rounded-full shadow-lg -top-2 -right-2 bg-tertiary-500 text-surface-900 border-tertiary-400/30"
						>
							{voter.tokens}
						</div>
					{/if}
				{/if}
			</div>

			{#if proposal.state !== 'pending' && proposal.state !== 'accepted' && proposal.state !== 'rejected'}
				<div class="flex gap-2">
					<button
						disabled={!userData ||
							!canVote(
								proposal,
								getVotersForProposal(proposal.id).find((v) => v.id === userData?.id)?.votes || 0
							) ||
							userTokens <
								getNextVoteCost(
									getVotersForProposal(proposal.id).find((v) => v.id === userData?.id)?.votes || 0
								)}
						on:click|stopPropagation={(e) => {
							e.stopPropagation();
							onVote(proposal.id, true);
						}}
						class="flex items-center justify-center w-10 h-10 transition-colors border rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/20 border-tertiary-500/30"
					>
						<Icon icon="mdi:plus" class="w-7 h-7 text-tertiary-200" />
					</button>
					<button
						disabled={!userData ||
							!canUnstakeVote(
								proposal,
								getVotersForProposal(proposal.id).find((v) => v.id === userData?.id)
							)}
						on:click|stopPropagation={() => onVote(proposal.id, false)}
						class="flex items-center justify-center w-10 h-10 transition-colors border rounded-full hover:bg-tertiary-500/20 disabled:opacity-50 disabled:cursor-not-allowed bg-tertiary-500/20 border-tertiary-500/30"
					>
						<Icon icon="mdi:minus" class="w-7 h-7 text-tertiary-200" />
					</button>
				</div>
			{/if}

			<div class="flex items-center gap-1.5 overflow-x-auto">
				{#each getVotersForProposal(proposal.id) as voter (voter.id)}
					<div class="relative flex-shrink-0">
						<Avatar me={formatVoterForAvatar(voter)} />
					</div>
				{/each}
			</div>
		</div>

		<!-- Mobile: Progress/Decision Info -->
		<div class="p-2 border-t border-surface-700/50 {getStateBgColor(proposal.state)}">
			{#if proposal.state === 'pending'}
				{#if userData?.id === '00000000-0000-0000-0000-000000000001'}
					<div class="flex gap-2">
						<button
							on:click|stopPropagation={() => onDecision(proposal.id, 'veto')}
							class="flex-1 px-2 py-1 text-xs font-medium transition-colors rounded-lg text-error-300 hover:bg-error-500/20 bg-error-500/10"
						>
							<div class="flex items-center justify-center gap-1">
								<Icon icon="heroicons:x-mark" class="w-3.5 h-3.5" />
								Veto
							</div>
						</button>
						<button
							on:click|stopPropagation={() => onDecision(proposal.id, 'pass')}
							class="flex-1 px-2 py-1 text-xs font-medium transition-colors rounded-lg text-success-300 hover:bg-success-500/20 bg-success-500/10"
						>
							<div class="flex items-center justify-center gap-1">
								<Icon icon="heroicons:check" class="w-3.5 h-3.5" />
								Pass
							</div>
						</button>
					</div>
				{:else}
					<div class="flex items-center justify-center gap-2 py-1">
						<Icon icon="heroicons:shield-check" class="w-4 h-4 text-primary-300" />
						<span class="text-sm font-medium text-primary-300">Awaiting Guardians Review</span>
					</div>
				{/if}
			{:else if proposal.state === 'accepted' || proposal.state === 'rejected'}
				<div class="flex items-center justify-between">
					<p class="text-xs text-tertiary-400">Decision</p>
					<p class="text-xs font-medium text-tertiary-200">
						{getTimeAgo(proposal.decided_at || '')}
					</p>
				</div>
			{:else if proposal.state === 'idea' || proposal.state === 'draft'}
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-1 shrink-0">
						<Icon
							icon={getStateIcon(proposal.state)}
							class="w-3.5 h-3.5 {getStateColor(proposal.state)}"
						/>
						<span class="text-xs font-medium {getStateColor(proposal.state)}"
							>{getStateLabel(proposal.state)}</span
						>
					</div>
					<div class="flex items-center justify-between flex-grow gap-2">
						<div class="flex-grow">
							<div class="w-full h-1 overflow-hidden rounded-full bg-surface-700/50">
								<div
									class="h-full transition-all duration-300 bg-tertiary-500"
									style="width: {Math.min(
										(proposal.total_votes /
											(proposal.state === 'idea'
												? STATE_THRESHOLDS.idea
												: STATE_THRESHOLDS.draft)) *
											100,
										100
									)}%"
								/>
							</div>
						</div>
						<p class="text-xs font-medium whitespace-nowrap text-tertiary-200">
							{proposal.total_votes} of {proposal.state === 'idea'
								? STATE_THRESHOLDS.idea
								: STATE_THRESHOLDS.draft}
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Middle: Basic Info (Desktop) -->
	<div class="flex-grow hidden min-w-0 p-6 border-r md:flex border-surface-700/50">
		<div class="flex flex-col min-h-[80px] w-full overflow-hidden">
			<h3 class="mb-4 text-2xl font-semibold truncate text-tertiary-100">
				{proposal.title}
			</h3>
			<div class="flex items-center gap-3">
				{#each getVotersForProposal(proposal.id) as voter (voter.id)}
					<div class="relative">
						<Avatar me={formatVoterForAvatar(voter)} />
						<div
							class="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] font-medium bg-tertiary-500 text-surface-900 rounded-full border border-tertiary-400/30 shadow-sm"
						>
							{voter.votes}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Right side: State (Desktop) -->
	<div class="hidden md:block w-[280px] shrink-0 p-6 {getStateBgColor(proposal.state)} relative">
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
			<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-bl-lg bg-surface-900/20">
				<Icon icon={getStateIcon(proposal.state)} class="w-4 h-4 {getStateColor(proposal.state)}" />
				<span class="text-sm font-medium {getStateColor(proposal.state)}"
					>{getStateLabel(proposal.state)}</span
				>
			</div>
		</div>

		<div class="mt-8 text-right">
			{#if proposal.state === 'pending'}
				{#if userData?.id === '00000000-0000-0000-0000-000000000001'}
					<div class="flex justify-end gap-2">
						<button
							on:click|stopPropagation={() => onDecision(proposal.id, 'veto')}
							class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-error-300 hover:bg-error-500/20 bg-error-500/10"
						>
							<div class="flex items-center gap-2">
								<Icon icon="heroicons:x-mark" class="w-5 h-5" />
								Veto
							</div>
						</button>
						<button
							on:click|stopPropagation={() => onDecision(proposal.id, 'pass')}
							class="px-4 py-2 text-sm font-medium transition-colors rounded-lg text-success-300 hover:bg-success-500/20 bg-success-500/10"
						>
							<div class="flex items-center gap-2">
								<Icon icon="heroicons:check" class="w-5 h-5" />
								Pass
							</div>
						</button>
					</div>
				{:else}
					<div class="flex flex-col items-end gap-2">
						<div class="flex items-center gap-2">
							<Icon icon="heroicons:shield-check" class="w-5 h-5 text-primary-300" />
							<span class="text-sm font-medium text-primary-300">Awaiting Guardians Review</span>
						</div>
						<p class="text-xs text-tertiary-300">Compliance check in progress</p>
					</div>
				{/if}
			{:else if proposal.state === 'accepted' || proposal.state === 'rejected'}
				<div class="flex flex-col items-end gap-1">
					<p class="text-2xl font-bold text-tertiary-100">
						{getTimeAgo(proposal.decided_at || '')}
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
							style="width: {Math.min((proposal.total_votes / STATE_THRESHOLDS.idea) * 100, 100)}%"
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
							style="width: {Math.min((proposal.total_votes / STATE_THRESHOLDS.draft) * 100, 100)}%"
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

<style>
	/* ... existing styles ... */
</style>
