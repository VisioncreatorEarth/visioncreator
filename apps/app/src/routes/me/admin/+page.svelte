<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';

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

	// Queries and mutations with proper store syntax
	const usersQuery = createQuery({
		operationName: 'getUsers',
		enabled: true
	});

	let selectedUserId: string | null = null;

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

	// Constants
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

	let selectedListId: string | null = null;

	// Helper functions to work with the new capability system
	function getTierCapability(capabilities: Capability[]) {
		return capabilities.find((c) => c.type === 'TIER' && c.active);
	}

	// Functions
	async function selectUser(user: User) {
		selectedUserId = user.id;
	}

	async function manageTier(userId: string | null, tier: 'FREE' | 'HOMINIO' | 'HOMINIO_PLUS') {
		if (!userId || changingTierId) return;
		changingTierId = tier;

		try {
			await $manageCapabilitiesMutation.mutateAsync({
				userId,
				action: 'grant',
				tier
			});
		} catch (error) {
			console.error('Failed to manage tier:', error);
		} finally {
			changingTierId = null;
		}
	}
</script>

<div class="container p-4 mx-auto h-screen">
	<h1 class="mb-6 text-3xl font-bold text-white">User Management</h1>

	{#if $usersQuery.isLoading}
		<div class="flex justify-center">
			<span class="loading loading-spinner loading-lg" />
		</div>
	{:else if $usersQuery.error}
		<div class="text-error-500">Error loading users: {$usersQuery.error.message}</div>
	{:else}
		<div class="grid grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
			<!-- User List - 1/3 width -->
			<div class="flex overflow-auto flex-col h-full rounded-lg bg-surface-800">
				<h2 class="p-6 pb-4 text-xl font-semibold text-white">Users</h2>
				<div class="overflow-y-auto flex-1 p-6 pt-0">
					<div class="space-y-2">
						{#each $usersQuery.data?.users || [] as user}
							<button
								class="w-full text-left p-3 rounded-lg {selectedUserId === user.id
									? 'bg-primary-500'
									: 'bg-surface-900'} hover:bg-primary-600 transition-colors"
								on:click={() => selectUser(user)}
							>
								{user.name}
								<span class="text-sm text-white/75">({user.id})</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Access Management - 1/3 width -->
			{#if selectedUserId && $getUserCapabilitiesQuery.data?.capabilities}
				<!-- Middle Section - Tier Management -->
				<div class="flex overflow-auto flex-col h-full rounded-lg bg-surface-800">
					<h2 class="p-6 pb-4 text-xl font-semibold text-white">Tier Management</h2>
					<div class="overflow-y-auto flex-1 p-6 pt-0">
						{#if $getUserCapabilitiesQuery.isLoading}
							<div class="flex justify-center">
								<span class="loading loading-spinner loading-lg" />
							</div>
						{:else if $getUserCapabilitiesQuery.error}
							<div class="text-error-500">
								Error loading capabilities: {$getUserCapabilitiesQuery.error.message}
							</div>
						{:else}
							<div class="space-y-4">
								{#each tiers as tier}
									<div class="flex justify-between items-center p-4 rounded-lg bg-surface-900">
										<div class="flex-1">
											<h3 class="font-medium text-white">{tier.name}</h3>
											<div class="space-y-1 text-sm text-white/75">
												{#each tier.features as feature}
													<p class="flex gap-2 items-center">
														<span class="text-success-400">✓</span>
														{feature}
													</p>
												{/each}
											</div>
										</div>
										<button
											class="px-4 py-2 rounded-lg transition-all {getTierCapability(
												$getUserCapabilitiesQuery.data.capabilities
											)?.config.tier === tier.id
												? 'bg-primary-500 text-white'
												: 'bg-surface-800 text-white/75 hover:bg-surface-700'}"
											on:click={() => manageTier(selectedUserId, tier.id)}
											disabled={changingTierId !== null}
										>
											{#if changingTierId === tier.id}
												<span class="loading loading-spinner loading-xs" />
											{:else}
												{getTierCapability($getUserCapabilitiesQuery.data.capabilities)?.config
													.tier === tier.id
													? 'Active'
													: 'Activate'}
											{/if}
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Audit Trail -->
				<div class="flex overflow-auto flex-col h-full rounded-lg bg-surface-800">
					<h2 class="p-6 pb-4 text-xl font-semibold text-white">Stats & Audit Trail</h2>
					<div class="overflow-y-auto flex-1 p-6 pt-0">
						{#if $userStatsQuery.data?.stats}
							<div class="p-4 mb-6 rounded-lg bg-surface-700">
								<h3 class="mb-4 text-lg font-semibold text-white">Usage Statistics</h3>
								<div class="grid grid-cols-2 gap-4">
									<div>
										<p class="text-sm text-surface-200">Total Calls</p>
										<p class="text-lg font-semibold">{$userStatsQuery.data.stats.total_calls}</p>
									</div>
									<div>
										<p class="text-sm text-surface-200">Success Rate</p>
										<p class="text-lg font-semibold">
											{$userStatsQuery.data.stats.success_rate.toFixed(1)}%
										</p>
									</div>
									<div>
										<p class="text-sm text-surface-200">Minutes Used</p>
										<p class="text-lg font-semibold">
											{$userStatsQuery.data.stats.minutes_used} / {$userStatsQuery.data.stats.minutes_limit}
										</p>
									</div>
									<div>
										<p class="text-sm text-surface-200">Minutes Remaining</p>
										<p class="text-lg font-semibold">{$userStatsQuery.data.stats.minutes_remaining}</p>
									</div>
								</div>
							</div>

							{#if $userStatsQuery.data.stats.recent_calls?.length > 0}
								<div class="mt-6">
									<h3 class="mb-4 text-lg font-semibold text-white">Recent Calls</h3>
									<div class="space-y-3">
										{#each $userStatsQuery.data.stats.recent_calls as call}
											<div class="p-3 rounded-lg bg-surface-700">
												<div class="flex justify-between items-center">
													<span class="text-sm text-surface-200">
														{new Date(call.start_time).toLocaleString()}
													</span>
													<span class="px-2 py-1 text-xs rounded-full" class:bg-green-700={call.status === 'completed'} class:bg-red-700={call.status === 'error'} class:bg-blue-700={call.status === 'active'}>
														{call.status}
													</span>
												</div>
												<div class="mt-2">
													<p class="text-sm">Duration: {call.duration?.toFixed(1) || 0} minutes</p>
													{#if call.error}
														<p class="mt-1 text-sm text-red-400">{call.error}</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{:else if $userStatsQuery.isLoading}
							<div class="flex justify-center p-4">
								<div class="loading loading-spinner loading-md" />
							</div>
						{/if}
						{#if $auditLogsQuery.isLoading}
							<div class="flex justify-center">
								<span class="loading loading-spinner loading-lg" />
							</div>
						{:else if $auditLogsQuery.error}
							<div class="text-error-500">
								Error loading audit logs: {$auditLogsQuery.error.message}
							</div>
						{:else if $auditLogsQuery.data?.logs}
							<div class="space-y-3">
								{#each $auditLogsQuery.data.logs as log}
									{@const details = (() => {
										try {
											return typeof log.details === 'string' ? JSON.parse(log.details) : null;
										} catch {
											return null;
										}
									})()}
									<div class="p-4 rounded-lg bg-surface-900">
										<div class="flex justify-between items-start mb-2">
											<div class="flex gap-2 items-center">
												{#if log.action === 'GRANT_TIER'}
													<span
														class="px-2 py-1 text-xs font-medium rounded-full bg-success-400/20 text-success-400"
													>
														Grant
													</span>
												{:else if log.action === 'REVOKE_TIER'}
													<span
														class="px-2 py-1 text-xs font-medium rounded-full bg-error-400/20 text-error-400"
													>
														Revoke
													</span>
												{:else}
													<span
														class="px-2 py-1 text-xs font-medium rounded-full bg-primary-400/20 text-primary-400"
													>
														{log.action}
													</span>
												{/if}
												<span class="text-sm font-medium text-white">Tier Change</span>
											</div>
											<span class="text-xs text-white/75">
												{new Date(log.timestamp).toLocaleString()}
											</span>
										</div>

										{#if details}
											<div class="mt-2 space-y-2">
												<div class="flex gap-2 items-center">
													<span class="text-sm font-medium text-white/75">Tier:</span>
													<span
														class="px-2 py-1 text-xs font-medium rounded-full bg-primary-400/20 text-primary-400"
													>
														{details.tier}
													</span>
												</div>
												{#if details.description}
													<p class="text-sm text-white/75">{details.description}</p>
												{/if}
												<div class="flex gap-2 items-center">
													<span class="text-sm font-medium text-white/75">Agent Requests:</span>
													<span class="text-sm text-white">{details.aiRequestsLimit} per week</span>
												</div>
											</div>
										{:else}
											<p class="text-sm text-white/75">{log.details}</p>
										{/if}

										<div class="pt-2 mt-2 border-t border-surface-700">
											<div class="flex gap-2 items-center text-xs text-white/50">
												<span>By:</span>
												<span class="font-medium text-white/75">{log.performedBy}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
