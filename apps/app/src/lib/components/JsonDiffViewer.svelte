<!--
  JsonDiffViewer Component Documentation
  
  Architecture Overview:
  ---------------------
  This component provides a specialized view for displaying JSON diffs based on operations.
  It shows the changes between two JSON objects by highlighting additions, removals, and modifications.
  
  Core Features:
  1. Operation-based Diff Display:
     - Shows changes based on operations (add, remove, replace)
     - Highlights additions in green, removals in red, and modifications with both
     - Preserves the structure of the JSON for better readability
  
  2. Path Navigation:
     - Organizes changes by their path in the JSON structure
     - Provides visual indicators for the type of change
  
  3. Integration with Patch Requests:
     - Works with the operations from patch requests
     - Can be used to preview changes before approval
  
  Props:
  - baseJson: The original JSON object
  - operations: Array of operations to apply (add, remove, replace)
  - expanded: Whether all nodes should be expanded by default
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	// Props
	export let baseJson: any = {};
	export let operations: Array<{
		id: string;
		operation_type: string;
		path: string[];
		old_value: any;
		new_value: any;
		created_at: string;
		metadata?: Record<string, any>;
	}> = [];
	export let expanded: boolean = true;

	// State
	let processedJson: any = {};
	let expandedPaths: Set<string> = new Set();

	// Process operations to create a diff view
	function processOperations() {
		// Start with a deep copy of the base JSON
		processedJson = JSON.parse(JSON.stringify(baseJson || {}));

		// Group operations by their path for better organization
		const operationsByPath: Record<string, any[]> = {};
		operations.forEach((op) => {
			const pathStr = op.path.join('.');
			if (!operationsByPath[pathStr]) {
				operationsByPath[pathStr] = [];
			}
			operationsByPath[pathStr].push(op);
		});

		// Apply operations to create the diff view
		Object.entries(operationsByPath).forEach(([pathStr, ops]) => {
			const path = pathStr.split('.');
			applyOperationsToPath(processedJson, path, ops);
		});
	}

	// Apply operations to a specific path in the JSON
	function applyOperationsToPath(json: any, path: string[], ops: any[]) {
		// Navigate to the parent object
		let current = json;
		let parent = null;
		let lastKey = path[path.length - 1];

		// Navigate to the parent of the target path
		for (let i = 0; i < path.length - 1; i++) {
			const key = path[i];
			if (!current[key]) {
				current[key] = {};
			}
			parent = current;
			current = current[key];
		}

		// Apply operations
		ops.forEach((op) => {
			switch (op.operation_type) {
				case 'add':
					// Mark as added
					if (parent && lastKey) {
						parent[lastKey] = {
							__diff_type: 'add',
							__value: op.new_value
						};
					} else {
						json[lastKey] = {
							__diff_type: 'add',
							__value: op.new_value
						};
					}
					break;
				case 'remove':
					// Mark as removed
					if (parent && lastKey) {
						parent[lastKey] = {
							__diff_type: 'remove',
							__value: op.old_value
						};
					} else {
						json[lastKey] = {
							__diff_type: 'remove',
							__value: op.old_value
						};
					}
					break;
				case 'replace':
					// Mark as modified
					if (parent && lastKey) {
						parent[lastKey] = {
							__diff_type: 'replace',
							__old_value: op.old_value,
							__new_value: op.new_value
						};
					} else {
						json[lastKey] = {
							__diff_type: 'replace',
							__old_value: op.old_value,
							__new_value: op.new_value
						};
					}
					break;
			}
		});
	}

	// Toggle expansion of a node
	function toggleExpand(path: string) {
		if (expandedPaths.has(path)) {
			expandedPaths.delete(path);
		} else {
			expandedPaths.add(path);
		}
		expandedPaths = expandedPaths; // Trigger reactivity
	}

	// Format a value for display
	function formatValue(value: any): string {
		if (value === null || value === undefined) return 'null';
		if (typeof value === 'object') {
			try {
				return JSON.stringify(value, null, 2);
			} catch (e) {
				return '[Complex Object]';
			}
		}
		if (typeof value === 'string') {
			return `"${value}"`;
		}
		return String(value);
	}

	// Get icon for operation type
	function getOperationIcon(type: string): string {
		switch (type) {
			case 'add':
				return 'heroicons:plus-circle';
			case 'remove':
				return 'heroicons:minus-circle';
			case 'replace':
				return 'heroicons:arrow-path';
			default:
				return 'heroicons:question-mark-circle';
		}
	}

	// Get color for operation type
	function getOperationColor(type: string): string {
		switch (type) {
			case 'add':
				return 'text-green-400';
			case 'remove':
				return 'text-red-400';
			case 'replace':
				return 'text-blue-400';
			default:
				return 'text-gray-400';
		}
	}

	// Initialize
	onMount(() => {
		processOperations();
		// If expanded is true, expand all paths
		if (expanded) {
			const allPaths = getAllPaths(processedJson);
			expandedPaths = new Set(allPaths);
		}
	});

	// Watch for changes in operations or baseJson
	$: {
		if (operations || baseJson) {
			processOperations();
		}
	}

	// Get all possible paths in the JSON
	function getAllPaths(obj: any, currentPath: string = ''): string[] {
		if (!obj || typeof obj !== 'object') return [];

		return Object.keys(obj).flatMap((key) => {
			const newPath = currentPath ? `${currentPath}.${key}` : key;
			const value = obj[key];

			if (value && typeof value === 'object' && !Array.isArray(value)) {
				return [newPath, ...getAllPaths(value, newPath)];
			}

			return [newPath];
		});
	}
</script>

<div
	class="font-mono text-sm bg-surface-900 rounded-lg p-4 overflow-auto max-h-[calc(100vh-12rem)]"
>
	{#if operations.length === 0}
		<div class="py-4 text-center text-tertiary-300">No changes to display</div>
	{:else}
		<div class="flex items-center justify-between mb-4">
			<div class="font-semibold text-tertiary-100">Changes ({operations.length})</div>
			<button
				class="px-2 py-1 text-xs rounded-lg bg-surface-700 text-tertiary-300 hover:bg-surface-600"
				on:click={() => {
					if (expandedPaths.size > 0) {
						expandedPaths.clear();
					} else {
						expandedPaths = new Set(getAllPaths(processedJson));
					}
					expandedPaths = expandedPaths; // Trigger reactivity
				}}
			>
				{expandedPaths.size > 0 ? 'Collapse All' : 'Expand All'}
			</button>
		</div>

		<div class="relative pl-5">
			{#each Object.entries(processedJson) as [key, value]}
				<div class="mb-2">
					<div class="flex items-start">
						<span class="mr-2 text-tertiary-200">"{key}":</span>
						{#if value && typeof value === 'object' && value.__diff_type}
							<div class="flex items-start">
								<span class="{getOperationColor(value.__diff_type)} mr-2">
									<Icon icon={getOperationIcon(value.__diff_type)} class="w-4 h-4" />
								</span>

								{#if value.__diff_type === 'add'}
									<span class="text-green-400">{formatValue(value.__value)}</span>
								{:else if value.__diff_type === 'remove'}
									<span class="text-red-400">{formatValue(value.__value)}</span>
								{:else if value.__diff_type === 'replace'}
									<div class="flex flex-col">
										<span class="text-red-400">- {formatValue(value.__old_value)}</span>
										<span class="text-green-400">+ {formatValue(value.__new_value)}</span>
									</div>
								{/if}
							</div>
						{:else if value && typeof value === 'object'}
							<div class="relative">
								<button
									class="absolute top-0 left-0 flex items-center justify-center w-4 h-4 -ml-5"
									on:click={() => toggleExpand(key)}
								>
									<Icon
										icon={expandedPaths.has(key)
											? 'heroicons:chevron-down'
											: 'heroicons:chevron-right'}
										class="w-3 h-3 text-tertiary-400"
									/>
								</button>
								<span class="text-tertiary-300">{'{'}</span>

								{#if expandedPaths.has(key)}
									<div class="ml-4">
										{#each Object.entries(value) as [subKey, subValue], i}
											<div class="flex items-start">
												<span class="mr-2 text-tertiary-200">"{subKey}":</span>
												{#if subValue && typeof subValue === 'object' && subValue.__diff_type}
													<div class="flex items-start">
														<span class="{getOperationColor(subValue.__diff_type)} mr-2">
															<Icon icon={getOperationIcon(subValue.__diff_type)} class="w-4 h-4" />
														</span>

														{#if subValue.__diff_type === 'add'}
															<span class="text-green-400">{formatValue(subValue.__value)}</span>
														{:else if subValue.__diff_type === 'remove'}
															<span class="text-red-400">{formatValue(subValue.__value)}</span>
														{:else if subValue.__diff_type === 'replace'}
															<div class="flex flex-col">
																<span class="text-red-400"
																	>- {formatValue(subValue.__old_value)}</span
																>
																<span class="text-green-400"
																	>+ {formatValue(subValue.__new_value)}</span
																>
															</div>
														{/if}
													</div>
												{:else}
													<span class="text-tertiary-300">{formatValue(subValue)}</span>
												{/if}
												{#if i < Object.entries(value).length - 1}
													<span class="text-tertiary-300">,</span>
												{/if}
											</div>
										{/each}
									</div>
								{:else}
									<span class="ml-1 text-tertiary-400">...</span>
								{/if}

								<span class="text-tertiary-300">{'}'}</span>
							</div>
						{:else}
							<span class="text-tertiary-300">{formatValue(value)}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	:global(.json-diff-add) {
		color: #4ade80; /* green-400 */
	}
	:global(.json-diff-remove) {
		color: #f87171; /* red-400 */
	}
	:global(.json-diff-replace) {
		color: #60a5fa; /* blue-400 */
	}
</style>
