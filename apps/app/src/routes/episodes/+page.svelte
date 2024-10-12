<script lang="ts">
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';

	const drawerStore = getDrawerStore();

	$: view = {
		id: 'HelloEarth',
		layout: {
			areas: `
                "main"
                "footer"
            `,
			overflow: 'auto'
		},
		children: [
			{
				id: 'xyz1',
				component: 'Episodes',
				slot: 'main'
			}
		]
	};
</script>

<ComposeView {view} />

<footer class="py-2 sm:py-2 text-white bg-surface-900">
	<div class="flex justify-between items-center px-4 sm:px-4">
		<div class="flex space-x-2 sm:space-x-4">
			<a href="/en/privacy-policy" class="text-2xs sm:text-xs">Privacy Policy - Datenschutz</a>
			<a href="/en/imprint" class="text-2xs sm:text-xs">Site Notice - Impressum</a>
		</div>
		<a href="/me" class="btn btn-sm variant-ghost-tertiary text-xs"> My Profile </a>
	</div>
</footer>

<style>
	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
	}
</style>
