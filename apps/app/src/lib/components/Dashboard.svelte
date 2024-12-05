<script lang="ts">
	import { writable } from 'svelte/store';
	import { env } from '$env/dynamic/public';
	import QRCode from '@castlenine/svelte-qrcode';
	import { eventBus } from '$lib/composables/eventBus';
	import { onMount, onDestroy } from 'svelte';

	export let me;
	const query = $me.query;

	let showQRCode = writable(false);
	let linkCopied = writable(false);

	let localInspirationsCount = 0;

	$: inspirations = localInspirationsCount || Number($query.data.inspirations) || 0;
	$: fullyUnlocked = inspirations >= 3;
	$: invitationLink = `${env.PUBLIC_BASE_URL}/?visionid=${$query.data.qrCodeId}`;
	$: temperature = $query.data.temperature;
	$: streamPotential = $query.data.streamPotential;

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

	function decrementLocal() {
		if (localInspirationsCount > 0) localInspirationsCount--;
	}

	function incrementLocal() {
		if (localInspirationsCount < 3) localInspirationsCount++;
	}

	function unlockAll() {
		localInspirationsCount = 3;
	}

	function restart() {
		localInspirationsCount = 0;
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
	<div class="flex absolute top-4 right-4 gap-6 items-start text-white">
		<div class="text-center">
			<div class="text-3xl font-medium text-white">{$query.data.visionRank}</div>
			<div class="text-xs text-tertiary-300">vision rank</div>
		</div>
		<div class="text-center">
			<div class="text-3xl font-medium text-white">{$query.data.inspirations}</div>
			<div class="text-xs text-tertiary-300">inspirations</div>
		</div>
		<div class="text-center">
			<div class="text-3xl font-medium text-white">${$query.data.inspirations * 5}/m</div>
			<div class="text-xs text-tertiary-300">stream potential</div>
		</div>
		<div class="text-center">
			<div class="text-3xl font-medium text-white">{temperature}°</div>
			<div class="text-xs text-tertiary-300">temp</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex relative z-10 flex-col h-full text-white">
		<div class="flex flex-col flex-1 justify-center">
			<!-- Time -->
			<div class="text-center">
				<h1 class="mb-4 text-9xl font-black tracking-wider h1">
					{new Date().toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: false
					})}
				</h1>

				<!-- Welcome Message -->
				<h2 class="mb-10 text-4xl text-tertiary-300">Be a magnet for joy, love and abundance.</h2>

				<!-- Early Access Section -->
				<div class="px-8 py-8 mx-auto max-w-4xl text-center rounded-xl bg-surface-900/50">
					{#if inspirations < 3}
						<p class="mb-8 text-2xl text-tertiary-300">
							To unlock early access to Hominio, inspire 3 new Visioncreators.
						</p>
					{:else if inspirations === 3}
						<p class="mb-8 text-2xl text-tertiary-300">
							<span class="font-bold uppercase">Almost there! </span><br /> In January you receive your
							early BETA invite.
						</p>
						<div class="flex gap-12 justify-center items-center mb-6">
							{#each Array(3).fill(false) as _, i}
								<div
									class="p-6 rounded-xl {i < inspirations
										? 'bg-secondary-500/40'
										: 'bg-surface-900/60'}"
								>
									<Icon
										icon={i < inspirations
											? 'solar:user-bold-duotone'
											: 'solar:lock-password-bold-duotone'}
										class={i < inspirations ? 'text-secondary-300' : 'text-tertiary-300'}
										width={48}
									/>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mb-8 text-2xl text-tertiary-300">
							Welcome to a new way of living and working<br />
							enjoy playing with Hominio
						</p>
						<div class="absolute bottom-20 left-1/2 justify-center -translate-x-1/2">
							<p
								class="px-6 py-4 text-lg font-light whitespace-pre-line rounded-xl opacity-90 text-tertiary-400 bg-surface-900/60"
							>
								To start talking to Hominio <br />long press the logo button.
							</p>
						</div>
						<button
							on:click={restart}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
						>
							Restart
						</button>
					{/if}
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
					{:else if inspirations < 3}
						<div class="flex gap-12 justify-center items-center mb-6">
							{#each Array(3).fill(false) as _, i}
								<div
									class="p-6 rounded-xl {i < inspirations
										? 'bg-secondary-500/40'
										: 'bg-surface-900/60'}"
								>
									<Icon
										icon={i < inspirations
											? 'solar:user-bold-duotone'
											: 'solar:lock-password-bold-duotone'}
										class={i < inspirations ? 'text-secondary-300' : 'text-tertiary-300'}
										width={48}
									/>
								</div>
							{/each}
						</div>
					{/if}
					<div class="flex gap-6 justify-center items-center">
						<button
							on:click={decrementLocal}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							disabled={inspirations === 0}
						>
							-1
						</button>
						<button
							on:click={incrementLocal}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							disabled={inspirations === 3}
						>
							+1
						</button>
						<button
							on:click={() => {
								localInspirationsCount = 4; // Switch to the last welcome view
							}}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
						>
							Unlock All
						</button>
						<button
							on:click={copyInvitationLink}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							disabled={$linkCopied}
						>
							{$linkCopied ? 'Copied!' : 'Copy Inspire Link'}
						</button>
						<button
							on:click={toggleQRCode}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
						>
							{$showQRCode ? 'Hide QR Code' : 'Show QR Code'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
