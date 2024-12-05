<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { env } from '$env/dynamic/public';
	import QRCode from '@castlenine/svelte-qrcode';

	let time = new Date();
	let temperature = '2°'; // This would normally come from a weather API
	let streamPotential = '$85/m';
	let inspirations = '12';
	let inviteCount = 0;
	let fullyUnlocked = false;
	let showQRCode = writable(false);
	let linkCopied = writable(false);
	let invitationLink = `${env.PUBLIC_BASE_URL}/?visionid=123`; // Replace with actual ID

	function incrementInvites() {
		if (inviteCount < 4) inviteCount++;
	}

	function decrementInvites() {
		if (inviteCount > 0) inviteCount--;
	}

	function skipToUnlocked() {
		inviteCount = 4;
		fullyUnlocked = true;
	}

	function restart() {
		inviteCount = 0;
		fullyUnlocked = false;
	}

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

	$: lockStatus = Array(3)
		.fill(false)
		.map((_, i) => i < inviteCount);

	// Update time every second
	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

	$: formattedTime = time.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	const welcomeMessage = 'Be a magnet for joy, love and abundance.';
	const how = 'To start talking to Hominio \nlong press the logo button.';
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
			<div class="text-3xl font-medium text-white">{inspirations}</div>
			<div class="text-xs text-tertiary-300">inspirations</div>
		</div>
		<div class="text-center">
			<div class="text-3xl font-medium text-white">{streamPotential}</div>
			<div class="text-xs text-tertiary-300">stream potential</div>
		</div>
		<div class="text-center">
			<div class="text-3xl font-medium text-white">{temperature}</div>
			<div class="text-xs text-tertiary-300">temp</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex relative z-10 flex-col h-full text-white">
		<div class="flex flex-col flex-1 justify-center">
			<!-- Time -->
			<div class="text-center">
				<h1 class="mb-4 text-9xl font-black tracking-wider h1">
					{formattedTime}
				</h1>

				<!-- Welcome Message -->
				<h2 class="mb-10 text-4xl text-tertiary-300">
					{welcomeMessage}
				</h2>

				<!-- Early Access Section -->
				<div class="px-8 py-8 mx-auto max-w-4xl text-center rounded-xl bg-surface-900/50">
					{#if fullyUnlocked}
						<p class="mb-8 text-2xl text-tertiary-300">
							Welcome to a new world, enjoy playing with Hominio
						</p>
						<button
							on:click={restart}
							class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
						>
							Restart
						</button>
					{:else if inviteCount === 3}
						<p class="mb-8 text-2xl text-tertiary-300">
							Almost there!<br />
							<span class="text-lg"
								>Only 34 VCs ahead of you on the waitinglist → Just 18 VCs ahead with 1 more
								inspiration.</span
							>
						</p>
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
							<div class="flex gap-12 justify-center items-center mb-6">
								{#each lockStatus as isUnlocked, i}
									<div class="p-6 rounded-xl bg-surface-900/60">
										<Icon
											icon={isUnlocked
												? 'solar:user-bold-duotone'
												: 'solar:lock-password-bold-duotone'}
											class="text-tertiary-300"
											width="64"
											height="64"
										/>
									</div>
								{/each}
							</div>
						{/if}
						<div class="flex gap-6 justify-center items-center">
							<button
								on:click={decrementInvites}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
								disabled={inviteCount === 0}
							>
								-1
							</button>
							<button
								on:click={incrementInvites}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
								disabled={inviteCount === 4}
							>
								+1
							</button>
							<button
								on:click={skipToUnlocked}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							>
								Unlock All
							</button>
							<button
								on:click={toggleQRCode}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							>
								{$showQRCode ? 'Hide QR' : 'Show QR'}
							</button>
							<button
								on:click={copyInvitationLink}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
								disabled={$linkCopied}
							>
								{$linkCopied ? 'Copied!' : 'Copy Link'}
							</button>
						</div>
					{:else}
						<p class="mb-8 text-2xl text-tertiary-300">
							To enter the Hominio early access invite pool, <br /> inspire 3 new Visioncreators.
						</p>
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
							<div class="flex gap-12 justify-center items-center mb-6">
								{#each lockStatus as isUnlocked, i}
									<div class="p-6 rounded-xl bg-surface-900/60">
										<Icon
											icon={isUnlocked
												? 'solar:user-bold-duotone'
												: 'solar:lock-password-bold-duotone'}
											class="text-tertiary-300"
											width="64"
											height="64"
										/>
									</div>
								{/each}
							</div>
						{/if}
						<div class="flex gap-6 justify-center items-center">
							<button
								on:click={decrementInvites}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
								disabled={inviteCount === 0}
							>
								-1
							</button>
							<button
								on:click={incrementInvites}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
								disabled={inviteCount === 3}
							>
								+1
							</button>
							<button
								on:click={skipToUnlocked}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							>
								Unlock All
							</button>
							<button
								on:click={toggleQRCode}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
							>
								{$showQRCode ? 'Hide QR' : 'Show QR'}
							</button>
							<button
								on:click={copyInvitationLink}
								class="px-4 py-2 text-lg rounded-full bg-surface-900/60 text-tertiary-300 hover:bg-surface-900/80"
								disabled={$linkCopied}
							>
								{$linkCopied ? 'Copied!' : 'Copy Link'}
							</button>
						</div>
					{/if}
				</div>

				{#if fullyUnlocked}
					<div class="absolute bottom-20 left-1/2 justify-center -translate-x-1/2">
						<p
							class="px-6 py-4 text-lg font-light whitespace-pre-line rounded-xl opacity-90 text-tertiary-400 bg-surface-900/60"
						>
							To start talking to Hominio long press the logo button.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Add any custom styles here if needed */
</style>
