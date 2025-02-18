<!--
  Properties Component Documentation
  
  Architecture Overview:
  ---------------------
  This component provides a hierarchical property editor with support for schema field types
  including relation type rendering with schema titles.
  
  Core Features:
  1. Property Editing:
     - Display and edit property values
     - Support for nested objects
     - Special handling for relation types
  
  2. Schema References:
     - Display schema titles for relations
     - Clickable links to referenced schemas
     - UUID to schema title resolution
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getContext } from 'svelte';

	interface PropertyValue {
		key: string;
		value: any;
		isObj: boolean;
		path: string;
		isRequired: boolean;
	}

	interface SchemaDetails {
		title: string;
		description: string;
		version: number;
		is_archived: boolean;
		id: string;
		current_version_id?: string;
	}

	export let properties: Record<string, any>;
	export let path: string[] = [];
	export let expandedProperties: string[] = [];
	export let isSchemaEditor = false;
	export let dbData: any[] = []; // Add this to receive the database items

	const dispatch = createEventDispatcher<{
		toggleProperty: { path: string; expanded: boolean };
		valueChange: { path: string; value: any };
		schemaClick: { schemaId: string };
	}>();

	let editedValues: Record<string, any> = {};

	// Function to get schema details from ID
	function getSchemaDetails(schemaId: string): SchemaDetails | null {
		if (!schemaId || !dbData) return null;

		const activeSchema = dbData.find((item) => item.id === schemaId);
		if (activeSchema) {
			return {
				title: activeSchema.json.title,
				description: activeSchema.json.description,
				version: activeSchema.version,
				is_archived: false,
				id: activeSchema.id
			};
		}

		// Check archived versions
		for (const item of dbData) {
			const archivedVersion = item.archived_versions?.find((v) => v.id === schemaId);
			if (archivedVersion) {
				return {
					title: archivedVersion.json.title,
					description: archivedVersion.json.description,
					version: archivedVersion.version,
					is_archived: true,
					id: archivedVersion.id,
					current_version_id: item.id
				};
			}
		}

		return null;
	}

	function handleSchemaClick(schemaId: string) {
		dispatch('schemaClick', { schemaId });
	}

	function toggleProperty(propertyPath: string) {
		dispatch('toggleProperty', {
			path: propertyPath,
			expanded: !expandedProperties.includes(propertyPath)
		});
	}

	function handleValueChange(key: string, value: any) {
		editedValues[key] = value;
		const fullPath = path.length > 0 ? [...path, key].join('.') : key;

		dispatch('valueChange', {
			path: fullPath,
			value: value
		});
	}

	function handleInputEvent(event: Event, key: string) {
		const input = event.target as HTMLInputElement;
		handleValueChange(key, input.value);
	}

	function renderProperties(properties: any, path: string[] = []) {
		let propsToRender = properties;
		let requiredFields: string[] = [];

		if (path.length === 0 && properties.type === 'object') {
			propsToRender = properties.properties;
			requiredFields = properties.required || [];
		} else if (properties.type === 'object') {
			propsToRender = properties.properties;
			requiredFields = properties.required || [];
		}

		// Filter out title and other metadata fields
		const metadataFields = ['title', 'description'];
		return Object.entries(propsToRender)
			.filter(([key]) => !metadataFields.includes(key))
			.map(([key, value]) => {
				// Check if this property has an x-relation
				const hasRelation = value && typeof value === 'object' && 'x-relation' in value;
				return {
					key,
					value: hasRelation ? { ...value, type: 'relation' } : value,
					isObj: !hasRelation && typeof value === 'object' && value !== null,
					path: [...path, key].join('.'),
					isRequired: requiredFields.includes(key)
				};
			});
	}

	let renderedProperties: ReturnType<typeof renderProperties>;

	$: {
		renderedProperties = renderProperties(properties, path);
		if (!expandedProperties.includes(path.join('.'))) {
			editedValues = {};
		}
	}

	// Add a function to filter out metadata fields
	function shouldDisplayProperty(property: any): boolean {
		return !property.isMetadata;
	}

	// Function to render relation value
	function renderRelationValue(prop: any) {
		if (prop.value?.['x-relation'] && prop.value?.['x-relation'].schemaId) {
			const schemaDetails = getSchemaDetails(prop.value['x-relation'].schemaId);
			return {
				isRelation: true,
				type: prop.value['x-relation'].type || 'single',
				...schemaDetails
			};
		}
		return { isRelation: false };
	}
</script>

<div class="flex">
	<div class="flex flex-col max-w-xs p-4 border-r border-surface-300-600-token">
		{#each renderedProperties as prop (prop.path)}
			{#if shouldDisplayProperty(prop)}
				<div class="flex flex-col mb-2">
					<div class="flex items-center">
						<span class="px-1 text-white rounded-sm text-2xs bg-surface-700 dark:bg-surface-600">
							{prop.value?.type || typeof prop.value}
						</span>
						<span
							class="ml-1 text-sm font-semibold truncate text-surface-700 dark:text-surface-300"
						>
							{prop.key}
						</span>
						{#if prop.isRequired}
							<span class="ml-1 text-xs text-error-500">*</span>
						{/if}
						{#if prop.isObj}
							<button
								class="ml-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
								on:click={() => toggleProperty(prop.path)}
							>
								{expandedProperties.includes(prop.path) ? '▼' : '▶'}
							</button>
						{/if}
					</div>

					{#if !prop.isObj}
						{#if prop.value?.['x-relation']}
							{@const relation = renderRelationValue(prop)}
							{#if relation.isRelation}
								<div class="flex flex-col gap-1 mt-1">
									<button
										class="flex items-center gap-2 text-sm font-semibold text-left text-tertiary-800 dark:text-tertiary-200 hover:underline"
										on:click={() => handleSchemaClick(prop.value['x-relation'].schemaId)}
									>
										<span class="text-surface-600 dark:text-surface-400">→</span>
										{relation.title || 'Untitled Schema'}
									</button>
									{#if relation.description}
										<p class="text-xs text-surface-600 dark:text-surface-400">
											{relation.description}
										</p>
									{/if}
									{#if relation.is_archived}
										<span
											class="self-start px-1.5 py-0.5 text-xs rounded-full bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-200"
										>
											Archived v{relation.version}
										</span>
									{/if}
								</div>
							{:else}
								<span class="text-sm text-surface-500">Invalid schema reference</span>
							{/if}
						{:else}
							<input
								type={typeof prop.value === 'number' ? 'number' : 'text'}
								class="input"
								value={editedValues[prop.key] ?? prop.value}
								on:input={(e) => handleInputEvent(e, prop.key)}
							/>
						{/if}
					{:else}
						<div class="flex flex-col">
							<span class="text-xs italic text-surface-500">
								{Object.keys(prop.value?.properties || {}).length} properties
							</span>
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
	{#each renderedProperties as prop (prop.path)}
		{#if prop.isObj && expandedProperties.includes(prop.path)}
			<svelte:self
				properties={prop.value}
				path={[...path, prop.key]}
				{expandedProperties}
				{isSchemaEditor}
				{dbData}
				on:toggleProperty
				on:valueChange
				on:schemaClick
			/>
		{/if}
	{/each}
</div>

<style lang="postcss">
	:global(.input) {
		@apply p-2 rounded border border-surface-300-600-token bg-tertiary-100 dark:bg-surface-700;
	}
	:global(.checkbox) {
		@apply w-4 h-4 rounded border border-surface-300-600-token;
	}
</style>
