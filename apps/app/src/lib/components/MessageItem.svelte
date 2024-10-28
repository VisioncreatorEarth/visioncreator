<script lang="ts">
	import { slide } from 'svelte/transition';
	import AgentAvatar from './AgentAvatar.svelte';
	import ComposeView from './ComposeView.svelte';
	import dayjs from 'dayjs';

	export let message: any;
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
	class="flex justify-{message.type === 'user' ? 'end' : 'start'} items-start space-x-3 w-full"
	transition:slide
>
	{#if message.type === 'agent'}
		<AgentAvatar agentType={message.agentType} seed={message.agentType} />
	{/if}

	<div class="flex flex-col space-y-1 {message.payloads?.length ? 'w-full' : 'max-w-[80%]'}">
		<!-- Agent header -->
		{#if message.type === 'agent'}
			<div class="flex items-center space-x-2">
				<span class="text-xs font-medium text-tertiary-300">
					{#if message.agentType === 'hominio'}
						Hominio
					{:else if message.agentType === 'ali'}
						Ali (Action Agent)
					{:else if message.agentType === 'walter'}
						Walter (Wunder Agent)
					{/if}
				</span>
				<span class="text-xs text-tertiary-600">
					{formatTime(message.timestamp)}
				</span>
			</div>
		{/if}

		<!-- Message content -->
		<div
			class="relative {message.type === 'user'
				? 'bg-secondary-800 text-white'
				: 'bg-surface-600 text-tertiary-200'} 
            px-4 py-2 rounded-2xl {message.type === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}"
		>
			<p class="text-sm whitespace-pre-wrap">{message.content}</p>
		</div>

		<!-- Action payloads only -->
		{#if message.payloads?.length > 0}
			{#each message.payloads as payload}
				{#if payload.type === 'action'}
					<div
						class="w-full mt-4 overflow-hidden border rounded-xl bg-surface-800 border-surface-600"
						transition:slide
					>
						<ComposeView
							view={payload.content.view}
							{session}
							showSpacer={false}
							on:actionComplete={handleActionComplete}
						/>
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	{#if message.type === 'user'}
		<AgentAvatar agentType="user" seed={session?.user?.id || 'default'} />
	{/if}
</div>
