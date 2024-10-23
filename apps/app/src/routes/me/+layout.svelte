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
	let emailInput = ''; // For login form
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

	function handleLogin() {
		// Mock login for now
		console.log('Login attempted with:', emailInput);
		// Here you would typically handle the actual login logic
		isModalOpen = false;
	}
</script>

<div class="@container overflow-hidden w-full h-full" class:blur-md={isModalOpen}>
	<slot />
</div>

{#if !session}
	<!-- Login Modal -->
	{#if isModalOpen}
		<Modal isOpen={true} on:close={toggleModal} isLoginModal={true}>
			<div class="p-6">
				<h2 class="mb-4 text-2xl font-bold text-tertiary-100">Welcome to Visioncreator</h2>
				<p class="mb-6 text-tertiary-200">Please enter your email to continue</p>
				<form on:submit|preventDefault={handleLogin} class="space-y-4">
					<input
						type="email"
						bind:value={emailInput}
						placeholder="Enter your email"
						class="w-full p-3 border rounded-lg bg-surface-700 text-tertiary-100 border-tertiary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
					/>
					<button
						type="submit"
						class="w-full px-4 py-3 text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600"
					>
						Continue
					</button>
				</form>
			</div>
		</Modal>
	{/if}

	<!-- Login Button (shown when not authenticated) -->
	{#if !isModalOpen}
		<button
			class="fixed z-50 flex items-center justify-center px-6 transition-all duration-300 -translate-x-1/2 border rounded-full shadow-lg bottom-4 left-1/2 h-14 bg-primary-500 border-tertiary-400 hover:shadow-xl hover:scale-105"
			on:click={() => (isModalOpen = true)}
		>
			<span class="font-medium text-white">Login</span>
		</button>
	{/if}
{:else}
	<!-- Existing authenticated content -->
	{#if isModalOpen && isMenuMode}
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
	<VoiceControl
		bind:this={voiceControlRef}
		bind:isRecording
		bind:isPressed
		{session}
		on:updateView={handleUpdateView}
	/>

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
