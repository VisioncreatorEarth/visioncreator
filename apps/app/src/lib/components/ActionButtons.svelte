<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { createEventDispatcher } from 'svelte';
	import { view } from '$lib/views/UpdateName';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { createMutation } from '$lib/wundergraph';

	let loading = false;
	let showComposeView = false;
	let showContactUs = false;
	const dispatch = createEventDispatcher();

	let subject = '';
	let body = '';
	let successMessage = '';

	const sendMailMutation = createMutation({
		operationName: 'sendMail'
	});

	const handleSignOut: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
			dispatch('signout');
		};
	};

	const toggleComposeView = () => {
		showComposeView = !showComposeView;
		showContactUs = false;
	};

	const toggleContactUs = () => {
		showContactUs = !showContactUs;
		showComposeView = false;
		successMessage = '';
	};

	const sendMail = async () => {
		loading = true;
		try {
			const result = await $sendMailMutation.mutateAsync({
				subject,
				body
			});
			if (result && result.success) {
				console.log('Email sent successfully', result.message);
				successMessage = 'Email sent successfully!';
				subject = '';
				body = '';
				setTimeout(() => {
					successMessage = '';
					toggleContactUs(); // Go back after 3 seconds
				}, 3000);
			} else if (result) {
				console.error('Failed to send email:', result.message);
				successMessage = `Failed to send email: ${result.message}`;
			}
		} catch (error) {
			console.error('Error sending email:', error);
			successMessage = `Error sending email: ${error.message || 'Unknown error'}`;
		} finally {
			loading = false;
		}
	};
</script>

<div class="@container">
	{#if showComposeView}
		<div class="p-4">
			<ComposeView {view} on:close={toggleComposeView} />
		</div>
	{:else if showContactUs}
		<div class="p-4">
			<h2 class="text-2xl font-bold mb-4">Contact Us</h2>
			{#if successMessage}
				<div class="alert variant-filled-success mb-4">{successMessage}</div>
			{:else}
				<input type="text" bind:value={subject} placeholder="Subject" class="input mb-2 w-full" />
				<textarea bind:value={body} placeholder="Message" class="textarea mb-2 w-full" rows="4" />
				<button
					class="btn @sm:btn-sm @lg:btn-md variant-filled-primary w-full mb-2"
					on:click={sendMail}
					disabled={loading || !subject || !body}
				>
					{loading ? 'Sending...' : 'Send Mail'}
				</button>
			{/if}
			<button
				class="btn @sm:btn-sm @lg:btn-md variant-ghost-surface w-full"
				on:click={toggleContactUs}
				disabled={loading}
			>
				Back
			</button>
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
					Sign Out
				</button>
			</form>
			<button
				class="btn @sm:btn-sm @lg:btn-md variant-ghost-warning w-full"
				on:click={toggleComposeView}
				disabled={loading}
			>
				Update Name
			</button>
			<button
				class="btn @sm:btn-sm @lg:btn-md variant-ghost-secondary w-full"
				on:click={toggleContactUs}
				disabled={loading}
			>
				Contact Us
			</button>
		</div>
	{/if}
</div>
