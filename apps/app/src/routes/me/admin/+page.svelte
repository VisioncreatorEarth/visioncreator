<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';

	// Types
	interface User {
		id: string;
		name: string;
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
		await $manageCapabilitiesMutation.mutate({
			userId,
			action: 'grant',
			capability: {
				type: 'TIER',
				name: `${tier} Tier`,
				description: `${tier} tier subscription`,
				config: {
					type: 'TIER',
					tier,
					aiRequestsLimit: tiers.find((t) => t.id === tier)?.aiLimit || 0,
					aiRequestsUsed: 0,
					lastResetAt: new Date().toISOString()
				}
			}
		});
	}

	async function manageListAccess(action: 'grant' | 'revoke') {
		if (!selectedUserId || !selectedListId) return;
		await $manageCapabilitiesMutation.mutate({
			userId: selectedUserId,
			action,
			capability: {
				type: 'RESOURCE',
				name: 'Shopping List Access',
				description: `${action} shopping list access`,
				config: {
					type: 'RESOURCE',
					resourceId: selectedListId,
					resourceType: 'SHOPPING_LIST',
					accessLevel: selectedAccessLevel
				}
			}
		});
	}
</script>

<div class="container p-4 mx-auto o">
	<h1 class="mb-6 text-3xl font-bold text-white">User Management</h1>

	{#if $usersQuery.isLoading}
		<div class="flex justify-center">
			<span class="loading loading-spinner loading-lg" />
		</div>
	{:else if $usersQuery.error}
		<div class="text-error-500">Error loading users: {$usersQuery.error.message}</div>
	{:else}
		<div class="grid grid-cols-3 gap-8">
			<!-- User List - 1/3 width -->
			<div class="h-screen p-6 overflow-auto rounded-lg bg-surface-800">
				<h2 class="mb-4 text-xl font-semibold text-white">Users</h2>
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

			<!-- Access Management - 1/3 width -->
			{#if selectedUserId && $getUserCapabilitiesQuery.data}
				<div class="space-y-6">
					<!-- Tier Management -->
					<div class="p-6 rounded-lg bg-surface-800">
						<h2 class="mb-4 text-xl font-semibold text-white">Tier Management</h2>
						<div class="space-y-4">
							{#each tiers as tier}
								<div class="flex items-center justify-between p-4 rounded-lg bg-surface-900">
									<div class="flex-1">
										<h3 class="font-medium text-white">{tier.name}</h3>
										<div class="space-y-1 text-sm text-white/75">
											{#each tier.features as feature}
												<p class="flex items-center gap-2">
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

					<!-- List Access Management -->
					<div class="p-6 rounded-lg bg-surface-800">
						<h2 class="mb-4 text-xl font-semibold text-white">List Access</h2>

						<!-- List Selection -->
						<div class="mb-4">
							<select class="w-full select bg-surface-700" bind:value={selectedListId}>
								<option value={null}>Select a list...</option>
								{#each mockShoppingLists as list}
									<option value={list.id}>{list.name}</option>
								{/each}
							</select>
						</div>

						<!-- Current Access -->
						{#if getResourceCapabilities($getUserCapabilitiesQuery.data.capabilities).length > 0}
							<div class="mb-4 space-y-2">
								{#each getResourceCapabilities($getUserCapabilitiesQuery.data.capabilities) as capability}
									<div class="p-3 rounded-lg bg-surface-900">
										<div class="flex items-center justify-between">
											<span class="text-white">List: {capability.config.resourceId}</span>
											<span
												class="px-2 py-1 text-xs rounded-full {accessLevels.find(
													(l) => l.value === capability.config.accessLevel
												)?.color}"
											>
												{capability.config.accessLevel}
											</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Access Management -->
						{#if selectedListId}
							<div class="flex items-center gap-2">
								<select class="select bg-surface-700" bind:value={selectedAccessLevel}>
									{#each accessLevels as level}
										<option value={level.value}>{level.label}</option>
									{/each}
								</select>

								<button
									class="px-3 py-1 text-sm rounded-lg bg-primary-500 hover:bg-primary-600"
									on:click={() => manageListAccess('grant')}
								>
									Grant Access
								</button>

								<button
									class="px-3 py-1 text-sm rounded-lg bg-error-500 hover:bg-error-600"
									on:click={() => manageListAccess('revoke')}
								>
									Revoke Access
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Audit Trail - 1/3 width -->
				<div class="p-6 rounded-lg bg-surface-800">
					<h2 class="mb-4 text-xl font-semibold text-white">Audit Trail</h2>
					<div class="space-y-3">
						{#each $auditLogsQuery.data?.logs || [] as log}
							<div class="p-3 rounded-lg bg-surface-900">
								<div class="flex items-start justify-between mb-1">
									<span class="text-sm font-medium text-white">{log.action}</span>
									<span class="text-xs text-white/75">
										{new Date(log.timestamp).toLocaleString()}
									</span>
								</div>
								<p class="text-sm text-white/75">{log.details}</p>
								<p class="mt-1 text-xs text-white/50">By: {log.performedBy}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
