<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This is a reusable message component that can be used anywhere in the app:
   - Displays messages from the database for a specific context (proposal, task, etc.)
   - Handles real-time message sending and receiving via Svelte stores
   - Shows message status and timestamps
   - Supports message formatting and layout
   - Handles error states and loading states

2. Props:
   - contextId: ID of the entity this chat belongs to
   - contextType: Type of entity (proposal, task, etc.)
   - className: Optional additional CSS classes

3. Features:
   - Real-time message updates via stores
   - Message grouping by time
   - Timestamp formatting
   - Input handling with validation
   - Error handling and loading states
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Avatar from './Avatar.svelte';

	// Props
	export let contextId: string;
	export let contextType: string;
	export let className = '';

	// Add proper typing for user data
	interface User {
		id: string;
		name: string;
		onboarded: boolean;
	}

	// Add proper typing for message data
	interface Message {
		id: string;
		content: string;
		sender_id: string;
		sender_name: string;
		created_at: string;
		updated_at: string;
	}

	// Queries and mutations
	const userQuery = createQuery({
		operationName: 'queryMe',
		enabled: true
	});

	$: messagesQuery = createQuery({
		operationName: 'queryMessages',
		input: {
			contextId,
			contextType
		},
		enabled: true,
		refetchInterval: 5000 // Poll every 5 seconds for new messages
	});

	const createMessageMutation = createMutation({
		operationName: 'createMessage'
	});

	// Local state
	let newMessage = '';
	let messageContainer: HTMLDivElement;
	let isScrolledToBottom = true;
	let error: string | null = null;

	// Reactive declarations
	$: userData = $userQuery.data
		? {
				id: $userQuery.data.id as string,
				name: $userQuery.data.name as string,
				onboarded: $userQuery.data.onboarded as boolean
		  }
		: null;

	$: messages = ($messagesQuery.data?.messages || []) as Message[];
	$: isLoading = $messagesQuery.isLoading;

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

	// Message sending
	async function handleSubmit() {
		if (!newMessage.trim() || !userData) return;

		try {
			const result = await $createMessageMutation.mutateAsync({
				contextId,
				contextType,
				content: newMessage.trim()
			});

			if (!result?.success) {
				error = result?.error || 'Failed to send message';
				return;
			}

			newMessage = '';
			error = null;
			isScrolledToBottom = true;
			await $messagesQuery.refetch();
		} catch (err: any) {
			error = err?.message || 'Failed to send message';
		}
	}

	// Format timestamp
	function formatTime(date: string): string {
		return new Intl.DateTimeFormat('en', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(new Date(date));
	}

	// Check if message is from current user
	function isOwnMessage(message: Message): boolean {
		return message.sender_id === userData?.id;
	}

	// Group messages by sender and time (within 5 minutes)
	function shouldGroupWithPrevious(message: Message, index: number): boolean {
		if (index === 0) return false;
		const prevMessage = messages[index - 1];
		return (
			prevMessage.sender_id === message.sender_id &&
			new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() <
				5 * 60 * 1000
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

	// Scroll to bottom when new messages arrive
	$: if (messages && isScrolledToBottom) {
		scrollToBottom();
	}

	// Clear error after 5 seconds
	$: if (error) {
		setTimeout(() => {
			error = null;
		}, 5000);
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
			{#if isLoading && !messages.length}
				<div class="flex items-center justify-center h-32">
					<div class="text-sm text-tertiary-300">Loading messages...</div>
				</div>
			{:else if error}
				<div class="p-2 text-sm text-error-400 bg-error-500/10 rounded-lg">
					{error}
				</div>
			{:else if !messages.length}
				<div class="flex items-center justify-center h-32">
					<div class="text-sm text-tertiary-300">No messages yet. Start the conversation!</div>
				</div>
			{:else}
				{#each messages as message, i}
					{@const grouped = shouldGroupWithPrevious(message, i)}
					{@const own = isOwnMessage(message)}

					<div class="flex items-start gap-2 {own ? 'flex-row-reverse' : ''}">
						{#if !grouped}
							<div class="flex-shrink-0 mt-1">
								<Avatar me={getAvatarProps(message.sender_id, own)} />
							</div>
						{:else}
							<div class="w-6" />
						{/if}

						<div class="flex-grow {own ? 'items-end' : ''} max-w-[80%]">
							{#if !grouped}
								<div class="flex items-center gap-1.5 mb-0.5 {own ? 'flex-row-reverse' : ''}">
									<span class="text-xs font-medium text-tertiary-200">
										{message.sender_name}
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
										{formatTime(message.created_at)}
									</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			{/if}
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
			disabled={!userData || isLoading}
		/>
		<button
			on:click={handleSubmit}
			disabled={!newMessage.trim() || !userData || isLoading}
			class="px-3 py-1.5 text-sm font-medium transition-colors rounded-lg bg-secondary-500 hover:bg-secondary-600 text-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if $createMessageMutation.isLoading}
				<Icon icon="mdi:loading" class="w-4 h-4 animate-spin" />
			{:else}
				Send
			{/if}
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
