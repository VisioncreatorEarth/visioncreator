export const defaultView = {
  id: 'HelloEarth',
  layout: {
    areas: `"main"`,
    overflow: 'auto'
  },
  children: [
    {
      id: 'xyz1',
      component: 'HelloEarth',
      slot: 'main',
      map: {
        name: {
          query: 'queryMe',
          prop: 'name'
        },
        description: {
          query: 'queryMe',
          prop: 'description'
        }
      }
    }
  ]
};
