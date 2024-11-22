export const view = {
    "metadata": {
        "id": "b4ee55dc-b5e3-4164-b31f-40ad974fbdc8",
        "version": "0.0.2",
        "isActive": true,
        "name": "UltraVoxAdmin",
        "description": "",
        "author": "00000000-0000-0000-0000-000000000001",
        "composer": "ComposeView241119",
        "createdAt": "2024-11-22T13:39:26.846303+00:00",
        "updatedAt": "2024-11-22T13:40:23.410707+00:00",
        "createdBy": "00000000-0000-0000-0000-000000000001",
        "updatedBy": "00000000-0000-0000-0000-000000000001"
    },
    "render": {
        "id": "ShoppingListsContainer",
        "layout": {
            "gap": "1rem",
            "rows": "auto",
            "areas": "\n        \"main\"\n      ",
            "style": "p-4",
            "overflow": "hidden"
        },
        "children": [
            {
                "id": "UltraVox",
                "slot": "main",
                "component": "UltravoxDashboard"
            }
        ]
    },
    "stateMachine": {},
    "customConfig": {
        "showSpacer": false
    }
}