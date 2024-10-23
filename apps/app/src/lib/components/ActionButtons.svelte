<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { view as updateNameView } from '$lib/views/UpdateName';
	import { view as sendMailView } from '$lib/views/SendMail';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import Icon from '@iconify/svelte';
	import { browser } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import { goto } from '$app/navigation';

	export let session: any;
	export let supabase: any;

	let loading = false;
	let logoutStatus = '';
	let showComposeView = false;
	let showContactUs = false;
	const dispatch = createEventDispatcher();

	let currentView = updateNameView;

	async function handleSignOut() {
		if (loading) return;

		loading = true;
		console.log('Starting logout process...');

		try {
			// Immediately redirect
			if (browser) {
				window.location.replace('/'); // Using replace instead of href
			}

			// Then handle the cleanup
			dispatch('signout');

			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			await invalidate('supabase:auth');
		} catch (error) {
			console.error('Error during logout:', error);
			if (browser) {
				window.location.replace('/');
			}
		}
	}

	const toggleComposeView = (view: typeof updateNameView | typeof sendMailView) => {
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
	{#if showComposeView}
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
		<div class="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 gap-2 mb-2">
			<button
				on:click={handleSignOut}
				class="btn @sm:btn-sm @lg:btn-md variant-ghost-error w-full"
				disabled={loading}
			>
				<Icon icon="mdi:logout" class="mr-2" />
				{#if loading}
					<span class="flex items-center">
						<span class="mr-2">
							{logoutStatus || 'Signing out...'}
						</span>
						<!-- Optional: Add a loading spinner here -->
					</span>
				{:else}
					Sign Out
				{/if}
			</button>
			<button
				class="btn @sm:btn-sm @lg:btn-md variant-ghost-secondary w-full"
				on:click={() => toggleComposeView(updateNameView)}
				disabled={loading}
			>
				<Icon icon="mdi:account-edit" class="mr-2" />
				Update Name
			</button>
			<button
				class="btn @sm:btn-sm @lg:btn-md variant-ghost-secondary w-full"
				on:click={() => toggleComposeView(sendMailView)}
				disabled={loading}
			>
				<Icon icon="mdi:message" class="mr-2" />
				Message Us
			</button>
		</div>
	{/if}
	{#if logoutStatus}
		<div
			class="mt-2 text-sm text-center"
			class:text-error-400={logoutStatus.includes('Error')}
			class:text-success-400={!logoutStatus.includes('Error')}
		>
			{logoutStatus}
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
