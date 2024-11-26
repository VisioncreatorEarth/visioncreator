<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { dynamicView } from '$lib/stores';

	export let activeTab: string;
	const tabs = ['views', 'actions', 'settings'] as const;

	const dispatch = createEventDispatcher();

	const viewLinks = [
		{
			name: 'Home',
			icon: 'mdi:view-dashboard',
			href: '/'
		},
		{
			name: 'Episodes',
			icon: 'mdi:play-circle',
			href: '/episodes'
		}
	];

	async function handleNavigation(link: (typeof viewLinks)[number]) {
		if (link.onClick) {
			link.onClick();
		}
		await goto(link.href);
		dispatch('closeModal');
	}
</script>

<div class="flex flex-col h-full">
	<div class="overflow-auto flex-grow p-4">
		{#if activeTab === 'views'}
			<div class="flex gap-4">
				{#each viewLinks as link}
					<div
						on:click={() => handleNavigation(link)}
						on:keydown={(e) => e.key === 'Enter' && handleNavigation(link)}
						class="flex flex-col items-center justify-center w-[100px] h-[100px] transition-colors duration-200 rounded-lg cursor-pointer {link.class ||
							'variant-ghost-secondary'} hover:variant-ghost-primary"
						tabindex="0"
						role="button"
					>
						<Icon icon={link.icon} class="mb-2 w-8 h-8" />
						<span class="text-sm font-medium">{link.name}</span>
					</div>
				{/each}
			</div>
		{:else}
			<slot name="content" />
		{/if}
	</div>

	<div class="flex justify-between items-center p-2 pr-16 border-t border-surface-500">
		<ul class="flex flex-wrap text-sm font-medium text-center">
			{#each tabs as tab}
				<li class="relative px-0.5 sm:px-1">
					<button
						class="inline-block px-2 py-2 rounded-lg transition-colors duration-200 sm:px-3"
						class:text-primary-500={activeTab === tab}
						class:text-tertiary-400={activeTab !== tab}
						on:click={() => dispatch('setActiveTab', tab)}
					>
						{tab.charAt(0).toUpperCase() + tab.slice(1)}
					</button>
					{#if activeTab === tab}
						<div
							class="absolute bottom-0 left-1/2 w-1/4 h-0.5 rounded-full -translate-x-1/2 bg-primary-500"
						/>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</div>
