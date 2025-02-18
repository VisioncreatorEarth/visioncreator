<script lang="ts">
	import type { Schema, SchemaProperty } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';

	export let schema: Schema;
	export let dbData: any[] = []; // Add this to receive database items for relations

	const dispatch = createEventDispatcher<{
		submit: { formData: Record<string, any> };
		cancel: void;
	}>();

	let formData: Record<string, any> = {};
	let searchQueries: Record<string, string> = {};
	let dropdownOpen: Record<string, boolean> = {};

	// Initialize form data when schema changes, but preserve existing values
	$: if (schema?.properties) {
		const initialData = initializeObjectData(schema.properties);
		formData = {
			...initialData,
			...Object.fromEntries(
				Object.entries(formData).map(([key, value]) => {
					const prop = schema.properties[key];
					// Ensure relation fields stay as strings
					if (prop?.type === 'object' && prop['x-relation']) {
						return [key, typeof value === 'string' ? value : null];
					}
					return [key, value];
				})
			)
		};
	}

	function initializeObjectData(properties: Record<string, SchemaProperty>) {
		return Object.entries(properties).reduce((acc, [key, prop]) => {
			if (prop.type === 'object') {
				if (prop['x-relation']) {
					// For relation fields, initialize with null and ensure it stays as a string
					acc[key] = formData[key] || null;
					searchQueries[key] = '';
					dropdownOpen[key] = false;
				} else if (prop.properties) {
					// Initialize nested object with empty object
					acc[key] = formData[key] || {};
					// Process each nested property
					Object.entries(prop.properties).forEach(([subKey, subProp]) => {
						if (subProp.type === 'object' && subProp['x-relation']) {
							const nestedKey = `${key}.${subKey}`;
							// Initialize nested relation field
							if (!acc[key][subKey]) {
								acc[key][subKey] = null;
							}
							searchQueries[nestedKey] = '';
							dropdownOpen[nestedKey] = false;
						} else {
							// Initialize other nested fields with appropriate default values
							if (!(subKey in acc[key])) {
								acc[key][subKey] = '';
							}
						}
					});
				}
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
		console.log('Form Data before processing:', formData);
		const processedData = processFormData(schema.properties, formData);
		console.log('Form Data after processing:', processedData);
		dispatch('submit', { formData: processedData });
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

<div class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50">
	<div
		class="relative w-full max-w-2xl max-h-[90vh] bg-surface-100 dark:bg-surface-800 rounded-lg flex flex-col"
	>
		<div class="p-6 border-b border-surface-300-600-token">
			<h2 class="text-xl font-semibold">+ Add New {schema.title}</h2>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="flex flex-col flex-1 overflow-hidden">
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

							{#if prop['x-relation']}
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
														console.log('Selected instance:', instance);
														// Store the ID directly as a string and prevent it from being split
														const id = String(instance.id);
														formData = {
															...formData,
															[key]: id
														};
														console.log(`Set formData[${key}] to:`, formData[key]);
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
							{:else if prop.type === 'object' && prop.properties}
								<div class="p-4 border rounded-lg border-surface-300-600-token">
									<h3 class="mb-4 text-sm font-medium">{prop.title || key}</h3>
									{#each Object.entries(prop.properties) as [subKey, subProp] (subKey)}
										<div class="mb-4">
											<label for={`${key}.${subKey}`} class="block mb-2 text-sm font-medium">
												{subProp.title || subKey}
												{#if prop.required?.includes(subKey)}
													<span class="text-error-500">*</span>
												{/if}
											</label>

											{#if subProp.type === 'object' && subProp['x-relation']}
												<div class="relative" id="relation-{key}.{subKey}">
													<input
														type="text"
														id={`${key}.${subKey}`}
														class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
														placeholder="Search..."
														bind:value={searchQueries[`${key}.${subKey}`]}
														on:focus={() => {
															dropdownOpen[`${key}.${subKey}`] = true;
															// Initialize the nested object if it doesn't exist
															if (!formData[key]) {
																formData[key] = {};
															}
														}}
														readonly
													/>
													{#if formData[key]?.[subKey]}
														<div class="mt-1 text-xs text-surface-600 dark:text-surface-400">
															Selected ID: {formData[key][subKey]}
														</div>
													{/if}
													{#if dropdownOpen[`${key}.${subKey}`]}
														<div
															class="absolute z-[100] w-full mt-1 bg-surface-100 dark:bg-surface-800 border border-surface-300-600-token rounded-lg shadow-lg overflow-y-auto max-h-48"
														>
															{#each getRelationInstances(subProp['x-relation'].schemaId, searchQueries[`${key}.${subKey}`]) as instance}
																<button
																	type="button"
																	class="w-full px-4 py-2 text-left hover:bg-surface-200 dark:hover:bg-surface-700"
																	on:click={() => {
																		const id = String(instance.id);
																		// Ensure we preserve other fields in the nested object
																		formData = {
																			...formData,
																			[key]: {
																				...formData[key],
																				[subKey]: id
																			}
																		};
																		console.log(`Set nested formData[${key}][${subKey}] to:`, id);
																		searchQueries[`${key}.${subKey}`] =
																			getInstanceDisplayValue(instance);
																		dropdownOpen[`${key}.${subKey}`] = false;
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
											{:else if subProp.type === 'string'}
												{#if subProp.format === 'email'}
													<input
														type="email"
														id={`${key}.${subKey}`}
														class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
														bind:value={formData[key][subKey]}
														required={prop.required?.includes(subKey)}
													/>
												{:else}
													<input
														type="text"
														id={`${key}.${subKey}`}
														class="w-full p-2 border rounded-lg bg-surface-200 dark:bg-surface-700 border-surface-300-600-token"
														bind:value={formData[key][subKey]}
														required={prop.required?.includes(subKey)}
													/>
												{/if}
											{/if}

											{#if subProp.description}
												<p class="mt-1 text-xs text-surface-600 dark:text-surface-400">
													{subProp.description}
												</p>
											{/if}
										</div>
									{/each}
								</div>
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

			<!-- Footer buttons - now properly fixed -->
			<div class="p-6 border-t border-surface-300-600-token bg-surface-100 dark:bg-surface-800">
				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="px-4 py-2 text-sm font-medium rounded-lg bg-surface-300 dark:bg-surface-600 hover:bg-surface-400 dark:hover:bg-surface-500"
						on:click={handleCancel}
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

<style lang="postcss">
	:global(.input) {
		@apply p-2 rounded border border-surface-300-600-token bg-tertiary-100;
	}
	:global(.checkbox) {
		@apply w-4 h-4 rounded border border-surface-300-600-token;
	}
</style>
