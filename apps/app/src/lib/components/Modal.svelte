<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let isOpen: boolean;
	export let activeTab: string;
	export let me: { id: string; email: string };
	export let session: { user: { id: string; email: string } };

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
</script>

{#if isOpen}
	<div
		class="fixed inset-0 flex items-end justify-center p-4 sm:p-6 z-50"
		on:click={toggleModal}
		on:keydown={(e) => e.key === 'Escape' && toggleModal()}
		role="dialog"
		aria-modal="true"
		transition:fade
	>
		<div
			class="w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			on:click|stopPropagation
		>
			<div class="flex flex-col flex-grow w-full h-full p-4 overflow-hidden">
				{#if activeTab === 'actions'}
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

			<div class="flex items-center justify-between p-2 border-t border-surface-500">
				<ul class="flex flex-wrap text-sm sm:text-md font-medium text-center">
					{#each ['actions', 'settings', 'legal'] as tab}
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
