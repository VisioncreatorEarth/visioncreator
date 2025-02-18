<script lang="ts">
	import type { Schema, SchemaProperty } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';

	export let schema: Schema;
	export let dbData: any[] = []; // Add this to receive database items for relations
	export let path: string[] = []; // Add path prop for nested fields
	export let parentFormData: Record<string, any> | null = null; // Add parent form data for nested objects

	const dispatch = createEventDispatcher<{
		submit: { formData: Record<string, any> };
		cancel: void;
		updateFormData: { path: string[]; value: any };
	}>();

	let formData: Record<string, any> = parentFormData || {};
	let searchQueries: Record<string, string> = {};
	let dropdownOpen: Record<string, boolean> = {};

	// Initialize form data when schema changes, but preserve existing values
	$: if (schema?.properties && !parentFormData) {
		const initialData = initializeObjectData(schema.properties);
		formData = {
			...initialData,
			...Object.fromEntries(
				Object.entries(formData).map(([key, value]) => {
					const prop = schema.properties[key];
					if (prop?.type === 'object' && prop['x-relation']) {
						return [key, typeof value === 'string' ? value : null];
					}
					return [key, value];
				})
			)
		};
	}

	function initializeObjectData(
		properties: Record<string, SchemaProperty>,
		currentPath: string[] = []
	) {
		return Object.entries(properties).reduce((acc, [key, prop]) => {
			const fieldPath = [...currentPath, key];
			const pathString = fieldPath.join('.');

			if (prop.type === 'object') {
				if (prop['x-relation']) {
					acc[key] = formData[key] || null;
					searchQueries[pathString] = '';
					dropdownOpen[pathString] = false;
				} else if (prop.properties) {
					acc[key] = formData[key] || {};
					acc[key] = initializeObjectData(prop.properties, fieldPath);
				}
			} else if (prop.type === 'string' && prop.enum) {
				acc[key] = formData[key] || prop.enum[0];
			} else {
				switch (prop.type) {
					case 'string':
						acc[key] = formData[key] || '';
						break;
					case 'number':
					case 'integer':
						acc[key] = formData[key] || '';
						break;
					case 'boolean':
						acc[key] = formData[key] || false;
						break;
					default:
						acc[key] = formData[key] || '';
				}
			}
			return acc;
		}, {} as Record<string, any>);
	}

	function handleNestedUpdate(event: CustomEvent<{ path: string[]; value: any }>) {
		const { path: nestedPath, value } = event.detail;
		let current = formData;
		for (let i = 0; i < nestedPath.length - 1; i++) {
			if (!current[nestedPath[i]]) {
				current[nestedPath[i]] = {};
			}
			current = current[nestedPath[i]];
		}
		current[nestedPath[nestedPath.length - 1]] = value;
		formData = { ...formData };

		if (parentFormData === null) {
			// Only dispatch if we're the root form
			const processedData = processFormData(schema.properties, formData);
			dispatch('updateFormData', { path: nestedPath, value: processedData });
		} else {
			// Pass up to parent if we're nested
			dispatch('updateFormData', { path: nestedPath, value });
		}
	}

	function getRelationInstances(schemaId: string, searchQuery: string = '') {
		if (!dbData) return [];

		const instances = dbData.filter((item) => item.schema === schemaId && !item.is_archived);
		if (!searchQuery) return instances;

		return instances.filter((instance) => {
			const displayField = getSchemaDisplayField(instance.schema);
			const displayValue = displayField ? instance.json[displayField] : instance.json.title;
			return displayValue?.toLowerCase().includes(searchQuery.toLowerCase());
		});
	}

	function getSchemaDisplayField(schemaId: string): string | null {
		const schema = dbData.find((item) => item.id === schemaId);
		return schema?.json?.display_field || null;
	}

	function getInstanceDisplayValue(instance: any): string {
		const displayField = getSchemaDisplayField(instance.schema);
		return displayField ? instance.json[displayField] : instance.json.title || 'Untitled';
	}

	function handleSubmit() {
		if (parentFormData === null) {
			// Only handle submit at root level
			console.log('Form Data before processing:', formData);
			const processedData = processFormData(schema.properties, formData);
			console.log('Form Data after processing:', processedData);
			dispatch('submit', { formData: processedData });
		}
	}

	function processFormData(properties: Record<string, SchemaProperty>, data: Record<string, any>) {
		return Object.entries(properties).reduce((acc, [key, prop]) => {
			if (prop.type === 'object') {
				if (prop['x-relation']) {
					// For relation fields, ensure we store the ID as a string
					if (typeof data[key] === 'string') {
						acc[key] = data[key];
					} else if (
						data[key] &&
						typeof data[key] === 'object' &&
						!Array.isArray(data[key]) &&
						Object.keys(data[key]).every((k) => !isNaN(Number(k)))
					) {
						acc[key] = Object.values(data[key]).join('');
					} else {
						acc[key] = null;
					}
				} else if (prop.properties) {
					// Always initialize nested objects
					acc[key] = {};

					// Process each property in the nested object
					Object.entries(prop.properties).forEach(([subKey, subProp]) => {
						if (subProp.type === 'object' && subProp['x-relation']) {
							// Handle nested relation
							acc[key][subKey] = data[key]?.[subKey] || null;
						} else {
							// Handle other nested fields
							acc[key][subKey] = data[key]?.[subKey] || '';
						}
					});

					// Check if any required fields are present
					if (prop.required?.length) {
						const hasRequiredFields = prop.required.every(
							(field) => acc[key][field] !== null && acc[key][field] !== ''
						);
						if (!hasRequiredFields) {
							console.warn(`Missing required fields in ${key}:`, prop.required);
						}
					}
				}
			} else if (prop.type === 'number' || prop.type === 'integer') {
				acc[key] = data[key] ? Number(data[key]) : null;
			} else {
				acc[key] = data[key] || '';
			}
			return acc;
		}, {} as Record<string, any>);
	}

	function handleCancel() {
		dispatch('cancel');
	}

	// Handle clicking outside of dropdown
	function handleClickOutside(event: MouseEvent, key: string) {
		const target = event.target as HTMLElement;
		if (!target.closest(`#relation-${key}`)) {
			dropdownOpen[key] = false;
		}
	}

	// Add event listener for clicking outside
	onMount(() => {
		document.addEventListener('click', (e) => {
			Object.keys(dropdownOpen).forEach((key) => {
				handleClickOutside(e, key);
			});
		});

		return () => {
			document.removeEventListener('click', (e) => {
				Object.keys(dropdownOpen).forEach((key) => {
					handleClickOutside(e, key);
				});
			});
		};
	});
</script>

{#if parentFormData === null}
	<!-- Root level modal wrapper -->
	<div class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50">
		<div
			class="relative flex flex-col w-full max-w-2xl h-[90vh] bg-surface-100 dark:bg-surface-800 rounded-lg"
		>
			<!-- Header -->
			<div class="flex-none p-6 border-b border-surface-300-600-token">
				<h2 class="text-xl font-semibold">+ Add New {schema.title}</h2>
			</div>

			<form on:submit|preventDefault={handleSubmit} class="flex flex-col flex-1 min-h-0">
				<!-- Scrollable content area -->
				<div class="flex-1 p-6 overflow-y-auto">
					{#if schema?.properties}
						{#each Object.entries(schema.properties) as [key, prop] (key)}
							<div class="mb-6">
								<label for={key} class="block mb-2 text-sm font-medium">
									{prop.title || key}
									{#if schema.required?.includes(key)}
										<span class="text-error-500">*</span>
									{/if}
								</label>

								{#if prop.type === 'object' && prop.properties}
									<div class="p-4 border rounded-lg border-surface-300-600-token">
										<svelte:self
											schema={{ ...prop, title: prop.title || key }}
											{dbData}
											path={[...path, key]}
											parentFormData={formData[key]}
											on:updateFormData={handleNestedUpdate}
										/>
									</div>
								{:else if prop.type === 'object' && prop['x-relation']}
									<div class="relative" id="relation-{key}">
										<input
											type="text"
											id={key}
											class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
											placeholder="Search..."
											bind:value={searchQueries[key]}
											on:focus={() => (dropdownOpen[key] = true)}
											readonly
										/>
										{#if formData[key]}
											<div class="mt-1 text-xs text-surface-600 dark:text-surface-400">
												Selected ID: {formData[key]}
											</div>
										{/if}
										{#if dropdownOpen[key]}
											<div
												class="absolute z-[100] w-full mt-1 bg-surface-100 dark:bg-surface-800 border border-surface-300-600-token rounded-lg shadow-lg overflow-y-auto max-h-48"
											>
												{#each getRelationInstances(prop['x-relation'].schemaId, searchQueries[key]) as instance}
													<button
														type="button"
														class="w-full px-4 py-2 text-left hover:bg-surface-200 dark:hover:bg-surface-700"
														on:click={() => {
															const id = String(instance.id);
															formData[key] = id;
															formData = { ...formData };
															searchQueries[key] = getInstanceDisplayValue(instance);
															dropdownOpen[key] = false;
														}}
													>
														<div>{getInstanceDisplayValue(instance)}</div>
														<div class="text-xs text-surface-600 dark:text-surface-400">
															ID: {instance.id}
														</div>
													</button>
												{/each}
											</div>
										{/if}
									</div>
								{:else if prop.type === 'string' && prop.enum}
									<select
										id={key}
										class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
										bind:value={formData[key]}
										required={schema.required?.includes(key)}
									>
										{#each prop.enum as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								{:else if prop.type === 'string'}
									{#if prop.format === 'email'}
										<input
											type="email"
											id={key}
											class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
											bind:value={formData[key]}
											required={schema.required?.includes(key)}
										/>
									{:else}
										<input
											type="text"
											id={key}
											class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
											bind:value={formData[key]}
											required={schema.required?.includes(key)}
											minlength={prop.minLength}
											maxlength={prop.maxLength}
										/>
									{/if}
								{/if}

								{#if prop.description}
									<p class="mt-1 text-xs text-surface-600 dark:text-surface-400">
										{prop.description}
									</p>
								{/if}
							</div>
						{/each}
					{/if}
				</div>

				<!-- Footer buttons - fixed at bottom -->
				<div
					class="flex-none p-6 border-t border-surface-300-600-token bg-surface-100 dark:bg-surface-800"
				>
					<div class="flex justify-end gap-2">
						<button
							type="button"
							class="px-4 py-2 text-sm font-medium rounded-lg bg-surface-300 dark:bg-surface-600 hover:bg-surface-400 dark:hover:bg-surface-500"
							on:click={() => dispatch('cancel')}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary-500 hover:bg-primary-600"
						>
							Create
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{:else}
	<!-- Nested object content -->
	{#if schema?.properties}
		{#each Object.entries(schema.properties) as [key, prop] (key)}
			<div class="mb-4">
				<label for={[...path, key].join('.')} class="block mb-2 text-sm font-medium">
					{prop.title || key}
					{#if schema.required?.includes(key)}
						<span class="text-error-500">*</span>
					{/if}
				</label>

				{#if prop.type === 'object' && prop.properties}
					<div class="p-4 border rounded-lg border-surface-300-600-token">
						<svelte:self
							schema={{ ...prop, title: prop.title || key }}
							{dbData}
							path={[...path, key]}
							parentFormData={formData[key]}
							on:updateFormData={handleNestedUpdate}
						/>
					</div>
				{:else if prop.type === 'object' && prop['x-relation']}
					<div class="relative" id="relation-{[...path, key].join('.')}">
						<input
							type="text"
							id={[...path, key].join('.')}
							class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
							placeholder="Search..."
							bind:value={searchQueries[[...path, key].join('.')]}
							on:focus={() => (dropdownOpen[[...path, key].join('.')] = true)}
							readonly
						/>
						{#if formData[key]}
							<div class="mt-1 text-xs text-surface-600 dark:text-surface-400">
								Selected ID: {formData[key]}
							</div>
						{/if}
						{#if dropdownOpen[[...path, key].join('.')]}
							<div
								class="absolute z-[100] w-full mt-1 bg-surface-100 dark:bg-surface-800 border border-surface-300-600-token rounded-lg shadow-lg overflow-y-auto max-h-48"
							>
								{#each getRelationInstances(prop['x-relation'].schemaId, searchQueries[[...path, key].join('.')]) as instance}
									<button
										type="button"
										class="w-full px-4 py-2 text-left hover:bg-surface-200 dark:hover:bg-surface-700"
										on:click={() => {
											const id = String(instance.id);
											formData[key] = id;
											formData = { ...formData };
											searchQueries[[...path, key].join('.')] = getInstanceDisplayValue(instance);
											dropdownOpen[[...path, key].join('.')] = false;
											dispatch('updateFormData', { path: [...path, key], value: id });
										}}
									>
										<div>{getInstanceDisplayValue(instance)}</div>
										<div class="text-xs text-surface-600 dark:text-surface-400">
											ID: {instance.id}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else if prop.type === 'string' && prop.enum}
					<select
						id={[...path, key].join('.')}
						class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
						bind:value={formData[key]}
						required={schema.required?.includes(key)}
						on:change={() =>
							dispatch('updateFormData', { path: [...path, key], value: formData[key] })}
					>
						{#each prop.enum as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				{:else if prop.type === 'string'}
					{#if prop.format === 'email'}
						<input
							type="email"
							id={[...path, key].join('.')}
							class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
							bind:value={formData[key]}
							required={schema.required?.includes(key)}
							on:input={() =>
								dispatch('updateFormData', { path: [...path, key], value: formData[key] })}
						/>
					{:else}
						<input
							type="text"
							id={[...path, key].join('.')}
							class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
							bind:value={formData[key]}
							required={schema.required?.includes(key)}
							minlength={prop.minLength}
							maxlength={prop.maxLength}
							on:input={() =>
								dispatch('updateFormData', { path: [...path, key], value: formData[key] })}
						/>
					{/if}
				{/if}

				{#if prop.description}
					<p class="mt-1 text-xs text-surface-600 dark:text-surface-400">
						{prop.description}
					</p>
				{/if}
			</div>
		{/each}
	{/if}
{/if}

<style lang="postcss">
	:global(.input) {
		@apply p-2 rounded border border-surface-300-600-token bg-tertiary-100;
	}
	:global(.checkbox) {
		@apply w-4 h-4 rounded border border-surface-300-600-token;
	}
</style>
