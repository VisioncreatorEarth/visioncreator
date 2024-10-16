<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';
	import Hominio from './Hominio.svelte';
	import { dev } from '$app/environment';

	export let isOpen: boolean;
	export let activeTab: string;
	export let me: { id: string; email: string; onboarded: boolean };
	export let isFirstTime: boolean;

	const dispatch = createEventDispatcher();

	function setActiveTab(tab: string) {
		dispatch('setActiveTab', tab);
	}

	function toggleModal() {
		dispatch('toggleModal');
	}

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		dispatch('navigate', href);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			toggleModal();
		}
	}

	const tabs = dev ? ['hominio', 'actions', 'settings', 'legal'] : ['actions', 'settings', 'legal'];
</script>

{#if isOpen}
	<div
		class="fixed inset-0 flex items-end justify-center p-4 sm:p-6 z-50"
		on:click={toggleModal}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		transition:fade
	>
		<div
			class="w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			on:click|stopPropagation={() => {}}
			role="document"
		>
			<div class="flex flex-col flex-grow w-full h-full p-4 overflow-hidden">
				{#if activeTab === 'hominio' && dev}
					<Hominio />
				{:else if activeTab === 'actions'}
					<slot name="actions" />
				{:else if activeTab === 'settings'}
					<slot name="settings" />
				{:else if activeTab === 'legal'}
					<div class="flex flex-col items-start justify-center h-full w-full">
						<ListBox class="w-full max-w-sm">
							<ListBoxItem
								value="privacy"
								on:click={(e) => handleLinkClick(e, '/en/privacy-policy')}
							>
								<svelte:fragment slot="lead">
									<Icon icon="mdi:shield-check" class="w-6 h-6" />
								</svelte:fragment>
								Privacy Policy
							</ListBoxItem>
							<ListBoxItem value="imprint" on:click={(e) => handleLinkClick(e, '/en/imprint')}>
								<svelte:fragment slot="lead">
									<Icon icon="mdi:information" class="w-6 h-6" />
								</svelte:fragment>
								Site Notice
							</ListBoxItem>
						</ListBox>
					</div>
				{/if}
			</div>

			<!-- Tab navigation -->
			<div class="flex items-center justify-between p-2 border-t border-surface-500">
				<ul class="flex flex-wrap text-sm sm:text-md font-medium text-center">
					{#each tabs as tab}
						<li class="relative px-0.5 sm:px-1">
							<button
								class={`inline-block px-2 py-2 sm:px-3 rounded-lg transition-colors duration-200 ${
									activeTab === tab
										? 'text-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click={() => setActiveTab(tab)}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
							{#if activeTab === tab}
								<div
									class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-primary-500 rounded-full"
								/>
							{/if}
						</li>
					{/each}
				</ul>
				<button class="p-2 text-tertiary-400 hover:text-tertiary-300" on:click={toggleModal}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6"
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
		</div>
	</div>
{/if}

<div class="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>

<div
	class="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-50"
>
	<div class="relative flex items-center">
		{#if isFirstTime && me.onboarded}
			<div
				class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap flex flex-col items-center animate-pulse"
			>
				<span
					class="btn variant-filled-tertiary text-xs font-semibold px-3 py-1 rounded-lg shadow-lg bg-secondary-500/95"
					>this is your menu</span
				>
				<div
					class="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-tertiary-500 -mt-[1px]"
				/>
			</div>
		{/if}
		{#if me.onboarded}
			<button
				class="flex items-center justify-center rounded-full bg-primary-500 w-14 h-14 border border-tertiary-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
				class:hidden={isOpen}
				on:click={toggleModal}
			>
				<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
			</button>
		{/if}
	</div>
</div>

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1) translateX(-50%);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.05) translateX(-48%);
		}
	}

	.animate-pulse {
		animation: pulse 2s infinite;
	}
</style>
