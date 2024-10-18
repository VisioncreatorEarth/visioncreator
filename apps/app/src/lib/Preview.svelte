<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { ComponentType } from 'svelte';

	interface ViewChild {
		id: string;
		component: string;
		slot: string;
	}

	interface View {
		children: ViewChild[];
	}

	let selectedChildren: ViewChild = { id: '', component: 'Claude', slot: 'default' };
	let view: View = { children: [selectedChildren] };

	let components = writable<{ name: string; value: string }[]>([]);

	async function loadComponentNames() {
		const componentFiles = import.meta.glob('$lib/components/*.svelte');
		const componentNames: { name: string; value: string }[] = [];
		for (const path in componentFiles) {
			const nameParts = path.split('/');
			const name = nameParts[nameParts.length - 1].replace('.svelte', '');
			if (name.startsWith('o-') || name === 'Claude') {
				componentNames.push({ name, value: name });
			}
		}
		components.set(componentNames);
	}

	onMount(() => {
		loadComponentNames();
	});

	function updateChildren(component: string, slot: string) {
		view.children = [{ ...selectedChildren, component, slot }];
	}

	let ComposeView: ComponentType;
	onMount(async () => {
		const module = await import('$lib/components/ComposeView.svelte');
		ComposeView = module.default;
	});
</script>

<div class="flex w-full h-full">
	<div class="w-48 h-full py-10 pr-5 overflow-y-scroll bg-surface-800">
		{#each $components as component}
			<button
				class="block w-full p-1 text-left hover:bg-gray-200"
				on:click={() => updateChildren(component.value, selectedChildren.slot)}
			>
				{component.name}
			</button>
		{/each}
	</div>
	<div class="w-full h-full p-4 overflow-hidden bg-surface-900">
		<div class="w-full h-full overflow-scroll rounded-2xl">
			{#if ComposeView}
				<svelte:component this={ComposeView} {view} />
			{/if}
		</div>
	</div>
</div>
