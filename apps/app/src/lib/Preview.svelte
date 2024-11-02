<script lang="ts">
	import { onMount } from 'svelte';
	import type { ComponentType } from 'svelte';
	import Icon from '@iconify/svelte';

	interface ViewChild {
		id: string;
		component: string;
		slot: string;
	}

	interface View {
		layout: {
			areas: string;
			overflow: 'auto';
		};
		children: ViewChild[];
	}

	let selectedChildren: ViewChild = {
		id: '',
		component: 'Claude',
		slot: 'main'
	};

	let view: View = {
		layout: {
			areas: `
				"main"
			`,
			overflow: 'auto'
		},
		children: [selectedChildren]
	};

	let ComposeView: ComponentType;
	onMount(async () => {
		const module = await import('$lib/components/ComposeView.svelte');
		ComposeView = module.default;
	});

	let screenWidth = '100%';
	let screenHeight = 'calc(100% - 5.5rem)';
	let isSimulatedDevice = false;
	let hasTopMargin = true;

	function setScreenSize(width: string, height: string, isPortrait: boolean) {
		screenWidth = width;
		screenHeight = isPortrait ? `calc(${height} - 0.5rem)` : height;
		isSimulatedDevice = true;
		hasTopMargin = isPortrait;
	}

	function resetScreenSize() {
		screenWidth = '100%';
		screenHeight = 'calc(100% - 5.5rem)';
		isSimulatedDevice = false;
		hasTopMargin = true;
	}
</script>

<div
	class="fixed inset-0 flex flex-col items-center overflow-hidden preview-container bg-surface-900 dark:bg-surface-950"
>
	<div
		class="flex-grow mx-2 mb-20 overflow-hidden transition-all duration-300 ease-in-out border-2 shadow-xl preview-screen bg-surface-700 dark:bg-surface-800 rounded-3xl border-surface-500 dark:border-surface-600"
		class:simulated-device={isSimulatedDevice}
		class:mt-2={hasTopMargin}
		style="width: {screenWidth}; height: {screenHeight}; max-width: calc(100% - 1rem);"
	>
		<div
			class="grid w-full h-full overflow-hidden bg-tertiary-200 dark:bg-surface-900"
			style="grid-template-areas: {view.layout.areas}"
		>
			{#if ComposeView}
				<svelte:component this={ComposeView} {view} />
			{/if}
		</div>
	</div>

	<div class="fixed flex space-x-2 screen-buttons bottom-6 left-4">
		<button
			on:click={() => setScreenSize('375px', '667px', true)}
			class="btn btn-icon variant-ghost-secondary"
			title="Mobile Portrait"
		>
			<Icon icon="system-uicons:iphone-portrait" />
		</button>
		<button
			on:click={() => setScreenSize('667px', '375px', false)}
			class="btn btn-icon variant-ghost-secondary"
			title="Mobile Landscape"
		>
			<Icon icon="system-uicons:iphone-landscape" />
		</button>
		<button
			on:click={() => setScreenSize('768px', '1024px', true)}
			class="btn btn-icon variant-ghost-secondary"
			title="Tablet Portrait"
		>
			<Icon icon="bi:tablet" />
		</button>
		<button
			on:click={() => setScreenSize('1024px', '768px', false)}
			class="btn btn-icon variant-ghost-secondary"
			title="Tablet Landscape"
		>
			<Icon icon="bi:tablet-landscape" />
		</button>
		<button on:click={resetScreenSize} class="btn btn-icon variant-ghost-secondary" title="Reset">
			<Icon icon="mdi:restore" />
		</button>
	</div>
</div>

<style>
	:global(body, html) {
		margin: 0;
		padding: 0;
		height: 100%;
		overflow: hidden;
	}

	.simulated-device {
		flex-grow: 0 !important;
		margin-top: auto !important;
	}

	@media (max-width: 640px) {
		.preview-container {
			padding: 0 !important;
		}

		.preview-screen {
			width: calc(100% - 1rem) !important;
			margin: 0.5rem !important;
			margin-bottom: 5rem !important;
		}

		.screen-buttons {
			display: none !important;
		}
	}
</style>
