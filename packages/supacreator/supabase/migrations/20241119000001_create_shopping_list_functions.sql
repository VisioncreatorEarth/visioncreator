CREATE OR REPLACE FUNCTION handle_shopping_list_update(
    p_user_id UUID,
    p_list_id UUID,
    p_list_name TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_list_id UUID;
    v_item JSONB;
    v_item_id UUID;
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Create or update shopping list
        IF p_list_id IS NULL THEN
            INSERT INTO shopping_lists (name, user_id)
            VALUES (p_list_name, p_user_id)
            RETURNING id INTO v_list_id;
        ELSE
            UPDATE shopping_lists
            SET name = p_list_name,
                updated_at = NOW()
            WHERE id = p_list_id AND user_id = p_user_id
            RETURNING id INTO v_list_id;
            
            IF v_list_id IS NULL THEN
                RAISE EXCEPTION 'Shopping list not found or unauthorized';
            END IF;
        END IF;

        -- Process each item
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            -- Create or get shopping item
            INSERT INTO shopping_items (name, category, icon, default_unit)
            VALUES (
                v_item->>'name',
                v_item->>'category',
                v_item->>'icon',
                v_item->>'default_unit'
            )
            ON CONFLICT (name, category) 
            DO UPDATE SET
                icon = EXCLUDED.icon,
                default_unit = EXCLUDED.default_unit,
                updated_at = NOW()
            RETURNING id INTO v_item_id;

            -- Add or update item in shopping list
            INSERT INTO shopping_list_items (
                shopping_list_id,
                item_id,
                quantity,
                unit
            )
            VALUES (
                v_list_id,
                v_item_id,
                (v_item->>'quantity')::decimal,
                COALESCE(v_item->>'unit', v_item->>'default_unit')
            )
            ON CONFLICT (shopping_list_id, item_id)
            DO UPDATE SET
                quantity = EXCLUDED.quantity,
                unit = EXCLUDED.unit,
                updated_at = NOW();
        END LOOP;

        -- Prepare result
        SELECT jsonb_build_object(
            'id', sl.id,
            'name', sl.name,
            'items', jsonb_agg(
                jsonb_build_object(
                    'id', sli.id,
                    'quantity', sli.quantity,
                    'unit', sli.unit,
                    'is_checked', sli.is_checked,
                    'item', jsonb_build_object(
                        'id', si.id,
                        'name', si.name,
                        'category', si.category,
                        'icon', si.icon,
                        'default_unit', si.default_unit
                    )
                )
            )
        )
        INTO v_result
        FROM shopping_lists sl
        LEFT JOIN shopping_list_items sli ON sli.shopping_list_id = sl.id
        LEFT JOIN shopping_items si ON si.id = sli.item_id
        WHERE sl.id = v_list_id
        GROUP BY sl.id;

        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$$;