<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This is a Discord/Slack-like global chat system that:
   - Shows chat rooms based on proposal states
   - Displays proposal threads within each channel
   - Provides a familiar messaging interface
   - Supports dark/light mode
   - Handles modal display and animations
   - Uses messageStore for real-time chat functionality

2. Props:
   - show: Boolean to control modal visibility
   - onClose: Function to handle modal closing

3. Features:
   - Three-column layout (Channels > Threads > Chat)
   - Channel list by proposal states
   - Thread list showing proposals
   - Real-time message updates
   - Message persistence
-->

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { getStateIcon, getStateLabel, type ProposalState } from '$lib/stores/proposalStore';
	import { proposals, currentUser } from '$lib/stores/proposalStore';
	import { messageStore, type Message } from '$lib/stores/messageStore';
	import { onMount, onDestroy } from 'svelte';

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
	let messages: Message[] = [];
	let messageContainer: HTMLDivElement;
	let isScrolledToBottom = true;
	let unsubscribe: () => void;

	function handleClose() {
		onClose();
	}

	function selectChannel(channel: ProposalState) {
		selectedChannel = channel;
		selectedThread = null;
		messages = [];
	}

	function selectThread(threadId: string) {
		selectedThread = threadId;
		if (threadId) {
			// Initialize thread if needed and subscribe to messages
			messageStore.createThread(threadId, 'proposal');
			const threadMessages = messageStore.getThreadMessages(threadId);
			if (unsubscribe) unsubscribe();
			unsubscribe = threadMessages.subscribe((value) => {
				messages = value;
				if (isScrolledToBottom) {
					scrollToBottom();
				}
			});
			// Mark messages as read
			messageStore.markAsRead(threadId, $currentUser.id);
		}
	}

	function handleSubmit() {
		if (!messageInput.trim() || !selectedThread) return;

		messageStore.sendMessage({
			contextId: selectedThread,
			contextType: 'proposal',
			content: messageInput.trim(),
			sender: {
				id: $currentUser.id,
				name: $currentUser.name
			}
		});

		messageInput = '';
		isScrolledToBottom = true;
	}

	function scrollToBottom() {
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	function handleScroll() {
		if (messageContainer) {
			const { scrollTop, scrollHeight, clientHeight } = messageContainer;
			isScrolledToBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
		}
	}

	// Format timestamp
	function formatTime(date: Date): string {
		return new Intl.DateTimeFormat('en', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(date);
	}

	// Check if message is from current user
	function isOwnMessage(message: Message): boolean {
		return message.sender.id === $currentUser.id;
	}

	// Group messages by sender and time (within 5 minutes)
	function shouldGroupWithPrevious(message: Message, index: number): boolean {
		if (index === 0) return false;
		const prevMessage = messages[index - 1];
		return (
			prevMessage.sender.id === message.sender.id &&
			message.timestamp.getTime() - prevMessage.timestamp.getTime() < 5 * 60 * 1000
		);
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

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
								<div class="px-2 py-1 text-xs font-semibold uppercase text-tertiary-400">
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
					<div class="border-r w-72 border-surface-600/50 bg-surface-800/50">
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
						<div
							bind:this={messageContainer}
							on:scroll={handleScroll}
							class="flex-grow p-4 space-y-2 overflow-y-auto"
						>
							{#if selectedProposal}
								{#if messages.length === 0}
									<div class="text-sm text-center text-tertiary-400">
										Start the discussion about "{selectedProposal.title}"
									</div>
								{:else}
									{#each messages as message, i}
										{@const grouped = shouldGroupWithPrevious(message, i)}
										{@const own = isOwnMessage(message)}

										<div class="flex gap-2 {own ? 'flex-row-reverse' : ''}">
											{#if !grouped}
												<div class="flex-shrink-0 w-6 h-6 rounded-full bg-surface-700/50">
													<Icon icon="mdi:account" class="w-6 h-6 p-1 text-tertiary-300" />
												</div>
											{:else}
												<div class="w-6" />
											{/if}

											<div class="flex-grow {own ? 'items-end' : ''} max-w-[80%]">
												{#if !grouped}
													<div
														class="flex items-center gap-2 mb-0.5 {own ? 'flex-row-reverse' : ''}"
													>
														<span class="text-xs font-medium text-tertiary-200">
															{message.sender.name}
														</span>
													</div>
												{/if}

												<div class="flex flex-col {own ? 'items-end' : ''}">
													<div
														class="relative px-3 py-1 text-sm rounded-lg {own
															? 'bg-blue-900/20 text-blue-300'
															: 'bg-surface-600/80 text-tertiary-50'} {grouped ? 'mt-0.5' : 'mt-0'}"
													>
														<p>
															{message.content}
														</p>
														<span
															class="block text-[9px] opacity-50 {own
																? 'text-right mr-[1px] text-blue-300'
																: 'text-left ml-[1px] text-tertiary-200'} -mb-0.5 mt-[1px]"
														>
															{formatTime(message.timestamp)}
														</span>
													</div>
												</div>
											</div>
										</div>
									{/each}
								{/if}
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
										on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
										placeholder="Message this thread..."
										class="flex-grow px-4 py-2 text-sm rounded-lg bg-surface-700/30 text-tertiary-100 placeholder:text-tertiary-400 focus:ring-2 focus:ring-tertiary-500/50 focus:outline-none"
									/>
									<button
										on:click={handleSubmit}
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
				class="absolute bottom-0 flex items-center justify-center w-16 h-8 -translate-x-1/2 translate-y-full rounded-b-full left-1/2 bg-surface-700"
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
