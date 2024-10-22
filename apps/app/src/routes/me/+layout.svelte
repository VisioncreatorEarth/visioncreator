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
	me={{ id: session.user.id, email: session.user.email, onboarded: $Me.onboarded }}
	{session}
	isFirstTime={$isFirstTime}
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

<!-- Fading out behind our Modal button -->
<div class="fixed bottom-0 left-0 right-0 z-40 h-24 pointer-events-none">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>
