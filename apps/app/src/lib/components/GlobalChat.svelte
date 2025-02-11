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
	import Avatar from './Avatar.svelte';
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
		'decision',
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

	type ChannelType =
		| ProposalState
		| 'general'
		| 'announcements'
		| 'help'
		| 'activity'
		| 'dm'
		| 'active';

	interface DefaultThread {
		id: string;
		title: string;
		author: string;
		state: ChannelType;
		description: string;
		isPinned: boolean;
	}

	interface DMUser {
		id: string;
		name: string;
		initials: string;
		isOnline: boolean;
	}

	interface DMThread extends DefaultThread {
		userId: string;
	}

	const DM_USERS: DMUser[] = [
		{ id: 'jd1', name: 'John Doe', initials: 'JD', isOnline: true },
		{ id: 'js1', name: 'Jane Smith', initials: 'JS', isOnline: false }
	];

	// Add a function to get plural state label
	function getPluralStateLabel(state: ProposalState): string {
		switch (state) {
			case 'idea':
				return 'Ideas';
			case 'draft':
				return 'Drafts';
			case 'offer':
				return 'Offers';
			case 'decision':
				return 'Decisions';
			case 'in_progress':
				return 'In Progress';
			case 'review':
				return 'Reviews';
			case 'completed':
				return 'Completed';
			case 'rejected':
				return 'Rejected';
			default:
				return getStateLabel(state);
		}
	}

	// Update the channel labels to use plural forms
	const PROPOSAL_CHANNELS = PROPOSAL_STATES.map((state) => ({
		id: state,
		label: getPluralStateLabel(state),
		icon: getStateIcon(state)
	}));

	// Update the DEFAULT_THREADS titles to use plural forms
	const DEFAULT_THREADS: Record<ChannelType, DefaultThread> = {
		activity: {
			id: 'activity-thread',
			title: 'Activity Stream',
			author: 'System',
			state: 'activity',
			description: 'Track all proposal updates and system activities.',
			isPinned: true
		},
		active: {
			id: 'active-thread',
			title: 'Active Discussions',
			author: 'System',
			state: 'active',
			description: 'Currently active discussions and updates.',
			isPinned: true
		},
		general: {
			id: 'general-thread',
			title: 'General Room Discussion',
			author: 'Visioncreator',
			state: 'general',
			description: 'General community discussions and updates.',
			isPinned: true
		},
		announcements: {
			id: 'announcements-thread',
			title: 'Announcements',
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
			title: 'Drafts Discussion',
			author: 'Visioncreator',
			state: 'draft',
			description: 'Discuss and refine draft proposals.',
			isPinned: true
		},
		offer: {
			id: 'offer-thread',
			title: 'Offers Discussion',
			author: 'Visioncreator',
			state: 'offer',
			description: 'Discuss current offers and voting.',
			isPinned: true
		},
		decision: {
			id: 'decision-thread',
			title: 'Decisions Discussion',
			author: 'Visioncreator',
			state: 'decision',
			description: 'Discuss proposals awaiting decision.',
			isPinned: true
		},
		in_progress: {
			id: 'in_progress-thread',
			title: 'In Progress Discussion',
			author: 'Visioncreator',
			state: 'in_progress',
			description: 'Updates on ongoing projects.',
			isPinned: true
		},
		review: {
			id: 'review-thread',
			title: 'Reviews Discussion',
			author: 'Visioncreator',
			state: 'review',
			description: 'Discuss proposals under review.',
			isPinned: true
		},
		completed: {
			id: 'completed-thread',
			title: 'Completed Discussion',
			author: 'Visioncreator',
			state: 'completed',
			description: 'Discuss completed projects and lessons learned.',
			isPinned: true
		},
		rejected: {
			id: 'rejected-thread',
			title: 'Rejected Discussion',
			author: 'Visioncreator',
			state: 'rejected',
			description: 'Discuss rejected proposals and improvements.',
			isPinned: true
		},
		dm: {
			id: 'dm-thread',
			title: 'Direct Messages',
			author: 'System',
			state: 'dm',
			description: 'Private conversations with other users.',
			isPinned: true
		}
	};

	// Update DM_THREADS to include multiple threads per user
	const DM_THREADS: Record<string, DMThread[]> = DM_USERS.reduce(
		(acc, user) => ({
			...acc,
			[user.id]: [
				{
					id: `dm-${user.id}-general`,
					title: `General Discussion`,
					author: user.name,
					state: 'dm' as ChannelType,
					description: `General chat with ${user.name}`,
					isPinned: true,
					userId: user.id
				}
				// Additional threads can be added here per user
			]
		}),
		{}
	);

	let selectedChannel: ChannelType = 'general';
	let selectedThread: DefaultThread | Proposal | null = DEFAULT_THREADS.general;
	let messageInput = '';
	let messages: Message[] = [];
	let messageContainer: HTMLDivElement;
	let isScrolledToBottom = true;
	let unsubscribe: () => void;

	// Add selectedDMUser state
	let selectedDMUser: string | null = null;

	// Add filteredProposals computed property
	$: filteredProposals = isProposalState(selectedChannel)
		? $proposals.filter((p) => p.state === selectedChannel)
		: [];

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

	function getThreadType(channel: ChannelType): 'proposal' | 'global' | 'dm' {
		if (channel === 'dm') return 'dm';
		return isProposalState(channel) ? 'proposal' : 'global';
	}

	// Update header based on channel type
	$: channelHeader = getChannelLabel(selectedChannel);

	// Update threads view based on channel type
	$: showThreadsList = true; // Always show threads list since we have default threads

	// Update channelProposals to handle new DM structure
	$: channelProposals =
		selectedChannel === 'dm'
			? selectedDMUser
				? DM_THREADS[selectedDMUser]
				: []
			: [
					DEFAULT_THREADS[selectedChannel],
					...(isProposalState(selectedChannel)
						? $proposals.filter((p) => p.state === selectedChannel)
						: [])
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

	function selectThread(thread: DefaultThread | string) {
		if (typeof thread === 'string') {
			// Handle thread ID
			const defaultThread = DEFAULT_THREADS[selectedChannel];
			if (thread === defaultThread.id) {
				selectedThread = defaultThread;
			} else {
				selectedThread = $proposals.find((p) => p.id === thread) || null;
			}
		} else {
			// Handle thread object
			selectedThread = thread;
		}

		if (selectedThread) {
			initializeThread(selectedThread.id, getThreadType(selectedChannel));
		}
	}

	function initializeThread(threadId: string, type: 'proposal' | 'global' | 'dm') {
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

	// Update selectDMUser function
	function selectDMUser(userId: string) {
		selectedChannel = 'dm';
		selectedDMUser = userId;
		const defaultThread = DM_THREADS[userId][0];
		selectedThread = defaultThread;
		initializeThread(defaultThread.id, 'dm');
	}

	// Add function to check if channel is a DM
	function isDMChannel(channel: ChannelType): boolean {
		return channel === 'dm';
	}

	// Update the getStateColor and getStateBgColor usage
	$: buttonClasses = selectedThread
		? isDMChannel(selectedThread.state)
			? 'text-tertiary-300 bg-tertiary-500/10'
			: `${getStateColor(selectedThread.state as ProposalState)} ${getStateBgColor(
					selectedThread.state as ProposalState
			  )}`
		: '';

	// Add helper function to generate avatar props
	function getAvatarProps(
		seed: string,
		highlight = false,
		size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'xs'
	) {
		return {
			data: { seed },
			design: { highlight },
			size
		};
	}

	// Add helper function to get channel title
	function getChannelTitle(channel: ChannelType): string {
		switch (channel) {
			case 'dm':
				return 'Direct Messages';
			case 'activity':
				return 'Activity Stream';
			case 'general':
				return 'General Discussion';
			case 'announcements':
				return 'Announcements';
			case 'help':
				return 'Help & Support';
			default:
				return getPluralStateLabel(channel as ProposalState);
		}
	}
</script>

<!-- 
{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/95 backdrop-blur-sm"
		transition:fade
		on:click={handleClose}
	>
		<div class="relative w-[95%] flex flex-col" on:click|stopPropagation>
			<div class="w-full h-[90vh] bg-surface-700 rounded-t-xl overflow-hidden" transition:scale>
				<div class="flex h-full overflow-hidden">
					<div class="w-56 border-r border-surface-600/50 bg-surface-800/50">
						<div class="p-4 border-b border-surface-700/50">
							<h2 class="text-lg font-semibold text-tertiary-100">Visioncreator Chat</h2>
							<p class="text-sm text-tertiary-300">Community Channels</p>
						</div>

						<div class="flex flex-col flex-shrink-0 w-64 p-2 border-r border-surface-700/50">
							<div class="mb-4">
								<h3 class="px-2 mb-2 text-xs font-medium text-tertiary-400">Global</h3>
								{#each GLOBAL_CHANNELS as channel}
									<button
										class="flex items-center w-full gap-2 px-3 py-2 text-sm transition-colors rounded-lg {selectedChannel ===
										channel.id
											? 'bg-surface-700/20'
											: 'hover:bg-surface-700/50'}"
										on:click={() => selectChannel(channel.id)}
									>
										<Icon icon={channel.icon} class="w-5 h-5 text-tertiary-300" />
										<span class="text-tertiary-100">{channel.label}</span>
									</button>
								{/each}
							</div>

							<div class="mb-4">
								<h3 class="px-2 mb-2 text-xs font-medium text-tertiary-400">Proposals</h3>
								{#each PROPOSAL_CHANNELS as channel}
									<button
										class="flex items-center w-full gap-2 px-3 py-2 text-sm transition-colors rounded-lg {selectedChannel ===
										channel.id
											? 'bg-surface-700/20'
											: 'hover:bg-surface-700/50'}"
										on:click={() => selectChannel(channel.id)}
									>
										<Icon icon={channel.icon} class="w-5 h-5 {getStateColor(channel.id)}" />
										<span class={getStateColor(channel.id)}>{channel.label}</span>
									</button>
								{/each}
							</div>

							<div>
								<div class="flex items-center justify-between px-2 mb-2">
									<h3 class="text-xs font-medium text-tertiary-400">Direct Messages</h3>
									<button
										class="p-1 transition-colors rounded-lg hover:bg-surface-700/50"
										on:click={() => {
											/* TODO: Add new DM */
										}}
									>
										<Icon icon="mdi:plus" class="w-4 h-4 text-tertiary-300" />
									</button>
								</div>
								{#each DM_USERS as user}
									<button
										class="flex items-center w-full gap-2 p-2 text-left transition-colors rounded-lg hover:bg-surface-700/50"
										on:click={() => selectDMUser(user.id)}
									>
										<Avatar
											me={{
												data: { seed: user.id },
												design: { highlight: user.isOnline },
												size: 'sm'
											}}
										/>
										<div>
											<div class="font-medium">{user.name}</div>
											<div class="text-sm text-surface-400">
												{user.isOnline ? 'Online' : 'Offline'}
											</div>
										</div>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<div class="border-r w-72 border-surface-600/50 bg-surface-800/50">
						<div class="flex items-center h-16 px-4 border-b border-surface-700/50">
							<div class="flex items-center gap-2">
								<Icon icon={getChannelIcon(selectedChannel)} class="w-5 h-5 text-tertiary-300" />
								<h3 class="text-lg font-semibold text-tertiary-100">{channelHeader}</h3>
							</div>
						</div>

						<div class="p-2">
							{#if DEFAULT_THREADS[selectedChannel]}
								<div class="mb-4">
									<div class="flex items-center gap-1 mb-1 text-xs text-tertiary-400">
										<Icon icon="mdi:pin" class="w-3 h-3" />
										<span>Pinned Thread</span>
									</div>
									<button
										class="flex flex-col w-full gap-1 p-3 text-left transition-colors rounded-lg hover:bg-surface-700/50"
										on:click={() => selectThread(DEFAULT_THREADS[selectedChannel])}
									>
										<div class="text-sm font-medium text-tertiary-100">
											{DEFAULT_THREADS[selectedChannel].title}
										</div>
										<p class="text-xs text-tertiary-300">
											{DEFAULT_THREADS[selectedChannel].description}
										</p>
									</button>
								</div>
							{/if}

							{#if selectedChannel === 'dm'}
								{#each DM_USERS as user}
									<button
										class="flex items-center w-full gap-2 p-2 text-left transition-colors rounded-lg hover:bg-surface-700/50"
										on:click={() => selectDMUser(user.id)}
									>
										<Avatar
											me={{
												data: { seed: user.id },
												design: { highlight: user.isOnline },
												size: 'xs'
											}}
										/>
										<div>
											<div class="text-sm font-medium text-tertiary-100">{user.name}</div>
											<div class="text-xs text-tertiary-300">
												{user.isOnline ? 'Online' : 'Offline'}
											</div>
										</div>
									</button>
								{/each}
							{:else if selectedChannel !== 'activity'}
								{#each filteredProposals as proposal}
									<button
										class="flex flex-col w-full gap-1 p-3 text-left transition-colors rounded-lg hover:bg-surface-700/50"
										on:click={() => selectThread(proposal.id)}
									>
										<div class="text-sm font-medium text-tertiary-100">{proposal.title}</div>
										<p class="text-xs text-tertiary-300">created by {proposal.author}</p>
									</button>
								{/each}
							{/if}
						</div>
					</div>

					<div class="flex flex-col flex-grow bg-surface-800/30">
						<div
							class="flex items-center justify-between h-16 px-4 border-b border-surface-700/50 bg-surface-800/50"
						>
							{#if selectedProposal}
								<div class="flex flex-col">
									<h3 class="text-lg font-semibold text-tertiary-100">
										{selectedProposal.title}
									</h3>
									<p class="text-sm text-tertiary-300">created by {selectedProposal.author}</p>
								</div>
								{#if isProposalState(selectedProposal.state)}
									<button
										on:click={() => goToProposal(selectedThread?.id || '')}
										class="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg {buttonClasses}"
									>
										<span>Open Proposal</span>
										<Icon icon="mdi:arrow-top-right" class="w-4 h-4" />
									</button>
								{/if}
							{:else}
								<div class="text-sm text-tertiary-400">Select a thread to start chatting</div>
							{/if}
						</div>

						<div
							bind:this={messageContainer}
							on:scroll={handleScroll}
							class="flex-grow p-4 space-y-2 overflow-y-auto"
						>
							{#if selectedChannel === 'activity'}
								<div class="flex flex-col gap-2">
									{#if $activityStore.length === 0}
										<div class="text-sm text-center text-surface-500">No activities yet</div>
									{:else}
										{#each $activityStore as activity (activity.id)}
											<div
												class="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50 dark:bg-surface-900/50 hover:bg-surface-700/50"
											>
												<div class="flex-shrink-0">
													<Icon
														icon={activityStore.getActivityIcon(activity.type)}
														class="w-5 h-5 text-tertiary-300"
													/>
												</div>
												<div class="flex-grow text-left">
													<p class="text-sm">{activityStore.formatActivity(activity)}</p>
													<p class="text-xs text-surface-500">
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
								</div>
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
												<Avatar me={getAvatarProps(message.sender.id, own)} />
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
{/if} -->
