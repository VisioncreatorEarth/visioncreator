<script lang="ts">
	import { writable } from 'svelte/store';
	import { Me, eventStream } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { eventBus } from '$lib/composables/eventBus';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';

	export let data;

	let modalOpen = writable(false);
	let activeTab = writable('actions');
	let { session } = data;
	$: ({ session } = data);

	let isFirstTime = writable(true);

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		goto(href);
	}

	onMount(() => {
		console.log('me', $Me);
		const firstTimeStatus = localStorage.getItem('isFirstTime');
		isFirstTime.set(firstTimeStatus === null || firstTimeStatus === 'true');

		const unsubscribe = eventStream.subscribe((events) => {
			const latestEvent = events[events.length - 1];
			if (latestEvent && latestEvent.type === 'updateMe') {
				setTimeout(() => {
					modalOpen.set(false);
				}, 1000);
			}
		});

		const handleToggleModal = () => {
			setTimeout(() => {
				modalOpen.set(false);
			}, 2000);
		};

		eventBus.on('toggleModal', handleToggleModal);

		return () => {
			unsubscribe();
			eventBus.off('toggleModal', handleToggleModal);
		};
	});

	function toggleModal(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			modalOpen.update((n) => !n);
			if ($isFirstTime) {
				isFirstTime.set(false);
				localStorage.setItem('isFirstTime', 'false');
			}
			if (!$modalOpen) {
				activeTab.set('actions');
			}
		}
	}

	function setActiveTab(tab: string) {
		activeTab.set(tab);
	}
</script>

<div
	class={`@container overflow-hidden w-full h-full ${$modalOpen ? 'blur-md' : ''}`}
	style="-webkit-overflow-scrolling: touch;"
>
	<slot />
</div>

{#if $modalOpen}
	<div
		class="fixed inset-0 flex items-end justify-center p-4 sm:p-6 z-50"
		on:click={toggleModal}
		role="dialog"
		aria-modal="true"
		transition:fade
	>
		{#if $Me}
			<div
				class="w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
				on:click|stopPropagation
			>
				<div class="flex flex-col flex-grow w-full h-full p-4 overflow-hidden">
					{#if $activeTab === 'actions'}
						<ActionButtons me={{ id: session.user.id }} />
					{:else if $activeTab === 'settings'}
						<Newsletter me={{ email: session.user.email, id: session.user.id }} />
					{:else if $activeTab === 'legal'}
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
										$activeTab === tab
											? 'text-primary-500'
											: 'text-tertiary-400 hover:text-tertiary-300'
									}`}
									on:click={() => setActiveTab(tab)}
								>
									{tab.charAt(0).toUpperCase() + tab.slice(1)}
								</button>
								{#if $activeTab === tab}
									<div
										class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-primary-500 rounded-full"
									/>
								{/if}
							</li>
						{/each}
					</ul>
					<button
						class="p-2 text-tertiary-400 hover:text-tertiary-300"
						on:click={() => toggleModal()}
					>
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
		{/if}
	</div>
{/if}

<!-- Fading glassmorphism effect -->
<div class="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>

<!-- Button container -->
<div
	class="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-50"
>
	<div class="relative flex items-center">
		{#if $isFirstTime && $Me.onboarded}
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
		{#if $Me.onboarded}
			<button
				class="flex items-center justify-center rounded-full bg-primary-500 w-14 h-14 border border-tertiary-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
				class:hidden={$modalOpen}
				on:click={toggleModal}
			>
				<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
			</button>
		{/if}
	</div>
</div>

<style>
	.blur-wrapper {
		position: relative;
		width: 70px;
		height: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.blur-wrapper::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		background-color: rgb(var(--color-surface-700) / 0.5);
		filter: blur(12px);
		border-radius: 50%;
		z-index: -1;
	}

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
