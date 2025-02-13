<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import TabMenu from './TabMenu.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import Newsletter from './Newsletter.svelte';
	import Auth from './Auth.svelte';
	import MyIntent from './MyIntent.svelte';
	import { dynamicView } from '$lib/stores';
	import LegalAndPrivacyPolicy from './LegalAndPrivacyPolicy.svelte';
	import { page } from '$app/stores';
	import ViewMenu from './ViewMenu.svelte';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import ProposalDetailView from './ProposalDetailView.svelte';
	import { view as defaultView } from '$lib/views/Default';
	import ProposalProfile from './ProposalProfile.svelte';

	export let session: any;
	export let supabase: any;
	export let customView: any = null;

	const dispatch = createEventDispatcher();

	// State management
	let isModalOpen = false;
	let activeTab = 'views';
	let isMenuMode = true;
	let isPressed = false;
	let isRecording = false;
	let isProcessing = false;
	let pressStartTime = 0;
	let lastToggleTime = 0;
	let myIntentRef: MyIntent;
	let isIntentModalOpen = false;
	let selectedView: any = null;
	const DEBOUNCE_DELAY = 300;

	// Keep track of the initial modal type
	let currentModalType:
		| 'login'
		| 'signup'
		| 'menu'
		| 'legal-and-privacy-policy'
		| 'custom-view'
		| 'aside-view' = 'menu';

	// Add component mapping
	const COMPONENT_MAP = {
		ProposalDetail: ProposalDetailView,
		Default: ComposeView,
		ProposalProfile: ProposalProfile
	};

	// Add helper to parse URL props
	function parseUrlProps(propsString: string | null): Record<string, string> {
		if (!propsString) return {};
		try {
			return propsString.split(',').reduce((acc, pair) => {
				const [key, value] = pair.split('=');
				acc[key] = value;
				return acc;
			}, {} as Record<string, string>);
		} catch (e) {
			console.error('Failed to parse props:', e);
			return {};
		}
	}

	function handleClose(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			if (currentModalType === 'custom-view') {
				// Clean up URL - remove modal, props, and any view-specific params
				const url = new URL(window.location.href);
				url.searchParams.delete('modal');
				url.searchParams.delete('props');

				// Keep only the base view parameter
				const currentView = url.searchParams.get('view');
				url.searchParams.set('view', 'Proposals');

				goto(url.toString(), { replaceState: true });
			}
			isModalOpen = false;
		}
	}

	function handleContentClick(event: MouseEvent) {
		event.stopPropagation();
	}

	async function handleMouseDown() {
		isPressed = true;
		pressStartTime = performance.now();

		// If we're recording, handle the end call click immediately
		if (isRecording) {
			if (myIntentRef) {
				myIntentRef.stopCall();
			}
			isPressed = false; // Reset pressed state
			return;
		}

		// Otherwise, handle normal long press logic
		setTimeout(async () => {
			if (isPressed) {
				if (performance.now() - pressStartTime >= 500) {
					isIntentModalOpen = true;
					await tick();
					if (isIntentModalOpen && myIntentRef?.handleLongPressStart) {
						await myIntentRef.handleLongPressStart();
					}
				}
			}
		}, 500);
	}

	async function handleMouseUp() {
		const currentTime = performance.now();
		const pressDuration = currentTime - pressStartTime;

		if (isPressed) {
			isPressed = false;
			// Only handle menu toggle for short presses when not recording
			// and when not starting a long press
			if (!isRecording && pressDuration < 500 && currentTime - lastToggleTime > DEBOUNCE_DELAY) {
				if (session) {
					toggleModal('menu');
				} else {
					toggleModal('login');
				}
				lastToggleTime = currentTime;
			}
		}
	}

	function toggleModal(
		type?: 'login' | 'signup' | 'menu' | 'legal-and-privacy-policy' | 'custom-view' | 'aside-view'
	) {
		if (!type) {
			if (currentModalType === 'custom-view') {
				// Clean up URL params
				const url = new URL(window.location.href);
				url.searchParams.delete('modal');
				url.searchParams.delete('props');

				// Keep only the base view parameter
				url.searchParams.set('view', 'Proposals');

				goto(url.toString(), { replaceState: true });
			} else if (
				currentModalType === 'legal-and-privacy-policy' &&
				$page.url.searchParams.has('open')
			) {
				const url = new URL(window.location.href);
				url.searchParams.delete('open');
				goto(url.pathname + url.search, { replaceState: true });
			}
			isModalOpen = false;
			return;
		}

		isModalOpen = false;
		currentModalType = type;

		setTimeout(() => {
			isModalOpen = true;
			isMenuMode = type === 'menu';

			if (type === 'menu') {
				activeTab = 'actions';
			}
		}, 0);
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
		const { type, component } = event.detail;

		if (type === 'aside-view' && component) {
			currentModalType = 'aside-view';
			customView = {
				component: COMPONENT_MAP[component],
				props: parseUrlProps($page.url.searchParams.get('asideProps'))
			};
			isModalOpen = true;
		} else if (type === 'legal-and-privacy-policy') {
			handleLegalModal();
		} else if (type === 'custom-view' && component) {
			currentModalType = 'custom-view';

			// Get props from URL if available
			const urlProps = parseUrlProps($page.url.searchParams.get('props'));

			if (component === 'Default') {
				customView = {
					component: COMPONENT_MAP[component],
					props: { view: defaultView }
				};
			} else if (component === 'ProposalDetail') {
				customView = {
					component: COMPONENT_MAP[component],
					props: {
						proposalId: urlProps.id,
						onClose: () => toggleModal()
					}
				};
			} else {
				customView = {
					component: COMPONENT_MAP[component],
					props: { ...urlProps, onClose: () => toggleModal() }
				};
			}
			isModalOpen = true;
		} else {
			toggleModal(type);
		}
	}

	function handleSignOut() {
		isModalOpen = false; // Close modal immediately
		currentModalType = 'menu'; // Reset modal type

		// The redirect will happen automatically from the server
		dispatch('signout');
	}

	function handleIntentClose() {
		isIntentModalOpen = false;
	}

	// Function to specifically handle legal modal
	function handleLegalModal() {
		// Force close any existing modal first
		isModalOpen = false;
		currentModalType = 'legal-and-privacy-policy';

		// Small timeout to ensure proper state reset
		setTimeout(() => {
			isModalOpen = true;
			isMenuMode = false;
		}, 0);
	}

	function handleIntentStateChange(rec: boolean, proc: boolean) {
		isRecording = rec;
		isProcessing = proc;
	}

	function handleViewSelect({ detail: { view } }: CustomEvent) {
		selectedView = view;
		dynamicView.set(view);
		dispatch('closeModal');
	}

	function handleEpisodesClick() {
		dispatch('closeModal');
	}

	// Update onMount to better handle legal modal trigger
	onMount(() => {
		const handleViewUpdate = (event: CustomEvent) => {
			const view = event.detail;
			if (view) {
				event.stopPropagation();
				dynamicView.update((store) => ({
					...store,
					view: view
				}));
			}
		};

		// Simplified legal trigger handler
		const handleLegalTrigger = () => {
			handleLegalModal();
		};

		const handleCloseModal = () => {
			toggleModal();
		};

		const handleCustomView = (event: CustomEvent) => {
			const viewConfig = event.detail;
			if (viewConfig) {
				currentModalType = 'custom-view';
				customView = viewConfig;
				isModalOpen = true;
			}
		};

		window.addEventListener('updateView', handleViewUpdate as EventListener);
		window.addEventListener('legalModalTrigger', handleLegalTrigger);
		window.addEventListener('openModal', handleModalOpen);
		window.addEventListener('closeModal', handleCloseModal);
		window.addEventListener('customView', handleCustomView as EventListener);

		return () => {
			window.removeEventListener('updateView', handleViewUpdate as EventListener);
			window.removeEventListener('legalModalTrigger', handleLegalTrigger);
			window.removeEventListener('openModal', handleModalOpen);
			window.removeEventListener('closeModal', handleCloseModal);
			window.removeEventListener('customView', handleCustomView as EventListener);
		};
	});

	// Add function to handle aside toggle
	function toggleAside(side: 'left' | 'right', component: string, props?: Record<string, string>) {
		const url = new URL(window.location.href);
		const currentAside = url.searchParams.get(
			`aside${side.charAt(0).toUpperCase() + side.slice(1)}`
		);

		if (currentAside === component) {
			// If same component, remove it (toggle off)
			url.searchParams.delete(`aside${side.charAt(0).toUpperCase() + side.slice(1)}`);
			if (props) {
				url.searchParams.delete('asideProps');
			}
		} else {
			// Set new component
			url.searchParams.set(`aside${side.charAt(0).toUpperCase() + side.slice(1)}`, component);
			if (props) {
				url.searchParams.set(
					'asideProps',
					Object.entries(props)
						.map(([k, v]) => `${k}=${v}`)
						.join(',')
				);
			}
		}

		goto(url.toString(), { replaceState: true });
	}

	// Simplified and more robust keyboard handler
	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && isModalOpen) {
			event.preventDefault(); // Prevent any default browser behavior
			toggleModal(); // Use toggleModal instead of handleClose for more reliable closing
		}
	}
</script>

<!-- Add window event binding for keyboard events -->
<svelte:window on:keydown={handleEscape} />

<!-- Update the nav pills container - Only show when authenticated -->
<!-- Global gradient overlay for all modals -->
{#if isModalOpen || isIntentModalOpen}
	<div class="fixed inset-x-0 bottom-0 z-40 w-screen pointer-events-none h-96">
		<div
			class="absolute inset-0 w-screen bg-gradient-to-t to-transparent from-surface-900 via-surface-900/50"
		/>
	</div>
{/if}

<div class="fixed z-50 flex items-center justify-center gap-3 -translate-x-1/2 bottom-4 left-1/2">
	{#if session}
		{#if $page.url.pathname !== '/me' || $page.url.searchParams.get('view') === 'Proposals'}
			<!-- Left Nav Pill - Ghost Style -->
			<button
				class="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-full shadow-lg btn-ghost variant-ghost-secondary hover:variant-ghost-primary"
				on:click={() => {
					if (typeof window !== 'undefined' && window.innerWidth < 1024) {
						window.dispatchEvent(
							new CustomEvent('openModal', {
								detail: {
									type: 'aside-view',
									component: 'ProposalProfile'
								}
							})
						);
					} else {
						toggleAside('left', 'ProposalProfile');
					}
				}}
			>
				<Icon icon="heroicons:user-circle" class="w-5 h-5" />
			</button>
		{/if}

		{#if session}
			<MyIntent
				bind:this={myIntentRef}
				{session}
				isOpen={isIntentModalOpen}
				onRecordingStateChange={(rec, proc) => {
					isRecording = rec;
					isProcessing = proc;
				}}
				on:close={handleIntentClose}
				style="display: none;"
			/>

			<!-- Main Action Button -->
			<button
				class="flex items-center justify-center transition-all duration-300 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
				class:bg-error-500={isRecording}
				class:bg-surface-800={isProcessing}
				class:bg-surface-600={!isRecording && !isProcessing}
				class:w-14={!isRecording}
				class:h-14={true}
				class:w-28={isRecording}
				on:mousedown={handleMouseDown}
				on:mouseup={handleMouseUp}
				on:mouseleave={handleMouseUp}
				on:touchstart|preventDefault={handleMouseDown}
				on:touchend|preventDefault={handleMouseUp}
				on:touchcancel|preventDefault={handleMouseUp}
				style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none; touch-action: none;"
			>
				{#if isRecording}
					<div class="flex items-center gap-2">
						<div class="w-3 h-3 bg-white rounded-full animate-pulse" />
						<span class="text-sm font-medium text-white">End Call</span>
					</div>
				{:else if isProcessing}
					<svg
						class="w-6 h-6 text-tertiary-200"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
						/>
					</svg>
				{:else}
					<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
				{/if}
			</button>
		{/if}

		{#if $page.url.pathname !== '/me' || $page.url.searchParams.get('view') === 'Proposals'}
			<!-- Right Nav Pill - Ghost Style -->
			<button
				class="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-full shadow-lg btn-ghost variant-ghost-secondary hover:variant-ghost-primary"
				on:click={() => goto('/me', { replaceState: true })}
			>
				<Icon icon="heroicons:home" class="w-5 h-5" />
			</button>
		{/if}
	{:else if !isModalOpen}
		<!-- Login Button -->
		<button class="btn btn-sm variant-ghost-secondary" on:click={() => toggleModal('login')}>
			<span>Login</span>
		</button>
	{/if}
</div>

{#if isModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm bg-surface-900/40"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="relative z-10 w-[calc(100%-1rem)] md:w-full bg-surface-700 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden mb-[3rem] mx-2 md:mx-0"
			class:max-w-6xl={currentModalType === 'menu' || currentModalType === 'custom-view'}
			class:max-w-md={currentModalType === 'login' || currentModalType === 'signup'}
			class:max-w-2xl={currentModalType === 'legal-and-privacy-policy'}
			class:h-[90vh]={currentModalType === 'custom-view' || currentModalType === 'aside-view'}
			on:click={handleContentClick}
		>
			{#if currentModalType === 'login' || currentModalType === 'signup'}
				<div class="relative flex flex-col">
					<Auth modalType={currentModalType} {supabase} />
				</div>
			{:else if currentModalType === 'menu'}
				<div class="relative">
					<TabMenu {activeTab} on:setActiveTab={setActiveTab} on:closeModal={() => toggleModal()}>
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
							{/if}
						</svelte:fragment>
					</TabMenu>
					<div class="pt-2 mt-2 border-t border-surface-700/30">
						<ViewMenu
							{selectedView}
							layout="horizontal"
							showLabels={true}
							on:viewSelect={handleViewSelect}
							on:episodesClick={handleEpisodesClick}
							on:close={() => toggleModal()}
						/>
					</div>
				</div>
			{:else if currentModalType === 'legal-and-privacy-policy'}
				<div class="relative">
					<LegalAndPrivacyPolicy on:close={() => toggleModal()} />
				</div>
			{:else if currentModalType === 'custom-view' && customView}
				<div class="grid w-full h-full">
					<div class="h-full overflow-hidden">
						<svelte:component
							this={customView.component}
							{...customView.props}
							onClose={() => toggleModal()}
						/>
					</div>
				</div>
			{:else if currentModalType === 'aside-view' && customView}
				<div class="flex-1 overflow-y-auto">
					<svelte:component this={customView.component} {...customView.props} />
				</div>
			{/if}
		</div>

		<button
			class="absolute z-20 flex items-center justify-center transition-all duration-200 -translate-x-1/2 border rounded-full shadow-lg bottom-2 w-9 h-9 left-1/2 bg-tertiary-500 text-surface-800 hover:text-surface-800 hover:shadow-xl hover:scale-105 border-surface-700/50"
			on:click={() => toggleModal()}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2.5"
				stroke="currentColor"
				class="w-4 h-4"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}
