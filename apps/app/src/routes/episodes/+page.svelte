<script lang="ts">
	import ComposeView from '$lib/components/ComposeView.svelte';

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

<style>
	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
	}
</style>
