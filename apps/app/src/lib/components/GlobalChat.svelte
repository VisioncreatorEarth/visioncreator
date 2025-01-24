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
	import {
		getStateIcon,
		getStateLabel,
		getStateColor,
		getStateBgColor,
		type ProposalState,
		type Proposal
	} from '$lib/stores/proposalStore';
	import { proposals, currentUser } from '$lib/stores/proposalStore';
	import { messageStore, type Message } from '$lib/stores/messageStore';
	import { activityStore, type Activity } from '$lib/stores/activityStore';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	export let show = false;
	export let onClose: () => void;

	const PROPOSAL_STATES: ProposalState[] = [
		'idea',
		'draft',
		'offer',
		'pending',
		'in_progress',
		'review',
		'completed',
		'rejected'
	];

	const GLOBAL_CHANNELS: Array<{ id: ChannelType; label: string; icon: string }> = [
		{ id: 'general', label: 'General', icon: 'mdi:chat' },
		{ id: 'announcements', label: 'Announcements', icon: 'mdi:bullhorn' },
		{ id: 'activity', label: 'Activity', icon: 'mdi:timeline-clock' },
		{ id: 'help', label: 'Help & Support', icon: 'mdi:help-circle' }
	];

	type ChannelType = ProposalState | 'general' | 'announcements' | 'help' | 'activity';

	interface DefaultThread {
		id: string;
		title: string;
		author: string;
		state: ChannelType;
		description: string;
		isPinned: boolean;
	}

	// Default threads for all channels
	const DEFAULT_THREADS: Record<ChannelType, DefaultThread> = {
		activity: {
			id: 'activity-thread',
			title: 'Activity Stream',
			author: 'System',
			state: 'activity',
			description: 'Track all proposal updates and system activities.',
			isPinned: true
		},
		general: {
			id: 'general-thread',
			title: 'General Discussion',
			author: 'Visioncreator',
			state: 'general',
			description: 'General community discussions and updates.',
			isPinned: true
		},
		announcements: {
			id: 'announcements-thread',
			title: 'Important Announcements',
			author: 'Visioncreator',
			state: 'announcements',
			description: 'Official announcements and important updates.',
			isPinned: true
		},
		help: {
			id: 'help-thread',
			title: 'Help & Support',
			author: 'Visioncreator',
			state: 'help',
			description: 'Get help and support from the community.',
			isPinned: true
		},
		idea: {
			id: 'idea-thread',
			title: 'Ideas Discussion',
			author: 'Visioncreator',
			state: 'idea',
			description: 'Discuss new ideas and proposals.',
			isPinned: true
		},
		draft: {
			id: 'draft-thread',
			title: 'Draft Proposals',
			author: 'Visioncreator',
			state: 'draft',
			description: 'Discuss and refine draft proposals.',
			isPinned: true
		},
		offer: {
			id: 'offer-thread',
			title: 'Active Offers',
			author: 'Visioncreator',
			state: 'offer',
			description: 'Discuss current offers and voting.',
			isPinned: true
		},
		pending: {
			id: 'pending-thread',
			title: 'Pending Approvals',
			author: 'Visioncreator',
			state: 'pending',
			description: 'Discuss proposals pending approval.',
			isPinned: true
		},
		in_progress: {
			id: 'in_progress-thread',
			title: 'In Progress Updates',
			author: 'Visioncreator',
			state: 'in_progress',
			description: 'Updates on ongoing projects.',
			isPinned: true
		},
		review: {
			id: 'review-thread',
			title: 'Review Discussion',
			author: 'Visioncreator',
			state: 'review',
			description: 'Discuss proposals under review.',
			isPinned: true
		},
		completed: {
			id: 'completed-thread',
			title: 'Completed Projects',
			author: 'Visioncreator',
			state: 'completed',
			description: 'Discuss completed projects and lessons learned.',
			isPinned: true
		},
		rejected: {
			id: 'rejected-thread',
			title: 'Rejected Proposals',
			author: 'Visioncreator',
			state: 'rejected',
			description: 'Discuss rejected proposals and improvements.',
			isPinned: true
		}
	};

	let selectedChannel: ChannelType = 'general';
	let selectedThread: DefaultThread | Proposal | null = DEFAULT_THREADS.general;
	let messageInput = '';
	let messages: Message[] = [];
	let messageContainer: HTMLDivElement;
	let isScrolledToBottom = true;
	let unsubscribe: () => void;

	// Helper functions for channel type checking
	function isProposalState(channel: ChannelType): channel is ProposalState {
		return PROPOSAL_STATES.includes(channel as ProposalState);
	}

	function getChannelIcon(channel: ChannelType): string {
		const globalChannel = GLOBAL_CHANNELS.find((c) => c.id === channel);
		return globalChannel ? globalChannel.icon : getStateIcon(channel as ProposalState);
	}

	function getChannelLabel(channel: ChannelType): string {
		const globalChannel = GLOBAL_CHANNELS.find((c) => c.id === channel);
		return globalChannel ? globalChannel.label : getStateLabel(channel as ProposalState);
	}

	function getThreadType(channel: ChannelType): 'proposal' | 'global' {
		return isProposalState(channel) ? 'proposal' : 'global';
	}

	// Update header based on channel type
	$: channelHeader = getChannelLabel(selectedChannel);

	// Update threads view based on channel type
	$: showThreadsList = true; // Always show threads list since we have default threads

	// Update channel proposals with pinned threads
	$: channelProposals = [
		DEFAULT_THREADS[selectedChannel], // Add default thread first
		...(isProposalState(selectedChannel)
			? $proposals.filter((p) => p.state === selectedChannel)
			: []) // Add regular proposals only for proposal channels
	];

	function handleClose() {
		onClose();
	}

	function selectChannel(channel: ChannelType) {
		selectedChannel = channel;
		// Select the default thread for the channel
		selectedThread = DEFAULT_THREADS[channel];
		// Initialize thread based on channel type
		initializeThread(DEFAULT_THREADS[channel].id, getThreadType(channel));
	}

	function selectThread(threadId: string) {
		const defaultThread = DEFAULT_THREADS[selectedChannel];
		if (threadId === defaultThread.id) {
			selectedThread = defaultThread;
		} else {
			selectedThread = $proposals.find((p) => p.id === threadId) || null;
		}

		if (selectedThread) {
			initializeThread(selectedThread.id, getThreadType(selectedChannel));
		}
	}

	function initializeThread(threadId: string, type: 'proposal' | 'global') {
		messageStore.createThread(threadId, type);
		const threadMessages = messageStore.getThreadMessages(threadId);
		if (unsubscribe) unsubscribe();
		unsubscribe = threadMessages.subscribe((value) => {
			messages = value;
			if (isScrolledToBottom) {
				scrollToBottom();
			}
		});
		messageStore.markAsRead(threadId, $currentUser.id);
	}

	// Initialize with general channel and its default thread
	onMount(() => {
		selectChannel('general');
	});

	function sendMessage() {
		if (!selectedThread || !messageInput.trim()) return;

		messageStore.sendMessage({
			contextId: selectedThread.id,
			contextType: 'proposal',
			content: messageInput.trim(),
			sender: {
				id: $currentUser.id,
				name: $currentUser.name
			}
		});
		messageInput = '';
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

	function goToProposal(proposalId: string) {
		onClose();
		goto(`/me?view=Proposals&id=${proposalId}`);
	}

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	$: isProposalChannel = !GLOBAL_CHANNELS.find((c) => c.id === selectedChannel);

	$: selectedProposal = selectedThread;
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
							<!-- Global Channels -->
							<div class="mb-4">
								<div class="px-2 py-1 text-xs font-semibold uppercase text-tertiary-400">
									Global Channels
								</div>
								{#each GLOBAL_CHANNELS as channel}
									<button
										class="flex items-center w-full gap-2 px-2 py-1.5 rounded-lg text-sm {selectedChannel ===
										channel.id
											? 'bg-tertiary-500/20 text-tertiary-100'
											: 'hover:bg-surface-700/50 text-tertiary-300'}"
										on:click={() => selectChannel(channel.id)}
									>
										<Icon icon={channel.icon} class="w-4 h-4" />
										<span># {channel.label.toLowerCase()}</span>
									</button>
								{/each}
							</div>

							<!-- Proposal Channels -->
							<div class="mb-4">
								<div class="px-2 py-1 text-xs font-semibold uppercase text-tertiary-400">
									Proposal Channels
								</div>
								{#each PROPOSAL_STATES as state}
									<button
										class="flex items-center w-full gap-2 px-2 py-1.5 rounded-lg text-sm {selectedChannel ===
										state
											? getStateBgColor(state) + ' ' + getStateColor(state)
											: 'hover:bg-surface-700/50 ' + getStateColor(state)}"
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
								<Icon icon={getChannelIcon(selectedChannel)} class="w-5 h-5 text-tertiary-300" />
								<h3 class="text-lg font-semibold text-tertiary-100">
									{channelHeader}
								</h3>
							</div>
						</div>

						<!-- Threads List or Global Chat -->
						{#if showThreadsList}
							<div class="p-2">
								{#each channelProposals as proposal}
									<div
										class="flex items-center w-full gap-2 p-3 text-left transition-colors rounded-lg {selectedThread &&
										selectedThread.id === proposal.id
											? 'bg-surface-700/20'
											: 'hover:bg-surface-700/50'}"
									>
										<button
											class="flex flex-col flex-grow gap-1"
											on:click={() => selectThread(proposal.id)}
										>
											{#if proposal?.isPinned}
												<div class="flex items-center gap-1 text-xs text-tertiary-400">
													<Icon icon="mdi:pin" class="w-3 h-3" />
													<span>Pinned Thread</span>
												</div>
											{/if}
											<div class="text-sm font-medium text-tertiary-100">{proposal.title}</div>
											<div class="text-xs text-tertiary-300">responsible {proposal.author}</div>
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<div class="p-4">
								<div class="text-sm text-center text-tertiary-400">
									Welcome to {getChannelLabel(selectedChannel)}
								</div>
							</div>
						{/if}
					</div>

					<!-- Main Chat Area -->
					<div class="flex flex-col flex-grow bg-surface-800/30">
						<!-- Channel Header -->
						<div
							class="flex items-center justify-between h-16 px-4 border-b border-surface-700/50 bg-surface-800/50"
						>
							{#if selectedProposal}
								<div class="flex flex-col">
									<h3 class="text-lg font-semibold text-tertiary-100">
										{selectedProposal.title}
									</h3>
									<p class="text-sm text-tertiary-300">responsible {selectedProposal.author}</p>
								</div>
								<button
									on:click={() => goToProposal(selectedThread?.id || '')}
									class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg {selectedThread
										? `${getStateColor(selectedThread.state)} ${getStateBgColor(
												selectedThread.state
										  )}`
										: ''}"
								>
									<span>Open Proposal</span>
									<Icon icon="mdi:arrow-top-right" class="w-4 h-4" />
								</button>
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
							{#if selectedChannel === 'activity'}
								{#if $activityStore.length === 0}
									<div class="text-sm text-center text-tertiary-400">No activities yet</div>
								{:else}
									{#each $activityStore as activity}
										<div class="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-700/20">
											<div
												class="flex items-center justify-center w-8 h-8 rounded-full bg-tertiary-500/10"
											>
												<Icon icon="mdi:timeline-clock" class="w-5 h-5 text-tertiary-300" />
											</div>
											<div class="flex-grow">
												<p class="text-sm text-tertiary-200">
													{activityStore.formatActivity(activity)}
												</p>
												<p class="text-xs text-tertiary-400">
													{new Date(activity.timestamp).toLocaleString()}
												</p>
											</div>
											{#if activity.proposalId}
												<button
													class="px-2 py-1 text-xs font-medium transition-colors rounded-lg hover:bg-tertiary-500/20 bg-tertiary-500/10 text-tertiary-300"
													on:click={() => {
														onClose();
														goto(`/me?view=Proposals&id=${activity.proposalId}`);
													}}
												>
													View Proposal
												</button>
											{/if}
										</div>
									{/each}
								{/if}
							{:else if selectedProposal}
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
										on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
										placeholder="Message this thread..."
										class="flex-grow px-4 py-2 text-sm rounded-lg bg-surface-700/30 text-tertiary-100 placeholder:text-tertiary-400 focus:ring-2 focus:ring-tertiary-500/50 focus:outline-none"
									/>
									<button
										on:click={sendMessage}
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
