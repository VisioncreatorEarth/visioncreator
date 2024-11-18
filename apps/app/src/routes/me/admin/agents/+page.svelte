<script>
	// Define resource types and their schemas
	const resourceTypes = {
		list: {
			conditions: ['maxItems', 'timeRestriction', 'sharedWith', 'categories'],
			accessLevels: ['read', 'write', 'share']
		},
		task: {
			conditions: ['dueDate', 'priority', 'assignees', 'labels'],
			accessLevels: ['read', 'write', 'assign']
		},
		calendar: {
			conditions: ['dateRange', 'eventType', 'participants', 'visibility'],
			accessLevels: ['read', 'write', 'invite']
		},
		document: {
			conditions: ['workspace', 'department', 'classification', 'retention'],
			accessLevels: ['read', 'write', 'comment']
		}
	};

	let agents = [
		{
			id: '1',
			name: 'Bert - Personal Assistant',
			pkp: '0x1234...5678',
			capabilities: {
				'list:personal_groceries': {
					type: 'list',
					isEnabled: true,
					accessLevels: ['read', 'write'],
					conditions: {
						maxItems: 50,
						timeRestriction: '9am-5pm',
						sharedWith: [],
						categories: ['groceries', 'food']
					},
					description: 'Personal grocery shopping list'
				},
				'task:daily_todos': {
					type: 'task',
					isEnabled: true,
					accessLevels: ['read', 'write', 'assign'],
					conditions: {
						dueDate: 'today',
						priority: ['high', 'medium'],
						assignees: ['self'],
						labels: ['personal', 'work']
					},
					description: 'Daily todo management'
				}
			}
		},
		{
			id: '2',
			name: 'Alice - Family Coordinator',
			pkp: '0x5678...9012',
			capabilities: {
				'list:family_groceries': {
					type: 'list',
					isEnabled: true,
					accessLevels: ['read', 'write', 'share'],
					conditions: {
						maxItems: 100,
						timeRestriction: 'always',
						sharedWith: ['0xfamily1...', '0xfamily2...'],
						categories: ['groceries', 'household']
					},
					description: 'Family shared grocery list'
				},
				'calendar:family_events': {
					type: 'calendar',
					isEnabled: true,
					accessLevels: ['read', 'write', 'invite'],
					conditions: {
						dateRange: '3_months',
						eventType: ['family', 'school', 'activities'],
						participants: ['family_members'],
						visibility: 'family_only'
					},
					description: 'Family calendar management'
				}
			}
		},
		{
			id: '3',
			name: 'Charlie - Office Manager',
			pkp: '0x9012...3456',
			capabilities: {
				'document:office_docs': {
					type: 'document',
					isEnabled: true,
					accessLevels: ['read', 'write', 'comment'],
					conditions: {
						workspace: 'office',
						department: ['admin', 'facilities'],
						classification: 'internal',
						retention: '1_year'
					},
					description: 'Office documentation management'
				},
				'task:maintenance': {
					type: 'task',
					isEnabled: true,
					accessLevels: ['read', 'write', 'assign'],
					conditions: {
						dueDate: 'weekly',
						priority: ['low', 'medium'],
						assignees: ['maintenance_staff'],
						labels: ['maintenance', 'facility']
					},
					description: 'Facility maintenance tasks'
				}
			}
		}
	];

	function toggleCapability(agentId, resourceId) {
		agents = agents.map((agent) => {
			if (agent.id === agentId) {
				return {
					...agent,
					capabilities: {
						...agent.capabilities,
						[resourceId]: {
							...agent.capabilities[resourceId],
							isEnabled: !agent.capabilities[resourceId].isEnabled
						}
					}
				};
			}
			return agent;
		});
	}

	function getResourceTypeIcon(type) {
		const icons = {
			list: '📋',
			task: '✓',
			calendar: '📅',
			document: '📄'
		};
		return icons[type] || '❔';
	}

	async function addAgent() {
		const newAgent = {
			id: (agents.length + 1).toString(),
			name: 'New Agent',
			pkp: '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
			capabilities: {
				'list:default': {
					type: 'list',
					isEnabled: false,
					accessLevels: ['read'],
					conditions: {
						maxItems: 10,
						timeRestriction: 'always',
						sharedWith: [],
						categories: []
					},
					description: 'Default list access'
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
						<th>Capabilities</th>
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
								<div class="grid grid-cols-2 gap-4">
									{#each Object.entries(agent.capabilities) as [resourceId, capability]}
										<div class="flex flex-col space-y-2 p-2 border border-surface-500 rounded">
											<div class="flex items-center justify-between">
												<span class="font-semibold">
													{getResourceTypeIcon(capability.type)} {resourceId.split(':')[1]}
												</span>
												<button
													class="chip {capability.isEnabled
														? 'variant-filled-success'
														: 'variant-filled-surface'}"
													on:click={() => toggleCapability(agent.id, resourceId)}
												>
													{capability.isEnabled ? 'Enabled' : 'Disabled'}
												</button>
											</div>
											<div class="text-xs space-y-1">
												<div>Type: {capability.type}</div>
												<div>Access: {capability.accessLevels.join(', ')}</div>
												<div class="text-surface-600-300-token">{capability.description}</div>
												<div class="mt-2">
													<strong>Conditions:</strong>
													{#each Object.entries(capability.conditions) as [key, value]}
														<div>{key}: {Array.isArray(value) ? value.join(', ') : value}</div>
													{/each}
												</div>
											</div>
										</div>
									{/each}
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
			<h3 class="mb-4 h3">About Resource Access Control</h3>
			<p class="mb-2">Each AI agent can have multiple capabilities across different resource types:</p>
			<ul class="space-y-2 list-disc list-inside">
				<li>
					<strong>Lists {getResourceTypeIcon('list')}:</strong> Shopping lists, todo lists, etc.
				</li>
				<li>
					<strong>Tasks {getResourceTypeIcon('task')}:</strong> Todo items, assignments, etc.
				</li>
				<li>
					<strong>Calendar {getResourceTypeIcon('calendar')}:</strong> Events, schedules, reminders
				</li>
				<li>
					<strong>Documents {getResourceTypeIcon('document')}:</strong> Files, notes, records
				</li>
			</ul>
			<div class="mt-4">
				<p class="text-sm text-surface-600-300-token">
					Each resource type has specific access levels and conditions that can be configured per agent
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
