<!--
  VersionsAside Component Documentation
  
  Architecture Overview:
  ---------------------
  This component handles the display and management of versions and variations
  for database items in the right sidebar.
  
  Core Features:
  1. Version Management:
     - Displays list of all versions for an item
     - Shows version numbers and timestamps
     - Allows switching between versions
  
  2. Variation Management:
     - Shows related variations of items
     - Supports navigation between variations
  
  3. Display Information:
     - Version numbers
     - Creation timestamps
     - Author information
     - Current viewing status
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

	export let selectedItem: DBItem | null = null;
	export let dbData: DBItem[] = [];

	// Event dispatcher for version changes
	const dispatch = createEventDispatcher<{
		versionSelect: { item: DBItem; expandedProperties: string[] };
	}>();

	// State for active tab
	let activeTab: 'versions' | 'variations' = 'versions';

	// Function to get all versions of an item
	function getAllVersions(item: DBItem | null): DBItem[] {
		if (!item || !dbData) return [];

		// Find the active record and its archived versions
		const activeRecord = dbData.find((record) => record.variation === item.variation);
		if (!activeRecord) return [];

		// Combine active record with archived versions and sort by version number
		const allVersions = [activeRecord, ...(activeRecord.archived_versions || [])].sort(
			(a, b) => b.version - a.version
		);

		console.log('Available versions:', allVersions); // Debug log
		return allVersions;
	}

	// Handle version selection
	function handleVersionSelect(version: DBItem) {
		console.log('Version selected:', version); // Debug log

		// Create a properly typed version object with explicit type casting
		const typedVersion = {
			id: String(version.id),
			json: version.json,
			author: String(version.author),
			author_name: String(version.author_name),
			schema: String(version.schema),
			version: Number(version.version),
			variation: String(version.variation),
			prev: version.prev ? String(version.prev) : null,
			created_at: String(version.created_at),
			is_archived: Boolean(version.is_archived),
			archived_versions: Array.isArray(version.archived_versions) ? version.archived_versions : []
		} satisfies DBItem;

		// Force a new reference by spreading
		const versionToSend = { ...typedVersion };

		dispatch('versionSelect', {
			item: versionToSend,
			expandedProperties: []
		});
	}
</script>

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
					{#each getAllVersions(selectedItem) as version}
						<!-- Make the entire button clickable and add hover effects -->
						<button
							class="w-full p-2 text-left transition-colors duration-150 rounded-lg {version.id ===
							selectedItem?.id
								? 'bg-tertiary-200 dark:bg-surface-700'
								: 'hover:bg-tertiary-100 dark:hover:bg-surface-600'}"
							on:click={() => handleVersionSelect(version)}
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
								{#if version.id === selectedItem?.id}
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
