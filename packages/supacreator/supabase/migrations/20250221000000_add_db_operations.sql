-- Migration: Add db_operations table for granular operation tracking
-- Description: Adds support for Yjs-like operation tracking for better concurrency and conflict resolution

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_db_operation_created ON public.db_operations;
DROP FUNCTION IF EXISTS public.process_db_operations() CASCADE;
DROP TABLE IF EXISTS public.db_operations CASCADE;

-- Create db_operations table
CREATE TABLE IF NOT EXISTS "public"."db_operations" (
    "id" uuid not null default gen_random_uuid(),
    "patch_request_id" uuid,
    "operation_type" text not null,
    "path" text[] not null,
    "old_value" jsonb,
    "new_value" jsonb,
    "metadata" jsonb default '{}',
    "created_at" timestamptz not null default now(),
    "author" uuid not null,
    "composite_id" uuid not null,
    "content_id" uuid not null,
    constraint "db_operations_pkey" primary key ("id"),
    constraint "db_operations_author_fkey" foreign key ("author") references public.profiles(id),
    constraint "db_operations_composite_id_fkey" foreign key ("composite_id") references public.composites(id),
    constraint "db_operations_patch_request_fkey" foreign key ("patch_request_id") references public.patch_requests(id) on delete cascade,
    constraint "db_operations_operation_type_check" check (operation_type in ('add', 'remove', 'replace', 'move', 'copy', 'test'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_db_operations_patch_request ON public.db_operations(patch_request_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_composite_id ON public.db_operations(composite_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_content_id ON public.db_operations(content_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_author ON public.db_operations(author);
CREATE INDEX IF NOT EXISTS idx_db_operations_operation_type ON public.db_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_db_operations_path ON public.db_operations USING gin (path);

-- Add function to generate operations from JSON diff
CREATE OR REPLACE FUNCTION public.generate_operations_from_diff(
    p_old_json jsonb,
    p_new_json jsonb,
    p_patch_request_id uuid,
    p_author uuid,
    p_composite_id uuid,
    p_content_id uuid
) RETURNS void AS $$
DECLARE
    v_old_keys text[];
    v_new_keys text[];
    v_key text;
    v_old_value jsonb;
    v_new_value jsonb;
BEGIN
    -- Get all keys from both objects
    SELECT array_agg(key) INTO v_old_keys FROM jsonb_object_keys(p_old_json) AS key;
    SELECT array_agg(key) INTO v_new_keys FROM jsonb_object_keys(p_new_json) AS key;
    
    -- Handle null arrays
    v_old_keys := COALESCE(v_old_keys, ARRAY[]::text[]);
    v_new_keys := COALESCE(v_new_keys, ARRAY[]::text[]);
    
    -- Process keys in old JSON that were changed or removed
    FOREACH v_key IN ARRAY v_old_keys
    LOOP
        v_old_value := p_old_json->v_key;
        v_new_value := p_new_json->v_key;
        
        -- If key exists in both but values differ
        IF v_new_value IS NOT NULL AND v_old_value != v_new_value THEN
            -- Create a replace operation
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                metadata
            ) VALUES (
                p_patch_request_id,
                'replace',
                ARRAY[v_key],
                v_old_value,
                v_new_value,
                p_author,
                p_composite_id,
                p_content_id,
                jsonb_build_object('property', v_key)
            );
        -- If key exists in old but not in new
        ELSIF v_new_value IS NULL THEN
            -- Create a remove operation
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                metadata
            ) VALUES (
                p_patch_request_id,
                'remove',
                ARRAY[v_key],
                v_old_value,
                NULL,
                p_author,
                p_composite_id,
                p_content_id,
                jsonb_build_object('property', v_key)
            );
        END IF;
    END LOOP;
    
    -- Process keys in new JSON that were added
    FOREACH v_key IN ARRAY v_new_keys
    LOOP
        -- If key exists in new but not in old
        IF NOT v_key = ANY(v_old_keys) THEN
            -- Create an add operation
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                metadata
            ) VALUES (
                p_patch_request_id,
                'add',
                ARRAY[v_key],
                NULL,
                p_new_json->v_key,
                p_author,
                p_composite_id,
                p_content_id,
                jsonb_build_object('property', v_key)
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing function first to avoid return type issues
DROP FUNCTION IF EXISTS public.generate_patch_request(uuid, uuid);

-- Create a new version of the generate_patch_request function with operations support
CREATE FUNCTION public.generate_patch_request(
    p_old_version_id uuid,
    p_new_version_id uuid
)
RETURNS uuid AS $$
DECLARE
    v_title text;
    v_description text;
    v_composite_record record;
    v_new_version record;
    v_old_version record;
    v_existing_request record;
    v_patch_request_id uuid;
BEGIN
    -- Get the new version details
    SELECT * INTO v_new_version 
    FROM public.db 
    WHERE id = p_new_version_id;

    IF v_new_version IS NULL THEN
        RAISE EXCEPTION 'New version % not found in db', p_new_version_id;
    END IF;

    -- Try to get the old version from archive first
    SELECT * INTO v_old_version 
    FROM public.db_archive 
    WHERE id = p_old_version_id;

    -- If not in archive, it might be in active db (about to be archived)
    IF v_old_version IS NULL THEN
        SELECT * INTO v_old_version 
        FROM public.db 
        WHERE id = p_old_version_id;
    END IF;

    IF v_old_version IS NULL THEN
        RAISE EXCEPTION 'Old version % not found in either db or db_archive', p_old_version_id;
    END IF;

    -- Find all composites that reference this content version
    FOR v_composite_record IN 
        SELECT c.id, c.title, c.compose_id 
        FROM public.composites c
        WHERE c.compose_id = p_old_version_id
    LOOP
        -- Check if a patch request already exists for this composite
        SELECT * INTO v_existing_request
        FROM public.patch_requests
        WHERE composite_id = v_composite_record.id
        AND old_version_id = p_old_version_id
        AND status = 'pending';

        -- Only create a new patch request if one doesn't exist
        IF v_existing_request IS NULL THEN
            -- Generate descriptive title and description
            v_title := 'Update request for ' || v_composite_record.title;
            v_description := format(
                'Content update for %s.%s%s',
                v_composite_record.title,
                E'\n\nPrevious version: ' || p_old_version_id,
                E'\nNew version: ' || p_new_version_id
            );

            -- Create patch request
            INSERT INTO public.patch_requests (
                title,
                description,
                author,
                old_version_id,
                new_version_id,
                composite_id
            ) VALUES (
                v_title,
                v_description,
                v_new_version.author,
                p_old_version_id,
                p_new_version_id,
                v_composite_record.id
            )
            RETURNING id INTO v_patch_request_id;
            
            -- Generate operations for this patch request
            PERFORM public.generate_operations_from_diff(
                v_old_version.json,
                v_new_version.json,
                v_patch_request_id,
                v_new_version.author,
                v_composite_record.id,
                p_new_version_id
            );
        ELSE
            v_patch_request_id := v_existing_request.id;
        END IF;
    END LOOP;
    
    RETURN v_patch_request_id;
END;
$$ LANGUAGE plpgsql;

-- Add function to apply operations to a JSON object
CREATE OR REPLACE FUNCTION public.apply_operations(
    p_base_json jsonb,
    p_operations uuid[]
) RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_operation record;
BEGIN
    v_result := p_base_json;
    
    -- Apply each operation in sequence
    FOR v_operation IN 
        SELECT * FROM public.db_operations
        WHERE id = ANY(p_operations)
        ORDER BY created_at
    LOOP
        CASE v_operation.operation_type
            WHEN 'add' THEN
                v_result := jsonb_set(v_result, v_operation.path, v_operation.new_value);
            WHEN 'remove' THEN
                v_result := v_result - v_operation.path[1];
            WHEN 'replace' THEN
                v_result := jsonb_set(v_result, v_operation.path, v_operation.new_value);
            ELSE
                -- Other operation types can be implemented as needed
        END CASE;
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Add function to detect conflicts between operations
CREATE OR REPLACE FUNCTION public.detect_operation_conflicts(
    p_operations_a uuid[],
    p_operations_b uuid[]
) RETURNS TABLE(
    operation_a uuid,
    operation_b uuid,
    path text[],
    conflict_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as operation_a,
        b.id as operation_b,
        a.path,
        CASE
            WHEN a.operation_type = 'remove' AND b.operation_type != 'remove' THEN 'remove_vs_modify'
            WHEN a.operation_type != 'remove' AND b.operation_type = 'remove' THEN 'modify_vs_remove'
            WHEN a.operation_type = 'replace' AND b.operation_type = 'replace' THEN 'replace_conflict'
            ELSE 'other_conflict'
        END as conflict_type
    FROM 
        public.db_operations a,
        public.db_operations b
    WHERE 
        a.id = ANY(p_operations_a) AND
        b.id = ANY(p_operations_b) AND
        a.id != b.id AND
        a.path = b.path;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on db_operations
ALTER TABLE "public"."db_operations" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE "public"."db_operations" TO service_role;

-- RLS Policies for db_operations
CREATE POLICY "service_role_all" ON "public"."db_operations"
AS PERMISSIVE FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Update the approve_patch_request function to handle operations
CREATE OR REPLACE FUNCTION public.approve_patch_request(p_patch_request_id uuid)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
    v_composite "public"."composites";
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;

    -- Update the composite to point to the new version
    UPDATE public.composites
    SET compose_id = v_patch_request.new_version_id,
        updated_at = now()
    WHERE id = v_patch_request.composite_id
    RETURNING * INTO v_composite;

    -- Update the patch request status
    UPDATE public.patch_requests
    SET status = 'approved',
        updated_at = now()
    WHERE id = p_patch_request_id
    RETURNING * INTO v_patch_request;

    RETURN v_patch_request;
END;
$$ LANGUAGE plpgsql; 