export const view = {
	id: 'MePageContainer',
	layout: {
		areas: `
            "row1"
            "row2"
            "row3"
            "row4"
        `,
		rows: 'auto auto auto 1fr',
		gap: '1rem',
		overflow: 'auto',
		style: 'p-4 max-w-6xl mx-auto'
	},
	children: [
		{
			id: 'SubscribeToNewsletter',
			slot: 'row1',
			component: 'SubscribeToNewsletter'
		},
		{
			id: 'Profile',
			component: 'Profile',
			slot: 'row2',
			map: {
				name: 'Profile',
				title: {
					query: 'queryMe',
					input: { id: 'authID' },
					prop: 'name'
				},
				description: 'wonderful to have you around',
				invites: {
					query: 'queryUserStats',
					input: { id: 'authID' },
					prop: 'suminvites'
				},
				waitingPosition: {
					query: 'queryUserStats',
					input: { id: 'authID' },
					prop: 'userRank'
				}
			}
		},
		{
			id: 'InviteCard',
			slot: 'row3',
			component: 'InviteCard'
		},
		{
			id: 'Leaderboard',
			component: 'Leaderboard',
			slot: 'row4',
			map: {
				list: {
					query: 'queryLeaderboard',
					prop: 'profiles',
					mapProps: {
						primaryText: 'prop.name',
						identifier: 'prop.id',
						numericValue: 'prop.suminvites'
					}
				},
				stats: [
					{
						label: 'Inspirations',
						value: 'prop.suminvites'
					},
					{
						label: 'Rank',
						value: 'prop.rank'
					}
				]
			}
		}
	]
};
