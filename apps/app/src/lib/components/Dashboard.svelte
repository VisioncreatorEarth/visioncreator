<script lang="ts">
	import { writable, readable } from 'svelte/store';
	import { env } from '$env/dynamic/public';
	import QRCode from '@castlenine/svelte-qrcode';
	import { eventBus } from '$lib/composables/eventBus';
	import { onMount, onDestroy } from 'svelte';

	export let me;
	const query = $me.query;

	let showQRCode = writable(false);
	let linkCopied = writable(false);

	$: inspirations = $query.data.inspirations;
	$: fullyUnlocked = inspirations >= 3;
	$: invitationLink = `${env.PUBLIC_BASE_URL}/?visionid=${$query.data.qrCodeId}`;
	$: temperature = $query.data.temperature;
	$: streamPotential = $query.data.streamPotential;

	// Launch date: January 7th, 2025, 18:00 CET
	const launchDate = new Date('2025-01-07T18:00:00+01:00').getTime();

	const countdown = readable(0, (set) => {
		const interval = setInterval(() => {
			const now = new Date().getTime();
			const distance = launchDate - now;
			set(Math.max(0, Math.floor(distance / 1000)));
		}, 1000);

		return () => clearInterval(interval);
	});

	$: days = Math.floor($countdown / 86400);
	$: hours = Math.floor(($countdown % 86400) / 3600);
	$: minutes = Math.floor(($countdown % 3600) / 60);
	$: seconds = $countdown % 60;

	function toggleQRCode() {
		showQRCode.update((n) => !n);
	}

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

	async function handleUpdateStats() {
		await $query.refetch();
	}

	onMount(() => {
		eventBus.on('updateStats', handleUpdateStats);
		console.log($query.data);
	});

	onDestroy(() => {
		eventBus.off('updateStats', handleUpdateStats);
	});
</script>

<div class="overflow-hidden relative w-full h-screen">
	<!-- Background Image -->
	<div
		class="absolute inset-0 bg-center bg-no-repeat bg-cover"
		style="background-image: url('/dashboard.jpg');"
	>
		<!-- Overlay for better text readability -->
		<div class="absolute inset-0 bg-black/20" />
	</div>

	<!-- Stats Display -->
	<div class="flex absolute top-4 right-4 gap-6">
		<div class="text-center">
			<div class="text-2xl font-medium text-white md:text-4xl">1</div>
			<div class="text-sm text-tertiary-300 md:text-base">vision rank</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-medium text-white md:text-4xl">{$query.data.inspirations}</div>
			<div class="text-sm text-tertiary-300 md:text-base">inspirations</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-medium text-white md:text-4xl">
				${$query.data.inspirations * 5}/m
			</div>
			<div class="text-sm text-tertiary-300 md:text-base">income potential</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex relative flex-col justify-center items-center p-4 w-full min-h-screen">
		<!-- Countdown -->
		<div class="mb-8 text-center">
			<h1 class="text-6xl font-bold text-white md:text-8xl">
				{days}d {hours.toString().padStart(2, '0')}h {minutes.toString().padStart(2, '0')}m {seconds.toString().padStart(2, '0')}s
			</h1>
			<h2 class="mt-4 text-xl text-tertiary-300 md:text-4xl">
				Be a magnet for joy, love and abundance.
			</h2>
		</div>

		<!-- Early Access Section -->
		<div class="mx-auto w-full max-w-sm md:max-w-2xl">
			<div class="p-6 rounded-xl bg-surface-900/50 md:p-10">
				{#if $showQRCode}
					<div class="flex justify-center mb-6">
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
					</div>
				{:else}
					{#if inspirations < 3}
						<p class="mb-6 text-base text-center text-tertiary-300 md:text-xl">
							To unlock early access to Hominio,<br />
							inspire {3 - inspirations} more Visioncreator{3 - inspirations === 1 ? '' : 's'} to join
							the waitlist.
						</p>
					{:else if inspirations === 3}
						<p class="mb-6 text-base text-center text-tertiary-300 md:text-xl">
							<span class="font-bold uppercase">Almost there!</span><br />
							In January you receive your early BETA invite.
						</p>
					{:else}
						<p class="mb-6 text-base text-center text-tertiary-300 md:text-xl">
							Welcome to a new way of living and working<br />
							enjoy playing with Hominio
						</p>
					{/if}

					<div class="flex gap-4 justify-center items-center mb-6 md:gap-10">
						{#each Array(3).fill(false) as _, i}
							<div
								class="p-3 rounded-xl md:p-12 {i < inspirations
									? 'bg-secondary-500/40'
									: 'bg-surface-900/60'}"
							>
								<Icon
									icon={i < inspirations
										? 'solar:user-bold-duotone'
										: 'solar:lock-password-bold-duotone'}
									class={`w-12 h-12 md:w-16 md:h-16 ${
										i < inspirations ? 'text-secondary-300' : 'text-surface-300'
									}`}
								/>
							</div>
						{/each}
					</div>
				{/if}

				<div class="flex gap-3 justify-center items-center md:gap-6">
					<button
						on:click={copyInvitationLink}
						class="px-4 py-2 text-sm rounded-full md:px-6 md:py-3 md:text-xl bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
						disabled={$linkCopied}
					>
						{$linkCopied ? 'Copied!' : 'Copy Invite Link'}
					</button>
					<button
						on:click={toggleQRCode}
						class="px-4 py-2 text-sm rounded-full md:px-6 md:py-3 md:text-xl bg-secondary-500/40 text-secondary-300 hover:bg-secondary-500/60"
					>
						{$showQRCode ? 'Hide QR Code' : 'Show Invite Code'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
