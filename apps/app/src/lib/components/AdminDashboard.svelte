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
			await Promise.all([
				$getUserCapabilitiesQuery.refetch(),
				$userStatsQuery.refetch()
			]);
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
				await Promise.all([
					$getUserCapabilitiesQuery.refetch(),
					$userStatsQuery.refetch()
				]);
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
					<!-- Usage Overview -->
					<div class="p-6 w-full rounded-lg bg-surface-800">
						<div class="grid grid-cols-4 gap-4">
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
									of {formatDuration($userStatsQuery.data.minutes_limit)}
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
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Left Column: Usage Overview and Tier Management -->
						<div class="space-y-6">
							<!-- Tier Management -->
							{#if $getUserCapabilitiesQuery.data?.capabilities}
								<div class="p-6 rounded-lg bg-surface-800">
									<h3 class="mb-4 text-lg font-semibold text-white">Tier Management</h3>
									
									<!-- Tier Information -->
									<div class="mb-4 p-4 rounded-lg bg-surface-700/50">
										<div class="flex items-center justify-between">
											<div>
												<p class="text-sm text-surface-200">Total Minutes Limit</p>
												<p class="mt-1 text-2xl font-semibold text-white">
													{formatDuration($userStatsQuery.data.minutes_limit)}
												</p>
											</div>
											<div class="text-right">
												<p class="text-sm text-surface-200">Active Tiers</p>
												<p class="mt-1 text-2xl font-semibold text-white">
													{$getUserCapabilitiesQuery.data.capabilities.length}
												</p>
											</div>
										</div>
									</div>
									
									<!-- Simplified Tier Buttons -->
									<div class="flex gap-3 mb-6">
										<button
											class="px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
											on:click={() => selectedUserId && handleTierChange(selectedUserId, 'FREE')}
										>
											+5m FREE
										</button>
										<button
											class="px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
											on:click={() => selectedUserId && handleTierChange(selectedUserId, 'HOMINIO')}
										>
											+60m HOMINIO
										</button>
										<button
											class="px-4 py-2 text-sm font-medium rounded-lg border border-tertiary-500 text-tertiary-500 hover:bg-tertiary-500/10"
											on:click={() => selectedUserId && handleTierChange(selectedUserId, 'VISIONCREATOR')}
										>
											+240m VISIONCREATOR
										</button>
									</div>

									<!-- Active Capabilities List -->
									<div class="space-y-2">
										<h4 class="text-sm font-medium text-surface-200">Active Capabilities</h4>
										<div class="space-y-4">
											{#each $getUserCapabilitiesQuery.data.capabilities as capability}
												<div class="p-4 rounded-lg bg-surface-700/50">
													<div class="flex justify-between items-start">
														<div>
															<div class="flex items-center gap-2">
																<p class="text-sm font-medium text-surface-200">{capability.config.tier}</p>
																<p class="text-xs text-surface-300">{capability.config.minutesLimit}m</p>
															</div>
															<p class="mt-1 text-xs text-surface-300">
																Granted: {new Date(capability.granted_at).toLocaleDateString()} by {capability.profiles?.name || 'Unknown'}
															</p>
														</div>
														<button
															class="text-xs text-red-400 hover:text-red-300"
															on:click={() => handleRemoveCapability(capability)}
														>
															Remove
														</button>
													</div>
												</div>
											{/each}
										</div>
									</div>
								</div>
							{/if}
						</div>

						<!-- Right Column: Call History and Capabilities -->
						<div class="space-y-6">
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
						</div>
					</div>
				{:else if $userStatsQuery.isLoading}
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<!-- Loading State: Left Column -->
						<div class="space-y-6">
							<div class="p-6 rounded-lg animate-pulse bg-surface-800">
								<div class="h-6 w-32 rounded bg-surface-700" />
								<div class="mt-4 space-y-3">
									<div class="h-12 rounded bg-surface-700" />
									<div class="h-12 rounded bg-surface-700" />
									<div class="h-12 rounded bg-surface-700" />
								</div>
							</div>
						</div>
						<!-- Loading State: Right Column -->
						<div class="space-y-6">
							<div class="p-6 rounded-lg animate-pulse bg-surface-800">
								<div class="h-6 w-32 rounded bg-surface-700" />
								<div class="mt-4 space-y-3">
									<div class="h-12 rounded bg-surface-700" />
									<div class="h-12 rounded bg-surface-700" />
									<div class="h-12 rounded bg-surface-700" />
								</div>
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
