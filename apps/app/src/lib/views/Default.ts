export const view = {
    id: 'HelloEarth',
    layout: {
        areas: `
			"main"
		`,
    },
    children: [
        {
            id: 'xyz1',
            component: 'HelloEarth',
            slot: 'main',
        }
    ]
}