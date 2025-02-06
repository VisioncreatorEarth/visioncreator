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
	import type { Proposal, ProposalState, VoterInfo, User } from '$lib/types/proposals';
	import {
		getStateBgColor,
		getStateActiveBgColor,
		getStateHoverBgColor
	} from '$lib/utils/proposalStateColors';

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

	// Local state
	let detailTab: 'details' | 'metadata' | 'chat' = 'details';
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

	// Helper function to get nav button classes
	function getNavButtonClasses(tabName: typeof detailTab): string {
		const isActive = detailTab === tabName;
		return `flex flex-col items-center justify-center w-16 h-16 transition-colors ${
			isActive
				? `text-tertiary-100 ${getStateActiveBgColor(proposal.state)}`
				: `text-tertiary-300 ${getStateHoverBgColor(proposal.state)}`
		}`;
	}

	// Helper function to get metadata section classes
	function getMetadataSectionClasses(isDesktop = false): string {
		return 'mb-6'; // Simplified to just margin bottom
	}
</script>

<svelte:window on:resize={updateViewport} />

<div class="flex flex-col h-[calc(100vh-16rem)] overflow-hidden bg-surface-900">
	<!-- Header -->
	<div
		class="overflow-hidden transition-all duration-200 border card rounded-xl border-surface-700/50 bg-surface-900"
	>
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

	<!-- Content Area -->
	<div class="flex flex-1 mt-4 overflow-hidden border card rounded-xl border-surface-700/50">
		<!-- Left Navigation -->
		<div class="flex flex-col w-16 border-r border-surface-700/50 bg-surface-800">
			<button class={getNavButtonClasses('details')} on:click={() => (detailTab = 'details')}>
				<Icon icon="mdi:text-box-outline" class="w-6 h-6" />
				<span class="mt-1 text-[10px]">Details</span>
			</button>

			{#if isMobileView}
				<button class={getNavButtonClasses('metadata')} on:click={() => (detailTab = 'metadata')}>
					<Icon icon="mdi:information-outline" class="w-6 h-6" />
					<span class="mt-1 text-[10px]">Info</span>
				</button>
			{/if}

			<button class={getNavButtonClasses('chat')} on:click={() => (detailTab = 'chat')}>
				<Icon icon="mdi:chat-outline" class="w-6 h-6" />
				<span class="mt-1 text-[10px]">Chat</span>
			</button>
		</div>

		<!-- Main Content -->
		<div
			class="flex-1 overflow-hidden {!isMobileView
				? 'border-r border-surface-700/50'
				: ''} bg-surface-800"
		>
			<div class="h-full overflow-y-auto">
				{#if detailTab === 'details'}
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
				{:else if detailTab === 'chat'}
					<div class="h-full">
						<Messages contextId={proposal.id} contextType="proposal" className="h-full" />
					</div>
				{:else if detailTab === 'metadata' && isMobileView}
					<div class="h-full overflow-y-auto p-6 space-y-6 bg-surface-900">
						<!-- Mobile Metadata Content -->
						<div>
							<h4 class="mb-2 text-sm font-medium text-tertiary-200">Author</h4>
							<div class="flex items-center gap-3">
								<Avatar
									me={{
										data: { seed: authorProfile?.name || proposal.author || '' },
										design: { highlight: false },
										size: 'sm'
									}}
								/>
								<p class="text-sm font-medium text-tertiary-100">
									{authorProfile?.name || 'Not assigned'}
								</p>
							</div>
						</div>

						{#if proposal.responsible}
							<div>
								<h4 class="mb-2 text-sm font-medium text-tertiary-200">Responsible</h4>
								<div class="flex items-center gap-3">
									<Avatar
										me={{
											data: { seed: proposal.responsible },
											design: { highlight: false },
											size: 'sm'
										}}
									/>
									<div>
										<p class="text-sm font-medium text-tertiary-100">{proposal.responsible}</p>
										<p class="text-xs text-tertiary-300">Lead</p>
									</div>
								</div>
							</div>
						{/if}

						{#if proposal.state !== 'idea'}
							<div>
								<h4 class="mb-2 text-sm font-medium text-tertiary-200">Pain Point</h4>
								<p class="text-sm text-tertiary-300">
									{proposal.metadata?.pain || 'Not defined yet'}
								</p>
							</div>

							<div>
								<h4 class="mb-2 text-sm font-medium text-tertiary-200">Expected Benefits</h4>
								<p class="text-sm text-tertiary-300">
									{proposal.metadata?.benefits || 'Not defined yet'}
								</p>
							</div>

							{#each Object.entries(proposal.metadata || {}) as [key, value]}
								{#if !['pain', 'benefits'].includes(key) && value !== null && value !== undefined}
									<div>
										<h4 class="mb-2 text-sm font-medium text-tertiary-200">
											{key.charAt(0).toUpperCase() + key.slice(1)}
										</h4>
										<p class="text-sm text-tertiary-300">{value}</p>
									</div>
								{/if}
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Metadata (Desktop Only) -->
		{#if !isMobileView}
			<div class="w-[280px] shrink-0 h-full overflow-y-auto {getStateBgColor(proposal.state)}">
				<div class="p-6 space-y-6">
					<!-- Desktop Metadata Content -->
					<div class={getMetadataSectionClasses(true)}>
						<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">Author</h4>
						<div class="flex items-center justify-end gap-3">
							<p class="text-sm font-medium text-tertiary-100">
								{authorProfile?.name || 'Not assigned'}
							</p>
							<Avatar
								me={{
									data: { seed: authorProfile?.name || proposal.author || '' },
									design: { highlight: false },
									size: 'sm'
								}}
							/>
						</div>
					</div>

					{#if proposal.responsible}
						<div class={getMetadataSectionClasses(true)}>
							<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">Responsible</h4>
							<div class="flex items-center justify-end gap-3">
								<div class="text-right">
									<p class="text-sm font-medium text-tertiary-100">{proposal.responsible}</p>
									<p class="text-xs text-tertiary-300">Lead</p>
								</div>
								<Avatar
									me={{
										data: { seed: proposal.responsible },
										design: { highlight: false },
										size: 'sm'
									}}
								/>
							</div>
						</div>
					{/if}

					{#if proposal.state !== 'idea'}
						<div class={getMetadataSectionClasses(true)}>
							<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">Pain Point</h4>
							<p class="text-sm text-right text-tertiary-300">
								{proposal.metadata?.pain || 'Not defined yet'}
							</p>
						</div>

						<div class={getMetadataSectionClasses(true)}>
							<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
								Expected Benefits
							</h4>
							<p class="text-sm text-right text-tertiary-300">
								{proposal.metadata?.benefits || 'Not defined yet'}
							</p>
						</div>

						{#each Object.entries(proposal.metadata || {}) as [key, value]}
							{#if !['pain', 'benefits'].includes(key) && value !== null && value !== undefined}
								<div class={getMetadataSectionClasses(true)}>
									<h4 class="mb-2 text-sm font-medium text-right text-tertiary-200">
										{key.charAt(0).toUpperCase() + key.slice(1)}
									</h4>
									<p class="text-sm text-right text-tertiary-300">{value}</p>
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.proposal-detail-view) {
		@apply h-[calc(100vh-16rem)] overflow-hidden bg-surface-900;
	}
</style>
