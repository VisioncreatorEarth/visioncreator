<!--
  SchemaInstances Component Documentation
  
  Architecture Overview:
  ---------------------
  This component displays instances of a specific schema in a table/list format.
  
  Core Features:
  1. Table View:
     - Displays all instances of a schema
     - Shows key properties as columns
     - Supports sorting and filtering
  
  2. Instance Selection:
     - Allows selecting an instance for viewing/editing
     - Highlights currently selected instance
  
  3. Display Fields:
     - Uses schema's display_field for primary display
     - Shows relevant metadata (author, version, etc.)
  
  Props:
  - schema: The schema object defining the structure
  - instances: Array of instances of this schema
  - selectedInstance: Currently selected instance
  - onSelectInstance: Callback when an instance is selected
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface DBItem {
		id: string;
		json: any;
		author: string;
		author_name: string;
		schema: string;
		version: number;
		created_at: string;
		prev: string | null;
		is_archived?: boolean;
		archived_at?: string;
		archived_versions?: DBItem[];
		variation: string;
	}

	export let schema: DBItem;
	export let instances: DBItem[] = [];
	export let selectedInstance: DBItem | null = null;

	const dispatch = createEventDispatcher<{
		select: { instance: DBItem };
	}>();

	// Get display field from schema
	$: displayField = schema?.json?.display_field || 'title';

	// Get primary fields from schema (excluding metadata)
	$: primaryFields = getPrimaryFields(schema?.json?.properties || {});

	function getPrimaryFields(properties: Record<string, any>) {
		const fields: any[] = [];
		const groups: Record<string, any[]> = {};

		function processField(
			field: any,
			path: string,
			fieldName: string,
			parentGroup: string | null = null
		) {
			if (field.type === 'object' && field.properties) {
				// Create a group for the object
				const groupPath = parentGroup ? `${parentGroup}.${path}` : path;
				groups[groupPath] = [];

				// Process each property in the object
				Object.entries(field.properties).forEach(([key, value]) => {
					processField(value, key, key, groupPath);
				});
			} else {
				// Skip metadata fields
				if (!['author', 'version', 'created', 'type', 'schema_id'].includes(fieldName)) {
					const fieldInfo = {
						path: parentGroup ? `${parentGroup}.${path}` : path,
						name: fieldName,
						title: field.title || fieldName,
						type: field.type,
						group: parentGroup
					};

					if (parentGroup) {
						groups[parentGroup].push(fieldInfo);
					} else {
						fields.push(fieldInfo);
					}
				}
			}
		}

		Object.entries(properties).forEach(([key, value]) => {
			processField(value, key, key);
		});

		// Combine all fields with their groups
		const allFields = [...fields];
		Object.entries(groups).forEach(([groupPath, groupFields]) => {
			const groupParts = groupPath.split('.');
			const groupName = groupParts[groupParts.length - 1];
			const properties = schema.json.properties;
			let groupDef = properties[groupName];

			// Handle nested group definitions
			if (groupParts.length > 1) {
				groupDef = groupParts.reduce((obj, part) => obj?.properties?.[part], properties);
			}

			if (groupFields.length > 0) {
				allFields.push({
					isGroup: true,
					path: groupPath,
					title: groupDef?.title || groupName,
					fields: groupFields
				});
			}
		});

		return allFields;
	}

	function getNestedValue(obj: any, path: string) {
		return path.split('.').reduce((o, i) => (o ? o[i] : null), obj?.json || {});
	}

	function formatValue(value: any, type: string): string {
		if (value === null || value === undefined) return '-';
		if (type === 'date') return new Date(value).toLocaleDateString();
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}

	function handleSelect(instance: DBItem) {
		dispatch('select', { instance });
	}

	function getDisplayValue(instance: DBItem): string {
		return instance.json[displayField] || 'Untitled';
	}
</script>

<div class="w-full">
	{#if instances.length === 0}
		<p class="text-center text-surface-600 dark:text-surface-400">No instances found</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full table-auto">
				<thead>
					<tr class="border-b border-surface-300-600-token">
						<th
							class="px-4 py-2 text-sm font-medium text-left text-surface-600 dark:text-surface-400"
						>
							{schema.json.properties[displayField]?.title || 'Name'}
						</th>
						{#each primaryFields as field}
							{#if field.isGroup}
								<th
									colspan={field.fields.length}
									class="px-4 py-2 text-sm font-medium text-left text-surface-600 dark:text-surface-400 bg-tertiary-100 dark:bg-surface-800"
								>
									{field.title}
								</th>
							{:else}
								<th
									class="px-4 py-2 text-sm font-medium text-left text-surface-600 dark:text-surface-400"
								>
									{field.title}
								</th>
							{/if}
						{/each}
					</tr>
					<!-- Subheaders for grouped fields -->
					<tr class="border-b border-surface-300-600-token">
						<th class="px-4 py-2" />
						<!-- Empty cell for name column -->
						{#each primaryFields as field}
							{#if field.isGroup}
								{#each field.fields as subField}
									<th
										class="px-4 py-2 text-sm font-medium text-left text-surface-500 dark:text-surface-400"
									>
										{subField.title}
									</th>
								{/each}
							{:else}
								<th class="px-4 py-2" /> <!-- Empty cell for non-group columns -->
							{/if}
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each instances as instance}
						<tr
							class="border-b border-surface-300-600-token cursor-pointer hover:bg-tertiary-100 dark:hover:bg-surface-700 {instance.id ===
							selectedInstance?.id
								? 'bg-tertiary-200 dark:bg-surface-800'
								: ''}"
							on:click={() => handleSelect(instance)}
						>
							<td class="px-4 py-2 text-sm">
								{getNestedValue(instance, displayField) || 'Untitled'}
							</td>
							{#each primaryFields as field}
								{#if field.isGroup}
									{#each field.fields as subField}
										<td class="px-4 py-2 text-sm">
											{formatValue(getNestedValue(instance, subField.path), subField.type)}
										</td>
									{/each}
								{:else}
									<td class="px-4 py-2 text-sm">
										{formatValue(getNestedValue(instance, field.path), field.type)}
									</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
