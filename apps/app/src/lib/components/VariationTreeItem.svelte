<!--
@component
VariationTreeItem.svelte - A recursive component for displaying a tree of composite variations.
This component handles:
1. Displaying a single composite item with its metadata
2. Recursively rendering child variations with proper indentation
3. Handling selection of variations
-->
<script lang="ts">
	import Icon from '@iconify/svelte';

	// Props
	export let composite: any; // The composite to display
	export let selectedCompositeId: string | null; // Currently selected composite ID
	export let onSelect: (id: string) => void; // Function to call when a composite is selected
	export let depth: number = 0; // Depth in the tree (for styling)

	// Computed properties
	$: isSelected = selectedCompositeId === composite.id;
	$: hasChildren = composite.children && composite.children.length > 0;
	$: isSubVariation = depth > 0;

	// Alternate colors for each level to make the nesting more visible
	$: depthIndicatorColor =
		depth % 4 === 0
			? 'bg-blue-600'
			: depth % 4 === 1
			? 'bg-indigo-600'
			: depth % 4 === 2
			? 'bg-violet-600'
			: 'bg-pink-600';

	// Format relationship type for display
	$: relationshipLabel = composite.relationshipType
		? composite.relationshipType.replace('_', ' ')
		: isSubVariation
		? 'variation_of'
		: 'variation';

	// Format depth badge - show numeric depth for deeper nesting
	$: depthBadge =
		depth > 2
			? `depth-${depth}`
			: depth === 2
			? 'sub-sub-variation'
			: depth === 1
			? 'sub-variation'
			: 'variation';
</script>

<div class="space-y-1 {depth > 0 ? 'mt-1' : ''}">
	<!-- Composite Item Button -->
	<button
		class="w-full p-3 rounded-lg transition-colors text-left
			{isSelected
			? 'bg-surface-700 border-l-4 border-primary-500'
			: 'bg-surface-900 hover:bg-surface-700'}"
		on:click={() => onSelect(composite.id)}
	>
		<div class="flex flex-col gap-1">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1 overflow-hidden">
					<!-- Improved depth visualization -->
					{#if isSubVariation}
						<div class="flex items-center mr-1.5 shrink-0">
							{#each Array(depth) as _, i}
								<span
									class="h-3 w-1.5 rounded-sm mx-0.5 {i === depth - 1
										? depthIndicatorColor
										: 'bg-surface-700/50'}"
								/>
							{/each}
						</div>
						<Icon icon="heroicons:arrow-right" class="w-3 h-3 text-surface-500 shrink-0" />
					{:else}
						<Icon icon="heroicons:document-duplicate" class="w-4 h-4 text-surface-400 shrink-0" />
					{/if}
					<div class="font-medium text-surface-100 truncate max-w-[200px]">{composite.title}</div>
				</div>
				<div class="flex items-center gap-1 ml-2 shrink-0">
					<!-- Display variation type if available -->
					{#if composite.metadata && composite.metadata.variation_type}
						<span class="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
							{composite.metadata.variation_type}
						</span>
					{/if}
					<!-- Display number of children if any -->
					{#if hasChildren}
						<span class="px-2 py-0.5 text-xs rounded-full bg-surface-700 text-surface-300">
							{composite.children.length}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex items-center justify-between">
				<div class="text-xs text-surface-400 truncate max-w-[150px]">
					by {composite.author?.name || 'Unknown'}
				</div>
				<!-- Improved relationship and depth badges -->
				<div class="flex gap-1 items-center">
					<!-- Only show relationship type for non-top-level items -->
					{#if isSubVariation && composite.relationshipType}
						<span class="text-xs text-surface-400">
							({relationshipLabel})
						</span>
					{/if}
					<!-- Show depth badge with color based on depth -->
					<span
						class="text-xs px-2 py-0.5 rounded-full {depthIndicatorColor} bg-opacity-20 text-surface-300"
					>
						{depthBadge}
					</span>
				</div>
			</div>
		</div>
	</button>

	<!-- Child Variations (Recursive) -->
	{#if hasChildren}
		<div class="pl-4 border-l border-dashed border-surface-700 ml-4 space-y-1">
			{#each composite.children as childComposite}
				<svelte:self
					composite={childComposite}
					{selectedCompositeId}
					{onSelect}
					depth={depth + 1}
				/>
			{/each}
		</div>
	{/if}
</div>
