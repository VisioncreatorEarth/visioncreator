export let view = {
  "metadata": {
    "id": "5b7cecca-c106-4766-ba7d-a65e1d290a7d",
    "version": "0.0.3",
    "isActive": true,
    "name": "BringMe",
    "description": "",
    "author": "00000000-0000-0000-0000-000000000001",
    "composer": "ComposeView241119",
    "createdAt": "2024-11-19T15:51:58.428557+00:00",
    "updatedAt": "2024-11-19T15:56:05.553994+00:00",
    "createdBy": "00000000-0000-0000-0000-000000000001",
    "updatedBy": "00000000-0000-0000-0000-000000000001"
  },
  "render": {
    "id": "ShoppingListsContainer",
    "layout": {
      "gap": "1rem",
      "rows": "auto",
      "areas": "\n        \"main\"\n      ",
      "style": "p-4 max-w-6xl mx-auto",
      "overflow": "auto"
    },
    "children": [
      {
        "id": "BringMe",
        "slot": "main",
        "component": "o-BringMe"
      }
    ]
  },
  "stateMachine": {},
  "customConfig": {}
}