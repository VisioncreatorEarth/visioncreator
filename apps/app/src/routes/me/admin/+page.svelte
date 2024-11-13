<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';

	// Types
	interface User {
		id: string;
		name: string;
	}

	interface TierCapability {
		type: string;
		limit?: number;
		tier: string;
	}

	interface ResourceCapability {
		resourceId: string;
		resourceType: string;
		accessLevel: 'read' | 'write' | 'owner';
		grantedAt: string;
		grantedBy: string;
	}

	interface CapabilitiesQueryResult {
		tier: string;
		tierCapabilities: TierCapability[];
		resourceCapabilities: ResourceCapability[];
	}

	interface AuditLog {
		timestamp: string;
		action: string;
		userId: string;
		details: string;
		performedBy: string;
	}

	// Queries and mutations with proper store syntax
	const usersQuery = createQuery<{ users: User[] }>({
		operationName: 'getUsers',
		enabled: true
	});

	let selectedUserId: string | null = null;

	$: getUserCapabilitiesQuery = createQuery<CapabilitiesQueryResult>({
		operationName: 'getUserCapabilities',
		input: { userId: selectedUserId || '' },
		enabled: !!selectedUserId
	});

	const manageCapabilitiesMutation = createMutation({
		operationName: 'manageCapabilities'
	});

	const manageListAccessMutation = createMutation({
		operationName: 'manageListAccess'
	});

	// Constants
	const tiers = [
		{ id: 'free', name: 'Free Tier', aiLimit: 5, shoppingListsLimit: 1 },
		{ id: 'homino', name: 'Homino', aiLimit: 100, shoppingListsLimit: 5 },
		{ id: 'visioncreator', name: 'Vision Creator', aiLimit: 500, shoppingListsLimit: 20 }
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

	// Mock audit logs (would come from API in real implementation)
	$: auditLogs = [
		{
			timestamp: new Date().toISOString(),
			action: 'TIER_CHANGE',
			userId: selectedUserId || '',
			details: 'Changed to Homino tier',
			performedBy: 'Admin'
		},
		{
			timestamp: new Date(Date.now() - 86400000).toISOString(),
			action: 'ACCESS_GRANTED',
			userId: selectedUserId || '',
			details: 'Granted write access to Shopping List "Groceries"',
			performedBy: 'Owner'
		}
	];

	// Functions
	async function selectUser(user: User) {
		selectedUserId = user.id;
	}

	async function updateTier(newTier: string) {
		try {
			await $manageCapabilitiesMutation.mutateAsync({
				userId: selectedUserId,
				tier: newTier
			});
			$getUserCapabilitiesQuery.refetch();
		} catch (error) {
			console.error('Failed to update tier:', error);
		}
	}

	async function manageListAccess(action: 'grant' | 'revoke') {
		if (!selectedListId || !selectedUserId) return;

		try {
			await $manageListAccessMutation.mutateAsync({
				listId: selectedListId,
				userId: selectedUserId,
				accessLevel: selectedAccessLevel,
				action
			});
			$getUserCapabilitiesQuery.refetch();
		} catch (error) {
			console.error('Failed to manage list access:', error);
		}
	}
</script>

<div class="container h-screen p-4 mx-auto">
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
			<div class="p-6 rounded-lg bg-surface-800">
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
						<h2 class="mb-4 text-xl font-semibold text-white">Access Management</h2>
						<div class="space-y-4">
							{#each tiers as tier}
								<div class="flex items-center justify-between p-3 rounded-lg bg-surface-900">
									<div>
										<h3 class="font-medium text-white">{tier.name}</h3>
										<div class="space-y-1 text-sm text-white/75">
											<p>{tier.aiLimit} AI requests per month</p>
											<p>{tier.shoppingListsLimit} Shopping Lists</p>
										</div>
									</div>
									<label class="cursor-pointer label">
										<input
											type="radio"
											name="tier"
											class="radio"
											checked={$getUserCapabilitiesQuery.data.tier === tier.id}
											on:change={() => updateTier(tier.id)}
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
						{#if $getUserCapabilitiesQuery.data.resourceCapabilities.length > 0}
							<div class="mb-4 space-y-2">
								{#each $getUserCapabilitiesQuery.data.resourceCapabilities as capability}
									<div class="p-3 rounded-lg bg-surface-900">
										<div class="flex items-center justify-between">
											<span class="text-white">List: {capability.resourceId}</span>
											<span
												class="px-2 py-1 text-xs rounded-full {accessLevels.find(
													(l) => l.value === capability.accessLevel
												)?.color}"
											>
												{capability.accessLevel}
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
						{#each auditLogs as log}
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
