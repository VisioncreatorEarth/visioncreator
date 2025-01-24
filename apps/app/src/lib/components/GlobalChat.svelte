<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This is a Discord/Slack-like global chat system that:
   - Shows chat rooms based on proposal states
   - Displays proposal threads within each channel
   - Provides a familiar messaging interface
   - Supports dark/light mode
   - Handles modal display and animations

2. Props:
   - show: Boolean to control modal visibility
   - onClose: Function to handle modal closing

3. Features:
   - Three-column layout (Channels > Threads > Chat)
   - Channel list by proposal states
   - Thread list showing proposals
   - Message input with emoji support
   - User presence indicators
-->

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { getStateIcon, getStateLabel, type ProposalState } from '$lib/stores/proposalStore';
	import { proposals } from '$lib/stores/proposalStore';

	export let show = false;
	export let onClose: () => void;

	const PROPOSAL_STATES: ProposalState[] = [
		'idea',
		'offer',
		'pending',
		'in_progress',
		'review',
		'completed',
		'rejected'
	];

	let selectedChannel: ProposalState = 'idea';
	let selectedThread: string | null = null;
	let messageInput = '';

	function handleClose() {
		onClose();
	}

	function selectChannel(channel: ProposalState) {
		selectedChannel = channel;
		selectedThread = null;
	}

	function selectThread(threadId: string) {
		selectedThread = threadId;
	}

	$: channelProposals = $proposals.filter((p) => p.state === selectedChannel);
	$: selectedProposal = selectedThread ? $proposals.find((p) => p.id === selectedThread) : null;
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/95 backdrop-blur-sm"
		transition:fade
		on:click={handleClose}
	>
		<!-- Modal Container -->
		<div class="relative w-[95%] flex flex-col" on:click|stopPropagation>
			<!-- Main Modal -->
			<div class="w-full h-[90vh] bg-surface-700 rounded-t-xl overflow-hidden" transition:scale>
				<!-- Main Content Container -->
				<div class="flex h-full overflow-hidden">
					<!-- Channels Sidebar -->
					<div class="w-56 border-r border-surface-600/50 bg-surface-800/50">
						<!-- Header -->
						<div class="p-4 border-b border-surface-700/50">
							<h2 class="text-lg font-semibold text-tertiary-100">Visioncreator Chat</h2>
							<p class="text-sm text-tertiary-300">Community Channels</p>
						</div>

						<!-- Channel List -->
						<div class="p-2">
							<div class="mb-4">
								<div class="px-2 py-1 text-xs font-semibold text-tertiary-400 uppercase">
									Proposal Channels
								</div>
								{#each PROPOSAL_STATES as state}
									<button
										class="flex items-center w-full gap-2 px-2 py-1.5 rounded-lg text-sm {selectedChannel ===
										state
											? 'bg-tertiary-500/20 text-tertiary-100'
											: 'hover:bg-surface-700/50 text-tertiary-300'}"
										on:click={() => selectChannel(state)}
									>
										<Icon icon={getStateIcon(state)} class="w-4 h-4" />
										<span># {getStateLabel(state).toLowerCase()}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Threads List -->
					<div class="w-72 border-r border-surface-600/50 bg-surface-800/50">
						<!-- Header -->
						<div class="flex items-center h-16 px-4 border-b border-surface-700/50">
							<div class="flex items-center gap-2">
								<Icon icon={getStateIcon(selectedChannel)} class="w-5 h-5 text-tertiary-300" />
								<h3 class="text-lg font-semibold text-tertiary-100">
									{getStateLabel(selectedChannel)}
								</h3>
							</div>
						</div>

						<!-- Threads List -->
						<div class="p-2">
							{#each channelProposals as proposal}
								<button
									class="flex flex-col w-full gap-1 p-3 text-left transition-colors rounded-lg {selectedThread ===
									proposal.id
										? 'bg-tertiary-500/20'
										: 'hover:bg-surface-700/50'}"
									on:click={() => selectThread(proposal.id)}
								>
									<div class="text-sm font-medium text-tertiary-100">{proposal.title}</div>
									<div class="text-xs text-tertiary-300">by {proposal.author}</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Main Chat Area -->
					<div class="flex flex-col flex-grow bg-surface-800/30">
						<!-- Channel Header -->
						<div
							class="flex items-center h-16 px-4 border-b border-surface-700/50 bg-surface-800/50"
						>
							{#if selectedProposal}
								<div class="flex flex-col">
									<h3 class="text-lg font-semibold text-tertiary-100">
										{selectedProposal.title}
									</h3>
									<p class="text-sm text-tertiary-300">by {selectedProposal.author}</p>
								</div>
							{:else}
								<div class="text-sm text-tertiary-400">Select a thread to start chatting</div>
							{/if}
						</div>

						<!-- Messages Area -->
						<div class="flex-grow p-4 overflow-y-auto">
							{#if selectedProposal}
								<div class="text-sm text-tertiary-400 text-center">
									Welcome to the discussion about "{selectedProposal.title}"
								</div>
							{:else}
								<div class="flex flex-col items-center justify-center h-full text-tertiary-400">
									<Icon icon="mdi:chat-outline" class="w-12 h-12 mb-2 opacity-50" />
									<p class="text-sm">Select a thread to view the conversation</p>
								</div>
							{/if}
						</div>

						<!-- Message Input -->
						{#if selectedProposal}
							<div class="p-4 border-t border-surface-700/50">
								<div class="flex items-center gap-2">
									<input
										type="text"
										bind:value={messageInput}
										placeholder="Message this thread..."
										class="flex-grow px-4 py-2 text-sm rounded-lg bg-surface-700/30 text-tertiary-100 placeholder:text-tertiary-400 focus:ring-2 focus:ring-tertiary-500/50 focus:outline-none"
									/>
									<button
										disabled={!messageInput.trim()}
										class="px-4 py-2 font-medium rounded-lg bg-tertiary-500 text-tertiary-50 hover:bg-tertiary-600 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Send
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Close Button Extension (Now relative to modal container) -->
			<div
				class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full flex items-center justify-center w-16 h-8 bg-surface-700 rounded-b-full"
			>
				<button
					on:click={handleClose}
					class="flex items-center justify-center w-full h-full hover:bg-surface-600/50 text-tertiary-300"
				>
					<Icon icon="mdi:close" class="w-5 h-5" />
				</button>
			</div>
		</div>
	</div>
{/if}
