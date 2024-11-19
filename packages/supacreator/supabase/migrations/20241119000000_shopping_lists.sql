-- Create shopping items table
CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    default_unit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, category)
);

-- Create shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES shopping_items(id),
    quantity DECIMAL DEFAULT 1,
    unit TEXT,
    is_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(shopping_list_id, item_id)
);

-- Create is_service_role function
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
$$;

-- Enable RLS on all tables
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Enable all access for service role"
    ON shopping_items
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role"
    ON shopping_lists
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role"
    ON shopping_list_items
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create the shopping list update function
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
            IF p_list_name IS NULL THEN
                RAISE EXCEPTION 'List name is required when creating a new list';
            END IF;
            INSERT INTO shopping_lists (name, user_id)
            VALUES (p_list_name, p_user_id)
            RETURNING id INTO v_list_id;
        ELSE
            -- Only update name if it's provided
            IF p_list_name IS NOT NULL THEN
                UPDATE shopping_lists
                SET name = p_list_name,
                    updated_at = NOW()
                WHERE id = p_list_id AND user_id = p_user_id
                RETURNING id INTO v_list_id;
            ELSE
                -- Just verify the list exists and belongs to the user
                SELECT id INTO v_list_id
                FROM shopping_lists
                WHERE id = p_list_id AND user_id = p_user_id;
            END IF;
            
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
            'items', COALESCE(
                jsonb_agg(
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
                ) FILTER (WHERE sli.id IS NOT NULL),
                '[]'::jsonb
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

-- Create toggle function
CREATE OR REPLACE FUNCTION toggle_shopping_list_item(
    p_user_id UUID,
    p_item_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_checked BOOLEAN;
BEGIN
    UPDATE shopping_list_items sli
    SET is_checked = NOT is_checked,
        updated_at = NOW()
    FROM shopping_lists sl
    WHERE sli.id = p_item_id
    AND sli.shopping_list_id = sl.id
    AND sl.user_id = p_user_id
    RETURNING is_checked INTO v_is_checked;

    IF v_is_checked IS NULL THEN
        RAISE EXCEPTION 'Shopping list item not found or unauthorized';
    END IF;

    RETURN v_is_checked;
END;
$$;
