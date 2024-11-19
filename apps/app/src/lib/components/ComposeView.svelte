<script lang="ts">
	import { onDestroy } from 'svelte';
	import lodash from 'lodash';
	const { isEqual } = lodash;

	interface ViewMetadata {
		id?: string;
		author?: string;
		composer?: string;
	}

	interface ViewConfig {
		metadata?: ViewMetadata;
		stateMachine?: any;
		render?: any;
		customConfig?: {
			showSpacer?: boolean;
		};
		// Old format properties
		id?: string;
		layout?: any;
		children?: any[];
	}

	export let view: ViewConfig;

	// Set default values for metadata if not provided
	$: {
		if (!view.metadata) view.metadata = {} as ViewMetadata;
		if (!view.metadata.composer) view.metadata.composer = 'ComposeView241119';
		if (!view.customConfig) view.customConfig = { showSpacer: false };
		if (view.customConfig.showSpacer === undefined) view.customConfig.showSpacer = false;
	}

	let composerInstance;
	let previousView;

	function isLegacyFormat(config: ViewConfig): boolean {
		return !config.render && (config.id !== undefined || config.layout !== undefined || config.children !== undefined);
	}

	function getComposerConfig(viewConfig: ViewConfig): any {
		if (isLegacyFormat(viewConfig)) {
			// If it's the old format, use the view config directly
			return viewConfig;
		}
		// If it's the new format, use the render property
		return viewConfig.render;
	}

	async function compose(element: HTMLElement, viewConfig: ViewConfig) {
		if (composerInstance) {
			composerInstance.$destroy();
		}
		const module = await import(`./Composer.svelte`);
		composerInstance = new module.default({
			target: element,
			props: {
				composer: getComposerConfig(viewConfig),
				showSpacer: viewConfig.customConfig?.showSpacer ?? false
			}
		});
	}

	function composeAction(element: HTMLElement, viewConfig: ViewConfig) {
		if (!isEqual(previousView, viewConfig)) {
			compose(element, viewConfig);
			previousView = { ...viewConfig };
		}
		return {
			update(viewConfig: ViewConfig) {
				if (!isEqual(previousView, viewConfig)) {
					compose(element, viewConfig);
					previousView = { ...viewConfig };
				}
			},
			destroy() {
				if (composerInstance) {
					composerInstance.$destroy();
				}
			}
		};
	}

	onDestroy(() => {
		if (composerInstance) {
			composerInstance.$destroy();
		}
	});
</script>

<div use:composeAction={view} class="grid overflow-hidden w-full h-full" />
