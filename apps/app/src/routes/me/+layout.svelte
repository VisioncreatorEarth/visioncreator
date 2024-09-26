<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { fade } from 'svelte/transition';
	import { eventBus } from '$lib/composables/eventBus';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import Newsletter from '$lib/components/Newsletter.svelte';
	import { Me, onboardingMachine, OnboardingState } from '$lib/stores';
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { persist, createLocalStorage } from '@macfja/svelte-persistent-store';
	import { writable, get } from 'svelte/store';

	export let data;

	let modalOpen = persist(writable(false), createLocalStorage(), 'modalOpen');
	let activeTab = persist(writable('actions'), createLocalStorage(), 'activeTab');
	let { session } = data;
	$: ({ session } = data);

	let showTooltip = false;

	const toggleOnboardedMutation = createMutation({
		operationName: 'toggleOnboarded'
	});

	const queryMe = createQuery({
		operationName: 'queryMe',
		input: { id: $Me.id },
		enabled: !!$Me.id
	});

	$: if ($queryMe.data) {
		console.log('Layout: queryMe data received', $queryMe.data);
		updateOnboardingState($queryMe.data.onboarded);
	}

	function updateOnboardingState(remoteOnboarded: boolean) {
		console.log('Layout: Updating onboarding state, remoteOnboarded:', remoteOnboarded);
		if (remoteOnboarded) {
			onboardingMachine.setRemoteOnboarded(true);
			console.log('Layout: Onboarding State set to Finished based on database');
		} else {
			const currentState = get(onboardingMachine);
			console.log('Layout: Current onboarding state:', currentState);
			if (!currentState || currentState.state === OnboardingState.Welcome) {
				onboardingMachine.transition('RESET');
				console.log('Layout: Onboarding State set or kept as Welcome');
			}
		}
	}

	$: {
		showTooltip = $onboardingMachine.state === OnboardingState.Dashboard;
		console.log('Layout: Current onboarding state:', $onboardingMachine.state);
	}

	function handleModalButtonClick() {
		if (showTooltip) {
			onboardingMachine.transition('TOOLTIP_CLICKED');
			if (!$queryMe.data?.onboarded) {
				$toggleOnboardedMutation.mutate({ id: $Me.id });
				console.log('Layout: Updating onboarded status in database');
			}
		}
		toggleModal();
		console.log('Layout: Modal button clicked, new onboarding state:', $onboardingMachine.state);
	}

	onMount(() => {
		console.log('Layout: Component mounted');
		modalOpen.set(false);

		eventBus.on('toggleModal', () => {
			setTimeout(() => {
				modalOpen.set(false);
			}, 1000);
		});

		return () => {
			eventBus.off('toggleModal', () => {});
		};
	});

	afterUpdate(() => {
		console.log(
			'Layout: After update, current state:',
			$onboardingMachine.state,
			'queryMe data:',
			$queryMe.data
		);
		if ($queryMe.data?.onboarded && $onboardingMachine.state !== OnboardingState.Finished) {
			console.log('Layout: Forcing state to Finished due to remote onboarded flag');
			onboardingMachine.setRemoteOnboarded(true);
		}
	});

	function toggleModal(event?: MouseEvent) {
		if (!event || event.target === event.currentTarget) {
			modalOpen.update((n) => !n);
		}
	}

	function setActiveTab(tab: string) {
		activeTab.set(tab);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			modalOpen.set(false);
		}
	}
</script>

<div
	class={`@container overflow-hidden w-full h-full ${$modalOpen ? 'blur-md' : ''}`}
	style="-webkit-overflow-scrolling: touch;"
>
	<slot />
</div>

{#if $onboardingMachine.state === OnboardingState.Dashboard || $onboardingMachine.state === OnboardingState.Finished}
	<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2">
		<div class="relative flex flex-col items-center">
			{#if showTooltip}
				<div
					class="absolute bottom-full mb-2 variant-ghost-secondary rounded-lg animate-pulse"
					in:fade={{ duration: 300 }}
					style="z-index: 50; width: max-content; left: 50%; transform: translateX(-50%);"
				>
					<div class="flex items-center px-4 py-2 whitespace-nowrap">
						<span>Open menu here</span>
					</div>
					<div class="arrow-down text-secondary-500" />
				</div>
			{/if}
			<button
				class="flex items-center justify-center rounded-full bg-secondary-500 w-14 h-14 border border-tertiary-400 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
				class:hidden={$modalOpen}
				on:click={handleModalButtonClick}
			>
				<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
			</button>
		</div>
	</div>
{/if}

{#if $modalOpen}
	<div
		class="fixed inset-0 flex items-end justify-center p-4 sm:p-6"
		on:click={toggleModal}
		on:keydown={handleKeyDown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		transition:fade
	>
		{#if $Me}
			<div
				class="w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
				on:click|stopPropagation={() => {}}
				role="document"
			>
				<!-- Modal content -->
				<div class="flex flex-col flex-grow w-full h-full p-4 overflow-hidden">
					{#if $activeTab === 'actions'}
						<ActionButtons me={{ id: session?.user?.id || '' }} />
					{:else if $activeTab === 'settings'}
						<Newsletter me={{ email: session?.user?.email || '', id: session?.user?.id || '' }} />
					{:else if $activeTab === 'legalinfo'}
						<div class="flex space-x-4 rounded-lg">
							<a
								href="/en/privacy-policy"
								class="btn hover:variant-filled-surface variant-ghost-surface"
							>
								Privacy Policy
							</a>
							<a href="/en/imprint" class="btn hover:variant-filled-surface variant-ghost-surface">
								Site Notice
							</a>
						</div>
					{/if}
				</div>

				<!-- Modal footer -->
				<div class="flex items-center justify-between p-2 border-t border-surface-500">
					<!-- Tab buttons -->
					<ul class="flex flex-wrap text-sm font-medium text-center">
						<li class="mr-2">
							<button
								class={`inline-block p-4 rounded-t-lg ${
									$activeTab === 'actions'
										? 'text-primary-500 border-b-2 border-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click={() => setActiveTab('actions')}
							>
								Actions
							</button>
						</li>
						<li class="mr-2">
							<button
								class={`inline-block p-4 rounded-t-lg ${
									$activeTab === 'settings'
										? 'text-primary-500 border-b-2 border-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click={() => setActiveTab('settings')}
							>
								Settings
							</button>
						</li>
						<li class="mr-2">
							<button
								class={`inline-block p-4 rounded-t-lg ${
									$activeTab === 'legalinfo'
										? 'text-primary-500 border-b-2 border-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click={() => setActiveTab('legalinfo')}
							>
								Legal Info
							</button>
						</li>
					</ul>
					<!-- Close button -->
					<button
						class="p-2 text-tertiary-400 hover:text-tertiary-300"
						on:click={() => modalOpen.set(false)}
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
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.arrow-down {
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid var(--color-secondary-500);
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%);
	}
</style>
