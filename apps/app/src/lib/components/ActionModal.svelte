<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import TabMenu from './TabMenu.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import Newsletter from './Newsletter.svelte';
	import LegalMenu from './LegalMenu.svelte';
	import Auth from './Auth.svelte';
	import MyIntent from './MyIntent.svelte';
	import { onMount } from 'svelte';
	import { dynamicView } from '$lib/stores';

	export let session: any;
	export let supabase: any;

	const dispatch = createEventDispatcher();

	// State management
	let isModalOpen = false;
	let activeTab = 'actions';
	let isMenuMode = true;
	let modalType: 'login' | 'signup' | 'menu' = 'menu';
	let isPressed = false;
	let isRecording = false;
	let pressStartTime = 0;
	let lastToggleTime = 0;
	let myIntentRef: any;
	let isIntentModalOpen = false;
	const DEBOUNCE_DELAY = 300;

	// Keep track of the initial modal type to prevent unwanted changes
	let currentModalType: 'login' | 'signup' | 'menu' = 'menu';

	$: {
		if (myIntentRef && dev) {
			// Keep only if absolutely necessary for debugging in development
			console.error('[Error] MyIntent reference issue:', myIntentRef);
		}
	}

	function handleClose(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			isModalOpen = false;
		}
	}

	function handleContentClick(event: MouseEvent) {
		event.stopPropagation();
	}

	function handleMouseDown() {
		isPressed = true;
		pressStartTime = performance.now();

		setTimeout(() => {
			if (isPressed && performance.now() - pressStartTime >= 500) {
				isIntentModalOpen = true;
				if (isIntentModalOpen && myIntentRef) {
					myIntentRef.handleLongPressStart();
				}
			}
			if (isPressed && performance.now() - pressStartTime < 500) {
				if (session) {
					toggleModal('menu');
				} else {
					toggleModal('login');
				}
			}
		}, 500);
	}

	function handleMouseUp() {
		const currentTime = performance.now();
		const pressDuration = currentTime - pressStartTime;

		if (isPressed) {
			isPressed = false;
			if (pressDuration >= 500) {
				if (isIntentModalOpen && myIntentRef) {
					myIntentRef.handleLongPressEnd();
				}
			} else if (currentTime - lastToggleTime > DEBOUNCE_DELAY) {
				if (session) {
					toggleModal('menu');
				} else {
					toggleModal('login');
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

		currentModalType = type;
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
		const view = event.detail.view;
		if (view) {
			window.dispatchEvent(
				new CustomEvent('updateView', {
					detail: view,
					bubbles: true,
					composed: true
				})
			);
			isModalOpen = false;
			goto('/me');
		}
	}

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		goto(href);
	}

	function handleModalOpen(event: CustomEvent) {
		const { type } = event.detail;
		toggleModal(type);
	}

	function handleSignOut() {
		isModalOpen = false;
		dispatch('signout');
	}

	function handleIntentClose() {
		isIntentModalOpen = false;
	}

	// Add event listener for view updates
	onMount(() => {
		const handleViewUpdate = (event: CustomEvent) => {
			const view = event.detail;
			if (view) {
				// Stop event propagation
				event.stopPropagation();

				// Update the dynamicView store directly instead of dispatching another event
				dynamicView.update((store) => ({
					...store,
					view: view
				}));
			}
		};

		window.addEventListener('updateView', handleViewUpdate as EventListener);

		return () => {
			window.removeEventListener('updateView', handleViewUpdate as EventListener);
		};
	});
</script>

<svelte:window on:openModal={handleModalOpen} />

{#if session}
	<MyIntent
		bind:this={myIntentRef}
		isOpen={isIntentModalOpen}
		{session}
		on:close={handleIntentClose}
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
		class="fixed z-50 -translate-x-1/2 btn btn-sm variant-ghost-tertiary hover:variant-ghost-primary bottom-4 left-1/2"
		on:click={() => toggleModal('login')}
	>
		<span>Login</span>
	</button>
{/if}

{#if isModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6 bg-surface-900/50 backdrop-blur-sm"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="relative z-10 w-full bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			class:max-w-6xl={currentModalType === 'menu'}
			class:max-w-md={currentModalType !== 'menu'}
			on:click={handleContentClick}
		>
			{#if currentModalType === 'login' || currentModalType === 'signup'}
				<div class="relative flex flex-col">
					<Auth modalType={currentModalType} {supabase} />
					<div class="flex justify-center mb-3">
						<button
							class="flex items-center justify-center w-8 h-8 transition-colors rounded-full bg-surface-700 hover:bg-surface-800 text-tertiary-400 hover:text-tertiary-300"
							on:click={() => toggleModal()}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="w-4 h-4"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			{:else if currentModalType === 'menu'}
				<div class="relative">
					<TabMenu {activeTab} on:setActiveTab={setActiveTab}>
						<svelte:fragment slot="content">
							{#if activeTab === 'actions'}
								<ActionButtons
									{session}
									{supabase}
									on:signout={handleSignOut}
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
					<button
						class="absolute flex items-center justify-center w-8 h-8 transition-colors rounded-full bottom-2 right-4 bg-surface-700 hover:bg-surface-800 text-tertiary-400 hover:text-tertiary-300"
						on:click={() => toggleModal()}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-4 h-4"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

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
