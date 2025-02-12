<!--
HOW THIS COMPONENT WORKS:
This is a reusable aside panel that:
- Renders on the left or right side
- Pushes content on desktop/tablet (>= lg)
- Overlays content on mobile (< lg)
- Handles transitions and backdrop
- Manages z-index properly
-->

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { asidePanels } from '$lib/stores/asidePanelStore';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ProposalProfile from './ProposalProfile.svelte';

	// Add prop to determine side
	export let side: 'left' | 'right' = 'left';

	// Component mapping
	const COMPONENT_MAP = {
		ProposalProfile
	};

	// Helper to get current component based on side
	$: currentComponent = side === 'left' ? $asidePanels.left : $asidePanels.right;

	// Handle mobile redirect to modal
	$: if (browser && currentComponent && window.innerWidth < 1024) {
		goto(`/me?modal=${currentComponent}&props=${$asidePanels.props}`, { replaceState: true });
	}
</script>

<!-- Only render on desktop -->
{#if currentComponent && typeof window !== 'undefined' && window.innerWidth >= 1024}
	<div
		class="sticky top-0 z-[45] h-[100dvh] w-[280px] transition-transform duration-200 border-surface-700/50 bg-surface-900/95 backdrop-blur-sm"
		class:border-r={side === 'left'}
		class:border-l={side === 'right'}
	>
		<div class="flex flex-col w-full h-full overflow-hidden">
			<div class="flex-1 w-full overflow-y-auto">
				{#if COMPONENT_MAP[currentComponent]}
					<svelte:component this={COMPONENT_MAP[currentComponent]} {...$asidePanels.props} />
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Right Aside - Similar structure -->
{#if $asidePanels.right}
	<!-- ... similar structure for right side ... -->
{/if}
