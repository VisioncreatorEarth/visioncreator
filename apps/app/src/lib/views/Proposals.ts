export const view = {
	metadata: {
		id: 'proposals-view',
		version: '0.0.1',
		isActive: true,
		name: 'Proposals',
		description: 'Community Proposals',
		author: '00000000-0000-0000-0000-000000000001',
		composer: 'ComposeView241119',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		createdBy: '00000000-0000-0000-0000-000000000001',
		updatedBy: '00000000-0000-0000-0000-000000000001'
	},
	render: {
		id: 'ProposalContainer',
		layout: {
			areas: `"main"`,
			rows: '1fr',
			gap: '0',
			overflow: 'auto',
			style: 'max-w-6xl mx-auto'
		},
		children: [
			{
				id: 'Proposals',
				component: 'Proposals',
				slot: 'main',
			}
		]
	},
	stateMachine: {},
	customConfig: { showSpacer: true }
};
