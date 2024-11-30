export const view = {
    id: 'HelloEarth',
    layout: {
        areas: `
			"main"
		`,
        overflow: 'auto'
    },
    children: [
        {
            id: 'xyz1',
            component: 'Episodes',
            slot: 'main',
        }
    ]
}