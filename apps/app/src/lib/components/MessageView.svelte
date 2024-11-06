<script lang="ts">
	import { fade } from 'svelte/transition';
	import { conversationManager, conversationStore } from '$lib/stores/intentStore';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import MessageItem from './MessageItem.svelte';

	// Initialize dayjs relative time plugin
	dayjs.extend(relativeTime);

	export let isOpen = false;
	export let session: any;

	let currentConversation: any;
	let messageContainer: HTMLDivElement;

	// Safe store subscription with proper typing
	conversationStore.subscribe((state) => {
		if (!state) {
			currentConversation = null;
			return;
		}

		const conversations = state.conversations || [];
		const currentConversationId = state.currentConversationId;

		if (currentConversationId && Array.isArray(conversations)) {
			currentConversation = conversations.find((conv) => conv.id === currentConversationId) || null;
		} else {
			currentConversation = null;
		}
	});

	function handleClose() {
		dispatch('close');
	}

	// Update the scrollToBottom function to be more robust
	function scrollToBottom() {
		if (messageContainer) {
			requestAnimationFrame(() => {
				messageContainer.scrollTo({
					top: messageContainer.scrollHeight,
					behavior: 'smooth'
				});
			});
		}
	}

	// Add scroll handling when messages update
	$: if (currentConversation?.messages?.length) {
		scrollToBottom();
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 bg-surface-800/50 backdrop-blur-sm"
		on:click|self={handleClose}
		transition:fade={{ duration: 200 }}
	>
		<div class="container h-full max-w-2xl mx-auto" on:click|stopPropagation>
			<div class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 mb-16">
				<div
					class="w-full max-w-6xl overflow-hidden border shadow-xl rounded-xl bg-surface-700 border-surface-600"
				>
					<!-- Header -->
					<div class="flex items-center justify-between p-4 border-b border-surface-600">
						<h2 class="text-lg font-semibold text-tertiary-200">Conversation History</h2>
						<button
							class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-surface-600/50"
							on:click={handleClose}
						>
							<svg
								class="w-6 h-6 text-tertiary-200"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<!-- Messages Content -->
					<div
						class="flex-1 p-6 space-y-4 overflow-y-auto max-h-[60vh] scroll-smooth"
						bind:this={messageContainer}
						style="scroll-behavior: smooth;"
					>
						{#if currentConversation?.messages?.length}
							{#each currentConversation.messages as message (message.id)}
								<MessageItem {message} {session} on:actionComplete />
							{/each}
						{:else}
							<div class="flex items-center justify-center flex-1">
								<p class="text-lg text-tertiary-200">No messages yet</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
