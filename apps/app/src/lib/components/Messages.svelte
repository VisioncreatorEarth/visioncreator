<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This is a reusable message component that can be used anywhere in the app:
   - Displays messages for a specific context (proposal, task, etc.)
   - Handles message sending, editing, and deletion
   - Shows message status and timestamps
   - Supports real-time updates
   - Handles message formatting and layout
   - Simulates automated responses for better UX

2. Props:
   - contextId: ID of the entity this chat belongs to
   - contextType: Type of entity (proposal, task, etc.)
   - height: Optional custom height for the chat container
   - className: Optional additional CSS classes

3. Features:
   - Message grouping by time
   - Read receipts
   - Message status indicators
   - Timestamp formatting
   - Input handling with validation
   - Automated response simulation
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { messageStore, type Message } from '$lib/stores/messageStore';
	import { createQuery } from '$lib/wundergraph';
	import Avatar from './Avatar.svelte';

	// Props
	export let contextId: string;
	export let contextType: string;
	export let height = '400px';
	export let className = '';

	// Add proper typing for user data
	interface User {
		id: string;
		name: string;
		onboarded: boolean;
	}

	// Add proper typing for message sender
	interface MessageSender {
		id: string;
		name: string;
	}

	interface Message {
		id: string;
		content: string;
		timestamp: Date;
		sender: MessageSender;
	}

	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

	// Local state
	let messages: Message[] = [];
	let newMessage = '';
	let messageContainer: HTMLDivElement;
	let isScrolledToBottom = true;
	let unsubscribe: () => void;

	// Simulated responses for better UX
	const simulatedResponses: string[] = [
		'Thanks for your input! I will look into this.',
		'That is an interesting perspective. Could you elaborate?',
		'I agree with your point. Let us move forward with this.',
		'Great suggestion! I will add this to our roadmap.',
		'This aligns well with our goals. Let us discuss further.',
		'I see what you mean. How about we approach it this way?',
		'Thanks for bringing this up. It is definitely worth considering.',
		'This could have a significant impact. Let us explore it more.'
	];

	// Update the userQuery typing
	$: userData = $userQuery.data
		? {
				id: $userQuery.data.id as string,
				name: $userQuery.data.name as string,
				onboarded: $userQuery.data.onboarded as boolean
		  }
		: null;

	// Initialize message thread
	onMount(() => {
		messageStore.createThread(contextId.toString(), contextType);
		const threadMessages = messageStore.getThreadMessages(contextId.toString());
		unsubscribe = threadMessages.subscribe((value) => {
			messages = value;
			if (isScrolledToBottom) {
				scrollToBottom();
			}
		});

		// Mark messages as read when component mounts
		if (userData?.id) {
			messageStore.markAsRead(contextId.toString(), userData.id);
		}
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});

	// Scroll handling
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

	// Message sending with simulated response
	function handleSubmit() {
		if (!newMessage.trim() || !userData) return;

		messageStore.sendMessage({
			contextId,
			contextType,
			content: newMessage.trim(),
			sender: {
				id: userData.id,
				name: userData.name
			}
		});

		// Simulate a response after a short delay
		setTimeout(() => {
			const randomResponse =
				simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
			messageStore.sendMessage({
				contextId,
				contextType,
				content: randomResponse,
				sender: {
					id: 'system',
					name: 'Visioncreator AI'
				}
			});
		}, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds

		newMessage = '';
		isScrolledToBottom = true;
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
		return message.sender.id === userData?.id;
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

	// Helper function to get avatar props
	function getAvatarProps(seed: string, highlight = false) {
		return {
			data: { seed },
			design: { highlight },
			size: '2xs' as const
		};
	}
</script>

<div class="relative flex flex-col h-full {className}">
	<!-- Messages Container -->
	<div
		bind:this={messageContainer}
		on:scroll={handleScroll}
		class="absolute inset-0 overflow-y-auto"
	>
		<div class="p-4 space-y-2 pb-20">
			{#each messages as message, i}
				{@const grouped = shouldGroupWithPrevious(message, i)}
				{@const own = isOwnMessage(message)}

				<div class="flex items-start gap-2 {own ? 'flex-row-reverse' : ''}">
					{#if !grouped}
						<div class="flex-shrink-0 mt-1">
							<Avatar me={getAvatarProps(message.sender.id, own)} />
						</div>
					{:else}
						<div class="w-6" />
					{/if}

					<div class="flex-grow {own ? 'items-end' : ''} max-w-[80%]">
						{#if !grouped}
							<div class="flex items-center gap-1.5 mb-0.5 {own ? 'flex-row-reverse' : ''}">
								<span class="text-xs font-medium text-tertiary-200">
									{message.sender.name}
								</span>
							</div>
						{/if}

						<div class="flex flex-col {own ? 'items-end' : ''}">
							<div
								class="relative px-3 py-1.5 text-sm rounded-lg {own
									? 'bg-secondary-900/20 text-secondary-300'
									: 'bg-surface-600/80 text-tertiary-50'} {grouped ? 'mt-0.5' : 'mt-0'}"
							>
								<p class="leading-relaxed">
									{message.content}
								</p>
								<span
									class="block text-[9px] opacity-50 {own
										? 'text-right mr-[1px] text-secondary-300'
										: 'text-left ml-[1px] text-tertiary-200'} -mb-0.5 mt-[1px]"
								>
									{formatTime(message.timestamp)}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Message Input -->
	<div
		class="absolute bottom-0 left-0 right-0 flex gap-2 p-3 border-t border-surface-700/50 bg-surface-900/95 backdrop-blur-sm"
	>
		<input
			type="text"
			bind:value={newMessage}
			on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
			placeholder="Type your message..."
			class="flex-grow px-3 py-1.5 text-sm rounded-lg bg-surface-700/30 text-tertiary-100 placeholder:text-tertiary-400 focus:ring-2 focus:ring-secondary-500/50 focus:outline-none"
		/>
		<button
			on:click={handleSubmit}
			disabled={!newMessage.trim() || !userData}
			class="px-3 py-1.5 text-sm font-medium transition-colors rounded-lg bg-secondary-500 hover:bg-secondary-600 text-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Send
		</button>
	</div>
</div>

<style>
	.card {
		transition: transform 0.2s;
	}
	.card:hover {
		transform: translateY(-2px);
	}
</style>
