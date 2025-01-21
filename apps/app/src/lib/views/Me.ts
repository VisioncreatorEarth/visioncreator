export const view = {
	metadata: {
		id: 'dashboard-view',
		version: '0.0.1',
		isActive: true,
		name: 'Dashboard',
		description: 'Main dashboard view with invite progression',
		author: '00000000-0000-0000-0000-000000000001',
		composer: 'ComposeView241119',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		createdBy: '00000000-0000-0000-0000-000000000001',
		updatedBy: '00000000-0000-0000-0000-000000000001'
	},
	render: {
		id: 'DashboardContainer',
		layout: {
			areas: `"main"`,
			rows: '1fr',
			gap: '0',
			overflow: 'auto'
		},
		children: [
			{
				id: 'Dashboard',
				component: 'Dashboard',
				slot: 'main',
				map: {
					name: {
						query: 'queryMe',
						prop: 'name'
					}
				}
			}
		]
	}
};
