<script lang="ts">
	import { writable } from 'svelte/store';
	import { Me, eventStream } from '$lib/stores';
	import { onMount } from 'svelte';
	import { eventBus } from '$lib/composables/eventBus';
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

<Modal
	isOpen={$modalOpen}
	activeTab={$activeTab}
	me={{ id: session.user.id, email: session.user.email }}
	{session}
	on:toggleModal={toggleModal}
	on:setActiveTab={(e) => setActiveTab(e.detail)}
	on:navigate={(e) => handleLinkClick(e, e.detail)}
>
	<svelte:fragment slot="actions">
		<ActionButtons me={{ id: session.user.id }} />
	</svelte:fragment>
	<svelte:fragment slot="settings">
		<Newsletter me={{ email: session.user.email, id: session.user.id }} />
	</svelte:fragment>
</Modal>

<div class="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>

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
