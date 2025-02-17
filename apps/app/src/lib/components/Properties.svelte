<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface PropertyValue {
		key: string;
		value: any;
		isObj: boolean;
		path: string;
	}

	export let properties: Record<string, any>;
	export let path: string[] = [];
	export let expandedProperties: string[] = [];
	export let isEditing: boolean = false;

	const dispatch = createEventDispatcher<{
		toggleProperty: { path: string; expanded: boolean };
		valueChange: { path: string[]; value: any };
	}>();

	let editedValues: Record<string, any> = {};

	function toggleProperty(propertyPath: string) {
		dispatch('toggleProperty', {
			path: propertyPath,
			expanded: !expandedProperties.includes(propertyPath)
		});
	}

	function handleValueChange(key: string, value: any) {
		editedValues[key] = value;
		const fullPath = [...path, key];
		dispatch('valueChange', { path: fullPath, value });
	}

	function handleInputChange(event: Event, key: string) {
		const target = event.target as HTMLInputElement;
		handleValueChange(key, target.value);
	}

	function renderProperties(properties: any, path: string[] = []) {
		return Object.entries(properties).map(([key, value]) => ({
			key,
			value,
			isObj: typeof value === 'object' && value !== null,
			path: [...path, key].join('.')
		}));
	}

	let renderedProperties: ReturnType<typeof renderProperties>;

	$: {
		renderedProperties = renderProperties(properties, path);
		if (!isEditing) {
			editedValues = {};
		}
	}

	function renderEditableValue(prop: any) {
		const value = editedValues[prop.key] ?? prop.value;

		switch (typeof value) {
			case 'string':
				return `<input 
					type="text" 
					class="input" 
					value="${value}"
					on:input={(e) => handleValueChange(prop.key, e.target.value)}
				/>`;
			case 'number':
				return `<input 
					type="number" 
					class="input" 
					value="${value}"
					on:input={(e) => handleValueChange(prop.key, parseFloat(e.target.value))}
				/>`;
			case 'boolean':
				return `<input 
					type="checkbox" 
					class="checkbox" 
					checked="${value}"
					on:change={(e) => handleValueChange(prop.key, e.target.checked)}
				/>`;
			default:
				return `<span class="text-surface-600">${JSON.stringify(value)}</span>`;
		}
	}
</script>

<div class="flex">
	<div class="flex flex-col max-w-xs p-4 border-r border-surface-300-600-token">
		{#each renderedProperties as prop (prop.path)}
			<div class="flex flex-col mb-2">
				<div class="flex items-center">
					<span class="px-1 text-white rounded-sm text-2xs bg-surface-700 dark:bg-surface-600">
						{typeof prop.value}
					</span>
					<span class="ml-1 text-sm font-semibold truncate text-surface-700 dark:text-surface-300">
						{prop.key}
					</span>
					{#if prop.isObj}
						<button
							class="ml-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
							on:click={() => toggleProperty(prop.path)}
						>
							{expandedProperties.includes(prop.path) ? '▼' : '▶'}
						</button>
					{/if}
				</div>

				{#if isEditing && !prop.isObj}
					<input
						type={typeof prop.value === 'number' ? 'number' : 'text'}
						class="input"
						value={editedValues[prop.key] ?? prop.value}
						on:input={(e) => handleValueChange(prop.key, e.target.value)}
					/>
				{:else}
					<span class="text-xs truncate text-surface-600 dark:text-surface-400">
						{prop.isObj ? '' : JSON.stringify(prop.value)}
					</span>
				{/if}
			</div>
		{/each}
	</div>
	{#each renderedProperties as prop (prop.path)}
		{#if prop.isObj && expandedProperties.includes(prop.path)}
			<svelte:self
				properties={prop.value}
				path={[...path, prop.key]}
				{expandedProperties}
				{isEditing}
				on:toggleProperty
				on:valueChange
			/>
		{/if}
	{/each}
</div>

<style>
	:global(.input) {
		@apply p-2 rounded border border-surface-300-600-token bg-tertiary-100 dark:bg-surface-700;
	}
	:global(.checkbox) {
		@apply w-4 h-4 rounded border border-surface-300-600-token;
	}
</style>
