import type { searchForWorkspaceRoot } from "vite";

export const view = {
	"metadata": {
		"id": "5b7cecca-c106-4766-ba7d-a65e1d290a7d",
		"version": "0.0.1",
		"isActive": true,
		"name": "Me",
		"description": "",
		"author": "00000000-0000-0000-0000-000000000001",
		"composer": "ComposeView241119",
		"createdAt": "2024-11-19T15:51:58.428557+00:00",
		"updatedAt": "2024-11-19T15:56:05.553994+00:00",
		"createdBy": "00000000-0000-0000-0000-000000000001",
		"updatedBy": "00000000-0000-0000-0000-000000000001"
	},
	render: {
		id: 'MePageContainer',
		layout: {
			areas: `
        "row1"
        "row2"
        "row3"
      `,
			rows: 'auto auto 1fr',
			gap: '1rem',
			overflow: 'auto',
			style: 'p-4 max-w-6xl mx-auto'
		},
		children: [
			{
				id: 'Profile',
				component: 'Profile',
				slot: 'row1',
				map: {
					avatar: {
						query: 'queryMe',
						prop: 'id'
					},
					title: {
						query: 'queryMe',
						prop: 'name'
					},
					description: 'wonderful to have you around',
					stat1: {
						query: 'queryUserStats',
						prop: 'userRank'
					},
					stat1desc: "Vision Rank",
					stat2: {
						query: 'queryUserStats',
						prop: 'suminvites'
					},
					stat2desc: "Pioneers Inspired",
				}
			},
			{
				id: 'InviteCard',
				slot: 'row2',
				component: 'InviteCard',
				map: {
					qrCodeId: {
						query: 'queryMe',
						prop: 'id'
					},
					title: "Inspire & Rise",
					subtitle: "Become one of the 1st to unlock early access",
					description: "The more fellows you inspire, the higher you rise in your rank and the faster you get invited.",
					showQrText: "Show QR Code",
					hideQrText: "Hide QR Code",
					copyLinkText: "Copy Inspire Link",
					linkCopiedText: "Link Copied!"
				}
			},
			{
				id: 'Leaderboard',
				component: 'Leaderboard',
				slot: 'row3',
				map: {
					highlightedItem: {
						query: 'queryMe',
						prop: 'id'
					},
					list: {
						query: 'queryLeaderboard',
						prop: 'profiles',
						mapProps: {
							primaryText: 'prop.name',
							identifier: 'prop.id',
							numericValue: 'prop.suminvites'
						}
					}
				}
			}
		]
	},
	"stateMachine": {},
	"customConfig": { showSpacer: true }
};
