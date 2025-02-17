<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import Properties from './Properties.svelte';

	// Add me prop
	export let me: any; // Update type according to your me object structure

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

	interface SchemaProperty {
		type: string;
		title: string;
		description?: string;
		format?: string;
		minimum?: number;
		maximum?: number;
		minLength?: number;
		maxLength?: number;
		pattern?: string;
		properties?: Record<string, SchemaProperty>;
		required?: string[];
	}

	interface FormData {
		username: string;
		email: string;
		profile: {
			fullName: string;
			birthDate: string | null;
		};
	}

	// Create the query directly
	const dbQuery = createQuery({
		operationName: 'queryDB',
		enabled: true
	});

	let selectedItem: DBItem | null = null;
	let message = { text: '', type: '' };
	let schemaInfo = null;
	let expandedProperties: string[] = [];
	let showCreateModal = false;
	let formData: FormData = {
		username: '',
		email: '',
		profile: {
			fullName: '',
			birthDate: ''
		}
	};

	// Debug logs
	$: console.log('dbQuery:', $dbQuery);
	$: if ($dbQuery?.data) console.log('query data:', $dbQuery.data);

	const insertDBMutation = createMutation({
		operationName: 'insertDB'
	});

	// Add edit mode state
	let isEditing = false;
	let editedJson: any = null;

	// Add editDB mutation
	const editDBMutation = createMutation({
		operationName: 'editDB'
	});

	// Add state for archived versions
	let archivedVersions: DBItem[] = [];

	function sortByTimestamp(a, b) {
		return new Date(b.json.timestamp || 0).getTime() - new Date(a.json.timestamp || 0).getTime();
	}

	function generateRandomSchema() {
		return {
			type: 'object',
			title: `User Schema ${Math.floor(Math.random() * 10000)}`,
			description: `Schema for user profile data ${Math.random()}`,
			display_field: 'email',
			properties: {
				username: {
					type: 'string',
					title: 'Username',
					description: "The user's chosen username",
					minLength: 3,
					maxLength: 20,
					pattern: '^[a-zA-Z0-9_-]+$'
				},
				email: {
					type: 'string',
					title: 'Email',
					description: "The user's email address"
				},
				profile: {
					type: 'object',
					title: 'User Profile',
					description: 'Additional profile information',
					properties: {
						fullName: {
							type: 'string',
							title: 'Full Name',
							description: "The user's full name"
						},
						birthDate: {
							type: 'string',
							title: 'Birth Date',
							description: "The user's birth date"
						}
					},
					required: ['fullName']
				}
			},
			required: ['username', 'profile']
		};
	}

	async function handleGenerateSchema() {
		message = { text: '', type: '' };
		try {
			const schema = generateRandomSchema();
			const result = await $insertDBMutation.mutateAsync({
				json: schema,
				type: 'schema',
				schema: '00000000-0000-0000-0000-000000000001'
			});

			if (result?.success) {
				message = { text: 'Random schema generated successfully!', type: 'success' };
				await $dbQuery.refetch();
			} else {
				message = { text: `Failed: ${result?.details || 'Unknown error'}`, type: 'error' };
				console.error('Failed:', result?.details);
			}
		} catch (error) {
			console.error('Error generating schema:', error);
			message = {
				text: `Error: ${error instanceof Error ? error.message : String(error)}`,
				type: 'error'
			};
		}
	}

	function truncateCID(url: string) {
		const cid = url.split('/').pop() || '';
		return cid.length > 16 ? `${cid.slice(0, 20)}...` : cid;
	}

	function findSchemaInfo(schemaId: string) {
		if (!$dbQuery?.data?.db) return null;
		const schema = $dbQuery.data.db.find((item) => item.id === schemaId);
		if (schema) {
			return {
				title: schema.json.title || 'Unknown Schema',
				description: schema.json.description || 'No description available',
				author: schema.json.author || 'Unknown',
				id: schema.id,
				version: schema.json.version
			};
		}
		return null;
	}

	// Add this helper function to ensure we always pass valid properties
	function getPropertiesToRender(item: any) {
		if (!item?.json) return {};

		// If it's a schema, return its properties definition
		if (item.json.properties) {
			return item.json.properties;
		}

		// If it's an object instance, return its property values
		const { type, title, description, author, version, schema_id, ...rest } = item.json;
		return rest || {};
	}

	$: if (selectedItem && selectedItem.json.$schema) {
		schemaInfo = findSchemaInfo(selectedItem.json.$schema);
	} else {
		schemaInfo = null;
	}

	function loadSchema(schemaId: string) {
		console.log('Loading schema:', schemaId);
		const schema = $dbQuery.data.db.find((item) => item.id === schemaId);
		if (schema) {
			selectedItem = schema;
			expandedProperties = [];
		}
	}

	function handleToggleProperty(event: CustomEvent<{ path: string; expanded: boolean }>) {
		const { path, expanded } = event.detail;

		if (expanded) {
			const pathParts = path.split('.');
			const parentPath = pathParts.slice(0, -1).join('.');
			expandedProperties = expandedProperties.filter((p) => {
				const pParts = p.split('.');
				return p === path || pParts.length !== pathParts.length || !p.startsWith(parentPath);
			});

			expandedProperties = [...expandedProperties, path];
		} else {
			expandedProperties = expandedProperties.filter(
				(p) => p !== path && !p.startsWith(path + '.')
			);
		}
	}

	$: if (selectedItem) {
		console.log('HominioDB: Selected item changed, resetting expandedProperties');
		expandedProperties = [];
	}

	// Function to generate form fields based on schema
	function generateFormFields(properties: Record<string, SchemaProperty>, parentKey = ''): string {
		return Object.entries(properties)
			.map(([key, prop]) => {
				const fullKey = parentKey ? `${parentKey}.${key}` : key;
				const isRequired = properties.required?.includes(key);
				const requiredAttr = isRequired ? 'required' : '';

				if (prop.type === 'object' && prop.properties) {
					return `
						<div class="mb-4">
							<h3 class="mb-2 text-lg font-semibold">
								${prop.title || key}
								${isRequired ? '<span class="text-error-500">*</span>' : ''}
							</h3>
							<div class="pl-4 border-l border-surface-300-600-token">
								${generateFormFields(prop.properties, key)}
							</div>
						</div>
					`;
				}

				let input = '';
				const validationAttrs = [
					requiredAttr,
					prop.minLength ? `minlength="${prop.minLength}"` : '',
					prop.maxLength ? `maxlength="${prop.maxLength}"` : '',
					prop.pattern ? `pattern="${prop.pattern}"` : '',
					prop.minimum ? `min="${prop.minimum}"` : '',
					prop.maximum ? `max="${prop.maximum}"` : ''
				]
					.filter(Boolean)
					.join(' ');

				switch (prop.type) {
					case 'string':
						if (prop.format === 'date') {
							input = `<input 
								type="date" 
								id="${fullKey}" 
								name="${fullKey}" 
								class="input" 
								${validationAttrs}
								bind:value={formData.${key}}
							>`;
						} else if (prop.format === 'email') {
							input = `<input 
								type="email" 
								id="${fullKey}" 
								name="${fullKey}" 
								class="input" 
								${validationAttrs}
								bind:value={formData.${key}}
							>`;
						} else {
							input = `<input 
								type="text" 
								id="${fullKey}" 
								name="${fullKey}" 
								class="input" 
								${validationAttrs}
								bind:value={formData.${key}}
							>`;
						}
						break;
					case 'number':
					case 'integer':
						input = `<input 
							type="number" 
							id="${fullKey}" 
							name="${fullKey}" 
							class="input" 
							${validationAttrs}
							bind:value={formData.${key}}
						>`;
						break;
					case 'boolean':
						input = `<input 
							type="checkbox" 
							id="${fullKey}" 
							name="${fullKey}" 
							class="checkbox" 
							${validationAttrs}
							bind:checked={formData.${key}}
						>`;
						break;
					default:
						input = `<input 
							type="text" 
							id="${fullKey}" 
							name="${fullKey}" 
							class="input" 
							${validationAttrs}
							bind:value={formData.${key}}
						>`;
				}

				const validationHints = [
					prop.minLength ? `Minimum ${prop.minLength} characters` : '',
					prop.maxLength ? `Maximum ${prop.maxLength} characters` : '',
					prop.pattern ? `Must match pattern: ${prop.pattern}` : '',
					prop.format ? `Must be a valid ${prop.format}` : ''
				].filter(Boolean);

				return `
					<div class="mb-4">
						<label for="${fullKey}" class="block mb-1 text-sm font-medium">
							${prop.title || key}
							${isRequired ? '<span class="text-error-500">*</span>' : ''}
						</label>
						${input}
						${
							prop.description
								? `<p class="mt-1 text-xs text-surface-600-300-token">${prop.description}</p>`
								: ''
						}
						${
							validationHints.length > 0
								? `<p class="mt-1 text-xs text-warning-500">${validationHints.join(' • ')}</p>`
								: ''
						}
						${isRequired ? `<p class="mt-1 text-xs text-error-500">Required field</p>` : ''}
					</div>
				`;
			})
			.join('');
	}

	// Helper function to format date to ISO format
	function formatDateForSubmission(date: string): string | null {
		if (!date) return null;
		try {
			// Convert to YYYY-MM-DD format
			const d = new Date(date);
			return d.toISOString().split('T')[0];
		} catch {
			return null;
		}
	}

	async function handleCreateObject(event: Event) {
		event.preventDefault();
		console.log('[HominioDB] Creating object with form data:', formData);

		try {
			// Create a clean object that matches the schema
			const processedFormData = {
				username: formData.username.trim(),
				email: formData.email.trim(),
				profile: {
					fullName: formData.profile.fullName.trim(),
					birthDate: formData.profile.birthDate || null
				}
			};

			// Add any schema-specific metadata
			if (selectedItem?.json.display_field) {
				const displayValue = processedFormData[selectedItem.json.display_field];
				if (displayValue) {
					processedFormData.title = displayValue;
				}
			}

			const result = await $insertDBMutation.mutateAsync({
				json: processedFormData,
				type: 'object',
				schema: selectedItem?.id || ''
			});

			if (result?.success) {
				message = { text: 'Object created successfully!', type: 'success' };
				await $dbQuery.refetch();
				showCreateModal = false;
				// Reset form
				formData = {
					username: '',
					email: '',
					profile: {
						fullName: '',
						birthDate: ''
					}
				};
			} else {
				message = {
					text: `Failed to create object: ${
						result?.details ? JSON.stringify(result.details) : 'Unknown error'
					}`,
					type: 'error'
				};
				console.error('[HominioDB] Failed to create object:', result?.details);
			}
		} catch (error) {
			console.error('[HominioDB] Error creating object:', error);
			message = {
				text: `Error: ${error instanceof Error ? error.message : String(error)}`,
				type: 'error'
			};
		}
	}

	function openCreateModal() {
		formData = {
			username: '',
			email: '',
			profile: {
				fullName: '',
				birthDate: ''
			}
		};
		showCreateModal = true;
	}

	function closeModal() {
		showCreateModal = false;
		formData = {
			username: '',
			email: '',
			profile: {
				fullName: '',
				birthDate: ''
			}
		};
	}

	// Handle ESC key to close modal
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showCreateModal) {
			closeModal();
		}
	}

	function getSchemaDetails(schemaId: string | null) {
		if (!schemaId || !$dbQuery?.data?.db) return null;
		const schema = $dbQuery.data.db.find((item) => item.id === schemaId);
		if (schema) {
			return {
				title: schema.json.title,
				description: schema.json.description,
				version: schema.version
			};
		}
		return null;
	}

	// Add a reactive statement to get schema details when selectedItem changes
	$: schemaDetails = selectedItem ? getSchemaDetails(selectedItem.schema) : null;

	function getSchemaDisplayField(item: any): string | null {
		if (!item.schema || !$dbQuery?.data?.db) return null;
		const schema = $dbQuery.data.db.find((s) => s.id === item.schema);
		return schema?.json?.display_field || null;
	}

	// Helper function to check if an item is a schema
	function isSchema(item: any): boolean {
		return item.schema === '00000000-0000-0000-0000-000000000001'; // References meta schema
	}

	// Function to handle value changes from Properties component
	function handleValueChange(event: CustomEvent<{ path: string[]; value: any }>) {
		const { path, value } = event.detail;

		// Initialize editedJson if not already done
		if (!editedJson) {
			editedJson = JSON.parse(JSON.stringify(selectedItem.json));
		}

		// Navigate to the correct position in the object and update the value
		let current = editedJson;
		const lastKey = path[path.length - 1];

		// Navigate through the path except the last key
		for (let i = 0; i < path.length - 1; i++) {
			if (!current[path[i]]) {
				current[path[i]] = {};
			}
			current = current[path[i]];
		}

		// Set the value at the final position
		current[lastKey] = value;

		console.log('Updated JSON:', editedJson);
	}

	// Function to start editing
	function startEditing() {
		isEditing = true;
		editedJson = null; // Will be initialized on first change
	}

	// Function to cancel editing
	function cancelEditing() {
		isEditing = false;
		editedJson = null;
	}

	// Function to save changes
	async function saveChanges() {
		if (!selectedItem?.id) return;

		try {
			const finalJson = editedJson || selectedItem.json;
			const result = await $editDBMutation.mutateAsync({
				id: selectedItem.id,
				json: finalJson
			});

			if (result?.success) {
				message = { text: 'Changes saved successfully!', type: 'success' };
				isEditing = false;
				editedJson = null;
				await $dbQuery.refetch();
			} else {
				message = { text: `Failed to save: ${result?.details || 'Unknown error'}`, type: 'error' };
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			message = {
				text: `Error: ${error instanceof Error ? error.message : String(error)}`,
				type: 'error'
			};
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex h-full text-gray-900 bg-tertiary-100 dark:bg-surface-800 dark:text-white">
	<!-- Left side: List view -->
	<div class="w-[300px] p-4 overflow-y-auto border-r border-surface-300-600-token">
		<button on:click={handleGenerateSchema} class="mb-4 btn variant-filled-primary">
			Generate Schema
		</button>

		{#if message.text}
			<div
				class={`p-2 mb-4 rounded ${
					message.type === 'success'
						? 'bg-success-100 text-success-800 dark:bg-success-700 dark:text-success-300'
						: 'bg-error-100 text-error-800 dark:bg-error-600 dark:text-error-300'
				}`}
			>
				{message.text}
			</div>
		{/if}

		{#if $dbQuery.isLoading}
			<p>Loading schemas...</p>
		{:else if $dbQuery.error}
			<p class="text-error-400">Error loading schemas: {$dbQuery.error.message}</p>
		{:else if $dbQuery.data?.db}
			<ul class="space-y-4">
				{#each $dbQuery.data.db.sort(sortByTimestamp) as item}
					<li
						class="p-2 cursor-pointer card variant-filled-tertiary-200 dark:variant-filled-surface-700 hover:bg-tertiary-300 dark:hover:bg-surface-600"
						on:click={() => (selectedItem = item)}
					>
						{#if isSchema(item)}
							<h3 class="font-semibold truncate text-md">{item.json.title}</h3>
						{:else}
							<h3 class="font-semibold truncate text-md">
								{#if item.schema && getSchemaDisplayField(item)}
									{item.json[getSchemaDisplayField(item)] || 'Untitled'}
								{:else}
									{item.json.title || 'Untitled'}
								{/if}
							</h3>
						{/if}
						<p class="text-xs truncate text-tertiary-400">
							Author: {item.author_name}
						</p>
					</li>
				{/each}
			</ul>
		{:else}
			<p>No schemas available</p>
		{/if}
	</div>

	<!-- Right side: Detail view -->
	<div class="flex-1 p-4 overflow-x-auto">
		{#if selectedItem}
			<div class="flex">
				<!-- First column: metadata -->
				<div class="flex flex-col max-w-xs p-4 border-r border-surface-300-600-token">
					<!-- Title and description if available -->
					<div class="mb-4">
						<div class="flex items-center justify-between">
							{#if selectedItem.json.title}
								<h3 class="text-xl font-semibold">{selectedItem.json.title}</h3>
							{/if}
						</div>
						{#if selectedItem.json.description}
							<span class="text-sm text-surface-800 dark:text-tertiary-500">
								{selectedItem.json.description}
							</span>
						{/if}
					</div>

					<!-- Create Object Button -->
					{#if isSchema(selectedItem)}
						<button class="w-full mb-4 btn variant-filled-primary" on:click={openCreateModal}>
							Create Object
						</button>
					{/if}

					<!-- Metadata Section -->
					<div class="grid gap-4">
						<!-- Schema Information -->
						{#if schemaDetails}
							<div class="flex flex-col">
								<span class="text-xs text-surface-500 dark:text-surface-400">Schema</span>
								<button
									class="text-sm font-semibold text-left text-tertiary-800 dark:text-tertiary-200 hover:underline"
									on:click={() => loadSchema(selectedItem.schema)}
								>
									{schemaDetails.title}
								</button>
							</div>
						{/if}

						<!-- Author Information -->
						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Author</span>
							<span class="text-sm font-semibold text-tertiary-800 dark:text-tertiary-200">
								{selectedItem.author_name || 'Unknown User'}
							</span>
							<span class="text-xs text-surface-600 dark:text-surface-400">
								{selectedItem.author}
							</span>
						</div>

						<!-- Version -->
						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Version</span>
							<span class="text-sm text-tertiary-800 dark:text-tertiary-200">
								v{selectedItem.version}
							</span>
						</div>

						<!-- Variation ID -->
						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Variation</span>
							<span class="text-sm font-mono text-tertiary-800 dark:text-tertiary-200">
								{selectedItem.variation}
							</span>
						</div>

						<!-- Created Date -->
						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Created</span>
							<span class="text-sm text-tertiary-800 dark:text-tertiary-200">
								{new Date(selectedItem.created_at).toLocaleString()}
							</span>
						</div>

						<!-- Other Metadata -->
						{#each ['$id', 'prev'] as key}
							{#if selectedItem.json[key] !== undefined}
								<div class="flex flex-col">
									<span class="text-xs text-surface-500 dark:text-surface-400">
										{key}
									</span>
									<span class="text-sm text-tertiary-800 dark:text-tertiary-200">
										{key === '$id' ? truncateCID(selectedItem.json[key]) : selectedItem.json[key]}
									</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Middle column: Properties -->
				<div class="flex-1 p-4">
					<!-- Edit controls -->
					<div class="flex justify-end gap-2 mb-4">
						{#if !isEditing}
							<button
								class="px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600"
								on:click={startEditing}
							>
								Edit
							</button>
						{:else}
							<button
								class="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600"
								on:click={cancelEditing}
							>
								Cancel
							</button>
							<button
								class="px-4 py-2 text-white rounded-lg bg-success-500 hover:bg-success-600"
								on:click={saveChanges}
							>
								Save
							</button>
						{/if}
					</div>

					<Properties
						properties={getPropertiesToRender(selectedItem)}
						{expandedProperties}
						{isEditing}
						on:toggleProperty={handleToggleProperty}
						on:valueChange={handleValueChange}
					/>
				</div>

				<!-- Right column: Version History -->
				{#if selectedItem}
					<div class="w-64 p-4 border-l border-surface-300-600-token">
						<div class="flex flex-col mb-4">
							<h3 class="text-lg font-semibold">Version History</h3>
							{#if selectedItem.is_archived}
								<button
									class="mt-2 px-2 py-1 text-sm text-center rounded bg-warning-100 hover:bg-warning-200 dark:bg-warning-900 dark:hover:bg-warning-800"
									on:click={() => {
										if ($dbQuery.data?.db) {
											const currentVersion = $dbQuery.data.db.find(
												(item) => item.variation === selectedItem.variation && !item.is_archived
											);
											if (currentVersion) {
												selectedItem = currentVersion;
												expandedProperties = [];
											}
										}
									}}
								>
									Return to Current Version
								</button>
							{/if}
						</div>

						<div class="space-y-2">
							<!-- All Versions (including current) -->
							{#if selectedItem}
								<!-- Current Version -->
								<button
									class="w-full p-2 text-left transition-colors rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
									class:bg-primary-100={!selectedItem.is_archived}
									class:dark:bg-primary-900={!selectedItem.is_archived}
									on:click={() => {
										if ($dbQuery.data?.db) {
											const currentVersion = $dbQuery.data.db.find(
												(item) => item.variation === selectedItem.variation && !item.is_archived
											);
											if (currentVersion) {
												selectedItem = currentVersion;
												expandedProperties = [];
											}
										}
									}}
								>
									<div class="flex items-center justify-between">
										<div>
											<span class="text-sm font-semibold">Current v{selectedItem.version}</span>
											<div class="text-xs text-surface-600">
												{new Date(selectedItem.created_at).toLocaleString()}
											</div>
											<div class="mt-1 text-xs text-surface-500">
												by {selectedItem.author_name}
											</div>
										</div>
										{#if !selectedItem.is_archived}
											<span class="text-xs text-surface-500">(viewing)</span>
										{/if}
									</div>
								</button>

								<!-- Previous Versions -->
								{#if selectedItem.archived_versions?.length > 0}
									{#each selectedItem.archived_versions.sort((a, b) => b.version - a.version) as version}
										<button
											class="w-full p-2 text-left transition-colors rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
											class:bg-surface-200={version.id === selectedItem.id}
											on:click={() => {
												selectedItem = version;
												expandedProperties = [];
											}}
										>
											<div class="flex items-center justify-between">
												<div>
													<span class="text-sm font-semibold">v{version.version}</span>
													<div class="text-xs text-surface-600">
														{new Date(version.created_at).toLocaleString()}
													</div>
													<div class="mt-1 text-xs text-surface-500">
														by {version.author_name}
													</div>
												</div>
												{#if version.id === selectedItem.id}
													<span class="text-xs text-surface-500">(viewing)</span>
												{/if}
											</div>
										</button>
									{/each}
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<p class="text-xl text-center">Select an item from the list to view details</p>
		{/if}
	</div>
</div>

<!-- Custom Modal -->
{#if showCreateModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80"
		on:click|self={closeModal}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-2xl p-6 mx-4 rounded-lg shadow-xl bg-tertiary-100 dark:bg-surface-800"
			role="document"
		>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">Create New {selectedItem?.json.title}</h2>
				<button
					class="p-2 text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-50"
					on:click={closeModal}
				>
					<svg
						class="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={handleCreateObject} class="space-y-4">
				{#if selectedItem?.json.properties}
					<!-- Username -->
					<div class="mb-4">
						<label for="username" class="block mb-1 text-sm font-medium">
							Username <span class="text-error-500">*</span>
						</label>
						<input
							type="text"
							id="username"
							class="input"
							bind:value={formData.username}
							required
							minlength="3"
							maxlength="20"
							pattern="^[a-zA-Z0-9_-]+$"
						/>
						<p class="mt-1 text-xs text-warning-500">
							Minimum 3 characters • Maximum 20 characters • Only letters, numbers, underscore and
							dash
						</p>
					</div>

					<!-- Email -->
					<div class="mb-4">
						<label for="email" class="block mb-1 text-sm font-medium">
							Email <span class="text-error-500">*</span>
						</label>
						<input type="email" id="email" class="input" bind:value={formData.email} required />
					</div>

					<!-- Profile -->
					<div class="mb-4">
						<h3 class="mb-2 text-lg font-semibold">Profile</h3>

						<!-- Full Name -->
						<div class="mb-4">
							<label for="fullName" class="block mb-1 text-sm font-medium">
								Full Name <span class="text-error-500">*</span>
							</label>
							<input
								type="text"
								id="fullName"
								class="input"
								bind:value={formData.profile.fullName}
								required
							/>
						</div>

						<!-- Birth Date -->
						<div class="mb-4">
							<label for="birthDate" class="block mb-1 text-sm font-medium"> Birth Date </label>
							<input
								type="date"
								id="birthDate"
								class="input"
								bind:value={formData.profile.birthDate}
							/>
						</div>
					</div>

					<div class="flex justify-end gap-2">
						<button
							type="button"
							class="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600"
							on:click={closeModal}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-white rounded-lg bg-success-500 hover:bg-success-600"
						>
							Create
						</button>
					</div>
				{/if}
			</form>
		</div>
	</div>
{/if}

<style>
	:global(.input) {
		@apply p-2 rounded border border-surface-300-600-token bg-tertiary-100 dark:bg-surface-700;
	}
	:global(.checkbox) {
		@apply w-4 h-4 rounded border border-surface-300-600-token;
	}
</style>
