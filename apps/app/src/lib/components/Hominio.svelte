<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';
	import { onMount } from 'svelte';

	interface Message {
		role: 'user' | 'assistant' | 'system';
		content: string;
		image?: string;
	}

	let messages: Message[] = [];
	let isLoading = false;
	let userInput = '';
	let imageFile: File | null = null;
	let messageContainer: HTMLDivElement;
	let imagePreviewUrl: string | null = null;

	function scrollToBottom() {
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	async function handleSubmit() {
		if (!userInput.trim() && !imageFile) return;

		let userMessage: Message = { role: 'user', content: userInput };

		if (imageFile) {
			const base64Image = await fileToBase64(imageFile);
			userMessage.image = base64Image;
		}

		messages = [...messages, userMessage];
		isLoading = true;

		userInput = '';
		removeImage();

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

			// Handle the response as needed
		} catch (error) {
			console.error('Error:', error);
		}

		isLoading = false;
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			imageFile = target.files[0];
			imagePreviewUrl = URL.createObjectURL(imageFile);
		}
	}

	function removeImage() {
		imageFile = null;
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
			imagePreviewUrl = null;
		}
	}

	async function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					resolve(reader.result);
				} else {
					reject(new Error('Failed to convert file to base64'));
				}
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		target.style.height = 'auto';
		target.style.height = `${target.scrollHeight}px`;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	onMount(() => {
		scrollToBottom();
	});
</script>

<div class="flex flex-col h-72 overflow-hidden rounded-xl p-2">
	<div class="mb-2 flex flex-wrap gap-2 h-16 overflow-x-auto overflow-y-hidden">
		{#if imagePreviewUrl}
			<div
				class="relative bg-surface-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-surface-500 overflow-hidden h-full"
				on:click={removeImage}
			>
				<img src={imagePreviewUrl} alt="Preview" class="h-10 w-auto object-cover" />
				<p class="text-2xs text-center truncate w-full p-1">{imageFile?.name}</p>
			</div>
		{/if}
	</div>

	<div
		class="flex-1 mb-2 overflow-y-auto rounded-xl bg-surface-700 text-tertiary-200 p-4"
		bind:this={messageContainer}
		on:DOMNodeInserted={scrollToBottom}
	>
		{#each messages as message (message.content)}
			<div class="mb-2">
				<strong>{message.role === 'user' ? 'You:' : 'Assistant:'}</strong>
				{#if message.image}
					<img src={message.image} alt="User uploaded" class="h-auto max-w-full mb-2 rounded-lg" />
				{/if}
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

	<form
		on:submit|preventDefault={handleSubmit}
		class="flex items-center bg-surface-700 rounded-xl overflow-hidden"
	>
		<textarea
			bind:value={userInput}
			placeholder="Type your message..."
			class="flex-grow p-4 border-0 resize-none text-tertiary-200 bg-transparent"
			rows="1"
			on:input={handleInput}
			on:keydown={handleKeydown}
		/>
		<label class="p-4 cursor-pointer text-tertiary-200 hover:text-tertiary-100">
			<Icon icon="mdi:image-plus" width="24" height="24" />
			<input type="file" accept="image/*" on:change={handleFileChange} class="hidden" />
		</label>
		<button type="submit" class="p-4 text-white bg-primary-500 hover:bg-primary-600">
			<Icon icon="mdi:send" width="24" height="24" />
		</button>
	</form>
</div>
