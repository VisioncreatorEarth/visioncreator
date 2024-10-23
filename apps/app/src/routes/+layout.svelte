<script lang="ts">
	import '../app.postcss';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	import { invalidate } from '$app/navigation';
	import { client } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TabMenu from '$lib/components/TabMenu.svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import LegalMenu from '$lib/components/LegalMenu.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import VoiceControl from '$lib/components/VoiceControl.svelte';
	import { browser } from '$app/environment';

	export let data: LayoutData;
	let { supabase, session, queryClient } = data;
	$: ({ supabase, session, queryClient } = data);

	// State management
	let isModalOpen = false;
	let activeTab = 'actions';
	let isMenuMode = true;
	let modalType: 'login' | 'signup' | 'menu' = 'menu';
	let isPressed = false;
	let isRecording = false;
	let pressStartTime = 0;
	let lastToggleTime = 0;
	let voiceControlRef: any;
	const DEBOUNCE_DELAY = 300;

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
				if (session) {
					modalType = 'menu';
					isMenuMode = true;
					activeTab = 'actions';
					isModalOpen = true;
				} else {
					modalType = 'login';
					isMenuMode = false;
					isModalOpen = true;
				}
				lastToggleTime = currentTime;
			}
		}
	}

	function toggleModal(type?: 'login' | 'signup' | 'menu') {
		if (!type) {
			isModalOpen = false;
			return;
		}
		modalType = type;
		isModalOpen = true;
		isMenuMode = type === 'menu';
		if (type === 'menu') {
			activeTab = 'actions';
		}
	}

	function setActiveTab(event: CustomEvent) {
		activeTab = event.detail;
	}

	function handleUpdateView(event: CustomEvent) {
		window.dispatchEvent(
			new CustomEvent('updateView', {
				detail: event.detail,
				bubbles: true,
				composed: true
			})
		);
		isModalOpen = false;
		goto('/me');
	}

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		goto(href);
	}

	async function handleLogout() {
		try {
			console.log('Starting logout process...');

			// First reset UI state
			isModalOpen = false;
			isMenuMode = true;
			activeTab = 'actions';

			// Then handle logout
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// Force immediate auth state update
			await invalidate('supabase:auth');

			// Redirect only in browser
			if (browser) {
				console.log('Logout successful, redirecting...');
				window.location.href = '/';
			}
		} catch (error) {
			console.error('Error during logout:', error);
			// Redirect only in browser
			if (browser) {
				window.location.href = '/';
			}
		}
	}

	onMount(() => {
		const { data: authData } = supabase.auth.onAuthStateChange(async (event, _session) => {
			console.log('Auth state changed:', event);

			if (event === 'SIGNED_OUT') {
				console.log('User signed out, resetting state...');

				isModalOpen = false;
				isMenuMode = true;
				activeTab = 'actions';

				// Force immediate redirect if not already on root
				if (browser && window.location.pathname !== '/') {
					window.location.replace('/');
				}
			}
		});

		return () => {
			if (authData?.subscription) {
				authData.subscription.unsubscribe();
			}
		};
	});

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	}

	// Watch for session changes - only in browser
	$: if (browser && !session && window.location.pathname !== '/') {
		window.location.replace('/');
	}
</script>

<!-- Wrap everything in QueryClientProvider -->
<QueryClientProvider client={queryClient}>
	<!-- Main content -->
	<div class="@container overflow-hidden w-full h-full" class:blur-md={isModalOpen}>
		<slot />
	</div>

	<!-- Unified Modal System -->
	{#if isModalOpen}
		<Modal isOpen={true} on:close={() => toggleModal()} isLoginModal={modalType !== 'menu'}>
			{#if modalType === 'login' || modalType === 'signup'}
				<Auth {modalType} {supabase} />
			{:else if modalType === 'menu'}
				<TabMenu {activeTab} on:setActiveTab={setActiveTab} on:close={() => toggleModal()}>
					<svelte:fragment slot="content">
						{#if activeTab === 'actions'}
							<ActionButtons
								{session}
								{supabase}
								on:signout={() => {
									isModalOpen = false;
									isMenuMode = true;
									activeTab = 'actions';
								}}
								on:updateView={handleUpdateView}
							/>
						{:else if activeTab === 'settings'}
							<Newsletter
								me={{
									email: session?.user?.email,
									id: session?.user?.id
								}}
							/>
						{:else if activeTab === 'legal'}
							<LegalMenu on:navigate={handleLinkClick} />
						{/if}
					</svelte:fragment>
				</TabMenu>
			{/if}
		</Modal>
	{/if}

	<!-- Conditional rendering of VoiceControl and Action Button -->
	{#if session}
		<VoiceControl
			bind:this={voiceControlRef}
			bind:isRecording
			bind:isPressed
			{session}
			on:updateView={handleUpdateView}
		/>

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
	{:else if !isModalOpen}
		<button
			class="fixed z-50 flex items-center justify-center px-6 transition-all duration-300 -translate-x-1/2 border rounded-full shadow-lg bottom-4 left-1/2 h-14 bg-primary-500 border-tertiary-400 hover:shadow-xl hover:scale-105"
			on:click={() => toggleModal('login')}
		>
			<span class="font-medium text-white">Login</span>
		</button>
	{/if}
</QueryClientProvider>

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
