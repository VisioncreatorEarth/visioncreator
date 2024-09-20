<!-- <script lang="ts">
	import { createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	interface Mail {
		id: string;
		from_email: string;
		subject: string;
		text_body: string;
		received_at: string;
	}

	interface GroupedMails {
		[email: string]: {
			[subject: string]: Mail[];
		};
	}

	const mailsQuery = createQuery({
		operationName: 'queryMails',
		input: {
			limit: 50,
			offset: 0
		}
	});

	let mails: Mail[] = [];
	let groupedMails: GroupedMails = {};
	let selectedEmail: string | null = null;
	let selectedSubject: string | null = null;

	onMount(async () => {
		await mailsQuery.refetch();
		if ($mailsQuery.data) {
			mails = $mailsQuery.data.mails;
			groupMails();
		}
	});

	function groupMails() {
		groupedMails = mails.reduce((acc, mail) => {
			if (!acc[mail.from_email]) {
				acc[mail.from_email] = {};
			}
			const subject = mail.subject.trim() || '(No Subject)';
			if (!acc[mail.from_email][subject]) {
				acc[mail.from_email][subject] = [];
			}
			acc[mail.from_email][subject].push(mail);
			return acc;
		}, {} as GroupedMails);

		if (Object.keys(groupedMails).length > 0) {
			selectedEmail = Object.keys(groupedMails)[0];
			selectedSubject = '(No Subject)';
		}
	}

	function selectEmail(email: string) {
		selectedEmail = email;
		selectedSubject = '(No Subject)';
	}

	function selectSubject(subject: string) {
		selectedSubject = subject;
	}

	$: if ($mailsQuery.data) {
		mails = $mailsQuery.data.mails;
		groupMails();
	}
</script>

<div class="flex h-screen bg-surface-900 text-tertiary-300">
	<div class="w-16 bg-surface-800 overflow-y-auto flex flex-col items-center py-4">
		{#each Object.keys(groupedMails) as email, index}
			<button
				class="w-12 h-12 mb-2 rounded-full bg-surface-700 flex items-center justify-center text-lg font-bold {selectedEmail ===
				email
					? 'ring-2 ring-primary-500'
					: ''}"
				on:click={() => selectEmail(email)}
				title={email}
			>
				{email[0].toUpperCase()}
			</button>
		{/each}
	</div>

	<div class="flex-1 flex overflow-hidden">
		<div class="w-64 bg-surface-800 overflow-y-auto">
			{#if selectedEmail}
				<h2 class="text-lg font-bold p-4 text-tertiary-300">{selectedEmail}</h2>
				{#each Object.entries(groupedMails[selectedEmail]) as [subject, messages]}
					<button
						class="w-full text-left p-4 hover:bg-surface-700 cursor-pointer transition-colors duration-200 {selectedSubject ===
						subject
							? 'bg-surface-700'
							: ''}"
						on:click={() => selectSubject(subject)}
					>
						<h3 class="font-semibold text-tertiary-300 truncate">{subject}</h3>
						<p class="text-sm text-tertiary-500">
							{messages.length} message(s)
						</p>
					</button>
				{/each}
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-4">
			{#if selectedEmail && selectedSubject && groupedMails[selectedEmail][selectedSubject]}
				<h2 class="text-2xl font-bold mb-4 text-tertiary-300">{selectedSubject}</h2>
				{#each groupedMails[selectedEmail][selectedSubject] as mail}
					<div class="flex mb-4">
						<div class="w-3/4 bg-surface-700 rounded-3xl p-4 ml-auto">
							<p class="text-xs text-tertiary-500 mb-2">
								{new Date(mail.received_at).toLocaleString()}
							</p>
							<p class="text-tertiary-300">{mail.text_body}</p>
						</div>
					</div>
				{/each}
			{:else}
				<p class="text-center text-tertiary-500">Select an email and subject to view messages.</p>
			{/if}
		</div>
	</div>
</div> -->
