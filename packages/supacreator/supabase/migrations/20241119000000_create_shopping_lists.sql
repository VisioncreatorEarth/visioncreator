-- -- Create shopping items table
-- CREATE TABLE public.shopping_items (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     icon TEXT,
--     category TEXT NOT NULL,
--     default_unit TEXT, -- Optional default unit for the item
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
--     UNIQUE(name, category)
-- );

-- -- Create shopping lists table
-- CREATE TABLE public.shopping_lists (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     user_id UUID REFERENCES auth.users(id),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
-- );

-- -- Create shopping list items table (junction table with quantities and units)
-- CREATE TABLE public.shopping_list_items (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
--     item_id UUID REFERENCES public.shopping_items(id) ON DELETE CASCADE,
--     quantity DECIMAL, -- Made optional and changed to decimal for fractional quantities
--     unit TEXT, -- Optional unit override
--     is_checked BOOLEAN DEFAULT false,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
--     UNIQUE(shopping_list_id, item_id)
-- );

-- -- Add RLS policies
-- ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- -- Shopping items are readable by all authenticated users
-- CREATE POLICY "Shopping items are viewable by all authenticated users"
-- ON public.shopping_items FOR SELECT
-- TO authenticated
-- USING (true);

-- -- Shopping lists are only viewable by their owners
-- CREATE POLICY "Shopping lists are viewable by owner"
-- ON public.shopping_lists FOR SELECT
-- TO authenticated
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Shopping lists are insertable by owner"
-- ON public.shopping_lists FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Shopping lists are updatable by owner"
-- ON public.shopping_lists FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Shopping lists are deletable by owner"
-- ON public.shopping_lists FOR DELETE
-- TO authenticated
-- USING (auth.uid() = user_id);

-- -- Shopping list items policies
-- CREATE POLICY "Shopping list items are viewable by list owner"
-- ON public.shopping_list_items FOR SELECT
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM public.shopping_lists
--         WHERE id = shopping_list_id
--         AND user_id = auth.uid()
--     )
-- );

-- CREATE POLICY "Shopping list items are insertable by list owner"
-- ON public.shopping_list_items FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     EXISTS (
--         SELECT 1 FROM public.shopping_lists
--         WHERE id = shopping_list_id
--         AND user_id = auth.uid()
--     )
-- );

-- CREATE POLICY "Shopping list items are updatable by list owner"
-- ON public.shopping_list_items FOR UPDATE
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM public.shopping_lists
--         WHERE id = shopping_list_id
--         AND user_id = auth.uid()
--     )
-- );

-- CREATE POLICY "Shopping list items are deletable by list owner"
-- ON public.shopping_list_items FOR DELETE
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM public.shopping_lists
--         WHERE id = shopping_list_id
--         AND user_id = auth.uid()
--     )
-- );
