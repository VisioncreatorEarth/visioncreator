<script lang="ts">
	import { page } from '$app/stores';
	import ComposeView from '$lib/components/ComposeView.svelte';

	// Get the component name from the URL query parameter
	$: componentName = $page.url.searchParams.get('c') || 'HelloEarth';

	// Create the view object with the dynamic component name
	$: view = {
		id: 'HelloEarth',
		layout: {
			areas: `
                "main"
            `
		},
		children: [
			{
				id: 'xyz1',
				component: componentName,
				slot: 'main'
			}
		]
	};
</script>

<ComposeView {view} />
