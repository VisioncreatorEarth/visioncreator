<script lang="ts">
	import { slide } from 'svelte/transition';
	import AgentAvatar from './AgentAvatar.svelte';
	import ComposeView from './ComposeView.svelte';
	import dayjs from 'dayjs';
	import type { Message } from '$lib/stores/intentStore';

	export let message: Message;
	export let session: any;

	function formatTime(timestamp: string) {
		return dayjs(timestamp).fromNow();
	}

	function getAgentDisplayName(agent: string) {
		const agentNames = {
			hominio: 'Hominio (Delegation)',
			ali: 'Ali (Actions)',
			vroni: 'Vroni (Views)',
			walter: 'Walter (Data)',
			bert: 'Bert (Lists)',
			system: 'System',
			user: 'You'
		};
		return agentNames[agent] || agent;
	}

	$: formattedPayload = formatPayload(message.payload);

	function formatPayload(payload: any) {
		if (!payload) return null;
		try {
			return {
				type: 'json',
				content:
					typeof payload.content === 'string'
						? payload.content
						: JSON.stringify(payload.content, null, 2)
			};
		} catch (error) {
			console.error('Error formatting payload:', error);
			return null;
		}
	}
</script>

<div
	class="flex justify-{message.agent === 'user' ? 'end' : 'start'} items-start space-x-3 w-full"
	transition:slide
	data-message-id={message.id}
>
	{#if message.agent !== 'user'}
		<AgentAvatar agentType={message.agent} seed={message.agent} />
	{/if}

	<div class="flex flex-col space-y-1 {message.payload ? 'w-full' : 'max-w-[80%]'}">
		{#if message.agent !== 'user'}
			<div class="flex items-center space-x-2">
				<span class="text-xs font-medium text-tertiary-300">
					{getAgentDisplayName(message.agent)}
				</span>
				<span class="text-xs text-tertiary-600">
					{formatTime(message.timestamp)}
				</span>
				{#if message.status === 'pending'}
					<span class="text-xs text-warning-500">Processing...</span>
				{:else if message.status === 'error'}
					<span class="text-xs text-error-500">Error</span>
				{/if}
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

		{#if formattedPayload}
			<div
				class="w-full mt-2 p-4 font-mono text-xs border rounded-xl bg-surface-800/50 border-surface-600"
			>
				<pre class="overflow-x-auto">{formattedPayload.content}</pre>
			</div>
		{/if}
	</div>

	{#if message.agent === 'user'}
		<AgentAvatar agentType="user" seed={session?.user?.id || 'default'} />
	{/if}
</div>
