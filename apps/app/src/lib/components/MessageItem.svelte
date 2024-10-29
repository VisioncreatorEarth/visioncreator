<script lang="ts">
	import { slide } from 'svelte/transition';
	import AgentAvatar from './AgentAvatar.svelte';
	import ComposeView from './ComposeView.svelte';
	import dayjs from 'dayjs';

	export let message: Message;
	export let session: any;

	// Helper function to format timestamp
	function formatTime(timestamp: string) {
		return dayjs(timestamp).fromNow();
	}

	function handleActionComplete(event: CustomEvent) {
		// Dispatch the event up to parent
		dispatch('actionComplete', event.detail);
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div
	class="flex justify-{message.agent === 'user' ? 'end' : 'start'} items-start space-x-3 w-full"
	transition:slide
	data-message-id={message.id}
>
	{#if message.agent !== 'user'}
		<AgentAvatar agentType={message.agent} seed={message.agent} />
	{/if}

	<div class="flex flex-col space-y-1 {message.payload?.view ? 'w-full' : 'max-w-[80%]'}">
		{#if message.agent !== 'user'}
			<div class="flex items-center space-x-2">
				<span class="text-xs font-medium text-tertiary-300">
					{#if message.agent === 'hominio'}
						Hominio
					{:else if message.agent === 'ali'}
						Ali (Action Agent)
					{:else if message.agent === 'walter'}
						Walter (Wunder Agent)
					{/if}
				</span>
				<span class="text-xs text-tertiary-600">
					{formatTime(message.timestamp)}
				</span>
			</div>
		{/if}

		<div
			class="relative {message.agent === 'user'
				? 'bg-secondary-800 text-white'
				: 'bg-surface-600 text-tertiary-200'} 
            px-4 py-2 rounded-2xl {message.agent === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}"
		>
			<p class="text-sm whitespace-pre-wrap">{message.content}</p>
		</div>

		{#if message.payload?.view}
			<div
				class="w-full mt-4 overflow-hidden border rounded-xl bg-surface-800 border-surface-600"
				transition:slide
			>
				<ComposeView view={message.payload.view} {session} showSpacer={false} on:actionComplete />
			</div>
		{/if}
	</div>

	{#if message.agent === 'user'}
		<AgentAvatar agentType="user" seed={session?.user?.id || 'default'} />
	{/if}
</div>
