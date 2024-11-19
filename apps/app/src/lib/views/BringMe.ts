export const view = {
  id: 'BringMePageContainer',
  layout: {
    areas: `
      "row1"
      "row2"
    `,
    rows: 'auto 1fr',
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
        name: 'BringMe',
        title: {
          query: 'queryMe',
          input: { id: 'authID' },
          prop: 'name'
        },
        description: 'Manage your shopping lists'
      }
    },
    {
      id: 'BringMe',
      component: 'o-BringMe',
      slot: 'row2',
      map: {
        title: 'Shopping Lists',
        description: 'Create and manage your shopping lists',
        authID: 'authID'
      }
    }
  ]
};
