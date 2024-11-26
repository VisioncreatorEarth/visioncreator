<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import UltravoxDashboard from './UltravoxDashboard.svelte';

	// Types
	interface User {
		id: string;
		name: string;
	}

	interface Capability {
		id: string;
		user_id: string;
		type: string;
		name: string;
		description: string;
		config: {
			tier: 'FREE' | 'HOMINIO' | 'HOMINIO_PLUS';
			minutesLimit?: number;
			[key: string]: any;
		};
		granted_at: string;
		granted_by: string;
		active: boolean;
	}

	interface AuditLog {
		id: string;
		timestamp: string;
		action: string;
		userId: string;
		details: string;
		performedBy: string;
		capabilityId: string;
		capabilityType: string;
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

	$: auditLogsQuery = createQuery({
		operationName: 'getAuditLogs',
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
			minutesLimit: 2,
			features: ['2 minutes one-time usage', 'Shopping List Management', 'Basic Shopping Assistant']
		},
		{
			id: 'HOMINIO',
			name: 'Hominio',
			minutesLimit: 60,
			features: ['60 minutes per month', 'Everything in Free', 'Advanced Shopping Assistant', 'Todo Management']
		},
		{
			id: 'HOMINIO_PLUS',
			name: 'Hominio+',
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

	// Calculate precise minutes used from recent calls
	function calculatePreciseMinutesUsed(stats: any): number {
		if (!stats.recent_calls?.length) return 0;
		
		return stats.recent_calls.reduce((total: number, call: any) => {
			return total + (call.duration || 0);
		}, 0);
	}

	$: if ($userStatsQuery.data?.stats) {
		console.log('Raw stats data:', $userStatsQuery.data.stats);
		console.log('Recent calls:', $userStatsQuery.data.stats.recent_calls);
	}

	function handleTierChange(userId: string, tierId: string) {
		if (!userId || changingTierId) return;
		changingTierId = tierId;

		try {
			$manageCapabilitiesMutation.mutateAsync({
				userId,
				action: 'grant',
				tier: tierId
			});
		} catch (error) {
			console.error('Failed to manage tier:', error);
		} finally {
			changingTierId = null;
		}
	}

	function getCurrentTier(capabilities: Capability[]) {
		return capabilities.find((c) => c.type === 'TIER' && c.active);
	}
</script>

<div class="flex h-screen">
	<!-- Left Sidebar - User Selection -->
	<aside class="w-80 overflow-y-auto border-r border-surface-700 bg-surface-800">
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
					{#each $usersQuery.data.users as user}
						<button
							class="w-full p-3 text-left rounded-lg transition-colors {selectedUserId === user.id
								? 'bg-tertiary-500/20 text-tertiary-400'
								: 'hover:bg-surface-700 text-surface-200'}"
							on:click={() => {
								selectedUserId = user.id;
								showUltravoxDashboard = false;
							}}
						>
							{user.name}
							<span class="text-sm opacity-75">({user.id})</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="flex-1 overflow-y-auto bg-surface-900">
		{#if showUltravoxDashboard}
			<UltravoxDashboard />
		{:else if selectedUserId}
			<div class="p-6 space-y-6">
				{#if $userStatsQuery.data?.stats}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Left Column: Usage Overview and Tier Management -->
						<div class="space-y-6">
							<!-- Usage Overview -->
							<div class="p-6 rounded-lg bg-surface-800">
								<h3 class="mb-4 text-lg font-semibold text-white">Usage Overview</h3>
								<div class="grid grid-cols-2 gap-4">
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Total Calls</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{$userStatsQuery.data.stats.total_calls}
										</p>
									</div>
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Success Rate</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{$userStatsQuery.data.stats.success_rate.toFixed(1)}%
										</p>
									</div>
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Minutes Used</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{formatDuration(calculatePreciseMinutesUsed($userStatsQuery.data.stats))}
										</p>
										<p class="mt-1 text-xs text-surface-300">
											of {$userStatsQuery.data.stats.minutes_limit}m limit
										</p>
									</div>
									<div class="p-4 rounded-lg bg-surface-700/50">
										<p class="text-sm text-surface-200">Minutes Remaining</p>
										<p class="mt-1 text-2xl font-semibold text-white">
											{formatDuration($userStatsQuery.data.stats.minutes_limit - calculatePreciseMinutesUsed($userStatsQuery.data.stats))}
										</p>
										<p class="mt-1 text-xs text-surface-300">
											this month
										</p>
									</div>
								</div>
							</div>

							<!-- Tier Management -->
							{#if $getUserCapabilitiesQuery.data?.capabilities}
								<div class="p-6 rounded-lg bg-surface-800">
									<h3 class="mb-4 text-lg font-semibold text-white">Tier Management</h3>
									<div class="space-y-4">
										{#each tiers as tier}
											{@const currentTier = getCurrentTier($getUserCapabilitiesQuery.data.capabilities)}
											<div class="p-4 rounded-lg bg-surface-700/50">
												<div class="flex justify-between items-start">
													<div>
														<h4 class="font-medium text-white">{tier.name}</h4>
														<ul class="mt-2 space-y-1 text-sm text-surface-200">
															{#each tier.features as feature}
																<li class="flex gap-2 items-center">
																	<span class="text-success-400">✓</span>
																	{feature}
																</li>
															{/each}
														</ul>
													</div>
													<button
														class={`px-4 py-2 rounded-lg transition-colors ${currentTier?.config.tier === tier.id ? 'bg-tertiary-500/20 text-tertiary-400' : 'bg-tertiary-500 text-white hover:bg-tertiary-600'}`}
														on:click={() => selectedUserId && handleTierChange(selectedUserId, tier.id)}
														disabled={changingTierId === tier.id}
													>
														{#if changingTierId === tier.id}
															<span class="inline-block w-4 h-4 border-2 rounded-full animate-spin" />
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

						<!-- Right Column: Call History -->
						<div class="space-y-6">
							{#if $userStatsQuery.data.stats.recent_calls?.length}
								<div class="p-6 rounded-lg bg-surface-800">
									<h3 class="mb-4 text-lg font-semibold text-white">Call History</h3>
									<div class="space-y-4">
										{#each $userStatsQuery.data.stats.recent_calls as call}
											<div class="p-4 rounded-lg bg-surface-700/50">
												<div class="flex justify-between items-center">
													<span class="text-sm text-surface-200">
														{new Date(call.start_time).toLocaleString()}
													</span>
													<span
														class={`px-2 py-1 text-xs rounded-full ${call.status === 'completed' ? 'bg-success-500/20 text-success-400' : ''} ${call.status === 'error' ? 'bg-error-500/20 text-error-400' : ''} ${call.status === 'active' ? 'bg-tertiary-500/20 text-tertiary-400' : ''}`}
													>
														{call.status}
													</span>
												</div>
												<div class="mt-3 grid grid-cols-2 gap-4">
													<div>
														<p class="text-sm text-surface-200">Duration</p>
														<p class="text-sm font-medium text-white">
															{formatDuration(call.duration || 0)}
														</p>
													</div>
													{#if call.end_time}
														<div>
															<p class="text-sm text-surface-200">Completed</p>
															<p class="text-sm font-medium text-white">
																{new Date(call.end_time).toLocaleString()}
															</p>
														</div>
													{/if}
												</div>
												{#if call.error}
													<div class="mt-3 p-2 rounded bg-error-500/10">
														<p class="text-sm text-error-400">{call.error}</p>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{:else if $userStatsQuery.isLoading}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Loading State: Left Column -->
						<div class="space-y-6">
							<div class="p-6 rounded-lg bg-surface-800 animate-pulse">
								<div class="h-6 w-48 mb-6 rounded bg-surface-700" />
								<div class="grid grid-cols-2 gap-4">
									{#each Array(4) as _}
										<div class="p-4 rounded-lg bg-surface-700/50">
											<div class="h-4 w-24 mb-2 rounded bg-surface-600" />
											<div class="h-8 w-16 rounded bg-surface-600" />
										</div>
									{/each}
								</div>
							</div>
							<div class="p-6 rounded-lg bg-surface-800 animate-pulse">
								<div class="h-6 w-48 mb-6 rounded bg-surface-700" />
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
						<div class="p-6 rounded-lg bg-surface-800 animate-pulse">
							<div class="h-6 w-48 mb-6 rounded bg-surface-700" />
							<div class="space-y-4">
								{#each Array(5) as _}
									<div class="p-4 rounded-lg bg-surface-700/50">
										<div class="flex justify-between items-center mb-4">
											<div class="h-4 w-32 rounded bg-surface-600" />
											<div class="h-6 w-16 rounded bg-surface-600" />
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
