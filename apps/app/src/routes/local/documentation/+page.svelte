<!--
  @component
  This component displays the system documentation with a sidebar navigation
  and scrollable content area using SvelteKit and Skeleton UI
-->
<script lang="ts">
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { marked } from 'marked';
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

	$: activeDoc = $page.url.searchParams.get('doc') || 'COMPOSITES-ARCHITECTURE.md';
	$: content = data.docs[activeDoc] || data.docs['COMPOSITES-ARCHITECTURE.md'] || '';
	$: renderedContent = '';

	// Safely render markdown with error handling
	$: {
		try {
			renderedContent = content ? marked(content) : '<p>No content available</p>';
		} catch (error) {
			console.error('Error rendering markdown:', error);
			renderedContent = '<p>Error rendering content</p>';
		}
	}

	function getDisplayTitle(filename: string): string {
		return filename
			.replace('.md', '')
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}
</script>

<AppShell slotSidebarLeft="bg-surface-800" slotHeader="bg-surface-900">
	<svelte:fragment slot="header">
		<AppBar background="bg-surface-900/90 backdrop-blur-lg border-b border-surface-700">
			<h1 class="text-2xl font-bold">Documentation</h1>
		</AppBar>
	</svelte:fragment>

	<svelte:fragment slot="sidebarLeft">
		<nav class="h-full w-64 p-4 overflow-y-auto">
			<ul class="space-y-1">
				{#each Object.keys(data.docs || {}) as doc}
					<li>
						<a
							href="?doc={doc}"
							class="block px-4 py-3 rounded-lg transition-all duration-200 {activeDoc === doc
								? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500'
								: 'text-surface-200 hover:bg-surface-700/50 hover:text-primary-300'} focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-800"
						>
							{getDisplayTitle(doc)}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</svelte:fragment>

	<div class="h-[calc(100vh-64px)] overflow-hidden bg-surface-900">
		<div class="container h-full mx-auto p-4">
			<div class="prose prose-invert max-w-none h-full overflow-y-auto px-4 pb-16">
				{#if Object.keys(data.docs || {}).length === 0}
					<div class="flex items-center justify-center h-full">
						<p class="text-lg text-surface-400">No documentation files found</p>
					</div>
				{:else}
					{@html renderedContent}
				{/if}
			</div>
		</div>
	</div>
</AppShell>

<style lang="postcss">
	:global(.prose) {
		@apply text-token;
	}
	:global(.prose h1) {
		@apply text-4xl font-bold mb-8 text-primary-400;
	}
	:global(.prose h2) {
		@apply text-3xl font-semibold mb-6 text-secondary-400;
	}
	:global(.prose h3) {
		@apply text-2xl font-medium mb-4 text-tertiary-400;
	}
	:global(.prose p) {
		@apply mb-4 text-lg;
	}
	:global(.prose ul) {
		@apply list-disc list-inside mb-4 space-y-2;
	}
	:global(.prose code) {
		@apply font-mono bg-surface-700/50 px-1.5 py-0.5 rounded text-primary-300;
	}
	:global(.prose pre) {
		@apply bg-surface-800/50 backdrop-blur-sm p-4 rounded-lg overflow-x-auto border border-surface-700;
	}
	:global(.prose pre code) {
		@apply bg-transparent p-0 text-surface-200;
	}
	:global(.prose blockquote) {
		@apply border-l-4 border-primary-500/50 pl-4 italic bg-surface-800/30 py-2 rounded-r-lg;
	}
	:global(.prose a) {
		@apply text-primary-400 hover:text-primary-300 underline decoration-primary-500/30 hover:decoration-primary-500 transition-colors duration-200;
	}
	:global(.prose table) {
		@apply w-full border-collapse mb-4;
	}
	:global(.prose th, .prose td) {
		@apply border border-surface-600/50 p-2;
	}
	:global(.prose th) {
		@apply bg-surface-700/50 text-primary-300;
	}
	:global(.prose img) {
		@apply rounded-lg border border-surface-700/50 shadow-xl shadow-surface-900/50;
	}
	:global(.prose hr) {
		@apply border-surface-700/50;
	}
	:global(.prose strong) {
		@apply text-primary-300;
	}
	:global(.prose em) {
		@apply text-tertiary-300;
	}
</style>
