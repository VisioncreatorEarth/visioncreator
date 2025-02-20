<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the detailed view of a single proposal, including:
   - Basic proposal information display
   - Navigation between details, metadata, chat, and compose sections
   - Responsive layout that adapts to mobile and desktop views
   - Vote management and proposal state transitions
   - Header auto-hides in compose tab for better editing experience

2. Layout Structure:
   - Desktop: Three-column layout (nav, content, metadata)
   - Mobile: Single column with metadata integrated into navigation
   - Responsive breakpoints handle layout transitions
   - Compose view hides header for full-height editing

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
	import ComposeProposal from './ComposeProposal.svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
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
	$: userId = $userQuery.data?.id as string;
	$: userTokensQuery = createQuery({
		operationName: 'getUserTokens',
		input: { userId },
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

	// Create a store for the detail tab
	const activeTab = writable<'details' | 'info' | 'chat' | 'compose'>('details');

	// Update handleVote function
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
				await Promise.all([proposalQuery.refetch?.(), userTokensQuery.refetch?.()].filter(Boolean));
			}
		} catch (error) {
			console.error('Failed to update vote:', error);
		}
	}

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

	// Add back the quadratic voting helper functions
	function getNextVoteCost(currentVotes: number): number {
		// Next vote will cost: (n+1)^2 - n^2
		return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
	}

	function getQuadraticCost(voteNumber: number): number {
		// Total cost for n votes is n^2
		return Math.pow(voteNumber, 2);
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

	// Update user tokens when data changes
	$: userTokens = $userTokensQuery.data?.balances?.VCE?.balance || 0;

	// Local state
	let isMobileView = false;

	// Author profile query
	$: authorProfileQuery = createQuery({
		operationName: 'getProfile',
		input: { userId: proposal?.author || '' },
		enabled: !!proposal?.author
	});

	$: authorProfile = $authorProfileQuery.data;
	$: userData = $userQuery?.data
		? ({
				id: $userQuery.data.id,
				name: $userQuery.data.name,
				onboarded: $userQuery.data.onboarded
		  } as User)
		: null;

	// Handle mobile view
	function updateViewport() {
		isMobileView = window.innerWidth < 768;
	}

	onMount(() => {
		updateViewport();
		window.addEventListener('resize', updateViewport);
	});

	onDestroy(() => {
		window.removeEventListener('resize', updateViewport);
	});

	// Make the nav classes reactive with updated tertiary colors
	$: getNavClasses = (tabName: 'details' | 'metadata' | 'chat' | 'compose') => {
		const base =
			'flex items-center justify-center px-4 py-2 transition-colors rounded-full hover:bg-surface-700/50';
		const isActive = $activeTab === tabName;
		return `${base} ${
			isActive
				? 'text-tertiary-500 bg-tertiary-300/10'
				: 'text-tertiary-300 hover:text-tertiary-200'
		}`;
	};

	// Handle tab changes with explicit functions
	function setTab(tab: 'details' | 'info' | 'chat' | 'compose') {
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

	// Helper function to format JSON for display
	function formatJSON(json: any): string {
		return JSON.stringify(json, null, 2);
	}
</script>

{#if proposal}
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Header - hidden in compose tab -->
		{#if $activeTab !== 'compose'}
			<div
				class="sticky top-0 z-10 flex-none border-b bg-surface-800/95 backdrop-blur-sm border-surface-700/50"
			>
				<ProposalHeaderItem
					{proposal}
					{userData}
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
		{/if}

		<!-- Main Content Area -->
		<div
			class="flex flex-1 overflow-hidden {$activeTab !== 'compose'
				? 'md:grid md:grid-cols-[1fr_280px]'
				: ''}"
		>
			<!-- Main Content Area -->
			<div class="flex flex-col flex-1 overflow-hidden">
				{#if $activeTab === 'details'}
					<div class="flex-1 overflow-y-auto">
						<div class="flex flex-col gap-6 p-6 pb-[40px] md:pb-20 overflow-x-hidden">
							{#if proposal.video_id}
								<div class="w-full overflow-hidden rounded-lg bg-surface-800">
									<VideoPlayer videoId={proposal.video_id} />
								</div>
							{/if}

							<div class="flex flex-col gap-2">
								<h3 class="text-sm font-medium text-tertiary-300">Project Overview</h3>
								<div
									class="prose prose-invert max-w-none prose-p:my-0.5 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-headings:mb-1 [&_ul]:leading-tight [&_li]:leading-tight"
								>
									{#if proposal.details}
										<div class="whitespace-pre-wrap overflow-wrap-anywhere">
											{@html marked(proposal.details)}
										</div>
									{:else}
										<p class="text-tertiary-300">
											No project overview available yet. Click to edit and add details.
										</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{:else if $activeTab === 'info' && isMobileView}
					<div class="flex-1 overflow-y-auto">
						<div class="p-6 space-y-6 pb-[80px]">
							<!-- Author Info -->
							<div class="mb-6">
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

							<!-- Status & Timeline -->
							<div class="space-y-6">
								<div>
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

								<div>
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
					</div>
				{:else if $activeTab === 'chat'}
					<div class="flex flex-col flex-1 h-full">
						<Messages contextId={proposal.id} contextType="proposal" className="h-full" />
					</div>
				{:else if $activeTab === 'compose'}
					<ComposeProposal proposalId={proposal.id} />
				{/if}
			</div>

			<!-- Right Metadata - Only on Desktop and not in compose tab -->
			{#if !isMobileView && $activeTab !== 'compose'}
				<div
					class="hidden md:block overflow-y-auto border-l border-surface-700/50 {getStateBgColor(
						proposal.state
					)}"
				>
					<div class="p-6 space-y-6">
						<!-- Author Info -->
						<div class={getMetadataSectionClasses(true)}>
							<h4 class="text-xs font-medium tracking-wider uppercase text-tertiary-300">Author</h4>
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
							<h4 class="text-xs font-medium tracking-wider uppercase text-tertiary-300">Status</h4>
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
									<span class="text-sm text-tertiary-100">{getTimeAgo(proposal.created_at)}</span>
								</div>
								{#if proposal.updated_at !== proposal.created_at}
									<div class="flex justify-between">
										<span class="text-sm text-tertiary-300">Updated</span>
										<span class="text-sm text-tertiary-100">{getTimeAgo(proposal.updated_at)}</span>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Mobile Navigation -->
		<div class="fixed bottom-0 left-0 right-0 z-20 md:hidden">
			<div
				class="flex items-center justify-between w-full px-4 py-1 border-t bg-surface-600 rounded-t-3xl border-surface-700/50"
			>
				<!-- Left Side Nav Items -->
				<div class="flex items-center gap-2">
					<button
						class="flex flex-col items-center justify-center w-12 h-10 transition-colors rounded-lg {$activeTab ===
						'details'
							? 'bg-tertiary-300/10 text-tertiary-500'
							: 'text-tertiary-300 hover:bg-surface-700/50'}"
						on:click={() => setTab('details')}
					>
						<Icon icon="mdi:text-box-outline" class="w-5 h-5 mt-1" />
						<span class="-mt-1 text-[10px]">Details</span>
					</button>

					<button
						class="flex flex-col items-center justify-center w-12 h-10 transition-colors rounded-lg {$activeTab ===
						'info'
							? 'bg-tertiary-300/10 text-tertiary-500'
							: 'text-tertiary-300 hover:bg-surface-700/50'}"
						on:click={() => setTab('info')}
					>
						<Icon icon="mdi:information-outline" class="w-5 h-5 mt-1" />
						<span class="-mt-1 text-[10px]">Info</span>
					</button>

					<button
						class="flex flex-col items-center justify-center w-12 h-10 transition-colors rounded-lg {$activeTab ===
						'compose'
							? 'bg-tertiary-300/10 text-tertiary-500'
							: 'text-tertiary-300 hover:bg-surface-700/50'}"
						on:click={() => setTab('compose')}
					>
						<Icon icon="mdi:pencil-ruler" class="w-5 h-5 mt-1" />
						<span class="-mt-1 text-[10px]">Compose</span>
					</button>
				</div>

				<!-- Right Side Nav Items -->
				<div class="flex items-center gap-2">
					<button
						class="flex flex-col items-center justify-center w-12 h-10 transition-colors rounded-lg {$activeTab ===
						'chat'
							? 'bg-tertiary-300/10 text-tertiary-500'
							: 'text-tertiary-300 hover:bg-surface-700/50'}"
						on:click={() => setTab('chat')}
					>
						<Icon icon="mdi:chat-outline" class="w-5 h-5 mt-1" />
						<span class="-mt-1 text-[10px]">Chat</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Desktop Navigation -->
		<div
			class="sticky bottom-0 left-0 right-0 z-20 hidden border-t md:flex bg-surface-600/95 backdrop-blur-sm border-surface-700/50"
		>
			<div class="flex items-center justify-between w-full px-4 py-2">
				<!-- Left Side Nav Items -->
				<div class="flex items-center gap-2">
					<button class={getNavClasses('details')} on:click={() => setTab('details')}>
						<Icon icon="mdi:text-box-outline" class="w-5 h-5" />
						<span class="ml-2 text-sm">Details</span>
					</button>

					<button class={getNavClasses('chat')} on:click={() => setTab('chat')}>
						<Icon icon="mdi:chat-outline" class="w-5 h-5" />
						<span class="ml-2 text-sm">Chat</span>
					</button>

					<button class={getNavClasses('compose')} on:click={() => setTab('compose')}>
						<Icon icon="mdi:pencil-ruler" class="w-5 h-5" />
						<span class="ml-2 text-sm">Compose</span>
					</button>
				</div>

				<!-- Right Side -->
				<div class="flex items-center">
					<!-- Edit button removed -->
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center flex-1">
		<p class="text-tertiary-300">Loading proposal...</p>
	</div>
{/if}
