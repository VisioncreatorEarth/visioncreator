<script lang="ts">
	import { createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	const mailsQuery = createQuery({
		operationName: 'queryMails',
		input: {
			limit: 50,
			offset: 0
		}
	});

	let mails = [];
	let groupedMails = {};
	let selectedEmail = null;

	onMount(async () => {
		await mailsQuery.refetch();
		if ($mailsQuery.data) {
			mails = $mailsQuery.data.mails;
			groupMails();
		}
	});

	function groupMails() {
		groupedMails = mails.reduce((acc, mail) => {
			const email = mail.from_email;
			if (!acc[email]) {
				acc[email] = [];
			}
			acc[email].push(mail);
			return acc;
		}, {});
		if (Object.keys(groupedMails).length > 0) {
			selectedEmail = Object.keys(groupedMails)[0];
		}
	}

	function selectEmail(email) {
		selectedEmail = email;
	}

	$: if ($mailsQuery.data) {
		mails = $mailsQuery.data.mails;
		groupMails();
	}
</script>

<div class="flex h-screen bg-surface-900 text-tertiary-300">
	<!-- Sidebar -->
	<div class="w-1/4 bg-surface-800 overflow-y-auto">
		{#each Object.keys(groupedMails) as email}
			<div
				class="p-4 hover:bg-surface-700 cursor-pointer transition-colors duration-200 {selectedEmail ===
				email
					? 'bg-surface-700'
					: ''}"
				on:click={() => selectEmail(email)}
			>
				<h3 class="font-semibold text-tertiary-300">{email}</h3>
				<p class="text-sm text-tertiary-500">
					{groupedMails[email].length} message(s)
				</p>
			</div>
		{/each}
	</div>

	<!-- Chat area -->
	<div class="flex-1 flex flex-col">
		<div class="flex-1 overflow-y-auto p-4">
			{#if selectedEmail}
				<h2 class="text-2xl font-bold mb-4 text-tertiary-300">{selectedEmail}</h2>
				{#each groupedMails[selectedEmail] as mail}
					<div class="flex mb-4">
						<div class="w-3/4 bg-surface-700 rounded-3xl p-4 ml-auto">
							<p class="text-lg font-semibold text-tertiary-300">{mail.subject}</p>
							<p class="text-xs text-tertiary-500 mb-2">
								{new Date(mail.received_at).toLocaleString()}
							</p>
							<p class="text-tertiary-300">{mail.text_body}</p>
						</div>
					</div>
				{/each}
			{:else}
				<p class="text-center text-tertiary-500">
					Select an email from the sidebar to view messages.
				</p>
			{/if}
		</div>
	</div>
</div>
