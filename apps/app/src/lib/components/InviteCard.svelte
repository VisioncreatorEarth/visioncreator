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
		<h3 class="text-primary-300 text-center">
			<span class="h1 text-4xl font-bold mb-2 block"> Join the 1 billion-owner startup </span>
			<p class="text-lg mt-4">
				Own a piece of the world's most exciting startup, a venture that unlocks human potential, <br
				/>redefines work and is owned by a billion humans – including you.
			</p>
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

	<div class="w-full max-w-3xl video-wrapper pb-4">
		<VideoPlayer youtubeId="K8iiYmb0r10" posterFrame="/images/001_poster.png" />
	</div>
	<!-- <Countdown /> -->
	<div class="">
		<h3 class="  text-primary-300">
			<span class="h1 text-4xl font-bold">
				Inspire & Rise <br />
			</span>
			<p class="text-xl font-medium">Become one of the 1st to unlock early access</p>
		</h3>
		The more fellows you inspire, the higher you rise in your rank and the faster you get invited.
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
