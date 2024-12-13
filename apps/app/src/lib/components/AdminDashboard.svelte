<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import UltravoxDashboard from './UltravoxDashboard.svelte';
	import { onMount } from 'svelte';

	const voicesQuery = createQuery({
		operationName: 'getVoices',
		enabled: true
	});

	type Voice = {
		voiceId: string;
		name: string;
		description: string;
		previewUrl: string | null;
		language: string;
	};

	let audioElements: Record<string, HTMLAudioElement> = {};
	let currentlyPlaying: string | null = null;

	function handleTimeUpdate(voiceId: string) {
		const audio = audioElements[voiceId];
		if (audio) {
			const progress = (audio.currentTime / audio.duration) * 100;
			const progressBar = document.getElementById(`progress-${voiceId}`);
			if (progressBar) {
				progressBar.style.width = `${progress}%`;
			}
		}
	}

	function playPreview(voiceId: string) {
		const audio = audioElements[voiceId];
		if (!audio) return;

		if (currentlyPlaying === voiceId) {
			audio.pause();
			audio.currentTime = 0;
			currentlyPlaying = null;
		} else {
			if (currentlyPlaying && audioElements[currentlyPlaying]) {
				audioElements[currentlyPlaying].pause();
				audioElements[currentlyPlaying].currentTime = 0;
			}
			audio.play().catch((error) => {
				console.error('Error playing audio:', error);
				currentlyPlaying = null;
			});
			currentlyPlaying = voiceId;
		}
	}

	function handleEnded(voiceId: string) {
		if (currentlyPlaying === voiceId) {
			currentlyPlaying = null;
		}
	}

	function groupVoicesByCategory(voices: Voice[]): Record<string, Voice[]> {
		return voices.reduce((acc, voice) => {
			if (!acc[voice.language]) {
				acc[voice.language] = [];
			}
			acc[voice.language].push(voice);
			return acc;
		}, {} as Record<string, Voice[]>);
	}

	onMount(() => {
		const audioElementsHtml = document.querySelectorAll('audio');
		audioElementsHtml.forEach((audio) => {
			const voiceId = audio.id;
			audioElements[voiceId] = audio as HTMLAudioElement;
		});
	});

	interface Capability {
		id: string;
		user_id: string;
		type: string;
		name: string;
		description: string;
		config: {
			tier: '5M' | '30M' | '1H' | '4H' | '10H';
			minutesLimit?: number;
			[key: string]: any;
		};
		granted_at: string;
		granted_by: string;
		active: boolean;
		profiles?: {
			name: string;
		};
	}

	let showUltravoxDashboard = true;
	let selectedUserId: string | null = null;
	let showLeftSidebar = false;
	let showRightSidebar = false;

	const usersQuery = createQuery({
		operationName: 'getUsers',
		enabled: true
	});

	$: getUserCapabilitiesQuery = createQuery({
		operationName: 'getUserCapabilities',
		input: { userId: selectedUserId || '' },
		enabled: !!selectedUserId
	});

	$: userStatsQuery = createQuery({
		operationName: 'getUserStats',
		input: { userId: selectedUserId || '' },
		enabled: !!selectedUserId
	});

	const manageCapabilitiesMutation = createMutation({
		operationName: 'manageCapabilities'
	});

	let changingTierId: string | null = null;

	const tiers = [
		{
			id: '5M',
			name: '5 Minutes Trial',
			minutesLimit: 5,
			features: ['5 minutes one-time usage', 'All Features Included', 'Trial Access']
		},
		{
			id: '30M',
			name: '30 Minutes Monthly',
			minutesLimit: 30,
			features: ['30 minutes per month', 'All Features Included', 'Monthly Renewal']
		},
		{
			id: '1H',
			name: '1 Hour Monthly',
			minutesLimit: 60,
			features: [
				'60 minutes per month',
				'All Features Included',
				'Monthly Renewal',
				'Priority Support'
			]
		},
		{
			id: '4H',
			name: '4 Hours Monthly',
			minutesLimit: 240,
			features: [
				'240 minutes per month',
				'All Features Included',
				'Monthly Renewal',
				'Priority Support',
				'Beta Access'
			]
		},
		{
			id: '10H',
			name: '10 Hours Monthly',
			minutesLimit: 600,
			features: [
				'600 minutes per month',
				'All Features Included',
				'Monthly Renewal',
				'Priority Support',
				'Beta Access',
				'Custom Support'
			]
		}
	];

	// Helper function to format duration with proper rounding
	function formatDuration(minutes: number): string {
		if (minutes === undefined || minutes === null) return '0m 00s';

		// Convert to seconds and round to avoid floating point issues
		const totalSeconds = Math.round(minutes * 60);
		const displayMinutes = Math.floor(totalSeconds / 60);
		const displaySeconds = totalSeconds % 60;

		// Add leading zero for seconds if needed
		const secondsStr = displaySeconds < 10 ? `0${displaySeconds}` : displaySeconds;
		return `${displayMinutes}m ${secondsStr}s`;
	}

	$: if ($userStatsQuery.data) {
		console.log('Raw stats data:', $userStatsQuery.data);
		console.log('Recent calls:', $userStatsQuery.data.recent_calls);
	}

	async function handleTierChange(userId: string, tierId: string) {
		if (!userId || changingTierId) return;
		changingTierId = tierId;

		try {
			await $manageCapabilitiesMutation.mutateAsync({
				userId,
				action: tierId === 'revoke' ? 'revoke' : 'grant',
				tier: tierId === 'revoke' ? null : tierId
			});

			// Refresh both queries to update the UI
			await Promise.all([$getUserCapabilitiesQuery.refetch(), $userStatsQuery.refetch()]);
		} catch (error) {
			console.error('Failed to manage tier:', error);
		} finally {
			changingTierId = null;
		}
	}

	async function handleRemoveCapability(capability: Capability) {
		try {
			console.log('Revoking capability:', capability);
			const result = await $manageCapabilitiesMutation.mutateAsync({
				userId: selectedUserId,
				action: 'revoke',
				type: capability.type,
				tier: capability.config.tier,
				capabilityId: capability.id
			});

			if (result.success) {
				// Refresh both queries
				await Promise.all([$getUserCapabilitiesQuery.refetch(), $userStatsQuery.refetch()]);
			}
		} catch (error) {
			console.error('Failed to remove capability:', error);
		}
	}

	function toggleRightSidebar() {
		showRightSidebar = !showRightSidebar;
	}

	function addMinutes(minutes: number) {
		// Add minutes to user's current tier
	}
</script>

<div class="flex h-screen">
	<!-- Mobile Navigation -->
	<div
		class="flex fixed top-0 right-0 left-0 z-50 justify-between p-2 border-b md:hidden bg-surface-800 border-surface-700"
	>
		<button
			class="p-2 rounded-lg hover:bg-surface-700"
			on:click={() => (showLeftSidebar = !showLeftSidebar)}
		>
			<Icon icon="heroicons:bars-3" class="w-6 h-6" />
		</button>
		<button class="p-2 rounded-lg hover:bg-surface-700" on:click={toggleRightSidebar}>
			<Icon icon="heroicons:users" class="w-6 h-6" />
		</button>
	</div>

	<!-- Left Sidebar - User Selection -->
	<aside
		class="fixed inset-y-0 left-0 z-40 w-80 transition-transform transform md:relative md:translate-x-0 {showLeftSidebar
			? 'translate-x-0'
			: '-translate-x-full'} overflow-y-auto border-r border-surface-700 bg-surface-800"
	>
		<div class="p-4 mt-14 md:mt-0">
			<!-- Special UltravoxDashboard Link -->
			<button
				class="w-full p-3 mb-4 text-left rounded-lg transition-colors {showUltravoxDashboard
					? 'bg-tertiary-500/20 text-tertiary-400'
					: 'hover:bg-surface-700 text-surface-200'}"
				on:click={() => {
					showUltravoxDashboard = true;
					showLeftSidebar = false;
				}}
			>
				UltravoxDashboard
			</button>

			<h2 class="mb-4 text-lg font-semibold text-white">Users</h2>

			{#if $usersQuery.isLoading}
				<div class="flex justify-center p-4">
					<div class="w-8 h-8 rounded-full border-b-2 animate-spin border-tertiary-500" />
				</div>
			{:else if $usersQuery.data?.users}
				<div class="space-y-2">
					{#each $usersQuery.data?.users || [] as user}
						<button
							class="w-full p-3 text-left rounded-lg transition-colors {selectedUserId === user.id
								? 'bg-tertiary-500/20 text-tertiary-400'
								: 'hover:bg-surface-700 text-surface-200'}"
							on:click={() => {
								selectedUserId = user.id;
								showUltravoxDashboard = false;
								showLeftSidebar = false;
							}}
						>
							<span class="block font-medium">{user.name}</span>
							<span class="block mt-0.5 text-xs opacity-75">{user.id}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="overflow-y-auto flex-1 pt-14 md:pt-0 bg-surface-900">
		{#if showUltravoxDashboard}
			<UltravoxDashboard />
		{:else if selectedUserId}
			<div class="p-6 space-y-6">
				{#if $userStatsQuery.data}
					<!-- Usage Overview -->
					<div class="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
						<div class="p-4 rounded-lg bg-surface-800">
							<p class="text-sm text-surface-200">Total Calls</p>
							<p class="mt-1 text-2xl font-semibold text-white">
								{$userStatsQuery.data.total_calls}
							</p>
						</div>
						<div class="p-4 rounded-lg bg-surface-800">
							<p class="text-sm text-surface-200">Success Rate</p>
							<p class="mt-1 text-2xl font-semibold text-white">
								{$userStatsQuery.data.success_rate.toFixed(1)}%
							</p>
						</div>
						<div class="p-4 rounded-lg bg-surface-800">
							<p class="text-sm text-surface-200">Minutes Used</p>
							<p class="mt-1 text-2xl font-semibold text-white">
								{formatDuration($userStatsQuery.data.minutes_used)}
							</p>
							<p class="mt-1 text-xs text-surface-300">
								of {formatDuration($userStatsQuery.data.minutes_limit)}
							</p>
						</div>
						<div class="p-4 rounded-lg bg-surface-800">
							<p class="text-sm text-surface-200">Minutes Remaining</p>
							<p class="mt-1 text-2xl font-semibold text-white">
								{formatDuration($userStatsQuery.data.minutes_remaining)}
							</p>
							<p class="mt-1 text-xs text-surface-300">this month</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
						<button
							class="flex gap-2 justify-center items-center px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
							on:click={() => selectedUserId && handleTierChange(selectedUserId, '5M')}
						>
							<span>+5m</span>
							<span class="text-xs">5M</span>
						</button>
						<button
							class="flex gap-2 justify-center items-center px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
							on:click={() => selectedUserId && handleTierChange(selectedUserId, '30M')}
						>
							<span>+30m</span>
							<span class="text-xs">30M</span>
						</button>
						<button
							class="flex gap-2 justify-center items-center px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
							on:click={() => selectedUserId && handleTierChange(selectedUserId, '1H')}
						>
							<span>+1h</span>
							<span class="text-xs">1H</span>
						</button>
						<button
							class="flex gap-2 justify-center items-center px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
							on:click={() => selectedUserId && handleTierChange(selectedUserId, '4H')}
						>
							<span>+4h</span>
							<span class="text-xs">4H</span>
						</button>
					</div>

					<!-- Active Capabilities List -->
					{#if $getUserCapabilitiesQuery.data?.capabilities}
						<div class="p-6 mt-6 rounded-lg bg-surface-800">
							<h3 class="mb-4 text-lg font-semibold text-white">Active Capabilities</h3>
							<div class="space-y-4">
								{#each $getUserCapabilitiesQuery.data.capabilities.filter((cap) => cap.active) as capability}
									<div class="flex justify-between items-center p-4 rounded-lg bg-surface-700/50">
										<div>
											<h3 class="font-medium text-tertiary-200">{capability.name}</h3>
											<p class="text-sm text-surface-300">{capability.description}</p>
										</div>
										{#if capability.type === 'TIER' && !['HOMINIO', 'VISIONCREATOR'].includes(capability.config?.tier)}
											<button
												class="px-3 py-1 text-sm font-medium rounded-lg text-error-400 hover:bg-error-400/10"
												on:click={() => handleRemoveCapability(capability)}
												disabled={changingTierId === capability.id}
											>
												{#if changingTierId === capability.id}
													<div
														class="w-4 h-4 rounded-full border-2 animate-spin border-t-transparent"
													/>
												{:else}
													Remove
												{/if}
											</button>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{:else if $userStatsQuery.isLoading}
					<!-- Loading state here -->
				{:else if $userStatsQuery.error}
					<!-- Error state here -->
				{/if}
				<!-- Bottom spacer -->
				<div class="h-24" />
			</div>
		{/if}
	</main>

	<!-- Right Sidebar -->
	<aside
		class="fixed inset-y-0 right-0 z-40 w-80 transition-transform transform md:relative md:translate-x-0 {showRightSidebar
			? 'translate-x-0'
			: 'translate-x-full'} overflow-y-auto border-l border-surface-700 bg-surface-800"
	>
		<div class="p-4 mt-14 md:mt-0">
			{#if showUltravoxDashboard}
				<div class="overflow-y-auto p-4 h-full">
					<h2 class="mb-4 text-xl font-semibold">Available Voices</h2>
					{#if $voicesQuery.isLoading}
						<div class="space-y-4">
							{#each Array(3) as _}
								<div class="p-4 rounded-lg animate-pulse bg-surface-700">
									<div class="mb-2 w-1/2 h-4 rounded bg-surface-600" />
									<div class="w-3/4 h-3 rounded bg-surface-600" />
								</div>
							{/each}
						</div>
					{:else if $voicesQuery.error}
						<div class="p-4 text-red-400 rounded-lg bg-surface-700">
							Error loading voices: {$voicesQuery.error.message}
						</div>
					{:else if $voicesQuery.data?.voices}
						<div class="space-y-6">
							{#each Object.entries(groupVoicesByCategory($voicesQuery.data.voices)) as [language, languageVoices]}
								<div>
									<h3 class="mb-3 text-sm font-medium text-surface-300">{language}</h3>
									<div class="space-y-2">
										{#each languageVoices as voice}
											<div class="p-3 rounded-lg transition-colors bg-surface-700 hover:bg-surface-600">
												<div class="flex-1 min-w-0">
													<div class="flex items-center justify-between gap-2">
														<div>
															<h4 class="font-medium truncate">{voice.name}</h4>
															<p class="mt-0.5 text-xs truncate text-surface-400">({voice.voiceId})</p>
														</div>
													</div>
													{#if voice.previewUrl}
														<div class="mt-2">
															<audio
																bind:this={audioElements[voice.voiceId]}
																preload="none"
																on:ended={() => handleEnded(voice.voiceId)}
																on:timeupdate={() => handleTimeUpdate(voice.voiceId)}
															>
																<source src={voice.previewUrl} type="audio/mpeg" />
																Your browser does not support the audio element.
															</audio>
															<div class="flex gap-2 items-center">
																<button
																	class="transition-colors shrink-0 text-primary-400 hover:text-primary-300"
																	on:click={() => playPreview(voice.voiceId)}
																>
																	{#if currentlyPlaying === voice.voiceId}
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			class="w-5 h-5"
																			viewBox="0 0 20 20"
																			fill="currentColor"
																		>
																			<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
																		</svg>
																	{:else}
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			class="w-5 h-5"
																			viewBox="0 0 20 20"
																			fill="currentColor"
																		>
																			<path
																				d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
																			/>
																		</svg>
																	{/if}
																</button>
																<div class="overflow-hidden flex-1 h-1 rounded-full bg-surface-600">
																	<div
																		id="progress-{voice.voiceId}"
																		class="h-full transition-all duration-100 bg-primary-400"
																		style="width: 0%"
																	/>
																</div>
															</div>
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Call History Section -->
				{#if selectedUserId && $userStatsQuery.data?.recent_calls?.length}
					<div class="overflow-y-auto p-4 h-full">
						<h3 class="mb-4 text-lg font-semibold text-white">
							Call History ({$userStatsQuery.data.recent_calls.length} calls)
						</h3>
						<div class="space-y-4">
							{#each $userStatsQuery.data.recent_calls as call}
								<div class="p-4 rounded-lg bg-surface-700/50">
									<div class="flex justify-between items-start">
										<div>
											<p class="text-sm font-medium text-surface-200">
												{new Date(call.start_time).toLocaleString()}
											</p>
											<p class="mt-1 text-xs text-surface-300">
												Duration: {formatDuration(call.duration)}
											</p>
										</div>
										<span
											class={`px-2 py-1 text-xs font-medium rounded-full
													${call.status === 'completed' ? 'bg-success-500/20 text-success-400' : ''}
													${call.status === 'error' ? 'bg-error-500/20 text-error-400' : ''}
													${call.status === 'active' ? 'bg-warning-500/20 text-warning-400' : ''}
												`}
										>
											{call.status}
										</span>
									</div>
									{#if call.error}
										<p class="mt-2 text-xs text-error-400">{call.error}</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</aside>
</div>

<style>
	:global(html) {
		background-color: rgb(var(--color-surface-900));
	}
</style>
