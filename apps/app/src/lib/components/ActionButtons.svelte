<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { createEventDispatcher } from 'svelte';
	import { view as updateNameView } from '$lib/views/UpdateName';
	import { view as sendMailView } from '$lib/views/SendMail';
	import ComposeView from '$lib/components/ComposeView.svelte';

	let loading = false;
	let showComposeView = false;
	let showContactUs = false;
	const dispatch = createEventDispatcher();

	let currentView = updateNameView;

	const handleSignOut: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
			dispatch('signout');
		};
	};

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
				showSpacer={false}
				session={null}
			/>
		</div>
	{:else if showContactUs}
		<div class="px-4">
			<ComposeView
				view={sendMailView}
				on:close={toggleContactUs}
				showSpacer={false}
				session={null}
			/>
		</div>
	{:else}
		<div class="grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 gap-2 mb-2">
			<form
				method="post"
				action="?/signout"
				use:enhance={handleSignOut}
				class="@sm:col-span-2 @md:col-span-1"
			>
				<button class="btn @sm:btn-sm @lg:btn-md variant-ghost-error w-full" disabled={loading}>
					<Icon icon="mdi:logout" class="mr-2" />
					Sign Out
				</button>
			</form>
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
</div>
