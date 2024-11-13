<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';

	// Define query type
	interface UserQueryResult {
		users: Array<{
			id: string;
			name: string;
		}>;
	}

	interface CapabilitiesQueryResult {
		capabilities: Array<{
			type: string;
			limit?: number;
			tier: string;
		}>;
		auditLogs: Array<{
			timestamp: string;
			modified_by: string;
			action: string;
			details: string;
		}>;
		tier: string;
	}

	// Create queries and mutations using WunderGraph client
	const usersQuery = createQuery<UserQueryResult>({
		operationName: 'getUsers',
		enabled: true
	});

	let selectedUserId: string | null = null;

	// Query with dynamic input based on selected user
	$: getUserCapabilitiesQuery = createQuery<CapabilitiesQueryResult>({
		operationName: 'getUserCapabilities',
		input: { userId: selectedUserId || '' },
		enabled: !!selectedUserId
	});

	const manageCapabilitiesMutation = createMutation({
		operationName: 'manageCapabilities'
	});

	let selectedUser = null;
	let currentTier = 'free';

	const tiers = [
		{ id: 'free', name: 'Free Tier', limit: 5 },
		{ id: 'homino', name: 'Homino', limit: 100 },
		{ id: 'visioncreator', name: 'Vision Creator', limit: 500 }
	];

	async function selectUser(user) {
		selectedUser = user;
		selectedUserId = user.id;

		// The query will automatically refetch when selectedUserId changes
		if ($getUserCapabilitiesQuery.data) {
			currentTier = $getUserCapabilitiesQuery.data.tier;
		}
	}

	async function updateTier(newTier) {
		try {
			const response = await $manageCapabilitiesMutation.mutateAsync({
				userId: selectedUser.id,
				tier: newTier
			});

			if (response.success) {
				// Query will automatically refetch
				currentTier = newTier;
			}
		} catch (error) {
			console.error('Failed to update tier:', error);
		}
	}
</script>

<div class="container p-4 mx-auto space-y-8">
	<h1 class="mb-6 text-3xl font-bold text-white">User Tier Management</h1>

	{#if $usersQuery.isLoading}
		<div class="flex justify-center">
			<span class="loading loading-spinner loading-lg" />
		</div>
	{:else if $usersQuery.error}
		<div class="text-error-500">Error loading users: {$usersQuery.error.message}</div>
	{:else}
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<!-- User List -->
			<div class="p-6 rounded-lg bg-surface-800">
				<h2 class="mb-4 text-xl font-semibold text-white">Users</h2>
				<div class="space-y-2">
					{#each $usersQuery.data?.users || [] as user}
						<button
							class="w-full text-left p-3 rounded-lg {selectedUser?.id === user.id
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

			<!-- Tier Management -->
			{#if selectedUser && $getUserCapabilitiesQuery.data}
				<div class="space-y-6">
					<div class="p-6 rounded-lg bg-surface-800">
						<h2 class="mb-4 text-xl font-semibold text-white">
							Tier Management for {selectedUser.name}
						</h2>
						<div class="space-y-4">
							{#each tiers as tier}
								<div class="flex items-center justify-between p-3 rounded-lg bg-surface-900">
									<div>
										<h3 class="font-medium text-white">{tier.name}</h3>
										<p class="text-sm text-white/75">{tier.limit} AI requests per month</p>
									</div>
									<label class="cursor-pointer label">
										<input
											type="radio"
											name="tier"
											class="radio"
											checked={currentTier === tier.id}
											on:change={() => updateTier(tier.id)}
										/>
									</label>
								</div>
							{/each}
						</div>
					</div>

					<!-- Audit Trail -->
					<div class="p-6 rounded-lg bg-surface-800">
						<h2 class="mb-4 text-xl font-semibold text-white">Audit Trail</h2>
						<div class="space-y-2">
							{#each $getUserCapabilitiesQuery.data.auditLogs as log}
								<div class="p-3 text-sm rounded-lg bg-surface-900">
									<div class="flex justify-between text-white">
										<span>{new Date(log.timestamp).toLocaleString()}</span>
										<span>Modified by: {log.modified_by}</span>
									</div>
									<div class="mt-1 text-sm text-white/75">
										{log.action}: {log.details}
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
