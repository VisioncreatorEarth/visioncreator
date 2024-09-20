<script lang="ts">
	import { writable } from 'svelte/store';
	import { Me, eventStream } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { eventBus } from '$lib/composables/eventBus';

	export let data;

	let modalOpen = writable(false);
	let activeTab = writable('actions');
	let { session } = data;
	$: ({ session } = data);

	let isFirstTime = writable(true);

	onMount(() => {
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

		eventBus.on('toggleModal', () => {
			setTimeout(() => {
				modalOpen.set(false);
			}, 1000);
		});

		return () => {
			unsubscribe();
			eventBus.off('toggleModal');
		};
	});

	function toggleModal(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			modalOpen.update((n) => !n);
			if ($isFirstTime) {
				isFirstTime.set(false);
				localStorage.setItem('isFirstTime', 'false');
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

<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
	<div class="relative flex items-center">
		{#if $isFirstTime}
			<div
				class="absolute right-full mr-4 whitespace-nowrap flex items-center space-x-2 px-4 py-2 bg-surface-300/30 backdrop-blur-sm rounded-full"
			>
				<span class="text-sm font-semibold text-tertiary-200">This is your menu</span>
				<div class="animate-pulse">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-tertiary-200"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7l5 5m0 0l-5 5m5-5H6"
						/>
					</svg>
				</div>
			</div>
		{/if}
		<button
			class="flex items-center justify-center rounded-full bg-primary-500 w-14 h-14 border border-tertiary-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 {$isFirstTime
				? 'animate-pulse-smooth'
				: ''}"
			class:hidden={$modalOpen}
			on:click={toggleModal}
		>
			<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
		</button>
	</div>
</div>

{#if $modalOpen}
	<div
		class="fixed inset-0 flex items-end justify-center p-4 sm:p-6"
		on:click={toggleModal}
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
					{:else if $activeTab === 'legalinfo'}
						<div class="flex space-x-4 rounded-lg">
							<a
								href="/en/privacy-policy"
								class="btn hover:variant-filled-surface variant-ghost-surface"
							>
								Privacy Policy
							</a>
							<a href="/en/imprint" class="btn hover:variant-filled-surface variant-ghost-surface">
								Imprint
							</a>
						</div>
					{/if}
				</div>

				<div class="flex items-center justify-between p-2 border-t border-surface-500">
					<ul class="flex flex-wrap text-sm font-medium text-center">
						<li class="mr-2">
							<a
								href="#"
								class={`inline-block p-4 rounded-t-lg ${
									$activeTab === 'actions'
										? 'text-primary-500 border-b-2 border-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click|preventDefault={() => setActiveTab('actions')}
							>
								Actions
							</a>
						</li>
						<li class="mr-2">
							<a
								href="#"
								class={`inline-block p-4 rounded-t-lg ${
									$activeTab === 'settings'
										? 'text-primary-500 border-b-2 border-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click|preventDefault={() => setActiveTab('settings')}
							>
								Settings
							</a>
						</li>

						<li class="mr-2">
							<a
								href="#"
								class={`inline-block p-4 rounded-t-lg ${
									$activeTab === 'logs'
										? 'text-primary-500 border-b-2 border-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click|preventDefault={() => setActiveTab('legalinfo')}
							>
								Legal Info
							</a>
						</li>
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

<style>
	@keyframes pulse-smooth {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.animate-pulse-smooth {
		animation: pulse-smooth 2s infinite;
	}
</style>
