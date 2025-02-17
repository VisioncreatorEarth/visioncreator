<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import Properties from './Properties.svelte';

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
			birthDate: string;
		};
	}

	// Create the query directly
	const dbQuery = createQuery({
		operationName: 'queryDB',
		enabled: true
	});

	let selectedItem = null;
	let message = { text: '', type: '' };
	let schemaInfo = null;
	let expandedProperties = new Map();
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

	const insertObjectMutation = createMutation({
		operationName: 'insertObject'
	});

	function sortByTimestamp(a, b) {
		return new Date(b.json.timestamp || 0).getTime() - new Date(a.json.timestamp || 0).getTime();
	}

	async function generateRandomObject() {
		message = { text: '', type: '' };
		const result = await $insertDBMutation.mutateAsync({});
		if (result.success) {
			message = { text: 'Random object generated successfully!', type: 'success' };
			await $dbQuery.refetch();
		} else {
			message = { text: `Failed: ${result.details}`, type: 'error' };
			console.error('Failed:', result.details);
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
			expandedProperties.set(schemaId, null);
			expandedProperties = new Map(expandedProperties);
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

	async function handleCreateObject() {
		if (!selectedItem?.id) return;

		try {
			console.log('[HominioDB] Creating object with form data:', formData);

			const result = await $insertObjectMutation.mutateAsync({
				object: {
					type: 'object',
					title: `New ${selectedItem.json.title} Object`,
					description: `Object created from ${selectedItem.json.title} schema`,
					author: 'HominioDB Client',
					version: 1,
					schema_id: selectedItem.id,
					...formData // Spread the form data directly
				}
			});

			console.log('[HominioDB] Create object result:', result);

			if (result?.success) {
				message = { text: 'Object created successfully!', type: 'success' };
				showCreateModal = false;
				formData = {
					username: '',
					email: '',
					profile: {
						fullName: '',
						birthDate: ''
					}
				};
				await $dbQuery.refetch();
			} else {
				message = { text: `Failed: ${result?.details || 'Unknown error'}`, type: 'error' };
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
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex h-full text-gray-900 bg-tertiary-100 dark:bg-surface-800 dark:text-white">
	<!-- Left side: List view -->
	<div class="w-[300px] p-4 overflow-y-auto border-r border-surface-300-600-token">
		<button on:click={generateRandomObject} class="mb-4 btn variant-filled-primary">
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
						<h3 class="font-semibold truncate text-md">{item.json.title}</h3>
						<p class="text-xs truncate text-tertiary-400">
							{item.json.type} • {item.json.author || 'Unknown'}
							{#if item.json.version}• v{item.json.version}{/if}
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
				<!-- First column: normal props -->
				<div class="flex flex-col max-w-xs p-4 border-r border-surface-300-600-token">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-xl font-semibold">{selectedItem.json.title}</h3>
						<button class="btn variant-filled-primary" on:click={openCreateModal}>
							Create Object
						</button>
					</div>

					<span class="mb-4 text-sm text-surface-800 dark:text-tertiary-500">
						{selectedItem.json.description}
					</span>
					{#if schemaInfo}
						<div
							class="flex flex-col mb-2 rounded cursor-pointer hover:bg-tertiary-200 dark:hover:bg-surface-700"
							on:click={() => loadSchema(schemaInfo.id)}
						>
							<span class="text-xs text-surface-500 dark:text-surface-400">Schema</span>
							<span class="text-sm font-semibold text-tertiary-100 dark:text-tertiary-200">
								{schemaInfo.title} v{schemaInfo.version ?? 0}
							</span>
							<span class="text-xs text-surface-700 dark:text-tertiary-400">
								{schemaInfo.description}
							</span>
						</div>
					{/if}
					{#each ['$id', 'author', 'version', 'prev'] as key}
						{#if selectedItem.json[key] !== undefined}
							<div class="flex flex-col mb-2">
								<span class="text-xs text-surface-500 dark:text-surface-400">
									{key}
								</span>
								<span class="text-xs text-surface-700 dark:text-tertiary-400">
									{key === '$id' ? truncateCID(selectedItem.json[key]) : selectedItem.json[key]}
								</span>
							</div>
						{/if}
					{/each}
				</div>
				<Properties
					properties={getPropertiesToRender(selectedItem)}
					{expandedProperties}
					on:toggleProperty={handleToggleProperty}
				/>
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
						<p class="mt-1 text-xs text-error-500">Required field</p>
					</div>

					<!-- Email -->
					<div class="mb-4">
						<label for="email" class="block mb-1 text-sm font-medium">
							Email <span class="text-error-500">*</span>
						</label>
						<input type="email" id="email" class="input" bind:value={formData.email} required />
						<p class="mt-1 text-xs text-warning-500">Must be a valid email address</p>
						<p class="mt-1 text-xs text-error-500">Required field</p>
					</div>

					<!-- Profile -->
					<div class="mb-4">
						<h3 class="mb-2 text-lg font-semibold">
							Profile <span class="text-error-500">*</span>
						</h3>
						<div class="pl-4 border-l border-surface-300-600-token">
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
								<p class="mt-1 text-xs text-error-500">Required field</p>
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
					</div>
				{/if}
				<div class="flex justify-end gap-2 mt-6">
					<button
						type="button"
						class="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600"
						on:click={closeModal}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-white rounded-lg bg-primary-500 hover:bg-primary-600"
					>
						Create
					</button>
				</div>
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
