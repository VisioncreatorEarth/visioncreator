-- Migration: Add db_operations table for granular operation tracking
-- Description: Adds support for Yjs-like operation tracking for better concurrency and conflict resolution

-- Drop existing objects if they exist, but check if tables exist first
DO $$
BEGIN
    -- Check if the tables exist before trying to drop triggers
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'db_operations') THEN
        DROP TRIGGER IF EXISTS on_db_operation_created ON public.db_operations;
    END IF;
    
    -- Drop functions regardless of table existence
    DROP FUNCTION IF EXISTS public.process_db_operations() CASCADE;
    DROP FUNCTION IF EXISTS public.validate_content_against_schema() CASCADE;
END
$$;

-- Drop the table if it exists
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
    "vector_clock" jsonb default '{}',
    constraint "db_operations_pkey" primary key ("id"),
    constraint "db_operations_author_fkey" foreign key ("author") references public.profiles(id),
    constraint "db_operations_composite_id_fkey" foreign key ("composite_id") references public.composites(id),
    constraint "db_operations_patch_request_fkey" foreign key ("patch_request_id") references public.patch_requests(id) on delete cascade,
    constraint "db_operations_operation_type_check" check (operation_type in ('add', 'remove', 'replace', 'move', 'copy', 'test'))
);

-- Create index on vector_clock
CREATE INDEX idx_db_operations_vector_clock ON public.db_operations USING gin (vector_clock);

-- Create content validation function
CREATE OR REPLACE FUNCTION public.validate_content_against_schema(
    p_content jsonb,
    p_schema_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_schema_data jsonb;
    v_schema_found boolean := false;
    v_meta_schema_id uuid := '00000000-0000-0000-0000-000000000001';
    v_meta_schema boolean := false;
    v_validation_result jsonb;
BEGIN
    -- Check if this is the meta-schema
    IF p_schema_id = v_meta_schema_id THEN
        v_meta_schema := true;
    END IF;
    
    -- Get the schema from active db
    SELECT json INTO v_schema_data
    FROM public.db
    WHERE id = p_schema_id;
    
    IF v_schema_data IS NOT NULL THEN
        v_schema_found := true;
    ELSE
        -- Try archive if not found in active
        SELECT json INTO v_schema_data
        FROM public.db_archive
        WHERE id = p_schema_id;
        
        IF v_schema_data IS NOT NULL THEN
            v_schema_found := true;
        END IF;
    END IF;
    
    IF NOT v_schema_found THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Schema not found',
            'details', format('Schema with ID %s not found in db or db_archive', p_schema_id)
        );
    END IF;
    
    -- For meta-schema validation (schemas themselves)
    IF v_meta_schema THEN
        -- Define the meta-schema inline
        DECLARE
            v_meta_schema_def jsonb := jsonb_build_object(
                'type', 'object',
                'required', ARRAY['type', 'properties'],
                'properties', jsonb_build_object(
                    'type', jsonb_build_object(
                        'type', 'string',
                        'enum', ARRAY['object']
                    ),
                    'title', jsonb_build_object('type', 'string'),
                    'description', jsonb_build_object('type', 'string'),
                    'properties', jsonb_build_object(
                        'type', 'object',
                        'additionalProperties', jsonb_build_object(
                            'type', 'object',
                            'required', ARRAY['type', 'title'],
                            'properties', jsonb_build_object(
                                'type', jsonb_build_object('type', 'string'),
                                'title', jsonb_build_object('type', 'string'),
                                'description', jsonb_build_object('type', 'string'),
                                'format', jsonb_build_object('type', 'string'),
                                'pattern', jsonb_build_object('type', 'string'),
                                'minimum', jsonb_build_object('type', 'number'),
                                'maximum', jsonb_build_object('type', 'number'),
                                'minLength', jsonb_build_object('type', 'integer', 'minimum', 0),
                                'maxLength', jsonb_build_object('type', 'integer', 'minimum', 0),
                                'required', jsonb_build_object(
                                    'oneOf', jsonb_build_array(
                                        jsonb_build_object('type', 'boolean'),
                                        jsonb_build_object(
                                            'type', 'array',
                                            'items', jsonb_build_object('type', 'string')
                                        )
                                    )
                                ),
                                'nullable', jsonb_build_object('type', 'boolean'),
                                'properties', jsonb_build_object('type', 'object'),
                                'items', jsonb_build_object('type', 'object'),
                                'errorMessage', jsonb_build_object('type', 'object'),
                                'validate', jsonb_build_object('type', 'object'),
                                'x-relation', jsonb_build_object(
                                    'type', 'object',
                                    'properties', jsonb_build_object(
                                        'schemaId', jsonb_build_object('type', 'string', 'format', 'uuid'),
                                        'type', jsonb_build_object('type', 'string', 'enum', ARRAY['single', 'multiple'])
                                    ),
                                    'required', ARRAY['schemaId']
                                )
                            )
                        )
                    ),
                    'required', jsonb_build_object(
                        'type', 'array',
                        'items', jsonb_build_object('type', 'string')
                    ),
                    'display_field', jsonb_build_object('type', 'string'),
                    'additionalProperties', jsonb_build_object('type', 'boolean')
                )
            );
        BEGIN
            -- Validate schema against meta-schema
            -- This is simplified and would need a proper JSON Schema validator in production
            IF NOT p_content ? 'type' OR p_content->>'type' != 'object' THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', 'Schema validation failed',
                    'details', 'Schema must have "type": "object"'
                );
            END IF;
            
            IF NOT p_content ? 'properties' OR jsonb_typeof(p_content->'properties') != 'object' THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', 'Schema validation failed',
                    'details', 'Schema must have "properties" as an object'
                );
            END IF;
            
            -- More validations would be implemented in a production system
            
            -- If we reach here, validation passed
            RETURN jsonb_build_object('valid', true);
        END;
    END IF;
    
    -- For regular content validation, we'd need a proper JSON Schema validator
    -- This is a simplified placeholder
    DECLARE
        v_properties jsonb;
        v_required text[];
        v_prop_name text;
        v_prop_def jsonb;
    BEGIN
        -- Basic validation
        IF jsonb_typeof(p_content) != 'object' AND v_schema_data->>'type' = 'object' THEN
            RETURN jsonb_build_object(
                'valid', false,
                'error', 'Content must be an object',
                'details', format('Content is %s but schema type is object', jsonb_typeof(p_content))
            );
        END IF;
        
        -- Get properties and required fields
        v_properties := v_schema_data->'properties';
        
        IF v_schema_data ? 'required' AND jsonb_typeof(v_schema_data->'required') = 'array' THEN
            SELECT array_agg(x) INTO v_required
            FROM jsonb_array_elements_text(v_schema_data->'required') x;
        ELSE
            v_required := ARRAY[]::text[];
        END IF;
        
        -- Check required fields
        FOR i IN 1..array_length(v_required, 1) LOOP
            IF NOT p_content ? v_required[i] THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', 'Required field missing',
                    'details', format('Required field "%s" is missing', v_required[i])
                );
            END IF;
        END LOOP;
        
        -- Check property types (simplified)
        FOR v_prop_name, v_prop_def IN SELECT * FROM jsonb_each(v_properties) LOOP
            IF p_content ? v_prop_name THEN
                -- Skip null values if nullable
                IF p_content->v_prop_name IS NULL AND (v_prop_def->'nullable')::boolean = true THEN
                    CONTINUE;
                END IF;
                
                -- Type checking (simplified)
                IF v_prop_def ? 'type' AND jsonb_typeof(p_content->v_prop_name) != v_prop_def->>'type' THEN
                    -- Special case for x-relation fields
                    IF v_prop_def ? 'x-relation' THEN
                        -- For relation fields, allow string (ID) or object
                        IF jsonb_typeof(p_content->v_prop_name) != 'string' AND 
                           jsonb_typeof(p_content->v_prop_name) != 'object' AND
                           p_content->v_prop_name IS NOT NULL THEN
                            RETURN jsonb_build_object(
                                'valid', false,
                                'error', 'Type validation failed',
                                'details', format('Field "%s" is relation but has invalid type %s', 
                                                 v_prop_name, jsonb_typeof(p_content->v_prop_name))
                            );
                        END IF;
                    ELSE
                        RETURN jsonb_build_object(
                            'valid', false,
                            'error', 'Type validation failed',
                            'details', format('Field "%s" has type %s but schema expects %s', 
                                             v_prop_name, jsonb_typeof(p_content->v_prop_name), v_prop_def->>'type')
                        );
                    END IF;
                END IF;
            END IF;
        END LOOP;
        
        -- If we reach here, validation passed
        RETURN jsonb_build_object('valid', true);
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function to edit content with validation
CREATE OR REPLACE FUNCTION public.edit_content_with_validation(
    p_id uuid,
    p_json jsonb,
    p_user_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_current_item record;
    v_schema_id uuid;
    v_validation_result jsonb;
BEGIN
    -- First, check if the item exists in active db
    SELECT * INTO v_current_item
    FROM public.db
    WHERE id = p_id;
    
    -- If not found in active db, check archive
    IF v_current_item IS NULL THEN
        SELECT * INTO v_current_item
        FROM public.db_archive
        WHERE id = p_id;
    END IF;
    
    IF v_current_item IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item not found',
            'details', format('Could not find content with id %s', p_id)
        );
    END IF;
    
    -- Get the schema ID
    v_schema_id := v_current_item.schema;
    
    -- Validate content against schema
    v_validation_result := public.validate_content_against_schema(p_json, v_schema_id);
    
    IF NOT (v_validation_result->>'valid')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Validation failed',
            'details', v_validation_result
        );
    END IF;
    
    -- If validation passes, proceed with the update
    RETURN public.handle_content_update(p_id, p_json, p_user_id);
END;
$$ LANGUAGE plpgsql;

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
CREATE OR REPLACE FUNCTION public.approve_patch_request(p_patch_request_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
    v_composite "public"."composites";
    v_composite_author uuid;
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;
    
    -- Get the composite and its author
    SELECT c.*, c.author INTO v_composite
    FROM public.composites c
    WHERE c.id = v_patch_request.composite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Composite not found for patch request';
    END IF;
    
    -- Check if the user is the author of the composite
    -- Skip this check if p_user_id is NULL (for internal calls like auto-approve)
    IF p_user_id IS NOT NULL AND p_user_id != v_composite.author THEN
        RAISE EXCEPTION 'Only the composite author can approve patch requests';
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

-- Create unified content update function that handles both direct edits and variations
CREATE OR REPLACE FUNCTION public.process_content_update(
    p_id uuid,                    -- ID of the content to update
    p_json jsonb,                 -- New content JSON
    p_user_id uuid,               -- User making the edit
    p_create_variation boolean    -- Force variation creation regardless of ownership
) RETURNS jsonb AS $$
DECLARE
    v_is_author boolean;
    v_current_item record;
    v_is_archived boolean := false;
    v_composite record;
    v_result jsonb;
    v_new_content_id uuid;
    v_patch_request_id uuid;
    v_new_composite_id uuid := null;
    v_operations_created boolean := false;
    v_new_json jsonb;
BEGIN
    -- Initialize the result
    v_result := jsonb_build_object('success', false);
    
    -- First, check if the item exists in active db
    SELECT * INTO v_current_item
    FROM public.db
    WHERE id = p_id;
    
    -- If not found in active db, check archive
    IF v_current_item IS NULL THEN
        SELECT * INTO v_current_item
        FROM public.db_archive
        WHERE id = p_id;
        
        IF v_current_item IS NOT NULL THEN
            v_is_archived := true;
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Item not found',
                'details', format('Could not find content with id %s', p_id)
            );
        END IF;
    END IF;
    
    -- Check if the current user is the author
    v_is_author := (v_current_item.author = p_user_id);
    
    -- Clean the JSON input
    v_new_json := p_json;
    -- Remove any system fields if they were accidentally included
    v_new_json := v_new_json - 'created_at';
    v_new_json := v_new_json - 'last_modified_at';
    v_new_json := v_new_json - 'author';
    v_new_json := v_new_json - 'schema';
    v_new_json := v_new_json - 'snapshot_id';

    -- Find the composite that uses this content
    SELECT * INTO v_composite
    FROM public.composites
    WHERE compose_id = p_id
    LIMIT 1;
    
    IF v_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No composite found for this content',
            'details', format('Content with id %s is not referenced by any composite', p_id)
        );
    END IF;
    
    -- Determine whether to create a variation or update directly
    -- Create variation if:
    -- 1. Explicitly requested via p_create_variation OR
    -- 2. User is not the author OR
    -- 3. Content is archived
    IF p_create_variation OR NOT v_is_author OR v_is_archived THEN
        -- Create a new content version
        v_new_content_id := gen_random_uuid();
        
        -- Insert new content
        INSERT INTO public.db (
            id,
            json,
            author,
            schema,
            created_at,
            last_modified_at,
            snapshot_id
        ) VALUES (
            v_new_content_id,
            v_new_json,
            p_user_id,
            v_current_item.schema,
            NOW(),
            NOW(),
            gen_random_uuid()
        );
        
        -- Create a new composite for this variation
        v_new_composite_id := gen_random_uuid();
        
        INSERT INTO public.composites (
            id,
            title,
            description,
            compose_id,
            author
        ) VALUES (
            v_new_composite_id,
            CASE 
                WHEN v_is_archived THEN format('Restored version of %s', v_composite.title)
                ELSE format('Variation of %s', v_composite.title)
            END,
            CASE 
                WHEN v_is_archived THEN format('Created by %s from archived content', p_user_id)
                ELSE format('Created by %s as a variation of composite %s', p_user_id, v_composite.id)
            END,
            v_new_content_id,
            p_user_id
        );
        
        -- Create relationship between new and original composite
        INSERT INTO public.composite_relationships (
            source_composite_id,
            target_composite_id,
            relationship_type,
            metadata
        ) VALUES (
            v_new_composite_id,
            v_composite.id,
            'variation_of',
            jsonb_build_object(
                'created_at', now(),
                'variation_type', CASE WHEN v_is_archived THEN 'archive_variation' ELSE 'edit_variation' END,
                'description', CASE 
                    WHEN v_is_archived THEN format('Created by %s from archived content', p_user_id)
                    ELSE format('Created by %s as a variation of composite %s', p_user_id, v_composite.id)
                END,
                'target_composite_id', v_composite.id,
                'is_from_archive', v_is_archived
            )
        );
        
        -- Create a patch request for this variation
        INSERT INTO public.patch_requests (
            title,
            description,
            author,
            old_version_id,
            new_version_id,
            composite_id,
            status
        ) VALUES (
            CASE 
                WHEN v_is_archived THEN format('Restored archive version for %s', v_composite.title)
                ELSE format('Edit variation for %s', v_composite.title)
            END,
            CASE 
                WHEN v_is_archived THEN format('Changes made by %s to restore archived content', p_user_id)
                ELSE format('Changes made by %s to create a variation of %s', p_user_id, v_composite.title)
            END,
            p_user_id,
            p_id,  -- Original content ID as old version
            v_new_content_id,
            v_new_composite_id,
            'pending'  -- Will be auto-approved if the user is the author
        )
        RETURNING id INTO v_patch_request_id;
        
        -- Generate operations for this patch request
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_operations_from_diff') THEN
            PERFORM public.generate_operations_from_diff(
                v_current_item.json,
                v_new_json,
                v_patch_request_id,
                p_user_id,
                v_new_composite_id,
                v_new_content_id
            );
            v_operations_created := true;
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'createdVariation', true,
            'fromArchive', v_is_archived,
            'compositeId', v_new_composite_id,
            'contentId', v_new_content_id,
            'patchRequestId', v_patch_request_id,
            'operationsCreated', v_operations_created,
            'message', CASE
                WHEN v_is_archived THEN 'Created a new variation from archived content'
                ELSE 'Created a new variation instead of editing the original content'
            END
        );
    ELSE
        -- For direct updates (user is author and content is not archived)
        -- Create a patch request for tracking changes
        v_new_content_id := gen_random_uuid();
        
        -- First create the new content
        INSERT INTO public.db (
            id,
            json,
            author,
            schema,
            created_at,
            last_modified_at,
            snapshot_id
        ) VALUES (
            v_new_content_id,
            v_new_json,
            p_user_id,
            v_current_item.schema,
            NOW(),
            NOW(),
            gen_random_uuid()
        );
        
        -- Create a patch request
        INSERT INTO public.patch_requests (
            title,
            description,
            author,
            old_version_id,
            new_version_id,
            composite_id,
            status
        ) VALUES (
            format('Update to %s', v_composite.title),
            format('Changes made by %s', p_user_id),
            p_user_id,
            p_id,
            v_new_content_id,
            v_composite.id,
            'pending'  -- Will be auto-approved since user is the author
        )
        RETURNING id INTO v_patch_request_id;
        
        -- Generate operations for this patch request
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_operations_from_diff') THEN
            PERFORM public.generate_operations_from_diff(
                v_current_item.json,
                v_new_json,
                v_patch_request_id,
                p_user_id,
                v_composite.id,
                v_new_content_id
            );
            v_operations_created := true;
        END IF;
        
        -- Archive the old version
        INSERT INTO public.db_archive (
            id,
            json,
            author,
            schema,
            created_at,
            archived_at,
            snapshot_id
        ) VALUES (
            v_current_item.id,
            v_current_item.json,
            v_current_item.author,
            v_current_item.schema,
            v_current_item.created_at,
            NOW(),
            v_current_item.snapshot_id
        );
        
        -- Update the composite to point to the new content
        UPDATE public.composites
        SET compose_id = v_new_content_id,
            updated_at = NOW()
        WHERE id = v_composite.id;
        
        -- Finally delete the old version from active db
        DELETE FROM public.db WHERE id = p_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'createdVariation', false,
            'compositeId', v_composite.id,
            'contentId', v_new_content_id,
            'patchRequestId', v_patch_request_id,
            'operationsCreated', v_operations_created,
            'message', 'Successfully updated content'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.process_content_update IS 'Unified function to handle content updates and variations in a single place'; 