<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import UltravoxDashboard from './UltravoxDashboard.svelte';

	interface Capability {
		id: string;
		user_id: string;
		type: string;
		name: string;
		description: string;
		config: {
			tier: 'FREE' | 'HOMINIO' | 'VISIONCREATOR';
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
	let activeTab = 'calls';

	const tiers = [
		{
			id: 'FREE',
			name: 'Free Tier',
			minutesLimit: 5,
			features: ['5 minutes one-time usage', 'Shopping List Management', 'Basic Shopping Assistant']
		},
		{
			id: 'HOMINIO',
			name: 'Hominio',
			minutesLimit: 60,
			features: [
				'60 minutes per month',
				'Everything in Free',
				'Advanced Shopping Assistant',
				'Todo Management'
			]
		},
		{
			id: 'VISIONCREATOR',
			name: 'Visioncreator',
			minutesLimit: 240,
			features: [
				'240 minutes per month',
				'Everything in Hominio',
				'Priority Support',
				'Beta Access to New Features'
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

	function handleTierChange(userId: string, tierId: string) {
		if (!userId || changingTierId) return;
		changingTierId = tierId;

		try {
			$manageCapabilitiesMutation.mutateAsync({
				userId,
				action: tierId === 'revoke' ? 'revoke' : 'grant',
				tier: tierId === 'revoke' ? null : tierId
			});
			$getUserCapabilitiesQuery.refetch();
		} catch (error) {
			console.error('Failed to manage tier:', error);
		} finally {
			changingTierId = null;
		}
	}

	function getCurrentTier(capabilities: Capability[]) {
		return capabilities.find((c) => c.type === 'TIER' && c.active);
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
				// Refresh the capabilities data
				await $getUserCapabilitiesQuery.refetch();
			}
		} catch (error) {
			console.error('Failed to remove capability:', error);
		}
	}
</script>

<div class="flex h-screen">
	<!-- Left Sidebar - User Selection -->
	<aside class="overflow-y-auto w-80 border-r border-surface-700 bg-surface-800">
		<div class="p-4">
			<!-- Special UltravoxDashboard Link -->
			<button
				class="w-full p-3 mb-4 text-left rounded-lg transition-colors {showUltravoxDashboard
					? 'bg-tertiary-500/20 text-tertiary-400'
					: 'hover:bg-surface-700 text-surface-200'}"
				on:click={() => (showUltravoxDashboard = true)}
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
	<main class="overflow-y-auto flex-1 bg-surface-900">
		{#if showUltravoxDashboard}
			<UltravoxDashboard />
		{:else if selectedUserId}
			<div class="p-6 space-y-6">
				{#if $userStatsQuery.data}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Left Column: Usage Overview and Tier Management -->
						<div class="space-y-6">
							<!-- Usage Overview -->
							<div class="p-6 rounded-lg bg-surface-800">
								<h3 class="mb-4 text-lg font-semibold text-white">Usage Overview</h3>
								<div class="grid grid-cols-2 gap-4">
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Total Calls</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{$userStatsQuery.data.total_calls}
										</p>
									</div>
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Success Rate</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{$userStatsQuery.data.success_rate.toFixed(1)}%
										</p>
									</div>
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Minutes Used</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{formatDuration($userStatsQuery.data.minutes_used)}
										</p>
										<p class="mt-1 text-xs text-surface-300">
											of {$userStatsQuery.data.minutes_limit}m limit
										</p>
									</div>
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Minutes Remaining</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{formatDuration($userStatsQuery.data.minutes_remaining)}
										</p>
										<p class="mt-1 text-xs text-surface-300">this month</p>
									</div>
								</div>
							</div>

							<!-- Tier Management -->
							{#if $getUserCapabilitiesQuery.data?.capabilities}
								<div class="p-6 rounded-lg bg-surface-800">
									<h3 class="text-lg font-semibold text-white mb-4">Tier Management</h3>
									<div class="space-y-4">
										{#each tiers as tier}
											{@const currentTier = getCurrentTier(
												$getUserCapabilitiesQuery.data.capabilities
											)}
											<div class="p-4 rounded-lg bg-surface-700/50">
												<div class="flex justify-between items-center">
													<div>
														<h4 class="font-medium text-white">{tier.name}</h4>
														<p class="mt-1 text-sm text-surface-200">
															{tier.minutesLimit} minutes {tier.id === 'FREE'
																? '(one-time)'
																: 'per month'}
														</p>
													</div>
													<button
														class={`px-4 py-2 rounded-lg transition-colors ${
															currentTier?.config.tier === tier.id
																? 'bg-tertiary-500/20 text-tertiary-400'
																: 'border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10'
														}`}
														on:click={() =>
															selectedUserId && handleTierChange(selectedUserId, tier.id)}
														disabled={changingTierId === tier.id}
													>
														{#if changingTierId === tier.id}
															<span
																class="inline-block w-4 h-4 rounded-full border-2 animate-spin"
															/>
														{:else if currentTier?.config.tier === tier.id}
															Active
														{:else}
															Activate
														{/if}
													</button>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<!-- Right Column: Call History and Capabilities -->
						<div class="space-y-6">
							<!-- Tab Navigation -->
							<div class="flex mb-4 space-x-4">
								<button
									class="px-4 py-2 rounded-lg {activeTab === 'calls'
										? 'bg-primary-500'
										: 'bg-surface-700'}"
									on:click={() => (activeTab = 'calls')}
								>
									Call History
								</button>
								<button
									class="px-4 py-2 rounded-lg {activeTab === 'capabilities'
										? 'bg-primary-500'
										: 'bg-surface-700'}"
									on:click={() => (activeTab = 'capabilities')}
								>
									Active Capabilities
								</button>
							</div>

							{#if activeTab === 'calls'}
								{#if $userStatsQuery.data.recent_calls?.length}
									<div class="p-6 rounded-lg bg-surface-800">
										<h3 class="mb-4 text-lg font-semibold text-white">
											Call History ({$userStatsQuery.data.recent_calls.length} calls)
										</h3>
										<div class="space-y-4 max-h-[800px] overflow-y-auto pr-2">
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
							{:else if $getUserCapabilitiesQuery.data?.capabilities?.length}
								<div class="p-6 rounded-lg bg-surface-800">
									<h3 class="mb-4 text-lg font-semibold text-white">
										Active Capabilities ({$getUserCapabilitiesQuery.data.capabilities.length})
									</h3>
									<div class="space-y-4">
										{#each $getUserCapabilitiesQuery.data.capabilities as capability}
											<div class="p-4 rounded bg-surface-700">
												<div class="flex justify-between items-start">
													<div>
														<h4 class="font-medium text-white">{capability.name}</h4>
														<p class="text-sm text-surface-200">{capability.description}</p>
														<div class="mt-2 text-xs text-surface-300">
															<p>Type: {capability.type}</p>
															<p>Tier: {capability.config.tier}</p>
															{#if capability.config.minutesLimit}
																<p>Minutes Limit: {capability.config.minutesLimit}</p>
															{/if}
															<p>Granted: {new Date(capability.granted_at).toLocaleDateString()}</p>
															<p>Granted by: {capability.profiles?.name || 'Unknown'}</p>
														</div>
													</div>
													<button
														class="px-3 py-1 text-sm font-medium text-white rounded-lg transition-colors bg-error-500 hover:bg-error-600"
														on:click={() => handleRemoveCapability(capability)}
														disabled={$manageCapabilitiesMutation.isLoading}
													>
														{$manageCapabilitiesMutation.isLoading ? 'Removing...' : 'Remove'}
													</button>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{:else}
								<div class="p-6 rounded-lg bg-surface-800">
									<p class="text-surface-200">No active capabilities found.</p>
								</div>
							{/if}
						</div>
					</div>
				{:else if $userStatsQuery.isLoading}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Loading State: Left Column -->
						<div class="space-y-6">
							<div class="p-6 rounded-lg animate-pulse bg-surface-800">
								<div class="mb-6 w-48 h-6 rounded bg-surface-700" />
								<div class="grid grid-cols-2 gap-4">
									{#each Array(4) as _}
										<div class="p-4 rounded-lg bg-surface-700/50">
											<div class="mb-2 w-24 h-4 rounded bg-surface-600" />
											<div class="w-16 h-8 rounded bg-surface-600" />
										</div>
									{/each}
								</div>
							</div>
							<div class="p-6 rounded-lg animate-pulse bg-surface-800">
								<div class="mb-6 w-48 h-6 rounded bg-surface-700" />
								<div class="space-y-4">
									{#each Array(3) as _}
										<div class="p-4 rounded-lg bg-surface-700/50">
											<div class="h-24 rounded bg-surface-600" />
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- Loading State: Right Column -->
						<div class="p-6 rounded-lg animate-pulse bg-surface-800">
							<div class="mb-6 w-48 h-6 rounded bg-surface-700" />
							<div class="space-y-4">
								{#each Array(5) as _}
									<div class="p-4 rounded-lg bg-surface-700/50">
										<div class="flex justify-between items-center mb-4">
											<div class="w-32 h-4 rounded bg-surface-600" />
											<div class="w-16 h-6 rounded bg-surface-600" />
										</div>
										<div class="grid grid-cols-2 gap-4">
											<div class="h-12 rounded bg-surface-600" />
											<div class="h-12 rounded bg-surface-600" />
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>

<style>
	:global(html) {
		background-color: rgb(var(--color-surface-900));
	}
</style>
