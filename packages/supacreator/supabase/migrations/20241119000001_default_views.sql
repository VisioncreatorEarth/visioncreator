-- Insert default ShopWithMe view
INSERT INTO views (
    version,
    is_active,
    metadata,
    render,
    state_machine,
    custom_config,
    created_by,
    updated_by
) VALUES (
    '0.0.1',
    true,
    '{"name": "ShopWithMe", "description": "AI-powered shopping assistant", "composer": "ComposeView241119"}'::jsonb,
    '{
        "id": "ShoppingListsContainer",
        "layout": {
            "gap": "1rem",
            "rows": "auto",
            "areas": "\n        \"main\"\n      ",
            "overflow": "auto"
        },
        "children": [
            {
                "id": "HominioShopWithMe",
                "slot": "main",
                "component": "HominioShopWithMe"
            }
        ]
    }'::jsonb,
    '{}'::jsonb,
    '{"spacer": true}'::jsonb,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
);
