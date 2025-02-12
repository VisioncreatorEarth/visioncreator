<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import { view as updateNameView } from '$lib/views/UpdateName';
	import { view as sendMailView } from '$lib/views/SendMail';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import Icon from '@iconify/svelte';
	import type { View } from '$lib/types/view';

	export let session: any;
	export let supabase: any;

	let loading = false;
	let logoutStatus = '';
	let showComposeView = false;
	let showContactUs = false;
	const dispatch = createEventDispatcher();

	let currentView: View = updateNameView;

	async function handleSignOut() {
		if (loading) return;
		loading = true;
		logoutStatus = 'Signing out...';

		try {
			const response = await fetch('/auth/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to sign out');
			}

			dispatch('signout');
			window.location.href = '/';
		} catch (error: unknown) {
			console.error('Error during logout:', error);
			logoutStatus = `Error signing out: ${
				error instanceof Error ? error.message : 'Unknown error'
			}`;
			loading = false;
		}
	}

	const toggleComposeView = (view: View) => {
		currentView = view;
		showComposeView = !showComposeView;
		showContactUs = false;
	};

	const toggleContactUs = () => {
		showContactUs = !showContactUs;
		showComposeView = false;
	};
</script>

<div class="@container">
	{#if loading}
		<div class="flex flex-col items-center justify-center p-6 text-center">
			<div class="flex items-center justify-center gap-2 mb-4">
				<svg
					class="w-8 h-8 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				<span class="text-lg">{logoutStatus}</span>
			</div>
		</div>
	{:else if showComposeView}
		<div class="px-4">
			<ComposeView
				view={currentView}
				on:close={() => (showComposeView = false)}
				on:updateView
				showSpacer={false}
				{session}
			/>
		</div>
	{:else if showContactUs}
		<div class="px-4">
			<ComposeView
				view={sendMailView}
				on:close={toggleContactUs}
				on:updateView
				showSpacer={false}
				{session}
			/>
		</div>
	{:else}
		<div class="flex flex-row items-center gap-2 pb-2">
			<button
				on:click={handleSignOut}
				class="btn btn-sm sm:btn-md variant-ghost-surface !p-2 md:!p-3"
				disabled={loading}
			>
				<Icon icon="mdi:logout" class="w-4 h-4 sm:w-5 sm:h-5" />
			</button>
			<button
				class="flex-grow btn btn-sm sm:btn-md variant-ghost-surface"
				on:click={() => toggleComposeView(updateNameView)}
				disabled={loading}
			>
				<Icon icon="mdi:account-edit" class="w-4 h-4 sm:w-5 sm:h-5" />
				<span class="ml-2 text-sm sm:text-base">Update Name</span>
			</button>
			<button
				class="flex-grow btn btn-sm sm:btn-md variant-ghost-surface"
				on:click={() => toggleComposeView(sendMailView)}
				disabled={loading}
			>
				<Icon icon="mdi:message" class="w-4 h-4 sm:w-5 sm:h-5" />
				<span class="ml-2 text-sm sm:text-base">Message Us</span>
			</button>
		</div>
	{/if}
</div>

<style>
	/* Optional: Add styles for status messages */
	.text-error-400 {
		color: rgb(248, 113, 113);
	}
	.text-success-400 {
		color: rgb(74, 222, 128);
	}
</style>
