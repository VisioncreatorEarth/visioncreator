<script lang="ts">
	import { fade } from 'svelte/transition';
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Hominio from './Hominio.svelte';

	export let isOpen: boolean;
	export let activeTab: string;
	export let me: { id: string; email: string; onboarded: boolean };
	export let isFirstTime: boolean;

	const dispatch = createEventDispatcher();

	let isRecording = false;
	let transcript = '';
	let longPressTimer: ReturnType<typeof setTimeout>;
	let buttonElement: HTMLButtonElement;
	let pressStartTime: number;
	let pressTimer: ReturnType<typeof setTimeout>;

	let lastToggleTime = 0;
	const DEBOUNCE_DELAY = 300; // milliseconds

	let isPressed = false;

	function setActiveTab(tab: string) {
		dispatch('setActiveTab', tab);
	}

	function toggleModal() {
		dispatch('toggleModal');
	}

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		dispatch('navigate', href);
	}

	function handleMouseDown() {
		isPressed = true;
		pressStartTime = performance.now();
		longPressTimer = setTimeout(() => {
			isRecording = true;
			transcript = 'Recording...';
			console.log(`Long press detected after ${performance.now() - pressStartTime}ms`);
		}, 500);
	}

	function handleMouseUp() {
		isPressed = false;
		const currentTime = performance.now();
		const pressDuration = currentTime - pressStartTime;
		clearTimeout(longPressTimer);

		console.log(`Press duration: ${pressDuration}ms`);

		if (currentTime - lastToggleTime > DEBOUNCE_DELAY) {
			if (isRecording) {
				isRecording = false;
				transcript = 'Mocked transcription: Hello, how can I help you?';
				setTimeout(() => {
					transcript = '';
				}, 3000);
				console.log(`Recording stopped after ${pressDuration}ms`);
				// Don't toggle the modal after recording
			} else if (pressDuration < 500) {
				console.log(`Modal toggled after ${pressDuration}ms`);
				toggleModal();
				lastToggleTime = currentTime;
			} else {
				console.log(`Long press detected, but not recording. No action taken.`);
			}
		} else {
			console.log(`Toggle ignored due to debounce (${currentTime - lastToggleTime}ms)`);
		}
	}

	onMount(() => {
		buttonElement?.addEventListener('touchstart', handleMouseDown);
		buttonElement?.addEventListener('touchend', handleMouseUp);
		return () => {
			buttonElement?.removeEventListener('touchstart', handleMouseDown);
			buttonElement?.removeEventListener('touchend', handleMouseUp);
		};
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6"
		on:click={toggleModal}
		on:keydown={(e) => e.key === 'Escape' && toggleModal()}
		role="dialog"
		aria-modal="true"
		transition:fade
	>
		<div
			class="w-full max-w-6xl bg-surface-600 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden"
			on:click|stopPropagation
		>
			<div class="flex flex-col flex-grow w-full h-full p-4 overflow-hidden">
				{#if activeTab === 'hominio'}
					<Hominio />
				{:else if activeTab === 'actions'}
					<slot name="actions" />
				{:else if activeTab === 'settings'}
					<slot name="settings" />
				{:else if activeTab === 'legal'}
					<div class="flex flex-col items-start justify-center w-full h-full">
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

			<!-- Tab navigation -->
			<div class="flex items-center justify-between p-2 border-t border-surface-500">
				<ul class="flex flex-wrap text-sm font-medium text-center sm:text-md">
					{#each ['hominio', 'actions', 'settings', 'legal'] as tab}
						<li class="relative px-0.5 sm:px-1">
							<button
								class={`inline-block px-2 py-2 sm:px-3 rounded-lg transition-colors duration-200 ${
									activeTab === tab
										? 'text-primary-500'
										: 'text-tertiary-400 hover:text-tertiary-300'
								}`}
								on:click={() => setActiveTab(tab)}
							>
								{tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
							{#if activeTab === tab}
								<div
									class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/4 h-0.5 bg-primary-500 rounded-full"
								/>
							{/if}
						</li>
					{/each}
				</ul>
				<button class="p-2 text-tertiary-400 hover:text-tertiary-300" on:click={toggleModal}>
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
	</div>
{/if}

<div class="fixed bottom-0 left-0 right-0 z-40 h-24 pointer-events-none">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>

<div
	class="fixed z-50 flex items-center justify-center transform -translate-x-1/2 bottom-4 left-1/2"
>
	<div class="relative flex items-center">
		{#if transcript}
			<div class="absolute w-64 mb-2 transform -translate-x-1/2 bottom-full left-1/2">
				<div class="p-3 rounded-lg shadow-lg bg-surface-700">
					<p class="text-tertiary-300">{transcript}</p>
				</div>
			</div>
		{/if}
		{#if isFirstTime && me.onboarded}
			<div
				class="absolute flex flex-col items-center mb-2 transform -translate-x-1/2 bottom-full left-1/2 whitespace-nowrap animate-pulse"
			>
				<span
					class="px-3 py-1 text-xs font-semibold rounded-lg shadow-lg btn variant-filled-tertiary bg-secondary-500/95"
					>this is your menu</span
				>
				<div
					class="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-tertiary-500 -mt-[1px]"
				/>
			</div>
		{/if}
		{#if me.onboarded}
			<div class="relative">
				<button
					bind:this={buttonElement}
					class="flex items-center justify-center transition-all duration-300 border rounded-full shadow-lg bg-primary-500 w-14 h-14 border-tertiary-400 hover:shadow-xl hover:scale-105"
					class:hidden={isOpen}
					class:recording-border={isRecording || isPressed}
					on:mousedown={handleMouseDown}
					on:mouseup={handleMouseUp}
					on:mouseleave={handleMouseUp}
				>
					<img src="/logo.png" alt="Visioncreator logo" class="pointer-events-none" />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
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

	.recording-border {
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
