<script lang="ts">
	const view = {
		id: 'VotingContainer',
		layout: {
			areas: `
				"main"
			`,
			rows: '1fr',
			overflow: 'auto'
		},
		children: [
			{
				id: 'ProposalsComponent',
				component: 'Proposals',
				slot: 'main'
			}
		]
	};
</script>

<ComposeView {view} />
