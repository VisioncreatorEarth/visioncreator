export let view = {
  "metadata": {
    "id": "5b7cecca-c106-4766-ba7d-a65e1d290a7d",
    "version": "0.0.1",
    "isActive": true,
    "name": "HominioShopWithMe",
    "description": "",
    "author": "00000000-0000-0000-0000-000000000001",
    "composer": "ComposeView241119",
    "createdAt": "2024-11-19T15:51:58.428557+00:00",
    "updatedAt": "2024-11-19T15:56:05.553994+00:00",
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": "00000000-0000-0000-0000-000000000001"
  },
  "render": {
    "id": "HominioShopWithMe",
    "layout": {
      "rows": "auto 1fr",
      "areas": `
        "banner"
        "main"`,
      "style": "max-w-6xl mx-auto",
      "overflow": "auto"
    },
    "children": [
      {
        "id": "Banner",
        "slot": "banner",
        "component": "Banner",
        "map": {
          "mode": "beta"
        }
      },
      {
        "id": "HominioShopWithMe",
        "slot": "main",
        "component": "HominioShopWithMe"
      }
    ]
  },
  "stateMachine": {},
  "customConfig": { "showSpacer": true }
}