<script lang="ts">
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
				component: 'Episodes',
				slot: 'main'
			}
		]
	};
</script>

<ComposeView {view} />
