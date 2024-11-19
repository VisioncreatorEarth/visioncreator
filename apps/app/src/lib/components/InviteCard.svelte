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
	class="w-full max-w-6xl p-2 @3xl:p-6 overflow-auto text-center rounded-3xl bg-surface-800 flex flex-col items-center justify-center space-y-4"
>
	<div class="">
		<h3 class="text-primary-300">
			<span class="text-4xl font-bold h1">
				{$query.data.title}<br />
			</span>
			<p class="text-xl font-medium">{$query.data.subtitle}</p>
		</h3>
		{$query.data.description}
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
	<div class="flex flex-row items-center p-4 space-x-2">
		<button
			type="button"
			class="btn btn-sm @3xl:btn-lg variant-ghost-primary"
			on:click={toggleQRCode}
		>
			{$showQRCode ? $query.data.hideQrText : $query.data.showQrText}
		</button>
		<button
			type="button"
			class="btn btn-sm @3xl:btn-lg variant-filled-primary"
			on:click={copyInvitationLink}
			disabled={$linkCopied}
		>
			{$linkCopied ? $query.data.linkCopiedText : $query.data.copyLinkText}
		</button>
	</div>
</div>
