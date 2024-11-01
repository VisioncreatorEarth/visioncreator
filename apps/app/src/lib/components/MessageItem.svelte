<script lang="ts">
	import { slide } from 'svelte/transition';
	import AgentAvatar from './AgentAvatar.svelte';
	import dayjs from 'dayjs';
	import type { Message } from '$lib/stores/intentStore';

	export let message: Message;
	export let session: any;

	let isPayloadVisible = false;

	function togglePayload() {
		isPayloadVisible = !isPayloadVisible;
	}

	function formatTime(timestamp: string) {
		return dayjs(timestamp).fromNow();
	}

	function getAgentDisplayName(agent: string) {
		const agentNames = {
			hominio: 'Hominio',
			ali: 'Ali',
			vroni: 'Vroni',
			walter: 'Walter',
			bert: 'Bert',
			user: 'You'
		};
		return agentNames[agent] || agent;
	}

	$: formattedPayload = formatPayload(message.payload);

	function formatPayload(payload: any) {
		if (!payload) return null;
		try {
			return {
				type: payload.type,
				content:
					typeof payload.data === 'object' ? JSON.stringify(payload.data, null, 2) : payload.data
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
			{#if message.payload}
				<div class="space-y-2">
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<span class="text-sm">{message.content}</span>
							{#if message.payload.type === 'view' && message.payload.data?.view?.children?.[0]?.component}
								<div
									class="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-300"
								>
									{message.payload.data.view.children[0].component}
								</div>
							{/if}
						</div>
						<button
							class="p-1.5 text-xs rounded-lg hover:bg-surface-700/50 text-tertiary-300"
							on:click={togglePayload}
						>
							{isPayloadVisible ? 'Hide Details' : 'Show Details'}
						</button>
					</div>
					{#if isPayloadVisible}
						<div
							class="p-2 mt-2 border rounded bg-surface-800/50 border-surface-700"
							transition:slide
						>
							<pre class="overflow-x-auto font-mono text-xs whitespace-pre-wrap text-tertiary-200">
								{JSON.stringify(message.payload.data, null, 2)}
							</pre>
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-sm whitespace-pre-wrap">{message.content}</p>
			{/if}
		</div>

		{#if formattedPayload && message.payload?.type !== 'view'}
			<div class="w-full mt-2">
				<div class="flex items-center justify-between mb-2">
					<span class="px-2 py-1 text-xs font-medium rounded-full bg-surface-700 text-tertiary-300">
						{formattedPayload.type}
					</span>
					<button
						class="p-1.5 text-xs rounded-lg hover:bg-surface-700/50 text-tertiary-300"
						on:click={togglePayload}
					>
						{isPayloadVisible ? 'Hide Details' : 'Show Details'}
					</button>
				</div>
				{#if isPayloadVisible}
					<div class="p-4 border rounded-xl bg-surface-800/50 border-surface-600" transition:slide>
						<pre class="overflow-x-auto font-mono text-xs text-tertiary-200">
							{formattedPayload.content}
						</pre>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if message.agent === 'user'}
		<AgentAvatar agentType="user" seed={session?.user?.id || 'default'} />
	{/if}
</div>
