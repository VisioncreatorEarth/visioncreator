<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { createComposerStore, getComposerStore } from '$lib/composables/composerStores';
	import { coreServices } from '$lib/composables/services';
	import Composer from './Composer.svelte';
	import { createQuery } from '../../lib/wundergraph';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { Me } from '$lib/stores';
	import { get } from 'svelte/store';
	import { eventBus } from '$lib/composables/eventBus';
	import { setupEventMapper } from '$lib/composables/eventMapper';
	import QueryStateWrapper from './QueryStateWrapper.svelte';

	interface IComposerLayout {
		areas?: string;
		columns?: string;
		rows?: string;
		gap?: string;
		style?: string;
		overflow?: 'hidden' | 'auto';
	}

	interface IComposer {
		id: string;
		layout?: IComposerLayout;
		component?: string;
		slot?: string;
		children?: IComposer[];
		data?: Record<string, any>;
		map?: any;
	}

	export let composer: IComposer;
	export let showSpacer = true;

	let queryClient;

	let layoutStyle = '';
	let unsubscribers = [];

	$: {
		layoutStyle = computeLayoutStyle(composer?.layout);
		loadComponentAndInitializeState(composer);
		if (composer?.children) {
			composer.children.forEach((child) => {
				loadComponentAndInitializeState(child);
			});
		}
	}

	onMount(() => {
		setupEventMapper();
	});

	async function loadComponentAndInitializeState(component: IComposer) {
		if (!component || !component.component) return null;

		const currentUserId = get(Me).id;

		if (component.id) {
			component.store = createComposerStore(component.id, component.store || {});
		}

		// Initialize query
		if (component.map) {
			const queryInstance = createQuery({
				operationName: 'queryComposer',
				input: {
					id: currentUserId,
					map: component.map
				},
				liveQuery: true
			});
			getComposerStore(component.id).update((storeValue) => ({
				...storeValue,
				query: queryInstance
			}));
		}

		getComposerStore(component.id).update((storeValue) => ({
			...storeValue,
			id: component.id,
			do: {
				core: coreServices,
				emit: (event: string, ...args: any[]) => eventBus.emit(event, component.id, ...args)
			},
			data: component.data || {}
		}));

		if (component.children) {
			component.children.forEach(loadComponentAndInitializeState);
		}

		// Return the QueryStateWrapper component
		return QueryStateWrapper;
	}

	function computeLayoutStyle(layout?: IComposerLayout): string {
		if (!layout) return '';

		return `
            grid-template-areas: ${layout.areas};
            ${layout.gap ? `gap: ${layout.gap};` : ''}
            ${layout.columns ? `grid-template-columns: ${layout.columns};` : ''}
            ${layout.rows ? `grid-template-rows: ${layout.rows};` : ''}
        `;
	}

	onDestroy(() => {
		unsubscribers.forEach((unsub) => unsub());
	});
</script>

<QueryClientProvider client={queryClient}>
	<div
		class={`grid w-full h-full @container ${
			composer?.layout?.overflow ? `overflow-${composer.layout.overflow}` : ''
		} ${composer?.layout?.style || ''}`}
		style={layoutStyle}
	>
		{#await loadComponentAndInitializeState(composer) then WrappedComponent}
			{#if WrappedComponent}
				<svelte:component
					this={WrappedComponent}
					me={getComposerStore(composer.id)}
					ChildComponent={composer.component}
				/>
			{/if}
		{/await}
		{#if composer?.children}
			{#each composer.children as child (child.id)}
				<div
					class={`grid w-full h-full @container ${
						child.layout?.overflow ? `overflow-${child.layout.overflow}` : ''
					} ${child.layout?.style || ''}`}
					style={`grid-area: ${child.slot};`}
				>
					{#await loadComponentAndInitializeState(child) then WrappedChildComponent}
						{#if WrappedChildComponent}
							<svelte:component
								this={WrappedChildComponent}
								me={getComposerStore(child.id)}
								ChildComponent={child.component}
							/>
							{#if child.children && child.children.length}
								<Composer composer={child} />
							{/if}
						{/if}
					{/await}
				</div>
			{/each}
		{/if}
		{#if showSpacer}
			<div class="composer-spacer" />
		{/if}
	</div>
</QueryClientProvider>

<style>
	.composer-spacer {
		height: 40px;
		grid-column: 1 / -1;
	}
</style>
