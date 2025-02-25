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
				<div class="flex items-center gap-1">
					{#if isSubVariation}
						<Icon icon="heroicons:arrow-right" class="w-3 h-3 text-surface-500" />
					{:else}
						<Icon icon="heroicons:document-duplicate" class="w-4 h-4 text-surface-400" />
					{/if}
					<div class="font-medium text-surface-100">{composite.title}</div>
				</div>
				<div class="flex items-center gap-1">
					{#if composite.metadata.variation_type}
						<span class="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
							{composite.metadata.variation_type}
						</span>
					{/if}
					{#if hasChildren}
						<span class="px-2 py-0.5 text-xs rounded-full bg-surface-700 text-surface-300">
							{composite.children.length}
						</span>
					{/if}
				</div>
			</div>
			<div class="flex items-center justify-between">
				<div class="text-xs text-surface-400">by {composite.author.name}</div>
				<span class="text-xs text-surface-300">
					{isSubVariation ? 'sub-variation' : 'variation'}
				</span>
			</div>
		</div>
	</button>

	<!-- Child Variations (Recursive) -->
	{#if hasChildren}
		<div class="pl-4 border-l border-surface-700 ml-4 space-y-1">
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
