<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';
	import { onMount } from 'svelte';
	import Talk from './Talk.svelte';

	interface Message {
		role: 'user' | 'assistant' | 'system';
		content: string;
		image?: string;
	}

	let messages: Message[] = [];
	let isLoading = false;
	let messageContainer: HTMLDivElement;

	function scrollToBottom() {
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	async function handleTranscript(transcript: string) {
		if (!transcript.trim()) return;

		let userMessage: Message = { role: 'user', content: transcript };
		messages = [...messages, userMessage];
		isLoading = true;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messages })
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			const assistantResponse = data.content;
			messages = [...messages, { role: 'assistant', content: assistantResponse }];
		} catch (error) {
			console.error('Error:', error);
		}

		isLoading = false;
	}

	onMount(() => {
		scrollToBottom();
	});
</script>

<div class="flex flex-col p-2 overflow-hidden h-72 rounded-xl">
	<div
		class="flex-1 p-4 mb-2 overflow-y-auto rounded-xl bg-surface-700 text-tertiary-200"
		bind:this={messageContainer}
		on:DOMNodeInserted={scrollToBottom}
	>
		{#each messages as message (message.content)}
			<div class="mb-2">
				<strong>{message.role === 'user' ? 'You:' : 'Assistant:'}</strong>
				<SvelteMarkdown source={message.content} />
			</div>
		{/each}
		{#if isLoading}
			<div class="mb-2">
				<strong>Assistant:</strong>
				<p>Building...</p>
			</div>
		{/if}
	</div>

	<Talk onTranscriptReady={handleTranscript} />
</div>
