<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the detailed view of a single proposal, including:
   - Basic proposal information display
   - Navigation between details, metadata, and chat sections
   - Responsive layout that adapts to mobile and desktop views
   - Vote management and proposal state transitions

2. Layout Structure:
   - Desktop: Three-column layout (nav, content, metadata)
   - Mobile: Single column with metadata integrated into navigation
   - Responsive breakpoints handle layout transitions

3. State Management:
   - Receives proposal data and user context as props
   - Manages local state for active tab and mobile view
   - Handles voting and proposal updates through parent events

4. Color Utilities:
   - Uses centralized color utilities from proposalStateColors.ts
   - Supports both light and dark mode through Skeleton UI Theme syntax
   - Background colors adapt based on proposal state
   - Interactive elements (buttons, tabs) use state-specific hover and active colors
-->

<script lang="ts">
	import Icon from '@iconify/svelte';
	import { marked } from 'marked';
	import Messages from './Messages.svelte';
	import Avatar from './Avatar.svelte';
	import VideoPlayer from './VideoPlayer.svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import type { QueryObserverResult } from '@tanstack/svelte-query';
	import type { Readable } from 'svelte/store';
	import { onDestroy, onMount } from 'svelte';
	import ProposalHeaderItem from './ProposalHeaderItem.svelte';
	import type { Proposal, VoterInfo, User } from '$lib/types/proposals';
	import {
		getStateBgColor,
		getStateIcon,
		getStateLabel,
		getStateColor
	} from '$lib/utils/proposalStateColors';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';

	// Only require these props
	export let proposalId: string;
	export let onClose: () => void;

	// Create queries for proposal data
	const proposalQuery = createQuery({
		operationName: 'queryProposals',
		enabled: true,
		refetchInterval: 1000
	});

	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

	// Reactive declarations for proposal data
	$: proposal = $proposalQuery.data?.proposals.find((p) => p.id === proposalId);
	$: userId = $userQuery.data?.id;
	$: userTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId: userId || '' },
		enabled: !!userId,
		refetchInterval: 500
	});

	// Create the mutation store at the top level with other stores
	const updateVotesMutation = createMutation({
		operationName: 'updateVotes'
	});

	const handleDecisionMutation = createMutation({
		operationName: 'handleProposalDecision'
	});

	// Helper functions that aren't imported
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

	// Update handleVote function to exactly match Proposals.svelte
	async function handleVote(proposalId: string, isIncrease: boolean) {
		if (!userId) return;

		try {
			const result = await $updateVotesMutation.mutateAsync({
				proposalId,
				userId,
				action: isIncrease ? 'stake' : 'unstake',
				amount: 1
			});

			if (result?.success) {
				await Promise.all([
					proposalQuery.refetch?.(),
					userTokensQuery.refetch?.(),
					votersQuery.refetch?.()
				]);
			}
		} catch (error) {
			console.error('Failed to update vote:', error);
		}
	}

	// Keep the helper functions as they are used by ProposalHeaderItem
	function getNextVoteCost(currentVotes: number): number {
		return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
	}

	function getQuadraticCost(voteNumber: number): number {
		return Math.pow(voteNumber + 1, 2) - Math.pow(voteNumber, 2);
	}

	// Update handleDecision function to use the store properly
	async function handleDecision(decision: 'veto' | 'pass') {
		if (!userId || !proposal) return;

		try {
			const result = await $handleDecisionMutation.mutateAsync({
				proposalId: proposal.id,
				decision,
				adminId: userId
			});

			if (result?.success) {
				await proposalQuery.refetch?.();
				onClose();
			}
		} catch (error) {
			console.error('Failed to handle decision:', error);
		}
	}

	function canVote(proposal: Proposal, currentVotes: number): boolean {
		if (proposal.state === 'pending') return false;
		return currentVotes < 20;
	}

	function canUnstakeVote(proposal: Proposal, voter?: VoterInfo): boolean {
		if (!voter) return false;
		if (proposal.author === voter.id && voter.votes <= 1) return false;
		return voter.votes > 0;
	}

	function getVoteDisplay(proposal: Proposal, voter?: VoterInfo) {
		const currentVotes = voter?.votes || 0;
		const currentTokens = voter?.tokens_staked_vce || 0;
		const nextVoteCost = getNextVoteCost(currentVotes);
		const unstakeReturn = currentVotes > 0 ? getQuadraticCost(currentVotes - 1) : 0;

		return {
			votes: currentVotes,
			tokens: currentTokens,
			nextCost: nextVoteCost,
			unstakeReturn
		};
	}

	function isAdmin(userId: string): boolean {
		return userId === '00000000-0000-0000-0000-000000000001';
	}

	// Update the voter query and functions
	const votersQuery = createQuery({
		operationName: 'getProposalVoters',
		input: { proposalId },
		enabled: !!proposalId,
		refetchInterval: 1000
	});

	// Update getVotersForProposal to match original functionality
	function getVotersForProposal(proposalId: string): VoterInfo[] {
		return $votersQuery.data?.voters || [];
	}

	// Add error handling for the query
	$: if ($votersQuery.error) {
		console.error('Failed to fetch voters:', $votersQuery.error);
	}

	// Update the template to handle loading and error states
	$: voters = getVotersForProposal(proposalId);
	$: isLoadingVoters = $votersQuery.isLoading;
	$: hasVotersError = !!$votersQuery.error;

	// Create a store for the detail tab and make it reactive
	const activeTab = writable<'details' | 'metadata' | 'chat'>('details');

	// Local state
	let isMobileView = false;

	// Author profile query
	$: authorProfileQuery = createQuery({
		operationName: 'getProfile',
		input: { userId: proposal?.author || '' },
		enabled: !!proposal?.author
	});

	// Reactive declarations
	$: authorProfile = $authorProfileQuery.data as
		| { id: string; name: string | null; onboarded: boolean }
		| undefined;
	$: userData = $userQuery?.data
		? {
				id: $userQuery.data.id,
				name: $userQuery.data.name,
				onboarded: $userQuery.data.onboarded
		  }
		: null;

	// Handle mobile view
	function updateViewport() {
		isMobileView = window.innerWidth < 768;
	}

	// Initialize viewport check and cleanup
	if (typeof window !== 'undefined') {
		updateViewport();
		window.addEventListener('resize', updateViewport);

		onDestroy(() => {
			window.removeEventListener('resize', updateViewport);
		});
	}

	// Make the nav classes reactive with updated tertiary colors
	$: getNavClasses = (tabName: 'details' | 'metadata' | 'chat') => {
		const base =
			'flex items-center justify-center w-16 h-16 transition-colors hover:bg-surface-700/50';
		const isActive = $activeTab === tabName;
		return `${base} ${isActive ? 'text-tertiary-500 bg-tertiary-300/10' : 'text-tertiary-300'}`;
	};

	// Handle tab changes with explicit functions
	function setTab(tab: 'details' | 'metadata' | 'chat') {
		activeTab.set(tab);
	}

	// Add back the metadata section classes helper
	function getMetadataSectionClasses(isDesktop = false): string {
		const baseClasses = 'space-y-2';
		if (isDesktop) {
			return `${baseClasses} mb-6`;
		}
		return baseClasses;
	}
</script>

<!-- Root container with fixed height -->
<div class="min-h-[90vh] md:min-h-[80vh] h-full flex flex-col">
	{#if proposal}
		{#if isLoadingVoters}
			<div class="flex items-center justify-center flex-1">
				<p class="text-tertiary-300">Loading voters...</p>
			</div>
		{:else if hasVotersError}
			<div class="flex items-center justify-center flex-1">
				<p class="text-error-300">Failed to load voters</p>
			</div>
		{:else}
			<!-- Main Layout Container -->
			<div class="flex flex-col h-full">
				<!-- Fixed Header - Always visible -->
				<div
					class="sticky top-0 z-10 flex-none bg-surface-800/95 backdrop-blur-sm border-b border-surface-700/50"
				>
					<ProposalHeaderItem
						{proposal}
						{userData}
						{getVotersForProposal}
						{canVote}
						{canUnstakeVote}
						{getVoteDisplay}
						onVote={handleVote}
						userTokens={$userTokensQuery.data?.balances?.VCE?.balance || 0}
						{getNextVoteCost}
						onDecision={handleDecision}
						{isAdmin}
						{getTimeAgo}
					/>
				</div>

				<!-- Scrollable Content Container -->
				<div class="flex flex-1 min-h-0">
					<!-- Left Navigation - Fixed, No Scroll -->
					<div
						class="flex-none flex flex-col w-16 border-r bg-surface-800/50 border-surface-700/50"
					>
						<button class={getNavClasses('details')} on:click={() => setTab('details')}>
							<div class="flex flex-col items-center justify-center w-full">
								<Icon icon="mdi:text-box-outline" class="w-6 h-6" />
								<span class="mt-1 text-[10px]">Details</span>
							</div>
						</button>

						{#if isMobileView}
							<button class={getNavClasses('metadata')} on:click={() => setTab('metadata')}>
								<div class="flex flex-col items-center justify-center w-full">
									<Icon icon="mdi:information-outline" class="w-6 h-6" />
									<span class="mt-1 text-[10px]">Info</span>
								</div>
							</button>
						{/if}

						<button class={getNavClasses('chat')} on:click={() => setTab('chat')}>
							<div class="flex flex-col items-center justify-center w-full">
								<Icon icon="mdi:chat-outline" class="w-6 h-6" />
								<span class="mt-1 text-[10px]">Chat</span>
							</div>
						</button>
					</div>

					<!-- Main Content Area - Independent Scroll -->
					<div class="flex-1 overflow-y-auto">
						{#if $activeTab === 'details'}
							<div class="flex flex-col gap-6 p-6">
								{#if proposal.video_id}
									<div class="w-full overflow-hidden rounded-lg bg-surface-800">
										<VideoPlayer videoId={proposal.video_id} />
									</div>
								{/if}

								<div class="flex flex-col gap-2">
									<h3 class="text-sm font-medium text-tertiary-300">Project Overview</h3>
									<div class="prose prose-invert max-w-none">
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
						{:else if $activeTab === 'chat'}
							<div class="h-full">
								<Messages contextId={proposal.id} contextType="proposal" className="h-full" />
							</div>
						{/if}
					</div>

					<!-- Right Metadata - Independent Scroll -->
					{#if !isMobileView}
						<div
							class="flex-none w-[280px] overflow-y-auto border-l border-surface-700/50 {getStateBgColor(
								proposal.state
							)}"
						>
							<div class="p-6 space-y-6">
								<!-- Author Info -->
								<div class={getMetadataSectionClasses(true)}>
									<h4 class="text-xs font-medium tracking-wider uppercase text-tertiary-300">
										Author
									</h4>
									<div class="flex items-center gap-3 mt-2">
										<Avatar
											me={{
												data: { seed: authorProfile?.id || proposal.author },
												design: { highlight: false },
												size: 'sm'
											}}
										/>
										<div>
											<p class="text-sm font-medium text-tertiary-100">
												{authorProfile?.name || 'Anonymous'}
											</p>
											<p class="text-xs text-tertiary-300">Visioncreator</p>
										</div>
									</div>
								</div>

								<!-- Status Info -->
								<div class={getMetadataSectionClasses(true)}>
									<h4 class="text-xs font-medium tracking-wider uppercase text-tertiary-300">
										Status
									</h4>
									<div class="flex items-center gap-2 mt-2">
										<Icon
											icon={getStateIcon(proposal.state)}
											class="w-5 h-5 {getStateColor(proposal.state)}"
										/>
										<span class="text-sm font-medium {getStateColor(proposal.state)}">
											{getStateLabel(proposal.state)}
										</span>
									</div>
								</div>

								<!-- Timestamps -->
								<div class={getMetadataSectionClasses(true)}>
									<h4 class="text-xs font-medium tracking-wider uppercase text-tertiary-300">
										Timeline
									</h4>
									<div class="mt-2 space-y-2">
										<div class="flex justify-between">
											<span class="text-sm text-tertiary-300">Created</span>
											<span class="text-sm text-tertiary-100"
												>{getTimeAgo(proposal.created_at)}</span
											>
										</div>
										{#if proposal.updated_at !== proposal.created_at}
											<div class="flex justify-between">
												<span class="text-sm text-tertiary-300">Updated</span>
												<span class="text-sm text-tertiary-100"
													>{getTimeAgo(proposal.updated_at)}</span
												>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex items-center justify-center flex-1">
			<p class="text-tertiary-300">Loading proposal...</p>
		</div>
	{/if}
</div>
