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
			tier: 'free' | 'homino' | 'visioncreator';
			aiRequestsLimit?: number;
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

	$: auditLogsQuery = createQuery({
		operationName: 'getAuditLogs',
		input: { userId: selectedUserId || '' },
		enabled: !!selectedUserId
	});

	const manageCapabilitiesMutation = createMutation({
		operationName: 'manageCapabilities'
	});

	// Constants
	const tiers = [
		{
			id: 'free',
			name: 'Free Tier',
			aiLimit: 5,
			features: ['Unlimited Shopping Lists', '5 AI requests per month', 'Shopping Agent']
		},
		{
			id: 'homino',
			name: 'Homino',
			aiLimit: 100,
			features: ['Everything in Free, plus:', '100 Hominio requests per month', 'Todo Agent']
		},
		{
			id: 'visioncreator',
			name: 'Vision Creator',
			aiLimit: 500,
			features: [
				'Everything in Homino, plus:',
				'500 Hominio requests per month',
				'Email Agent',
				'Beta Access to New Features & Skills'
			]
		}
	];

	const accessLevels = [
		{ value: 'read' as const, label: 'Read', color: 'bg-primary-400' },
		{ value: 'write' as const, label: 'Write', color: 'bg-success-400' },
		{ value: 'owner' as const, label: 'Owner', color: 'bg-warning-400' }
	];

	// Mock shopping lists (would come from API in real implementation)
	const mockShoppingLists = [
		{ id: 'list-1', name: 'Groceries' },
		{ id: 'list-2', name: 'Hardware Store' }
	];

	let selectedAccessLevel: 'read' | 'write' | 'owner' = 'read';
	let selectedListId: string | null = null;

	// Helper functions to work with the new capability system
	function getTierCapability(capabilities: Capability[]) {
		return capabilities.find((c) => c.type === 'TIER' && c.active);
	}

	function getResourceCapabilities(capabilities: Capability[]) {
		return capabilities.filter((c) => c.type === 'RESOURCE' && c.active);
	}

	// Functions
	async function selectUser(user: User) {
		selectedUserId = user.id;
	}

	async function manageTier(userId: string | null, tier: 'free' | 'homino' | 'visioncreator') {
		if (!userId) return;
		try {
			await $manageCapabilitiesMutation.mutate({
				userId,
				action: 'grant',
				tier
			});
			// Refresh capabilities using the store
			$getUserCapabilitiesQuery.refetch();
			$auditLogsQuery.refetch();
		} catch (error) {
			console.error('Failed to manage tier:', error);
			// Handle error appropriately (e.g., show toast notification)
		}
	}

	async function manageListAccess(action: 'grant' | 'revoke') {
		if (!selectedUserId || !selectedListId) return;
		try {
			await $manageCapabilitiesMutation.mutate({
				userId: selectedUserId,
				action,
				tier: 'free' // Default tier for list access
			});
			// Refresh capabilities using the store
			$getUserCapabilitiesQuery.refetch();
			$auditLogsQuery.refetch();
		} catch (error) {
			console.error('Failed to manage list access:', error);
			// Handle error appropriately
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
			{#if selectedUserId && $getUserCapabilitiesQuery.data}
				<div class="flex overflow-auto flex-col h-full rounded-lg bg-surface-800">
					<h2 class="p-6 pb-4 text-xl font-semibold text-white">Tier Management</h2>
					<div class="overflow-y-auto flex-1 p-6 pt-0">
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
									<label class="cursor-pointer label">
										<input
											type="radio"
											name="tier"
											class="radio"
											checked={getTierCapability($getUserCapabilitiesQuery.data.capabilities)
												?.config.tier === tier.id}
											on:change={() => manageTier(selectedUserId, tier.id)}
										/>
									</label>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Audit Trail - 1/3 width -->
				<div class="flex overflow-auto flex-col h-full rounded-lg bg-surface-800">
					<h2 class="p-6 pb-4 text-xl font-semibold text-white">Audit Trail</h2>
					<div class="overflow-y-auto flex-1 p-6 pt-0">
						<div class="space-y-3">
							{#each $auditLogsQuery.data?.logs || [] as log}
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
												<span class="text-sm font-medium text-white/75">AI Requests:</span>
												<span class="text-sm text-white">{details.aiRequestsLimit} per month</span>
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
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
