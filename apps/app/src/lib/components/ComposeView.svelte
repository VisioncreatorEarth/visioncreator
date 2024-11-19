<script lang="ts">
	import { onDestroy } from 'svelte';
	import lodash from 'lodash';
	const { isEqual } = lodash;

	export let view;

	$: {
		if (!view.metadata) view.metadata = {};
		if (!view.metadata.composer) view.metadata.composer = "ComposeView241119";
		if (!view.customConfig) view.customConfig = { showSpacer: false };
		if (view.customConfig.showSpacer === void 0) view.customConfig.showSpacer = false;
	}

	let composerInstance;
	let previousView;

	function isLegacyFormat(config) {
		return !config.render && (config.id !== void 0 || config.layout !== void 0 || config.children !== void 0);
	}

	function getComposerConfig(viewConfig) {
		if (isLegacyFormat(viewConfig)) {
			return viewConfig;
		}
		return viewConfig.render;
	}

	async function compose(element, viewConfig) {
		if (composerInstance) {
			composerInstance.$destroy();
		}
		const module = await import('./Composer.svelte');
		composerInstance = new module.default({
			target: element,
			props: {
				composer: getComposerConfig(viewConfig),
				showSpacer: viewConfig.customConfig?.showSpacer ?? false
			}
		});
	}

	function composeAction(element, viewConfig) {
		if (!isEqual(previousView, viewConfig)) {
			compose(element, viewConfig);
			previousView = { ...viewConfig };
		}

		return {
			update(viewConfig) {
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
