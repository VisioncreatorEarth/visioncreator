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
	import { createQuery } from '$lib/wundergraph';
	import type { QueryObserverResult } from '@tanstack/svelte-query';
	import type { Readable } from 'svelte/store';
	import { onDestroy } from 'svelte';
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

	// Props
	export let proposal: Proposal;
	export let onClose: () => void;
	export let onVote: (proposalId: string, isIncrease: boolean) => void;
	export let onDecision: (proposalId: string, decision: 'veto' | 'pass') => void;
	export let userQuery: Readable<QueryObserverResult<User | undefined>>;
	export let getVotersForProposal: (proposalId: string) => VoterInfo[];
	export let canVote: (proposal: Proposal, currentVotes: number) => boolean;
	export let canUnstakeVote: (proposal: Proposal, voter?: VoterInfo) => boolean;
	export let getVoteDisplay: (proposal: Proposal, voter?: VoterInfo) => any;
	export let isAdmin: (userId: string) => boolean;
	export let getTimeAgo: (date: string) => string;
	export let userTokens: number;
	export let getNextVoteCost: (currentVotes: number) => number;

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

<!-- Modal-like overlay -->
<div
	class="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-surface-900/50 backdrop-blur-sm"
	on:click|self={onClose}
	transition:fade={{ duration: 200 }}
>
	<!-- Modal Container -->
	<div class="relative w-[95%] flex flex-col" on:click|stopPropagation>
		<!-- Main Content Container -->
		<div
			class="w-full h-[90vh] max-w-6xl mx-auto overflow-hidden rounded-t-xl bg-surface-800/95 border border-surface-700/50"
		>
			<!-- Content -->
			<div class="flex flex-col h-full overflow-hidden">
				<!-- Header -->
				<div class="border-b border-surface-700/50 bg-surface-800/95">
					<ProposalHeaderItem
						{proposal}
						{userData}
						{getVotersForProposal}
						{canVote}
						{canUnstakeVote}
						{getVoteDisplay}
						{onVote}
						{userTokens}
						{getNextVoteCost}
						{onDecision}
						{isAdmin}
						{getTimeAgo}
					/>
				</div>

				<!-- Main Area -->
				<div class="flex flex-1 min-h-0 bg-surface-800/95">
					<!-- Left Navigation (Fixed) -->
					<div class="flex flex-col w-16 shrink-0 bg-surface-800/50 border-r border-surface-700/50">
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

					<!-- Content Area -->
					<div class="flex flex-1 min-h-0">
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

						<!-- Right Metadata (Desktop Only) -->
						{#if !isMobileView}
							<div
								class="w-[280px] shrink-0 overflow-y-auto border-l border-surface-700/50 {getStateBgColor(
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
			</div>
		</div>

		<!-- Close Button Extension -->
		<div
			class="absolute bottom-0 flex items-center justify-center w-16 h-8 -translate-x-1/2 translate-y-full rounded-b-full left-1/2 bg-surface-800/95"
		>
			<button
				on:click={onClose}
				class="flex items-center justify-center w-full h-full hover:bg-surface-600/50 text-tertiary-300"
			>
				<Icon icon="mdi:close" class="w-5 h-5" />
			</button>
		</div>
	</div>
</div>

<style>
	:global(.proposal-detail-view) {
		@apply h-[calc(100vh-16rem)] overflow-hidden bg-surface-900;
	}
</style>
