<script lang="ts">
	/**
	 * HominioDB Component Documentation
	 *
	 * Architecture Overview:
	 * ---------------------
	 * This component implements a universal schema-based database with versioning and archiving.
	 *
	 * Core Concepts:
	 *
	 * 1. Database Structure:
	 *    - Two main tables: 'db' (active records) and 'db_archive' (historical versions)
	 *    - Every record has a unique ID and a variation ID
	 *    - Variation ID groups all versions of the same logical entity
	 *
	 * 2. Versioning System:
	 *    - Records are never updated in place
	 *    - When editing a record:
	 *      a. Original record moves to db_archive
	 *      b. New version created in db with updated values
	 *      c. New version's 'prev' field points to archived version
	 *      d. Version number increments
	 *      e. Variation ID remains the same
	 *
	 * 3. Schema Management:
	 *    - Every record references a schema (including schemas themselves)
	 *    - Root schema (meta-schema) is self-referential
	 *    - Schema references can point to either active or archived schemas
	 *    - Database triggers validate schema references across both tables
	 *
	 * 4. Display Fields:
	 *    - Schemas can specify a 'display_field'
	 *    - The specified field's value is used as the record's display title
	 *    - Display values update automatically via database triggers
	 *
	 * 5. Reference Handling:
	 *    - References remain valid after archiving
	 *    - System automatically checks both active and archived tables
	 *    - Triggers ensure referential integrity across tables
	 *
	 * Key Properties:
	 * - id: Unique identifier for each version
	 * - variation: Groups all versions of same entity
	 * - prev: Points to previous version in archive
	 * - version: Incremental version number
	 * - schema: References the schema (active or archived)
	 * - json: Actual data following schema structure
	 * - created_at: Timestamp of version creation
	 * - archived_at: When version was moved to archive
	 *
	 * Edit Flow:
	 * 1. User modifies a record
	 * 2. update_db_version() function triggers
	 * 3. Current version moves to archive
	 * 4. New version created with updates
	 * 5. References and version numbers update
	 * 6. Display fields recalculate via triggers
	 *
	 * This architecture ensures:
	 * - Complete version history
	 * - No data loss
	 * - Referential integrity
	 * - Automatic display field updates
	 * - Schema validation across versions
	 */

	import { createMutation, createQuery } from '$lib/wundergraph';
	import Properties from './Properties.svelte';
	import SchemaForm from './SchemaForm.svelte';
	import JsonEditor from './JsonEditor.svelte';

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
		nullable?: boolean;
	}

	interface FormData {
		username: string;
		email: string;
		profile: {
			fullName: string;
			birthDate: string | null;
		};
	}

	// Add type for query result
	interface DBQueryResult {
		db: DBItem[];
	}

	// Update type definitions
	interface Queries {
		queryDB: DBQueryResult;
	}

	// Update query creation with proper type
	const dbQuery = createQuery<keyof Queries>({
		operationName: 'queryDB',
		enabled: true
	});

	let selectedItem: DBItem | null = null;
	let message = { text: '', type: '' };
	let schemaInfo = null;
	let expandedProperties: string[] = [];
	let showCreateModal = false;
	let showCreateObjectModal = false;
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

	// Add state for archived versions
	let archivedVersions: DBItem[] = [];

	// Add back the state variables
	let editedJson: any = null;
	let hasChanges = false;

	// Add editDB mutation back
	const editDBMutation = createMutation({
		operationName: 'editDB'
	});

	// Add these state variables after the other let declarations
	let isEditingTitle = false;
	let isEditingDescription = false;
	let editedTitle = '';
	let editedDescription = '';

	// Add state for active tab
	let activeTab: 'versions' | 'variations' = 'versions';

	// Add state for content tab
	let contentTab: 'properties' | 'json' = 'properties';

	// Add handleKeydown function back
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (showCreateModal) {
				closeModal();
			}
			isEditingTitle = false;
			isEditingDescription = false;
		}
	}

	// Update loadSchema function with proper type assertions
	async function loadSchema(schemaId: string, autoLoadCurrent: boolean = false) {
		console.log('Loading schema:', schemaId);

		if (!$dbQuery.data?.db) return;

		// If autoLoadCurrent is true, first try to find the current version
		if (autoLoadCurrent) {
			const currentSchema = $dbQuery.data.db.find((item) =>
				(item as DBItem).archived_versions?.some((v) => v.id === schemaId)
			) as DBItem | undefined;

			if (currentSchema) {
				selectedItem = currentSchema;
				expandedProperties = [];
				return;
			}
		}

		// Regular schema loading logic
		const activeSchema = $dbQuery.data.db.find((item) => (item as DBItem).id === schemaId) as
			| DBItem
			| undefined;

		if (activeSchema) {
			selectedItem = activeSchema;
			expandedProperties = [];
			return;
		}

		// Check archived schemas
		const archivedSchema = $dbQuery.data.db.find((item) =>
			(item as DBItem).archived_versions?.some((version) => version.id === schemaId)
		) as DBItem | undefined;

		if (archivedSchema) {
			const version = archivedSchema.archived_versions?.find((v) => v.id === schemaId);
			if (version) {
				selectedItem = version;
				expandedProperties = [];
			}
		}
	}

	function sortByTimestamp(a: any, b: any) {
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
					pattern: '^[\\w-]+$',
					errorMessage: {
						pattern: 'Username can only contain letters, numbers, underscore and dash',
						minLength: 'Username must be at least 3 characters long',
						maxLength: 'Username cannot exceed 20 characters'
					}
				},
				email: {
					type: 'string',
					title: 'Email',
					description: "The user's email address",
					format: 'email',
					pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
					errorMessage: {
						format: 'Please enter a valid email address',
						pattern: 'Please enter a valid email address'
					}
				},
				profile: {
					type: 'object',
					title: 'User Profile',
					description: 'Additional profile information',
					properties: {
						fullName: {
							type: 'string',
							title: 'Full Name',
							description: "The user's full name",
							minLength: 2,
							maxLength: 100,
							pattern: "^[A-Za-zÀ-ÖØ-öø-ÿ\\s'-]+$",
							errorMessage: {
								pattern: 'Full name can only contain letters, spaces, hyphens and apostrophes',
								minLength: 'Full name must be at least 2 characters long',
								maxLength: 'Full name cannot exceed 100 characters'
							}
						},
						birthDate: {
							type: 'string',
							title: 'Birth Date',
							description: "The user's birth date",
							format: 'date',
							nullable: true,
							errorMessage: {
								format: 'Please enter a valid date'
							},
							validate: {
								minDate: '1900-01-01',
								maxDate: new Date().toISOString().split('T')[0],
								errorMessage: {
									minDate: 'Birth date cannot be before 1900',
									maxDate: 'Birth date cannot be in the future'
								}
							}
						}
					},
					required: ['fullName']
				}
			},
			required: ['username', 'email', 'profile']
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

	// Add closeModal function
	function closeModal() {
		showCreateModal = false;
	}

	// Update getSchemaDetails function with proper types
	function getSchemaDetails(schemaId: string | null) {
		if (!schemaId || !$dbQuery?.data?.db) return null;

		const dbItems = $dbQuery.data.db as DBItem[];
		const activeSchema = dbItems.find((item) => item.id === schemaId);

		if (activeSchema) {
			return {
				title: activeSchema.json.title,
				description: activeSchema.json.description,
				version: activeSchema.version,
				is_archived: false,
				id: activeSchema.id
			};
		}

		for (const item of dbItems) {
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

	// Add a reactive statement to get schema details when selectedItem changes
	$: schemaDetails = selectedItem ? getSchemaDetails(selectedItem.schema) : null;

	// Update getSchemaDisplayField with proper type handling
	function getSchemaDisplayField(item: DBItem): string | null {
		if (!item.schema || !$dbQuery?.data?.db) return null;
		const schema = $dbQuery.data.db.find((s) => (s as DBItem).id === item.schema) as
			| DBItem
			| undefined;
		return schema?.json?.display_field || null;
	}

	// Helper function to check if an item is a schema
	function isSchema(item: DBItem): boolean {
		return item.schema === '00000000-0000-0000-0000-000000000001';
	}

	// Update handleValueChange to match the event format
	function handleValueChange(event: CustomEvent<{ path: string; value: any }>) {
		const { path, value } = event.detail;

		// Initialize editedJson if not already done
		if (!editedJson && selectedItem) {
			editedJson = JSON.parse(JSON.stringify(selectedItem.json));
		}

		// Navigate to the correct position in the object and update the value
		const pathParts = path.split('.');
		let current = editedJson;

		for (let i = 0; i < pathParts.length - 1; i++) {
			if (!current[pathParts[i]]) {
				current[pathParts[i]] = {};
			}
			current = current[pathParts[i]];
		}

		const lastPart = pathParts[pathParts.length - 1];
		current[lastPart] = value;
		hasChanges = true;

		console.log('Value changed:', { path, value, hasChanges, editedJson }); // Debug log
	}

	// Update the saveChanges function to handle version updates
	async function saveChanges() {
		if (!selectedItem?.id || !editedJson) return;

		try {
			const result = await $editDBMutation.mutateAsync({
				id: selectedItem.id,
				json: editedJson
			});

			if (result?.success) {
				// Refetch the data
				await $dbQuery.refetch();

				// Find the new version in the updated data
				if ($dbQuery.data?.db) {
					// For schema items, find by title to ensure we get the latest version
					if (isSchema(selectedItem)) {
						const updatedItem = $dbQuery.data.db.find(
							(item) => item.json.title === editedJson.title
						);
						if (updatedItem) {
							selectedItem = updatedItem;
						}
					} else {
						// For regular items, find by variation to get the latest version
						const updatedItem = $dbQuery.data.db.find(
							(item) => item.variation === selectedItem?.variation
						);
						if (updatedItem) {
							selectedItem = updatedItem;
						}
					}
				}

				editedJson = null;
				hasChanges = false;
				message = { text: 'Changes saved successfully!', type: 'success' };
			} else {
				message = {
					text: `Failed to save changes: ${result?.details || 'Unknown error'}`,
					type: 'error'
				};
			}
		} catch (error) {
			console.error('Error saving changes:', error);
			message = {
				text: `Error saving changes: ${error instanceof Error ? error.message : String(error)}`,
				type: 'error'
			};
		}
	}

	// Add reactive statement to handle version updates
	$: if ($dbQuery.data?.db && selectedItem) {
		// Keep the selected item in sync with the latest version
		const currentVersion = $dbQuery.data.db.find(
			(item) => item.variation === selectedItem.variation
		);
		if (currentVersion && currentVersion.id !== selectedItem.id) {
			selectedItem = currentVersion;
		}
	}

	interface ValidationError {
		field: string;
		message: string;
	}

	function validateAgainstSchema(data: any, schema: any): ValidationError[] {
		const errors: ValidationError[] = [];

		function validateField(value: any, fieldSchema: any, path: string) {
			if (fieldSchema.required && value === undefined) {
				errors.push({
					field: path,
					message: `${fieldSchema.title || path} is required`
				});
				return;
			}

			if ((value === null || value === '') && !fieldSchema.required) return;

			switch (fieldSchema.type) {
				case 'string':
					if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
						errors.push({
							field: path,
							message:
								fieldSchema.errorMessage?.minLength || `Minimum length is ${fieldSchema.minLength}`
						});
					}
					if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
						errors.push({
							field: path,
							message:
								fieldSchema.errorMessage?.maxLength || `Maximum length is ${fieldSchema.maxLength}`
						});
					}
					if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
						errors.push({
							field: path,
							message: fieldSchema.errorMessage?.pattern || `Invalid format`
						});
					}
					if (fieldSchema.format === 'email') {
						const emailRegex = new RegExp(
							fieldSchema.pattern || '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
						);
						if (!emailRegex.test(value)) {
							errors.push({
								field: path,
								message: fieldSchema.errorMessage?.format || 'Invalid email format'
							});
						}
					}
					if (fieldSchema.format === 'date') {
						if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
							errors.push({
								field: path,
								message: fieldSchema.errorMessage?.format || 'Invalid date format'
							});
							return;
						}
						const [year, month, day] = value.split('-').map(Number);
						const date = new Date(year, month - 1, day);
						if (isNaN(date.getTime())) {
							errors.push({
								field: path,
								message: fieldSchema.errorMessage?.format || 'Invalid date'
							});
							return;
						}
						if (fieldSchema.validate) {
							const { minDate, maxDate } = fieldSchema.validate;
							if (minDate && date < new Date(minDate)) {
								errors.push({
									field: path,
									message:
										fieldSchema.validate.errorMessage?.minDate || `Date cannot be before ${minDate}`
								});
							}
							if (maxDate && date > new Date(maxDate)) {
								errors.push({
									field: path,
									message:
										fieldSchema.validate.errorMessage?.maxDate || `Date cannot be after ${maxDate}`
								});
							}
						}
					}
					break;
				case 'object':
					if (fieldSchema.properties) {
						Object.entries(fieldSchema.properties).forEach(([key, propSchema]) => {
							validateField(value[key], propSchema, path ? `${path}.${key}` : key);
						});
					}
					break;
			}
		}

		validateField(data, schema, '');
		return errors;
	}

	// Add these functions for editing
	function startEditing(field: 'title' | 'description') {
		if (!selectedItem) return;

		if (field === 'title') {
			isEditingTitle = true;
			editedTitle = selectedItem.json.title || '';
		} else {
			isEditingDescription = true;
			editedDescription = selectedItem.json.description || '';
		}
	}

	async function saveInlineEdit(field: 'title' | 'description') {
		if (!selectedItem?.id) return;

		try {
			const newJson = JSON.parse(JSON.stringify(selectedItem.json));

			if (field === 'title') {
				newJson.title = editedTitle.trim();
				isEditingTitle = false;
			} else {
				newJson.description = editedDescription.trim();
				isEditingDescription = false;
			}

			const result = await $editDBMutation.mutateAsync({
				id: selectedItem.id,
				json: newJson
			});

			if (result?.success) {
				await $dbQuery.refetch();
			} else {
				message = {
					text: `Failed to save: ${result?.details || 'Unknown error'}`,
					type: 'error'
				};
			}
		} catch (error) {
			console.error(`Error saving ${field}:`, error);
			message = {
				text: `Error saving ${field}: ${error instanceof Error ? error.message : String(error)}`,
				type: 'error'
			};
		}
	}

	// Update the getAllVersions function with null checks
	function getAllVersions(item: DBItem | null): DBItem[] {
		if (!item || !$dbQuery?.data?.db) return [];

		const dbItems = $dbQuery.data.db as DBItem[];
		const activeRecord = dbItems.find((record) => record.variation === item.variation);

		if (!activeRecord) return [];

		return [activeRecord, ...(activeRecord.archived_versions || [])].sort(
			(a, b) => b.version - a.version
		);
	}

	// Update JSON text when tab or item changes
	$: if (selectedItem && contentTab === 'json') {
		// This is now handled by the JsonEditor component
	}

	// Add helper functions
	async function createAddressSchema() {
		const addressSchema = {
			type: 'object',
			title: 'Address',
			description: 'Physical address information',
			properties: {
				street: {
					type: 'string',
					title: 'Street',
					description: 'Street address including house number'
				},
				city: {
					type: 'string',
					title: 'City',
					description: 'City name'
				},
				state: {
					type: 'string',
					title: 'State/Province',
					description: 'State or province name'
				},
				postalCode: {
					type: 'string',
					title: 'Postal Code',
					pattern: '^[0-9]{5}(-[0-9]{4})?$',
					description: 'ZIP or postal code'
				},
				country: {
					type: 'string',
					title: 'Country',
					description: 'Country name'
				}
			},
			required: ['street', 'city', 'postalCode', 'country'],
			display_field: 'street'
		};

		try {
			// Find the meta schema (schema for schemas)
			const metaSchema = $dbQuery.data?.db.find(
				(item) => item.json.title === 'Meta Schema' && !item.is_archived
			);

			if (!metaSchema) {
				throw new Error('Meta schema not found');
			}

			const result = await $insertDBMutation.mutateAsync({
				json: addressSchema,
				type: 'schema',
				schema: metaSchema.id // Add the required schema parameter
			});

			if (result?.success) {
				await $dbQuery.refetch();
				message = { text: 'Address schema created successfully!', type: 'success' };
			}
		} catch (error) {
			console.error('Error creating address schema:', error);
			message = {
				text: `Error creating address schema: ${
					error instanceof Error ? error.message : String(error)
				}`,
				type: 'error'
			};
		}
	}

	// Add helper function to get display value
	function getDisplayValue(item: DBItem): string {
		const displayField = getSchemaDisplayField(item);
		if (item.schema && displayField && typeof displayField === 'string') {
			return item.json[displayField] || 'Untitled';
		}
		return item.json.title || 'Untitled';
	}

	// Add missing handleToggleProperty function
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

	// Add missing functions
	function closeCreateObjectModal() {
		showCreateObjectModal = false;
	}

	// Update the handleCreateObject function to switch to the new item after creation
	async function handleCreateObject(event: CustomEvent<{ formData: Record<string, any> }>) {
		if (!selectedItem?.id) return;

		try {
			console.log('[HominioDB] Creating object with form data:', event.detail.formData);

			// Add any schema-specific metadata
			if (selectedItem?.json.display_field) {
				const displayValue = event.detail.formData[selectedItem.json.display_field];
				if (displayValue) {
					event.detail.formData.title = displayValue;
				}
			}

			const result = await $insertDBMutation.mutateAsync({
				json: event.detail.formData,
				type: 'object',
				schema: selectedItem?.id || ''
			});

			if (result?.success) {
				message = { text: 'Object created successfully!', type: 'success' };
				await $dbQuery.refetch();

				// Switch to the newly created item
				if ($dbQuery.data?.db && result.insertedData) {
					const newItem = $dbQuery.data.db.find((item) => item.id === result.insertedData.id);
					if (newItem) {
						selectedItem = newItem;
					}
				}

				showCreateObjectModal = false;
				// Reset form
				formData = {
					username: '',
					email: '',
					profile: {
						fullName: '',
						birthDate: null
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
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="flex h-full">
	<!-- Main content area -->
	<div class="flex-1">
		<!-- List and details content -->
		<div class="flex h-full">
			<!-- Left sidebar with list -->
			<div class="w-64 p-4 border-r border-surface-300-600-token">
				<div class="flex flex-col gap-2 p-4">
					<button class="btn variant-filled-primary btn-sm" on:click={handleGenerateSchema}>
						Add User Schema
					</button>
					<button class="btn variant-filled-primary btn-sm" on:click={createAddressSchema}>
						Add Address Schema
					</button>
				</div>

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
										{getDisplayValue(item)}
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

			<!-- Main content -->
			<div class="flex-1 p-4">
				{#if selectedItem}
					<!-- Header with title/description -->
					<div class="mb-6">
						<div class="flex items-start justify-between mb-4">
							<div>
								<div class="flex-1">
									{#if isEditingTitle}
										<div class="flex items-center gap-2">
											<input
												type="text"
												bind:value={editedTitle}
												class="w-full text-2xl font-semibold input"
												placeholder="Enter title"
												on:keydown={(e) => {
													if (e.key === 'Enter') saveInlineEdit('title');
													if (e.key === 'Escape') isEditingTitle = false;
												}}
											/>
											<button
												class="p-1 text-success-500 hover:text-success-600"
												on:click={() => saveInlineEdit('title')}
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</button>
											<button
												class="p-1 text-error-500 hover:text-error-600"
												on:click={() => (isEditingTitle = false)}
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									{:else}
										<div class="flex items-center group">
											<h2 class="text-2xl font-semibold">
												{#if isSchema(selectedItem)}
													{selectedItem.json.title || 'Untitled'}
												{:else}
													{getDisplayValue(selectedItem)}
												{/if}
											</h2>
											<button
												class="p-1 ml-2 opacity-0 group-hover:opacity-100 text-tertiary-500 hover:text-tertiary-700 dark:text-tertiary-400 dark:hover:text-tertiary-200"
												on:click={() => startEditing('title')}
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
													/>
												</svg>
											</button>
										</div>
									{/if}
								</div>

								{#if isEditingDescription}
									<div class="flex items-start gap-2 mt-1">
										<textarea
											bind:value={editedDescription}
											class="w-full text-sm input"
											rows="3"
											placeholder="Enter description"
											on:keydown={(e) => {
												if (e.key === 'Enter' && e.ctrlKey) saveInlineEdit('description');
												if (e.key === 'Escape') isEditingDescription = false;
											}}
										/>
										<div class="flex flex-col gap-1">
											<button
												class="p-1 text-success-500 hover:text-success-600"
												on:click={() => saveInlineEdit('description')}
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 13l4 4L19 7"
													/>
												</svg>
											</button>
											<button
												class="p-1 text-error-500 hover:text-error-600"
												on:click={() => (isEditingDescription = false)}
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									</div>
								{:else if selectedItem?.json.description}
									<div class="flex items-center group">
										<p class="mt-1 text-sm text-surface-600 dark:text-surface-300">
											{selectedItem.json.description}
										</p>
										<button
											class="p-1 ml-2 opacity-0 group-hover:opacity-100 text-tertiary-500 hover:text-tertiary-700 dark:text-tertiary-400 dark:hover:text-tertiary-200"
											on:click={() => startEditing('description')}
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
												/>
											</svg>
										</button>
									</div>
								{:else}
									<button
										class="mt-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
										on:click={() => startEditing('description')}
									>
										Add description...
									</button>
								{/if}
							</div>

							<!-- Create Object Button -->
							{#if isSchema(selectedItem)}
								<button
									class="btn variant-filled-primary"
									on:click={() => (showCreateObjectModal = true)}
								>
									Create Object
								</button>
							{/if}
						</div>
					</div>

					<!-- Metadata Grid -->
					<div class="grid grid-cols-4 gap-4 mb-6">
						<!-- Add archived badge if viewing archived version -->
						{#if selectedItem?.is_archived}
							<div class="col-span-4 mb-2">
								<span
									class="px-2 py-1 text-xs font-semibold rounded-full bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-200"
								>
									Archived Version {selectedItem.version}
								</span>
							</div>
						{/if}

						{#if schemaDetails}
							<div class="flex flex-col">
								<span class="text-xs text-surface-500 dark:text-surface-400">Schema</span>
								<div class="flex items-center gap-2">
									<button
										class="text-sm font-semibold text-left text-tertiary-800 dark:text-tertiary-200 hover:underline"
										on:click={() => loadSchema(schemaDetails.id)}
									>
										{schemaDetails.title}
									</button>
									{#if schemaDetails.is_archived}
										<span
											class="px-1.5 py-0.5 text-xs rounded-full bg-surface-300 dark:bg-surface-600 text-surface-700 dark:text-surface-200"
										>
											Archived v{schemaDetails.version}
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Author</span>
							<span class="text-sm font-semibold text-tertiary-800 dark:text-tertiary-200">
								{selectedItem?.author_name}
							</span>
						</div>

						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Variation</span>
							<span class="font-mono text-sm text-tertiary-800 dark:text-tertiary-200">
								{selectedItem.variation}
							</span>
						</div>

						<div class="flex flex-col">
							<span class="text-xs text-surface-500 dark:text-surface-400">Created</span>
							<span class="text-sm text-tertiary-800 dark:text-tertiary-200">
								{new Date(selectedItem.created_at).toLocaleString()}
							</span>
						</div>
					</div>

					<!-- Add this after the metadata grid and before the Properties section -->
					<div class="flex flex-col h-full">
						<!-- Add tabs -->
						<div class="mb-4 border-b border-surface-300-600-token">
							<div class="flex">
								<button
									class="px-4 py-2 text-sm font-medium {contentTab === 'properties'
										? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
										: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'}"
									on:click={() => (contentTab = 'properties')}
								>
									Properties
								</button>
								<button
									class="px-4 py-2 text-sm font-medium {contentTab === 'json'
										? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
										: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'}"
									on:click={() => (contentTab = 'json')}
								>
									JSON
								</button>
							</div>
						</div>

						<!-- Save button -->
						<div class="flex justify-end mb-4">
							{#if hasChanges}
								<button
									class="px-4 py-2 text-white rounded-lg bg-success-500 hover:bg-success-600"
									on:click={saveChanges}
								>
									Save
								</button>
							{/if}
						</div>

						<!-- Tab content -->
						<div class="flex-1">
							{#if contentTab === 'properties'}
								<div class="h-[calc(100vh-400px)] overflow-y-auto">
									<Properties
										properties={selectedItem?.json}
										{expandedProperties}
										on:toggleProperty={handleToggleProperty}
										on:valueChange={handleValueChange}
									/>
								</div>
							{:else}
								<div class="h-[calc(100vh-400px)] overflow-y-auto">
									<JsonEditor
										json={selectedItem?.json}
										on:save={({ detail }) => {
											editedJson = detail.json;
											saveChanges();
										}}
										on:change={({ detail }) => {
											if (detail.isValid) {
												editedJson = detail.json;
												hasChanges = true;
											}
										}}
									/>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<p class="text-xl text-center">Select an item from the list to view details</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Right aside for versions and variations -->
	<aside class="border-l w-80 border-surface-300-600-token bg-surface-100 dark:bg-surface-800">
		<!-- Tabs -->
		<div class="border-b border-surface-300-600-token">
			<div class="flex">
				<button
					class="px-4 py-2 text-sm font-medium {activeTab === 'versions'
						? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
						: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'}"
					on:click={() => (activeTab = 'versions')}
				>
					Versions
				</button>
				<button
					class="px-4 py-2 text-sm font-medium {activeTab === 'variations'
						? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
						: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'}"
					on:click={() => (activeTab = 'variations')}
				>
					Variations
				</button>
			</div>
		</div>

		<!-- Tab content -->
		<div class="p-4">
			{#if activeTab === 'versions'}
				<!-- Versions list -->
				<div class="space-y-2">
					{#if selectedItem}
						{#each getAllVersions(selectedItem).sort((a, b) => b.version - a.version) as version}
							<button
								class="w-full p-2 text-left rounded-lg {version.id === selectedItem.id
									? 'bg-surface-200 dark:bg-surface-700'
									: 'hover:bg-surface-100 dark:hover:bg-surface-800'}"
								on:click={() => {
									selectedItem = version;
									expandedProperties = [];
								}}
							>
								<div class="flex items-center justify-between">
									<div>
										<span class="text-sm font-semibold">Version {version.version}</span>
										<div class="text-xs text-surface-600 dark:text-surface-300">
											{new Date(version.created_at).toLocaleString()}
										</div>
										<div class="mt-1 text-xs text-surface-500 dark:text-surface-400">
											by {version.author_name}
										</div>
									</div>
									{#if version.id === selectedItem.id}
										<span class="text-xs text-surface-600 dark:text-surface-300">(viewing)</span>
									{/if}
								</div>
							</button>
						{/each}
					{:else}
						<p class="text-sm text-surface-500 dark:text-surface-400">
							Select an item to view its versions
						</p>
					{/if}
				</div>
			{:else}
				<!-- Variations list (placeholder for now) -->
				<div class="p-4 text-sm text-surface-600 dark:text-surface-400">
					Variations coming soon...
				</div>
			{/if}
		</div>
	</aside>
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
							pattern="[\w-]+"
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
								pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+"
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

<!-- Add the modal for creating objects -->
{#if showCreateObjectModal && selectedItem}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl p-6 rounded-lg bg-surface-100 dark:bg-surface-800">
			<h2 class="mb-4 text-xl font-semibold">Create {selectedItem.json.title}</h2>

			<SchemaForm
				schema={selectedItem.json}
				on:submit={handleCreateObject}
				on:cancel={closeCreateObjectModal}
			/>
		</div>
	</div>
{/if}

<style lang="postcss">
	:global(.input) {
		@apply p-2 rounded border border-surface-300-600-token bg-tertiary-100 dark:bg-surface-700;
	}
	:global(.checkbox) {
		@apply w-4 h-4 rounded border border-surface-300-600-token;
	}
</style>
