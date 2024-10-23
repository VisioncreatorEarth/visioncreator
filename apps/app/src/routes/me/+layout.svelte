<script lang="ts">
	import { dev } from '$app/environment';
	import { Me, eventStream } from '$lib/stores';
	import { onMount } from 'svelte';
	import { eventBus } from '$lib/composables/eventBus';
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	let { session } = data;
	$: ({ session } = data);

	let isModalOpen = false;
	let activeTab = 'actions';
	let isMenuMode = true;
	let isPressed = false;
	let isRecording = false;
	let pressStartTime = 0;
	let lastToggleTime = 0;
	let voiceControlRef;
	const DEBOUNCE_DELAY = 300;

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
					isModalOpen = false;
				}, 1000);
			}
		});

		const handleToggleModal = () => {
			setTimeout(() => {
				isModalOpen = false;
			}, 2000);
		};

		eventBus.on('toggleModal', handleToggleModal);

		return () => {
			unsubscribe();
			eventBus.off('toggleModal', handleToggleModal);
		};
	});

	function toggleModal() {
		isModalOpen = !isModalOpen;
		if (isModalOpen) {
			isMenuMode = true;
			activeTab = 'actions';
		}
	}

	function setActiveTab(event) {
		activeTab = event.detail;
	}

	function handleUpdateView(event: CustomEvent) {
		window.dispatchEvent(new CustomEvent('updateView', { detail: event.detail }));
	}

	function handleMouseDown() {
		isPressed = true;
		pressStartTime = performance.now();

		if (dev) {
			setTimeout(() => {
				if (isPressed && performance.now() - pressStartTime >= 500) {
					isMenuMode = false;
					voiceControlRef?.handleLongPress();
				}
			}, 500);
		}
	}

	function handleMouseUp() {
		const currentTime = performance.now();
		const pressDuration = currentTime - pressStartTime;

		if (isPressed) {
			isPressed = false;
			if (dev && pressDuration >= 500) {
				voiceControlRef?.handleRelease();
			} else if (currentTime - lastToggleTime > DEBOUNCE_DELAY) {
				isMenuMode = true;
				isModalOpen = true;
				lastToggleTime = currentTime;
			}
		}
	}
</script>

<div class="@container overflow-hidden w-full h-full" class:blur-md={isModalOpen && isMenuMode}>
	<slot />
</div>

<!-- Menu Modal -->
{#if isModalOpen && isMenuMode && session}
	<Modal isOpen={true} on:close={toggleModal}>
		<TabMenu {activeTab} on:setActiveTab={setActiveTab} on:close={toggleModal}>
			<svelte:fragment slot="content">
				{#if activeTab === 'actions'}
					<ActionButtons me={{ id: session.user.id }} />
				{:else if activeTab === 'settings'}
					<Newsletter me={{ email: session.user.email, id: session.user.id }} />
				{:else if activeTab === 'legal'}
					<LegalMenu on:navigate={handleLinkClick} />
				{/if}
			</svelte:fragment>
		</TabMenu>
	</Modal>
{/if}

<!-- Voice Control Component -->
{#if session}
	<VoiceControl
		bind:this={voiceControlRef}
		bind:isRecording
		bind:isPressed
		{session}
		on:updateView={handleUpdateView}
	/>
{/if}

<!-- Floating button - hide when modal is open -->
{#if !isModalOpen || !isMenuMode}
	<button
		class="fixed z-50 flex items-center justify-center transition-all duration-300 -translate-x-1/2 border rounded-full shadow-lg bottom-4 left-1/2 w-14 h-14 bg-primary-500 border-tertiary-400 hover:shadow-xl hover:scale-105"
		class:recording-border={isRecording}
		on:mousedown={handleMouseDown}
		on:mouseup={handleMouseUp}
		on:mouseleave={handleMouseUp}
	>
		<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
	</button>
{/if}

<!-- Background gradient -->
<div class="fixed bottom-0 left-0 right-0 z-40 h-24 pointer-events-none">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>

<style>
	.recording-border {
		@apply border-primary-500 scale-110;
		box-shadow: 0 0 0 2px red, 0 0 0 4px rgba(255, 0, 0, 0.5);
		animation: pulse-red 0.3s infinite alternate;
	}

	@keyframes pulse-red {
		0% {
			box-shadow: 0 0 0 2px red, 0 0 0 4px rgba(255, 0, 0, 0.5);
		}
		100% {
			box-shadow: 0 0 0 2px red, 0 0 0 8px rgba(255, 0, 0, 0);
		}
	}
</style>
