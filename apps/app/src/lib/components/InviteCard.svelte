<script lang="ts">
	import { writable } from 'svelte/store';
	import { env } from '$env/dynamic/public';
	import QRCode from '@castlenine/svelte-qrcode';

	export let me;
	const query = $me.query;

	let linkCopied = writable(false);
	let showQRCode = writable(false);
	let invitationLink = `${env.PUBLIC_BASE_URL}/?visionid=${$query.data.qrCodeId}`;

	async function copyInvitationLink() {
		try {
			await navigator.clipboard.writeText(invitationLink);
			linkCopied.set(true);
			setTimeout(() => {
				linkCopied.set(false);
			}, 1000);
		} catch (err) {
			console.error('Failed to copy the link:', err);
			alert('Failed to copy the link.');
		}
	}

	function toggleQRCode() {
		showQRCode.update((n) => !n);
	}
</script>

<div
	class="w-full max-w-6xl p-4 @2xl:p-5 @3xl:p-6 overflow-auto text-center rounded-3xl bg-surface-800 flex flex-col items-center justify-center space-y-4 @2xl:space-y-5 @3xl:space-y-6"
>
	<div class="space-y-2 @2xl:space-y-3 @3xl:space-y-4">
		<h3 class="text-primary-300">
			<span class="text-2xl @2xl:text-3xl @3xl:text-4xl font-bold">
				{$query.data.title}<br />
			</span>
			<p class="mt-2 text-base @2xl:text-lg @3xl:text-xl font-medium">
				{$query.data.subtitle}
			</p>
		</h3>
		<p class="text-sm @2xl:text-base @3xl:text-lg text-tertiary-400">
			{$query.data.description}
		</p>
	</div>

	{#if $showQRCode}
		<QRCode
			data={invitationLink}
			backgroundColor="#141a4d"
			color="#f0ede5"
			shape="circle"
			haveBackgroundRoundedEdges
			logoPath="/logo.png"
			logoSize="25"
			logoPadding="4"
		/>
	{/if}

	<div
		class="flex flex-row items-center p-2 @2xl:p-3 @3xl:p-4 space-x-2 @2xl:space-x-3 @3xl:space-x-4"
	>
		<button
			type="button"
			class="btn btn-sm @2xl:btn-md @3xl:btn-lg variant-ghost-primary"
			on:click={toggleQRCode}
		>
			{$showQRCode ? $query.data.hideQrText : $query.data.showQrText}
		</button>
		<button
			type="button"
			class="btn btn-sm @2xl:btn-md @3xl:btn-lg variant-filled-primary"
			on:click={copyInvitationLink}
			disabled={$linkCopied}
		>
			{$linkCopied ? $query.data.linkCopiedText : $query.data.copyLinkText}
		</button>
	</div>
</div>
