<script lang="ts">
	import { writable, readable } from 'svelte/store';
	import { env } from '$env/dynamic/public';
	import QRCode from '@castlenine/svelte-qrcode';
	import { eventBus } from '$lib/composables/eventBus';
	import { onMount, onDestroy } from 'svelte';

	let contentWrapper: HTMLDivElement;

	export let me;
	const query = $me.query;

	let showQRCode = writable(false);
	let linkCopied = writable(false);

	$: inspirations = $query.data.inspirations;
	$: fullyUnlocked = inspirations >= 3;
	$: invitationLink = `${env.PUBLIC_BASE_URL}/?visionid=${$query.data.qrCodeId}`;
	$: temperature = $query.data.temperature;
	$: streamPotential = $query.data.streamPotential;

	// Launch date: January 21st, 2025, 19:00 CET
	const launchDate = new Date('2025-01-21T19:00:00+01:00').getTime();

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

	function setViewportHeight() {
		if (contentWrapper) {
			contentWrapper.style.height = `${window.innerHeight}px`;
		}
	}

	onMount(() => {
		eventBus.on('updateStats', handleUpdateStats);
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', setViewportHeight);
			setViewportHeight();
		}
	});

	onDestroy(() => {
		eventBus.off('updateStats', handleUpdateStats);
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', setViewportHeight);
		}
	});
</script>

<div bind:this={contentWrapper} class="@container fixed inset-0 overflow-hidden">
	<div class="relative w-full h-full">
		<!-- Background Image -->
		<div
			class="absolute inset-0 bg-center bg-no-repeat bg-cover"
			style="background-image: url('/dashboard.jpg');"
		>
			<div class="absolute inset-0 bg-black/20" />
		</div>

		<!-- Grid Layout -->
		<div class="relative grid h-full grid-rows-[auto_1fr_auto]">
			<!-- Stats Display -->
			<div class="flex z-10 gap-6 justify-center p-4 md:justify-end md:pr-8">
				<div class="text-center">
					<div class="text-xl font-medium text-white md:text-2xl lg:text-3xl">
						{$query.data.visionRank}
					</div>
					<div class="text-xs text-tertiary-300 md:text-sm">vision rank</div>
				</div>
				<div class="text-center">
					<div class="text-xl font-medium text-white md:text-2xl lg:text-3xl">
						{$query.data.inspirations}
					</div>
					<div class="text-xs text-tertiary-300 md:text-sm">inspirations</div>
				</div>
				<div class="text-center">
					<div class="text-xl font-medium text-white md:text-2xl lg:text-3xl">
						${($query.data.inspirations * 3.33).toFixed(2)}/m
					</div>
					<div class="text-xs text-tertiary-300 md:text-sm">income potential</div>
				</div>
			</div>

			<!-- Main Content -->
			<div class="flex overflow-y-auto z-10 flex-col justify-center items-center p-4">
				<!-- Countdown -->
				{#if !$showQRCode}
					<div class="mb-8 text-center">
						<h2 class="mb-4 text-base text-tertiary-300 sm:text-lg md:text-2xl">
							Launching BETA programs in
						</h2>
						<h1 class="text-3xl font-bold text-white sm:text-5xl">
							{days}d {hours.toString().padStart(2, '0')}h {minutes.toString().padStart(2, '0')}m {seconds
								.toString()
								.padStart(2, '0')}s
						</h1>
					</div>
				{/if}

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
							<div class="flex justify-center">
								<button on:click={toggleQRCode} class="btn variant-ghost-tertiary btn-sm md:btn-md">
									Hide QR Code
								</button>
							</div>
						{:else}
							{#if inspirations < 3}
								<p class="mb-6 text-base text-center text-tertiary-300 md:text-xl">
									To get into one of our soon launching Hominio BETA programs,<br />
									inspire {3 - inspirations} more Visioncreator{3 - inspirations === 1 ? '' : 's'} to
									join the waitlist.
								</p>

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
							{:else if inspirations === 3}
								<p class="mb-6 text-base text-center text-tertiary-300 md:text-xl">
									<span class="text-2xl font-bold uppercase">
										{$query.data.visionRank <= 89 ? 'Congratulations!' : 'Be Patient'}
									</span><br />
									{#if $query.data.visionRank <= 89}
										You're position {$query.data.visionRank} in line for our exclusive first BETA access
										- limited to only 89 pioneering visioncreators.<br /><br />
										Keep spreading the word to secure your spot in our early access program and increase
										your income potential!
									{:else}
										Only top 89 visioncreators will get early access. You're position {$query.data
											.visionRank}.<br /><br />
										Keep inspiring new Visioncreators to join the waitlist for a chance to reach the
										first 89 and to increase your income potential!
									{/if}
								</p>
							{:else}
								<p class="mb-6 text-base text-center text-tertiary-300 md:text-xl">
									Welcome to a new way of living and working<br />
									enjoy playing with Hominio
								</p>
							{/if}

							<div class="flex gap-3 justify-center items-center md:gap-6">
								<button
									on:click={copyInvitationLink}
									class="btn variant-ghost-tertiary btn-sm md:btn-md"
									disabled={$linkCopied}
								>
									{$linkCopied ? 'Copied!' : 'Copy Invite Link'}
								</button>
								<button
									on:click={toggleQRCode}
									class="bg-gradient-to-br btn btn-sm md:btn-md variant-gradient-secondary-primary"
								>
									Show Invite Code
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Bottom Spacer -->
			<div class="z-10 h-16" />
		</div>
	</div>
</div>

<footer class="fixed bottom-0 right-0 py-2 @sm:py-2 text-white z-40">
	<div class="px-4 @sm:px-4">
		<a
			href="https://unsplash.com/de/fotos/lichtstrahl-in-der-nahe-des-gewassers--p-KCm6xB9I"
			target="_blank"
			rel="noopener noreferrer"
			class="transition-colors text-2xs text-tertiary-500/80 hover:text-tertiary-500"
		>
			Image by SpaceX
		</a>
	</div>
</footer>

<style>
	:global(body) {
		background-color: rgba(24, 25, 73, 1);
	}
</style>
