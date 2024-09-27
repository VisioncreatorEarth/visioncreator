<script lang="ts">
	import { writable } from 'svelte/store';
	import { env } from '$env/dynamic/public';
	import QRCode from '@castlenine/svelte-qrcode';

	export let me;

	let linkCopied = writable(false);
	let showQRCode = writable(false);
	let invitationLink = `${env.PUBLIC_BASE_URL}/?visionid=${$me.authID}`;

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
	<div class="text-lg p-4 rounded-lg">
		<h3 class="  text-primary-300">
			<span class="h1 text-4xl font-bold">
				Inspire & Rise <br />
			</span>
			<p class="text-xl font-medium">Be one of the 1st pioneers to unlock early access</p>
		</h3>
		<!-- 	<ul class="space-y-2">
			<li>Claim your exclusive - once-in-a-lifetime surprise - limited to the top 21 pioneers!</li>
			<li>+1 free ticket to our inaugural event</li>
		</ul>
		<p class="mt-4 font-semibold text-secondary-300 text-lg sm:text-xl md:text-2xl">
			Time's running!
		</p>
		-->
	</div>
	<!-- <Countdown /> -->
	<p class="">
		Lead the way into a new world. <br />The more fellows you inspire, the higher you rise in your
		rank and the faster you get invited.
		<!-- to stay in the top 21! -->
	</p>

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
	<div class="p-4 flex flex-row items-center space-x-2">
		<button
			type="button"
			class="btn btn-sm @3xl:btn-lg variant-ghost-primary"
			on:click={toggleQRCode}
		>
			{$showQRCode ? 'Hide QR Code' : 'Show QR Code'}
		</button>
		<button
			type="button"
			class="btn btn-sm @3xl:btn-lg variant-filled-primary"
			on:click={copyInvitationLink}
			disabled={$linkCopied}
		>
			{$linkCopied ? 'Link Copied!' : 'Copy Inspire Link'}
		</button>
	</div>
</div>
