import type { View } from '$lib/types/view';

export const view: View = {
    id: 'Default',
    layout: {
        areas: `
			"main"
		`,
    },
    children: [
        {
            id: 'helloWorld',
            component: 'HelloEarth',
            slot: 'main',
            props: {
                title: 'Hello from Default View'
            }
        }
    ],
    metadata: {
        composer: "ComposeView241119"
    },
    customConfig: {
        showSpacer: false
    }
};