<script lang="ts">
	import { slide } from 'svelte/transition';
	import AgentAvatar from './AgentAvatar.svelte';
	import ComposeView from './ComposeView.svelte';
	import dayjs from 'dayjs';
	import type { Message } from '$lib/stores/intentStore';
	import { createEventDispatcher } from 'svelte';

	export let message: Message;
	export let session: any;

	const dispatch = createEventDispatcher();

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

	function handleActionComplete(event: CustomEvent) {
		dispatch('actionComplete', event.detail);
	}

	// Helper to determine if we should show the compose view
	$: showComposeView = message.payload?.type === 'action';
</script>

<div
	class="flex justify-{message.agent === 'user' ? 'end' : 'start'} items-start space-x-3 w-full"
	transition:slide
	data-message-id={message.id}
>
	{#if message.agent !== 'user'}
		<AgentAvatar agentType={message.agent} seed={message.agent} />
	{/if}

	<div class="flex flex-col space-y-1 {showComposeView ? 'w-full' : 'max-w-[80%]'}">
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

		{#if message.payload?.type === 'view' && message.payload.data?.view}
			<div
				class="w-full mt-4 overflow-hidden border rounded-xl bg-surface-800 border-surface-600"
				transition:slide
			>
				<ComposeView
					view={message.payload.data.view}
					{session}
					showSpacer={false}
					on:actionComplete={handleActionComplete}
				/>
			</div>
		{:else if message.payload?.type === 'action' && message.payload.data}
			<div
				class="w-full mt-4 overflow-hidden border rounded-xl bg-surface-800 border-surface-600"
				transition:slide
			>
				<ComposeView
					view={message.payload.data}
					{session}
					showSpacer={false}
					on:actionComplete={handleActionComplete}
				/>
			</div>
		{:else if message.payload?.type === 'delegation'}
			<div class="p-8 mt-2 border rounded bg-surface-800/50 border-surface-700" transition:slide>
				<div class="space-y-1 text-sm text-tertiary-200">
					<p><span class="font-medium">Task:</span> {message.payload.data.task}</p>
					<p>
						<span class="font-medium">Reasoning:</span>
						{message.payload.data.reasoning}
					</p>
				</div>
			</div>
		{:else if message.payload?.type === 'error'}
			<div class="p-2 mt-2 border rounded bg-surface-800/50 border-surface-700" transition:slide>
				<pre class="overflow-x-auto font-mono text-xs whitespace-pre-wrap text-tertiary-200">
					{JSON.stringify(message.payload.data, null, 2)}
				</pre>
			</div>
		{/if}
	</div>

	{#if message.agent === 'user'}
		<AgentAvatar agentType="user" seed={session?.user?.id || 'default'} />
	{/if}
</div>
