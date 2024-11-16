<script>
	let agents = [
		{
			id: '1',
			name: 'Bert - Shopping Assistant',
			pkp: '0x1234...5678',
			capabilities: {
				list_1_private: {
					isEnabled: true,
					conditions: {
						maxItems: 50,
						timeRestriction: '9am-5pm',
						requiredRole: 'owner',
						description: 'Private grocery list for personal meal planning'
					}
				},
				list_2_family: {
					isEnabled: true,
					conditions: {
						maxItems: 100,
						sharedWith: ['0x5678...', '0x9101...'],
						description: 'Shared family grocery list for weekly shopping'
					}
				},
				list_3_household: {
					isEnabled: true,
					conditions: {
						maxItems: 25,
						allowedCategories: ['cleaning', 'maintenance', 'utilities'],
						description: 'Household maintenance and cleaning supplies'
					}
				}
			}
		}
	];

	function toggleCapability(agentId, resource) {
		agents = agents.map((agent) => {
			if (agent.id === agentId) {
				return {
					...agent,
					capabilities: {
						...agent.capabilities,
						[resource]: {
							...agent.capabilities[resource],
							isEnabled: !agent.capabilities[resource].isEnabled
						}
					}
				};
			}
			return agent;
		});
	}

	async function addAgent() {
		const newAgent = {
			id: (agents.length + 1).toString(),
			name: 'New Agent',
			pkp: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
			capabilities: {
				list_1_private: {
					isEnabled: false,
					conditions: {
						maxItems: 10,
						timeRestriction: 'always',
						requiredRole: 'none',
						description: 'Private grocery list for personal meal planning'
					}
				},
				list_2_family: {
					isEnabled: false,
					conditions: {
						maxItems: 10,
						sharedWith: [],
						description: 'Shared family grocery list for weekly shopping'
					}
				},
				list_3_household: {
					isEnabled: false,
					conditions: {
						maxItems: 10,
						allowedCategories: [],
						description: 'Household maintenance and cleaning supplies'
					}
				}
			}
		};
		agents = [...agents, newAgent];
	}

	function removeAgent(agentId) {
		agents = agents.filter((agent) => agent.id !== agentId);
	}
</script>

{#if agents.length > 0}
	<div class="container p-4 mx-auto space-y-4">
		<div class="flex justify-between items-center">
			<h2 class="h2">AI Agent Access Control</h2>
			<button class="btn variant-filled-primary" on:click={addAgent}>Add Agent</button>
		</div>

		<div class="p-4 card variant-filled-surface">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>Agent</th>
						<th>PKP</th>
						<th>List 1: Private</th>
						<th>List 2: Family</th>
						<th>List 3: Household</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each agents as agent (agent.id)}
						<tr>
							<td class="table-cell-fit">
								<div class="flex items-center space-x-4">
									<div class="placeholder" />
									<span class="font-bold">{agent.name}</span>
								</div>
							</td>
							<td class="table-cell-fit">
								<code class="code">{agent.pkp}</code>
							</td>
							<td class="table-cell-fit">
								<div class="flex flex-col space-y-2">
									<button
										class="chip {agent.capabilities.list_1_private.isEnabled
											? 'variant-filled-success'
											: 'variant-filled-surface'}"
										on:click={() => toggleCapability(agent.id, 'list_1_private')}
									>
										{agent.capabilities.list_1_private.isEnabled ? 'Enabled' : 'Disabled'}
									</button>
									<div class="text-xs">
										<div>Max Items: {agent.capabilities.list_1_private.conditions.maxItems}</div>
										<div>Time: {agent.capabilities.list_1_private.conditions.timeRestriction}</div>
										<div>Role: {agent.capabilities.list_1_private.conditions.requiredRole}</div>
										<div class="text-surface-600-300-token">{agent.capabilities.list_1_private.conditions.description}</div>
									</div>
								</div>
							</td>
							<td class="table-cell-fit">
								<div class="flex flex-col space-y-2">
									<button
										class="chip {agent.capabilities.list_2_family.isEnabled
											? 'variant-filled-success'
											: 'variant-filled-surface'}"
										on:click={() => toggleCapability(agent.id, 'list_2_family')}
									>
										{agent.capabilities.list_2_family.isEnabled ? 'Enabled' : 'Disabled'}
									</button>
									<div class="text-xs">
										<div>Max Items: {agent.capabilities.list_2_family.conditions.maxItems}</div>
										<div>Shared With: {agent.capabilities.list_2_family.conditions.sharedWith.length} addresses</div>
										<div class="text-surface-600-300-token">{agent.capabilities.list_2_family.conditions.description}</div>
									</div>
								</div>
							</td>
							<td class="table-cell-fit">
								<div class="flex flex-col space-y-2">
									<button
										class="chip {agent.capabilities.list_3_household.isEnabled
											? 'variant-filled-success'
											: 'variant-filled-surface'}"
										on:click={() => toggleCapability(agent.id, 'list_3_household')}
									>
										{agent.capabilities.list_3_household.isEnabled ? 'Enabled' : 'Disabled'}
									</button>
									<div class="text-xs">
										<div>Max Items: {agent.capabilities.list_3_household.conditions.maxItems}</div>
										<div>Categories: {agent.capabilities.list_3_household.conditions.allowedCategories.join(', ') || 'None'}</div>
										<div class="text-surface-600-300-token">{agent.capabilities.list_3_household.conditions.description}</div>
									</div>
								</div>
							</td>
							<td class="table-cell-fit">
								<button class="btn variant-filled-error" on:click={() => removeAgent(agent.id)}>
									Remove
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="p-4 card variant-filled-surface">
			<h3 class="mb-4 h3">About List Access Control</h3>
			<p class="mb-2">Each AI agent has configurable access to three specific lists:</p>
			<ul class="space-y-2 list-disc list-inside">
				<li>
					<strong>List 1 - Private:</strong> Personal grocery list for meal planning with time restrictions
				</li>
				<li>
					<strong>List 2 - Family:</strong> Shared family grocery list for weekly shopping
				</li>
				<li>
					<strong>List 3 - Household:</strong> Maintenance and cleaning supplies with category restrictions
				</li>
			</ul>
			<div class="mt-4">
				<p class="text-sm text-surface-600-300-token">
					Each list has specific conditions and can be enabled/disabled per agent
				</p>
			</div>
		</div>
	</div>
{:else}
	<div class="container p-4 mx-auto">
		<div class="p-4 card variant-filled-surface">
			<p class="text-center">No agents found. Add your first agent to get started.</p>
		</div>
	</div>
{/if}

<style>
	.table-cell-fit {
		@apply p-2;
	}
</style>
