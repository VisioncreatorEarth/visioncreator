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
    "patch_request_id" uuid not null,
    "operation_type" text not null, -- add, remove, replace, etc.
    "path" text[] not null, -- JSON path as an array of segments
    "old_value" jsonb,
    "new_value" jsonb,
    "author" uuid not null,
    "composite_id" uuid not null,
    "content_id" uuid not null,
    "created_at" timestamptz not null default now(),
    "metadata" jsonb default '{}'::jsonb,
    "vector_clock" jsonb default '{}'::jsonb,
    -- CRDT specific columns
    "position_id" text, -- Unique position identifier for array elements (fractional index)
    "lamport_timestamp" bigint, -- Logical timestamp for operation ordering
    "site_id" uuid, -- Site identifier (usually the author)
    constraint "db_operations_pkey" primary key ("id"),
    constraint "db_operations_patch_request_fkey" foreign key ("patch_request_id") references public.patch_requests(id),
    constraint "db_operations_author_fkey" foreign key ("author") references public.profiles(id),
    constraint "db_operations_composite_id_fkey" foreign key ("composite_id") references public.composites(id),
    constraint "db_operations_content_id_fkey" foreign key ("content_id") references public.db(id)
);

-- Add CRDT-specific indexes for better performance
CREATE INDEX IF NOT EXISTS idx_db_operations_position_id ON public.db_operations(position_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_lamport_timestamp ON public.db_operations(lamport_timestamp);
CREATE INDEX IF NOT EXISTS idx_db_operations_site_id ON public.db_operations(site_id);

-- Create index on vector_clock
CREATE INDEX idx_db_operations_vector_clock ON public.db_operations USING gin (vector_clock);

-- Create content validation function
CREATE OR REPLACE FUNCTION public.validate_content_against_schema(
    p_content jsonb,
    p_schema_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_schema_data jsonb;
    v_is_meta_schema boolean := false;
BEGIN
    -- Check if schema is found in db
    SELECT json INTO v_schema_data
    FROM public.db
    WHERE id = p_schema_id;
    
    IF v_schema_data IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Schema not found',
            'details', format('Could not find schema with id %s', p_schema_id)
        );
    END IF;
    
    -- Check if this is the meta-schema (self-validating)
    IF p_schema_id = '00000000-0000-0000-0000-000000000001' THEN
        v_is_meta_schema := true;
    END IF;
    
    -- Enforce schema restrictions before validation
    v_schema_data := public.ensure_schema_restrictions(v_schema_data);
    
    -- Special case for meta-schema validation
    IF v_is_meta_schema THEN
        -- Define a simplified meta-schema to validate against
        DECLARE
            v_meta_schema jsonb := jsonb_build_object(
                'type', 'object',
                'properties', jsonb_build_object(
                    'type', jsonb_build_object(
                        'type', 'string',
                        'enum', jsonb_build_array('object', 'array', 'string', 'number', 'integer', 'boolean', 'null')
                    ),
                    'title', jsonb_build_object('type', 'string'),
                    'description', jsonb_build_object('type', 'string'),
                    'properties', jsonb_build_object(
                        'type', 'object',
                        'additionalProperties', jsonb_build_object(
                            'type', 'object',
                            'properties', jsonb_build_object(
                                'type', jsonb_build_object(
                                    'type', 'string',
                                    'enum', jsonb_build_array('object', 'array', 'string', 'number', 'integer', 'boolean', 'null')
                                ),
                                'title', jsonb_build_object('type', 'string'),
                                'description', jsonb_build_object('type', 'string'),
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
        v_additional_properties_allowed boolean := true;
        v_content_keys text[];
        v_schema_keys text[];
        v_extra_key text;
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
        
        -- Check if additionalProperties is restricted
        IF v_schema_data ? 'additionalProperties' THEN
            IF jsonb_typeof(v_schema_data->'additionalProperties') = 'boolean' THEN
                v_additional_properties_allowed := (v_schema_data->>'additionalProperties')::boolean;
            END IF;
        END IF;
        
        -- If additionalProperties is false, check that no extra properties exist
        IF NOT v_additional_properties_allowed THEN
            -- Get all keys in the content
            SELECT array_agg(key) INTO v_content_keys 
            FROM jsonb_object_keys(p_content) AS key;
            
            -- Get all keys defined in the schema
            SELECT array_agg(key) INTO v_schema_keys 
            FROM jsonb_object_keys(v_properties) AS key;
            
            -- Check for keys in content that aren't in the schema
            FOREACH v_extra_key IN ARRAY v_content_keys
            LOOP
                IF NOT v_extra_key = ANY(v_schema_keys) THEN
                    RETURN jsonb_build_object(
                        'valid', false,
                        'error', 'Additional property not allowed',
                        'details', format('Property "%s" is not defined in the schema and additionalProperties is false', v_extra_key)
                    );
                END IF;
            END LOOP;
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

-- Function for editing content with validation and versioning
CREATE OR REPLACE FUNCTION public.edit_content_with_validation(
    p_id uuid,
    p_json jsonb,
    p_user_id uuid,
    p_create_variation boolean DEFAULT false,
    p_composite_id uuid DEFAULT NULL,
    p_variation_title text DEFAULT NULL,
    p_variation_description text DEFAULT NULL,
    p_variation_type text DEFAULT 'alternative'
) RETURNS jsonb AS $$
DECLARE
    v_current_item record;
    v_schema_id uuid;
    v_schema_data jsonb;
    v_is_meta_schema boolean := false;
    v_validation_result jsonb;
    v_new_id uuid := gen_random_uuid();
    v_snapshot_id uuid := gen_random_uuid();
    v_patch_request_id uuid;
    v_composite record;
    v_new_composite_id uuid;
    v_site_id uuid;
    v_lamport_timestamp bigint;
BEGIN
    -- CRDT initialization - get site ID and timestamp (always enabled)
    v_site_id := public.get_or_create_site_id(p_user_id);
    
    -- Get latest timestamp for this site
    SELECT MAX(lamport_timestamp) INTO v_lamport_timestamp
    FROM public.db_operations
    WHERE site_id = v_site_id;
    
    v_lamport_timestamp := COALESCE(v_lamport_timestamp, 0);
    v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);

    -- Check if the current item exists
    SELECT * INTO v_current_item
    FROM public.db
    WHERE id = p_id;
    
    IF v_current_item IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', format('Content with id %s not found', p_id)
        );
    END IF;
    
    -- Get the schema ID
    v_schema_id := v_current_item.schema;
    
    -- Check if this is the meta-schema
    IF v_schema_id = '00000000-0000-0000-0000-000000000001' THEN
        v_is_meta_schema := true;
    END IF;
    
    -- Validate content against schema
    -- First check if the validate_content_against_schema function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_content_against_schema') THEN
    v_validation_result := public.validate_content_against_schema(p_json, v_schema_id);
    
    IF NOT (v_validation_result->>'valid')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Validation failed',
            'details', v_validation_result
        );
        END IF;
    END IF;
    
    -- If validation passes and create_variation is true, create a variation
    IF p_create_variation THEN
        -- If composite ID is provided, use it; otherwise find the composite that uses this content
        IF p_composite_id IS NOT NULL THEN
            SELECT * INTO v_composite
            FROM public.composites
            WHERE id = p_composite_id;
            
            IF v_composite IS NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Specified composite not found',
                    'details', format('Composite with id %s not found', p_composite_id)
                );
            END IF;
        ELSE
            SELECT * INTO v_composite
            FROM public.composites
            WHERE compose_id = p_id
            LIMIT 1;
            
            IF v_composite IS NULL THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'No composite found for this content',
                    'details', format('No composite references content with id %s', p_id)
                );
            END IF;
        END IF;
        
        -- Always use the CRDT variation creation function
        RETURN public.create_composite_with_crdt(
            COALESCE(p_variation_title, v_composite.title || ' (Variation)'),
            COALESCE(p_variation_description, 'Variation of ' || v_composite.title),
            p_json,
            p_user_id,
            v_schema_id,
            v_composite.id,
            'branch'
        );
    ELSE
        -- Normal edit (not creating a variation)
        -- Insert the new content version
        INSERT INTO public.db (
            id,
            json,
            author,
            schema,
            created_at,
            last_modified_at,
            snapshot_id
        ) VALUES (
            v_new_id,
            p_json,
            p_user_id,
            v_schema_id,
            now(),
            now(),
            v_snapshot_id
        );
        
        -- Find all composites that point to the current content version
        FOR v_composite IN 
            SELECT c.id, c.title, c.compose_id
            FROM public.composites c
            WHERE c.compose_id = p_id
        LOOP
            -- Create a patch request
            INSERT INTO public.patch_requests (
                title,
                description,
                author,
                old_version_id,
                new_version_id,
                composite_id,
                operation_type,
                status,
                metadata
            ) VALUES (
                'Edit request for ' || v_composite.title,
                'Update content for ' || v_composite.title,
                p_user_id,
                p_id,
                v_new_id,
                v_composite.id,
                'edit',
                'pending',
                jsonb_build_object(
                    'crdt_enabled', true,
                    'site_id', v_site_id,
                    'timestamp', now()
                )
            )
            RETURNING id INTO v_patch_request_id;
            
            -- Generate operations to track differences
            IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_operations_from_diff') THEN
                PERFORM public.generate_operations_from_diff(
                    v_current_item.json,
                    p_json,
                    v_patch_request_id,
                    p_user_id,
                    v_composite.id,
                    v_new_id
                );
            END IF;
        END LOOP;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Created content update successfully',
            'content_id', v_new_id,
            'snapshot_id', v_snapshot_id,
            'patch_request_id', v_patch_request_id,
            'crdt_enabled', true
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_db_operations_patch_request ON public.db_operations(patch_request_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_composite_id ON public.db_operations(composite_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_content_id ON public.db_operations(content_id);
CREATE INDEX IF NOT EXISTS idx_db_operations_author ON public.db_operations(author);
CREATE INDEX IF NOT EXISTS idx_db_operations_operation_type ON public.db_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_db_operations_path ON public.db_operations USING gin (path);

-- Drop the existing function
DROP FUNCTION IF EXISTS public.generate_operations_from_diff(jsonb, jsonb, uuid, uuid, uuid, uuid);

-- Add function to generate operations from JSON diff with improved array handling
CREATE OR REPLACE FUNCTION public.generate_operations_from_diff(
    p_old_json jsonb,
    p_new_json jsonb,
    p_patch_request_id uuid,
    p_author uuid,
    p_composite_id uuid,
    p_content_id uuid
) RETURNS void AS $$
DECLARE
    v_lamport_timestamp bigint;
    v_key text;
    v_old_keys text[];
    v_new_keys text[];
    v_old_value jsonb;
    v_new_value jsonb;
    v_array_positions jsonb := '{}'::jsonb;
    v_position_id text;
    v_prev_position_id text;
    v_next_position_id text;
    v_site_id uuid;
BEGIN
    -- Use author as site ID for this set of operations
    v_site_id := p_author;
    
    -- Get current Lamport timestamp for this site
    SELECT MAX(lamport_timestamp) INTO v_lamport_timestamp
    FROM public.db_operations
    WHERE site_id = v_site_id;
    
    -- Initialize timestamp if not found
    v_lamport_timestamp := COALESCE(v_lamport_timestamp, 0);
    v_lamport_timestamp := public.update_lamport_timestamp(v_lamport_timestamp, NULL);
    
    -- Handle null inputs
    p_old_json := COALESCE(p_old_json, '{}'::jsonb);
    p_new_json := COALESCE(p_new_json, '{}'::jsonb);
    
    -- Extract keys from both JSONs
    SELECT array_agg(key) INTO v_old_keys 
    FROM jsonb_object_keys(p_old_json) AS key;
    
    SELECT array_agg(key) INTO v_new_keys 
    FROM jsonb_object_keys(p_new_json) AS key;
    
    -- Handle potential nulls from empty objects
    v_old_keys := COALESCE(v_old_keys, ARRAY[]::text[]);
    v_new_keys := COALESCE(v_new_keys, ARRAY[]::text[]);
    
    -- Process all keys in old JSON
    FOREACH v_key IN ARRAY v_old_keys LOOP
        v_old_value := p_old_json->v_key;
        
        -- Check if key exists in new JSON
        IF (p_new_json ? v_key) THEN
        v_new_value := p_new_json->v_key;
        
            -- Check if value has changed
            IF v_old_value IS DISTINCT FROM v_new_value THEN
                -- Special handling for arrays with CRDT approach
            IF jsonb_typeof(v_old_value) = 'array' AND jsonb_typeof(v_new_value) = 'array' THEN
                    -- Step 1: Initialize array position tracking
                    v_array_positions := '{}'::jsonb;
                    
                    -- Step 2: Map existing positions and identify deleted items
                    FOR i IN 0..(jsonb_array_length(v_old_value) - 1) LOOP
                        DECLARE
                            v_item jsonb := v_old_value->i;
                            v_found boolean := false;
                            v_found_at integer;
                        BEGIN
                            -- Check if item exists in new array
                            FOR j IN 0..(jsonb_array_length(v_new_value) - 1) LOOP
                                IF v_item = v_new_value->j THEN
                                    v_found := true;
                                    v_found_at := j;
                                    EXIT;
                                END IF;
                            END LOOP;
                            
                            -- Assign position ID to this item
                            v_position_id := (i::text || '.0_' || v_site_id::text);
                            
                            -- Store position mapping
                            v_array_positions := jsonb_set(
                                v_array_positions,
                                ARRAY[i::text],
                                to_jsonb(v_position_id)
                            );
                            
                            -- If item isn't in new array, it was deleted
                            IF NOT v_found THEN
                                v_lamport_timestamp := public.update_lamport_timestamp(v_lamport_timestamp, NULL);
                                
                                    INSERT INTO public.db_operations (
                                        patch_request_id,
                                        operation_type,
                                        path,
                                        old_value,
                                        new_value,
                                        author,
                                        composite_id,
                                        content_id,
                                    metadata,
                                    position_id,
                                    lamport_timestamp,
                                    site_id,
                                    vector_clock
                                    ) VALUES (
                                        p_patch_request_id,
                                    'remove',
                                    ARRAY[v_key],
                                    v_item,
                                    NULL,
                                        p_author,
                                        p_composite_id,
                                        p_content_id,
                                        jsonb_build_object(
                                        'is_array_operation', true,
                                        'array_index', i,
                                        'property', v_key
                                    ),
                                    v_position_id,
                                    v_lamport_timestamp,
                                    v_site_id,
                                    public.update_vector_clock(NULL, p_author)
                                    );
                                END IF;
                        END;
                    END LOOP;
                    
                    -- Step 3: Identify and add new items with proper position IDs
                    FOR j IN 0..(jsonb_array_length(v_new_value) - 1) LOOP
                        DECLARE
                            v_item jsonb := v_new_value->j;
                            v_found boolean := false;
                            v_found_at integer;
                        BEGIN
                            -- Check if item exists in old array
                            FOR i IN 0..(jsonb_array_length(v_old_value) - 1) LOOP
                                IF v_item = v_old_value->i THEN
                                    v_found := true;
                                    v_found_at := i;
                                    EXIT;
                            END IF;
                        END LOOP;
                        
                            -- If item is new, add an operation with position
                            IF NOT v_found THEN
                                -- Find position - get neighbor positions
                                IF j = 0 THEN
                                    v_prev_position_id := NULL;
                                ELSE
                                    v_prev_position_id := (v_array_positions->(j-1)::text)#>>'{}';
                                END IF;
                                
                                IF j = jsonb_array_length(v_new_value) - 1 THEN
                                    v_next_position_id := NULL;
                                ELSE
                                    v_next_position_id := (v_array_positions->(j+1)::text)#>>'{}';
                        END IF;
                                
                                -- Generate position ID between neighbors
                                v_position_id := public.generate_position_id(v_prev_position_id, v_next_position_id, v_site_id);
                                
                                -- Increment timestamp for each operation
                                v_lamport_timestamp := public.update_lamport_timestamp(v_lamport_timestamp, NULL);
                            
                            INSERT INTO public.db_operations (
                                patch_request_id,
                                operation_type,
                                path,
                                old_value,
                                new_value,
                                author,
                                composite_id,
                                content_id,
                                    metadata,
                                    position_id,
                                    lamport_timestamp,
                                    site_id,
                                    vector_clock
                            ) VALUES (
                                p_patch_request_id,
                                'add',
                                    ARRAY[v_key],
                                NULL,
                                    v_item,
                                p_author,
                                p_composite_id,
                                p_content_id,
                                jsonb_build_object(
                                        'is_array_operation', true,
                                        'array_index', j,
                                    'property', v_key,
                                        'prev_position', v_prev_position_id,
                                        'next_position', v_next_position_id
                                    ),
                                    v_position_id,
                                    v_lamport_timestamp,
                                    v_site_id,
                                    public.update_vector_clock(NULL, p_author)
                                );
                            END IF;
                        END;
                    END LOOP;
                ELSIF jsonb_typeof(v_old_value) = 'object' AND jsonb_typeof(v_new_value) = 'object' THEN
                    -- For objects, recursively generate operations for nested objects
                    -- This enables deep CRDT operations
                    DECLARE
                        v_nested_path text[];
                    BEGIN
                        v_nested_path := ARRAY[v_key];
                        
                        -- Call recursively for nested objects
                        PERFORM public.generate_nested_operations_from_diff(
                            v_old_value,
                            v_new_value,
                                p_patch_request_id,
                                p_author,
                                p_composite_id,
                                p_content_id,
                            v_nested_path,
                            v_lamport_timestamp,
                            v_site_id
                        );
                    END;
                ELSE
                    -- For primitive types, just do a simple replace
                    v_lamport_timestamp := public.update_lamport_timestamp(v_lamport_timestamp, NULL);
                    
                INSERT INTO public.db_operations (
                    patch_request_id,
                    operation_type,
                    path,
                    old_value,
                    new_value,
                    author,
                    composite_id,
                    content_id,
                        metadata,
                        lamport_timestamp,
                        site_id,
                        vector_clock
                ) VALUES (
                    p_patch_request_id,
                    'replace',
                    ARRAY[v_key],
                    v_old_value,
                    v_new_value,
                    p_author,
                    p_composite_id,
                    p_content_id,
                        jsonb_build_object('property', v_key),
                        v_lamport_timestamp,
                        v_site_id,
                        public.update_vector_clock(NULL, p_author)
                );
            END IF;
            END IF;
        ELSE
            -- Key was removed
            v_lamport_timestamp := public.update_lamport_timestamp(v_lamport_timestamp, NULL);
            
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                metadata,
                lamport_timestamp,
                site_id,
                vector_clock
            ) VALUES (
                p_patch_request_id,
                'remove',
                ARRAY[v_key],
                v_old_value,
                NULL,
                p_author,
                p_composite_id,
                p_content_id,
                jsonb_build_object('property', v_key),
                v_lamport_timestamp,
                v_site_id,
                public.update_vector_clock(NULL, p_author)
            );
        END IF;
    END LOOP;
    
    -- Process keys added in new JSON
    FOREACH v_key IN ARRAY v_new_keys LOOP
        -- If key is new (not in old JSON)
        IF NOT v_key = ANY(v_old_keys) THEN
            v_new_value := p_new_json->v_key;
            v_lamport_timestamp := public.update_lamport_timestamp(v_lamport_timestamp, NULL);
                        
                        INSERT INTO public.db_operations (
                            patch_request_id,
                            operation_type,
                            path,
                            old_value,
                            new_value,
                            author,
                            composite_id,
                            content_id,
                metadata,
                lamport_timestamp,
                site_id,
                vector_clock
                ) VALUES (
                    p_patch_request_id,
                    'add',
                    ARRAY[v_key],
                    NULL,
                    v_new_value,
                    p_author,
                    p_composite_id,
                    p_content_id,
                jsonb_build_object('property', v_key),
                v_lamport_timestamp,
                v_site_id,
                public.update_vector_clock(NULL, p_author)
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

    -- Get the old version from db
    SELECT * INTO v_old_version 
    FROM public.db 
    WHERE id = p_old_version_id;

    IF v_old_version IS NULL THEN
        RAISE EXCEPTION 'Old version % not found in db', p_old_version_id;
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

-- Create apply_operations function
CREATE OR REPLACE FUNCTION public.apply_operations(
    p_base_json jsonb,
    p_operations uuid[]
) RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_operation record;
    v_property text;
    v_array_operations jsonb := '{}'::jsonb;
    v_is_array_op boolean;
    v_array jsonb;
    v_position_map jsonb;
    v_position_array text[];
    v_position_id text;
    v_array_index integer;
    v_current_array_path text[];
BEGIN
    -- Initialize result from base
    v_result := COALESCE(p_base_json, '{}'::jsonb);
    
    -- First pass: collect array operations separately and apply non-array operations
    FOR v_operation IN 
        SELECT * FROM public.db_operations
        WHERE id = ANY(p_operations)
        ORDER BY lamport_timestamp, site_id::text
    LOOP
        -- Determine if it's an array operation
        v_is_array_op := (v_operation.metadata->>'is_array_operation')::boolean;
        
        IF v_is_array_op THEN
            -- Group array operations by path
            v_property := array_to_string(v_operation.path, '.');
            
            -- Initialize array operations map for this path if not exists
            IF NOT v_array_operations ? v_property THEN
                v_array_operations := jsonb_set(
                    v_array_operations,
                    ARRAY[v_property],
                    '[]'::jsonb
                );
            END IF;
            
            -- Add this operation to the array operations for this path
            v_array_operations := jsonb_set(
                v_array_operations,
                ARRAY[v_property],
                (v_array_operations->v_property) || to_jsonb(v_operation)
            );
        ELSE
            -- Apply non-array operations in timestamp order
            v_property := array_to_string(v_operation.path, '.');
            
            CASE v_operation.operation_type
                WHEN 'add' THEN
                    -- Handle nested paths properly
                    IF array_length(v_operation.path, 1) > 1 THEN
                        -- For nested paths, ensure parent structures exist
                        v_result := jsonb_set_deep(
                            v_result, 
                            v_operation.path, 
                            v_operation.new_value,
                            TRUE  -- Create parent paths if needed
                        );
                    ELSE
                        -- Simple property add
                        v_result := jsonb_set(
                            v_result, 
                            ARRAY[v_operation.path[1]], 
                            v_operation.new_value,
                            TRUE  -- Create if doesn't exist
                        );
                    END IF;
                    
                WHEN 'remove' THEN
                    -- For nested paths, need careful handling
                    IF array_length(v_operation.path, 1) > 1 THEN
                        v_result := jsonb_remove_deep(v_result, v_operation.path);
                    ELSE
                        -- Simple property remove
                        v_result := v_result - v_operation.path[1];
                    END IF;
                    
                WHEN 'replace' THEN
                    -- Handle nested paths properly
                    IF array_length(v_operation.path, 1) > 1 THEN
                        v_result := jsonb_set_deep(
                            v_result, 
                            v_operation.path, 
                            v_operation.new_value
                        );
                    ELSE
                        -- Simple property replace
                        v_result := jsonb_set(
                            v_result, 
                            ARRAY[v_operation.path[1]], 
                            v_operation.new_value
                        );
                    END IF;
            END CASE;
        END IF;
    END LOOP;
    
    -- Second pass: process array operations path by path
    FOR v_property IN SELECT jsonb_object_keys(v_array_operations) LOOP
        -- Parse path string back to array
        v_current_array_path := string_to_array(v_property, '.');
        
        -- Get current array from result or create empty one
        v_array := jsonb_get_deep(v_result, v_current_array_path);
        IF v_array IS NULL OR jsonb_typeof(v_array) != 'array' THEN
            v_array := '[]'::jsonb;
        END IF;
        
        -- Process array operations in position order
        DECLARE
            v_value_map jsonb := '{}'::jsonb;  -- Maps position IDs to values
            v_ordered_positions text[] := '{}';
            v_result_array jsonb := '[]'::jsonb;
            v_operation_data jsonb;
            v_op_index integer;
            v_position_numeric numeric;
            v_removed_values jsonb := '[]'::jsonb;   -- Keep track of removed values
            v_original_array jsonb := v_array;       -- Store original array
            v_item jsonb;
            v_i integer;
            v_found boolean;
        BEGIN
            -- First, collect all values being explicitly added with operations
            FOR v_op_index IN 0..jsonb_array_length(v_array_operations->v_property) - 1 LOOP
                v_operation_data := v_array_operations->v_property->v_op_index;
                
                IF (v_operation_data->>'operation_type') = 'add' THEN
                    -- For add operations with position ID
                    v_position_id := v_operation_data->>'position_id';
                    
                    IF v_position_id IS NOT NULL THEN
                        -- Add position ID to ordered list and map it to value
                        v_ordered_positions := array_append(v_ordered_positions, v_position_id);
                        v_value_map := jsonb_set(
                            v_value_map,
                            ARRAY[v_position_id],
                            v_operation_data->'new_value'
                        );
                    ELSE
                        -- Fallback: simply append to array if no position ID
                        v_array := v_array || jsonb_build_array(v_operation_data->'new_value');
                    END IF;
                END IF;
            END LOOP;
            
            -- Now collect all values being explicitly removed
            FOR v_op_index IN 0..jsonb_array_length(v_array_operations->v_property) - 1 LOOP
                v_operation_data := v_array_operations->v_property->v_op_index;
                
                IF (v_operation_data->>'operation_type') = 'remove' THEN
                    -- For remove operations, get the position ID
                    v_position_id := v_operation_data->>'position_id';
                    
                    -- Remove this position ID from tracking if it exists
                    IF v_position_id IS NOT NULL THEN
                        -- Find and remove position
                        SELECT array_remove(v_ordered_positions, v_position_id) INTO v_ordered_positions;
                        
                        -- Remove from value map
                        v_value_map := v_value_map - v_position_id;
                    END IF;
                    
                    -- Also track the value being removed for later filtering
                    v_removed_values := v_removed_values || jsonb_build_array(v_operation_data->'old_value');
                END IF;
            END LOOP;
            
            -- Sort position IDs by their numeric part
            SELECT array_agg(position_id) INTO v_ordered_positions
            FROM (
                SELECT 
                    pos_id AS position_id,
                    CASE
                        WHEN position('_' IN pos_id) > 0 
                        THEN substring(pos_id, 1, position('_' IN pos_id) - 1)::numeric
                        ELSE 999999999 -- Fallback for invalid format
                    END AS numeric_part
                FROM unnest(v_ordered_positions) AS pos_id
                ORDER BY numeric_part
            ) AS sorted_positions;
            
            -- Build the result array by combining explicitly added values and filtering out removed values
            v_result_array := '[]'::jsonb;
            
            -- First add the positioned elements in order
            IF v_ordered_positions IS NOT NULL THEN
                FOREACH v_position_id IN ARRAY v_ordered_positions LOOP
                    -- Only add if position has a value
                    IF v_value_map ? v_position_id THEN
                        v_result_array := v_result_array || jsonb_build_array(v_value_map->v_position_id);
                    END IF;
                END LOOP;
            END IF;
            
            -- Then add all values from the original array that weren't explicitly removed
            IF jsonb_array_length(v_original_array) > 0 THEN
                FOR v_i IN 0..jsonb_array_length(v_original_array) - 1 LOOP
                    v_item := v_original_array->v_i;
                    v_found := FALSE;
                    
                    -- Check if this item was removed
                    FOR v_op_index IN 0..jsonb_array_length(v_removed_values) - 1 LOOP
                        IF v_item IS NOT DISTINCT FROM v_removed_values->v_op_index THEN
                            v_found := TRUE;
                            EXIT;
                        END IF;
                    END LOOP;
                    
                    -- Also check if it's already been added via a position operation
                    IF NOT v_found THEN
                        FOR v_position_id IN SELECT jsonb_object_keys(v_value_map) LOOP
                            IF v_item IS NOT DISTINCT FROM v_value_map->v_position_id THEN
                                v_found := TRUE;
                                EXIT;
                            END IF;
                        END LOOP;
                    END IF;
                    
                    -- If not removed and not already added, add it to result
                    IF NOT v_found THEN
                        v_result_array := v_result_array || jsonb_build_array(v_item);
                    END IF;
                END LOOP;
            END IF;
            
            -- Update the result with the reconstructed array
            IF array_length(v_current_array_path, 1) > 1 THEN
                v_result := jsonb_set_deep(v_result, v_current_array_path, v_result_array);
            ELSE
                v_result := jsonb_set(v_result, v_current_array_path, v_result_array);
            END IF;
        END;
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to set deeply nested JSONB values
CREATE OR REPLACE FUNCTION public.jsonb_set_deep(
    p_json jsonb,
    p_path text[],
    p_value jsonb,
    p_create_missing boolean DEFAULT false
) RETURNS jsonb AS $$
                        DECLARE
    v_result jsonb;
    v_current jsonb;
    v_sub_path text[];
    v_i integer;
                        BEGIN
    -- Handle empty or null input
    IF p_json IS NULL THEN
        IF p_create_missing THEN
            p_json := '{}'::jsonb;
        ELSE
            RETURN NULL;
        END IF;
    END IF;
    
    IF array_length(p_path, 1) <= 1 THEN
        -- Base case: simple property
        IF array_length(p_path, 1) = 1 THEN
            RETURN jsonb_set(p_json, ARRAY[p_path[1]], p_value, p_create_missing);
        ELSE
            -- No path, return original
            RETURN p_json;
                                    END IF;
    END IF;
    
    -- Recursive case: handle nested path
    v_result := p_json;
    
    -- Get current value at first level
    v_current := v_result->p_path[1];
    
    -- Create container if missing and allowed
    IF v_current IS NULL AND p_create_missing THEN
        v_current := '{}'::jsonb;
                            END IF;
    
    -- If we can't proceed, return original
    IF v_current IS NULL OR jsonb_typeof(v_current) != 'object' THEN
        IF p_create_missing THEN
            v_current := '{}'::jsonb;
        ELSE
            RETURN p_json;
        END IF;
    END IF;
    
    -- Build sub-path for recursive call
    v_sub_path := p_path;
    SELECT array_agg(v_sub_path[i]) INTO v_sub_path
    FROM generate_series(2, array_length(v_sub_path, 1)) AS i;
    
    -- Recursively set within sub-object
    v_current := jsonb_set_deep(v_current, v_sub_path, p_value, p_create_missing);
    
    -- Update the result
    v_result := jsonb_set(v_result, ARRAY[p_path[1]], v_current, p_create_missing);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to remove from deeply nested JSONB
CREATE OR REPLACE FUNCTION public.jsonb_remove_deep(
    p_json jsonb,
    p_path text[]
) RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_current jsonb;
    v_sub_path text[];
    v_i integer;
BEGIN
    -- Handle empty or null input
    IF p_json IS NULL OR array_length(p_path, 1) = 0 THEN
        RETURN p_json;
    END IF;
    
    IF array_length(p_path, 1) = 1 THEN
        -- Base case: simple property
        RETURN p_json - p_path[1];
    END IF;
    
    -- Recursive case: handle nested path
    v_result := p_json;
    
    -- Get current value at first level
    v_current := v_result->p_path[1];
    
    -- If we can't proceed, return original
    IF v_current IS NULL OR jsonb_typeof(v_current) != 'object' THEN
        RETURN p_json;
    END IF;
    
    -- Build sub-path for recursive call
    v_sub_path := p_path;
    SELECT array_agg(v_sub_path[i]) INTO v_sub_path
    FROM generate_series(2, array_length(v_sub_path, 1)) AS i;
    
    -- Recursively remove within sub-object
    v_current := jsonb_remove_deep(v_current, v_sub_path);
    
    -- Update the result
    v_result := jsonb_set(v_result, ARRAY[p_path[1]], v_current);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get deeply nested JSONB value
CREATE OR REPLACE FUNCTION public.jsonb_get_deep(
    p_json jsonb,
    p_path text[]
) RETURNS jsonb AS $$
DECLARE
    v_current jsonb;
    v_i integer;
BEGIN
    -- Handle empty or null input
    IF p_json IS NULL OR array_length(p_path, 1) = 0 THEN
        RETURN NULL;
    END IF;
    
    v_current := p_json;
    
    -- Navigate through path
    FOR v_i IN 1..array_length(p_path, 1) LOOP
        IF v_current IS NULL OR jsonb_typeof(v_current) != 'object' THEN
            RETURN NULL;
        END IF;
        v_current := v_current->p_path[v_i];
    END LOOP;
    
    RETURN v_current;
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
    
    -- Check if the item exists in db
    SELECT * INTO v_current_item
    FROM public.db
    WHERE id = p_id;
    
    IF v_current_item IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item not found',
            'details', format('Could not find content with id %s', p_id)
        );
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
    -- 2. User is not the author
    IF p_create_variation OR NOT v_is_author THEN
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
            format('Variation of %s', v_composite.title),
            format('Created by %s as a variation of composite %s', p_user_id, v_composite.id),
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
                'variation_type', 'edit_variation',
                'description', format('Created by %s as a variation of composite %s', p_user_id, v_composite.id),
                'target_composite_id', v_composite.id
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
            format('Edit variation for %s', v_composite.title),
            format('Changes made by %s to create a variation of %s', p_user_id, v_composite.title),
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
            'compositeId', v_new_composite_id,
            'contentId', v_new_content_id,
            'patchRequestId', v_patch_request_id,
            'operationsCreated', v_operations_created,
            'message', 'Created a new variation instead of editing the original content'
        );
    ELSE
        -- For content where user is the author, process the edit
        RETURN public.process_edit(p_id, v_new_json, p_user_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.process_content_update IS 'Unified function to handle content updates and variations in a single place';

-- Create or replace function to ensure additionalProperties: false is set
CREATE OR REPLACE FUNCTION public.ensure_schema_restrictions(
    p_schema_data jsonb
) RETURNS jsonb AS $$
BEGIN
    -- If additionalProperties is not specified, add it as false
    IF NOT p_schema_data ? 'additionalProperties' THEN
        p_schema_data := jsonb_set(p_schema_data, '{additionalProperties}', 'false'::jsonb);
    END IF;
    
    RETURN p_schema_data;
END;
$$ LANGUAGE plpgsql;

-- Create or replace get_content_schema to enforce schema restrictions
CREATE OR REPLACE FUNCTION public.get_content_schema(
    p_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_content record;
    v_schema_id uuid;
    v_schema_data jsonb;
BEGIN
    -- Try to find content in db
    SELECT * INTO v_content
    FROM public.db
    WHERE id = p_id;
    
    IF v_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', format('Could not find content with id %s', p_id)
        );
    END IF;
    
    -- Get schema id
    v_schema_id := v_content.schema;
    
    -- Get schema data from db
    SELECT json INTO v_schema_data
    FROM public.db
    WHERE id = v_schema_id;
    
    IF v_schema_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Schema not found',
            'details', format('Could not find schema with id %s', v_schema_id)
        );
    END IF;
    
    -- Enforce schema restrictions
    v_schema_data := public.ensure_schema_restrictions(v_schema_data);
    
    RETURN jsonb_build_object(
        'success', true,
        'schema_id', v_schema_id,
        'schema_data', v_schema_data
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to generate position ID between two positions (fractional indexing)
CREATE OR REPLACE FUNCTION public.generate_position_id(
    p_prev_position text,
    p_next_position text,
    p_site_id uuid
) RETURNS text AS $$
DECLARE
    v_prev_num numeric;
    v_next_num numeric;
    v_new_num numeric;
    v_site_string text;
    v_digits integer := 10; -- Precision for fractional indices
BEGIN
    -- Convert site ID to string
    v_site_string := p_site_id::text;
    
    -- Handle boundary cases
    IF p_prev_position IS NULL AND p_next_position IS NULL THEN
        -- First position in an empty array
        RETURN '0.5_' || v_site_string;
    ELSIF p_prev_position IS NULL THEN
        -- Insert at beginning of array
        v_next_num := substring(p_next_position, 1, position('_' in p_next_position) - 1)::numeric;
        v_new_num := v_next_num / 2;
    ELSIF p_next_position IS NULL THEN
        -- Insert at end of array
        v_prev_num := substring(p_prev_position, 1, position('_' in p_prev_position) - 1)::numeric;
        v_new_num := v_prev_num + 1;
    ELSE
        -- Insert between two elements
        v_prev_num := substring(p_prev_position, 1, position('_' in p_prev_position) - 1)::numeric;
        v_next_num := substring(p_next_position, 1, position('_' in p_next_position) - 1)::numeric;
        v_new_num := (v_prev_num + v_next_num) / 2;
    END IF;
    
    -- Format with consistent precision and add site ID to ensure uniqueness
    RETURN trim(to_char(v_new_num, 'FM999999990.9999999999')) || '_' || v_site_string;
END;
$$ LANGUAGE plpgsql;

-- Create function to update Lamport timestamp (logical clock)
CREATE OR REPLACE FUNCTION public.update_lamport_timestamp(
    p_current_timestamp bigint,
    p_received_timestamp bigint DEFAULT NULL,
    p_increment boolean DEFAULT true
) RETURNS bigint AS $$
DECLARE
    v_new_timestamp bigint;
BEGIN
    -- Set default values
    p_current_timestamp := COALESCE(p_current_timestamp, 0);
    p_received_timestamp := COALESCE(p_received_timestamp, 0);
    
    -- Lamport timestamp logic: max(local, received) + (increment ? 1 : 0)
    v_new_timestamp := GREATEST(p_current_timestamp, p_received_timestamp);
    
    IF p_increment THEN
        v_new_timestamp := v_new_timestamp + 1;
    END IF;
    
    RETURN v_new_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create a site ID for a user
DO $$ 
BEGIN
    -- Drop the existing function if it exists
    DROP FUNCTION IF EXISTS public.get_or_create_site_id(uuid);
    
    -- Check if the 2-parameter version exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_or_create_site_id' 
        AND pronargs = 2
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Create the function with one parameter
        CREATE OR REPLACE FUNCTION public.get_or_create_site_id(p_user_id uuid) 
        RETURNS uuid AS $FUNC$
        DECLARE
            v_site_id uuid;
        BEGIN
            -- Check if user already has a site ID
            SELECT site_id INTO v_site_id
            FROM public.user_site_ids
            WHERE user_id = p_user_id;
            
            -- If not, create one
            IF v_site_id IS NULL THEN
                v_site_id := gen_random_uuid();
                
                -- Create a table if it doesn't exist
                CREATE TABLE IF NOT EXISTS public.user_site_ids (
                    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
                    site_id uuid NOT NULL UNIQUE,
                    created_at timestamptz NOT NULL DEFAULT now()
                );
                
                -- Insert new site ID
                INSERT INTO public.user_site_ids (user_id, site_id)
                VALUES (p_user_id, v_site_id);
            END IF;
            
            RETURN v_site_id;
        END;
        $FUNC$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Function for generating operations for nested objects
CREATE OR REPLACE FUNCTION public.generate_nested_operations_from_diff(
    p_old_json jsonb,
    p_new_json jsonb,
    p_patch_request_id uuid,
    p_author uuid,
    p_composite_id uuid,
    p_content_id uuid,
    p_parent_path text[],
    p_current_timestamp bigint,
    p_site_id uuid
) RETURNS bigint AS $$
DECLARE
    v_lamport_timestamp bigint := p_current_timestamp;
    v_key text;
    v_old_keys text[];
    v_new_keys text[];
    v_old_value jsonb;
    v_new_value jsonb;
    v_array_positions jsonb := '{}'::jsonb;
    v_position_id text;
    v_prev_position_id text;
    v_next_position_id text;
    v_nested_path text[];
    v_old_item_id text;
    v_new_item_id text;
    v_found_match boolean;
    v_matched_index integer;
BEGIN
    -- Extract keys from both JSONs
    SELECT array_agg(key) INTO v_old_keys 
    FROM jsonb_object_keys(p_old_json) AS key;
    
    SELECT array_agg(key) INTO v_new_keys 
    FROM jsonb_object_keys(p_new_json) AS key;
    
    -- Handle potential nulls from empty objects
    v_old_keys := COALESCE(v_old_keys, ARRAY[]::text[]);
    v_new_keys := COALESCE(v_new_keys, ARRAY[]::text[]);
    
    -- Process all keys in old JSON
    FOREACH v_key IN ARRAY v_old_keys LOOP
        v_old_value := p_old_json->v_key;
        
        -- Check if key exists in new JSON
        IF (p_new_json ? v_key) THEN
            v_new_value := p_new_json->v_key;
            
            -- Check if value has changed
            IF v_old_value IS DISTINCT FROM v_new_value THEN
                -- Special handling for arrays with CRDT approach
                IF jsonb_typeof(v_old_value) = 'array' AND jsonb_typeof(v_new_value) = 'array' THEN
                    -- Step 1: Initialize array position tracking
                    v_array_positions := '{}'::jsonb;
                    
                    -- Step 2: Map existing positions and identify deleted items
                    FOR i IN 0..(jsonb_array_length(v_old_value) - 1) LOOP
                        DECLARE
                            v_item jsonb := v_old_value->i;
                            v_found boolean := false;
                            v_found_at integer;
                            v_matching_item jsonb;
                        BEGIN
                            -- Check if item exists in new array
                            -- For objects, we try to match by id first if available
                            v_found_match := false;
                            v_matched_index := -1;
                            
                            -- Special handling for objects - try to match by id first
                            IF jsonb_typeof(v_item) = 'object' AND v_item ? 'id' THEN
                                v_old_item_id := v_item->>'id';
                                
                                -- Look for objects with the same id in the new array
                                FOR j IN 0..(jsonb_array_length(v_new_value) - 1) LOOP
                                    IF jsonb_typeof(v_new_value->j) = 'object' AND 
                                       v_new_value->j ? 'id' AND 
                                       v_new_value->j->>'id' = v_old_item_id THEN
                                        v_found := true;
                                        v_found_at := j;
                                        v_matching_item := v_new_value->j;
                                        EXIT;
                                    END IF;
                                END LOOP;
                                
                                -- If we found a match by ID, check if it has changed
                                IF v_found AND v_item IS DISTINCT FROM v_matching_item THEN
                                    -- Generate nested operations for the matched objects
                                    -- This allows for property-level updates instead of replacing the whole object
                                    v_position_id := (i::text || '.0_' || p_site_id::text);
                                    
                                    -- Store position mapping
                                    v_array_positions := jsonb_set(
                                        v_array_positions,
                                        ARRAY[i::text],
                                        to_jsonb(v_position_id)
                                    );
                                    
                                    -- Generate a path for the nested object
                                    v_nested_path := p_parent_path || v_key || (i::text);
                                    
                                    -- Recursively generate operations for the changed object's properties
                                    v_lamport_timestamp := public.generate_nested_operations_from_diff(
                                        v_item,
                                        v_matching_item,
                                        p_patch_request_id,
                                        p_author,
                                        p_composite_id,
                                        p_content_id,
                                        v_nested_path,
                                        v_lamport_timestamp,
                                        p_site_id
                                    );
                                    
                                    -- Skip the standard comparison since we've handled this object
                                    CONTINUE;
                                END IF;
                            ELSE
                                -- For non-objects or objects without id, fall back to direct equality check
                                FOR j IN 0..(jsonb_array_length(v_new_value) - 1) LOOP
                                    IF v_item = v_new_value->j THEN
                                        v_found := true;
                                        v_found_at := j;
                                        EXIT;
                                    END IF;
                                END LOOP;
                            END IF;
                            
                            -- Assign position ID to this item
                            v_position_id := (i::text || '.0_' || p_site_id::text);
                            
                            -- Store position mapping
                            v_array_positions := jsonb_set(
                                v_array_positions,
                                ARRAY[i::text],
                                to_jsonb(v_position_id)
                            );
                            
                            -- If item isn't in new array, it was deleted
                            IF NOT v_found THEN
                                v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);
                                
                                INSERT INTO public.db_operations (
                                    patch_request_id,
                                    operation_type,
                                    path,
                                    old_value,
                                    new_value,
                                    author,
                                    composite_id,
                                    content_id,
                                    metadata,
                                    position_id,
                                    lamport_timestamp,
                                    site_id,
                                    vector_clock
                                ) VALUES (
                                    p_patch_request_id,
                                    'remove',
                                    p_parent_path || v_key,
                                    v_item,
                                    NULL,
                                    p_author,
                                    p_composite_id,
                                    p_content_id,
                                    jsonb_build_object(
                                        'is_array_operation', true,
                                        'array_index', i,
                                        'property', v_key,
                                        'path', p_parent_path || v_key
                                    ),
                                    v_position_id,
                                    v_lamport_timestamp,
                                    p_site_id,
                                    public.update_vector_clock(NULL, p_author)
                                );
                            END IF;
                        END;
                    END LOOP;
                    
                    -- Step 3: Identify and add new items with proper position IDs
                    FOR j IN 0..(jsonb_array_length(v_new_value) - 1) LOOP
                        DECLARE
                            v_item jsonb := v_new_value->j;
                            v_found boolean := false;
                            v_found_at integer;
                        BEGIN
                            -- Check if item exists in old array
                            -- For objects, we try to match by id first if available
                            IF jsonb_typeof(v_item) = 'object' AND v_item ? 'id' THEN
                                v_new_item_id := v_item->>'id';
                                
                                -- Look for objects with the same id in the old array
                                FOR i IN 0..(jsonb_array_length(v_old_value) - 1) LOOP
                                    IF jsonb_typeof(v_old_value->i) = 'object' AND 
                                       v_old_value->i ? 'id' AND 
                                       v_old_value->i->>'id' = v_new_item_id THEN
                                        v_found := true;
                                        v_found_at := i;
                                        EXIT;
                                    END IF;
                                END LOOP;
                            ELSE
                                -- For non-objects or objects without id, fall back to direct equality check
                                FOR i IN 0..(jsonb_array_length(v_old_value) - 1) LOOP
                                    IF v_item = v_old_value->i THEN
                                        v_found := true;
                                        v_found_at := i;
                                        EXIT;
                                    END IF;
                                END LOOP;
                            END IF;
                            
                            -- If item is new, add an operation with position
                            IF NOT v_found THEN
                                -- Find position - get neighbor positions
                                IF j = 0 THEN
                                    v_prev_position_id := NULL;
                                ELSE
                                    v_prev_position_id := (v_array_positions->(j-1)::text)#>>'{}';
                                END IF;
                                
                                IF j = jsonb_array_length(v_new_value) - 1 THEN
                                    v_next_position_id := NULL;
                                ELSE
                                    v_next_position_id := (v_array_positions->(j+1)::text)#>>'{}';
                                END IF;
                                
                                -- Generate position ID between neighbors
                                v_position_id := public.generate_position_id(v_prev_position_id, v_next_position_id, p_site_id);
                                
                                -- Increment timestamp for each operation
                                v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);
                                
                                INSERT INTO public.db_operations (
                                    patch_request_id,
                                    operation_type,
                                    path,
                                    old_value,
                                    new_value,
                                    author,
                                    composite_id,
                                    content_id,
                                    metadata,
                                    position_id,
                                    lamport_timestamp,
                                    site_id,
                                    vector_clock
                                ) VALUES (
                                    p_patch_request_id,
                                    'add',
                                    p_parent_path || v_key,
                                    NULL,
                                    v_item,
                                    p_author,
                                    p_composite_id,
                                    p_content_id,
                                    jsonb_build_object(
                                        'is_array_operation', true,
                                        'array_index', j,
                                        'property', v_key,
                                        'prev_position', v_prev_position_id,
                                        'next_position', v_next_position_id,
                                        'path', p_parent_path || v_key
                                    ),
                                    v_position_id,
                                    v_lamport_timestamp,
                                    p_site_id,
                                    public.update_vector_clock(NULL, p_author)
                                );
                            END IF;
                        END;
                    END LOOP;
                ELSIF jsonb_typeof(v_old_value) = 'object' AND jsonb_typeof(v_new_value) = 'object' THEN
                    -- For nested objects, recursively generate operations
                    v_nested_path := p_parent_path || v_key;
                    
                    -- Recursive call for nested objects
                    v_lamport_timestamp := public.generate_nested_operations_from_diff(
                        v_old_value,
                        v_new_value,
                        p_patch_request_id,
                        p_author,
                        p_composite_id,
                        p_content_id,
                        v_nested_path,
                        v_lamport_timestamp,
                        p_site_id
                    );
                ELSE
                    -- For primitive types, just do a simple replace
                    v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);
                    
                    INSERT INTO public.db_operations (
                        patch_request_id,
                        operation_type,
                        path,
                        old_value,
                        new_value,
                        author,
                        composite_id,
                        content_id,
                        metadata,
                        lamport_timestamp,
                        site_id,
                        vector_clock
                    ) VALUES (
                        p_patch_request_id,
                        'replace',
                        p_parent_path || v_key,
                        v_old_value,
                        v_new_value,
                        p_author,
                        p_composite_id,
                        p_content_id,
                        jsonb_build_object(
                            'property', v_key,
                            'path', p_parent_path || v_key
                        ),
                        v_lamport_timestamp,
                        p_site_id,
                        public.update_vector_clock(NULL, p_author)
                    );
                END IF;
            END IF;
        ELSE
            -- Key was removed
            v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);
            
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                metadata,
                lamport_timestamp,
                site_id,
                vector_clock
            ) VALUES (
                p_patch_request_id,
                'remove',
                p_parent_path || v_key,
                v_old_value,
                NULL,
                p_author,
                p_composite_id,
                p_content_id,
                jsonb_build_object(
                    'property', v_key,
                    'path', p_parent_path || v_key
                ),
                v_lamport_timestamp,
                p_site_id,
                public.update_vector_clock(NULL, p_author)
            );
        END IF;
    END LOOP;
    
    -- Process keys added in new JSON
    FOREACH v_key IN ARRAY v_new_keys LOOP
        -- If key is new (not in old JSON)
        IF NOT v_key = ANY(v_old_keys) THEN
            v_new_value := p_new_json->v_key;
            v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);
            
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                composite_id,
                content_id,
                metadata,
                lamport_timestamp,
                site_id,
                vector_clock
            ) VALUES (
                p_patch_request_id,
                'add',
                p_parent_path || v_key,
                NULL,
                v_new_value,
                p_author,
                p_composite_id,
                p_content_id,
                jsonb_build_object(
                    'property', v_key,
                    'path', p_parent_path || v_key
                ),
                v_lamport_timestamp,
                p_site_id,
                public.update_vector_clock(NULL, p_author)
            );
        END IF;
    END LOOP;
    
    -- Return updated timestamp
    RETURN v_lamport_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Update conflict detection function for CRDT operations
CREATE OR REPLACE FUNCTION public.detect_operation_conflicts(
    p_operations_a uuid[],
    p_operations_b uuid[]
) RETURNS TABLE(
    operation_a uuid,
    operation_b uuid,
    path text[],
    conflict_type text,
    metadata jsonb
) AS $$
BEGIN
    -- In a true CRDT system, operations don't conflict by design if they're 
    -- applied in the correct causal order according to logical timestamps
    
    -- However, we still want to detect operations that might need special handling
    RETURN QUERY
    SELECT 
        a.id as operation_a,
        b.id as operation_b,
        a.path,
        CASE
            -- Array operations with the same position_id (very unlikely but possible)
            WHEN a.position_id IS NOT NULL AND 
                 b.position_id IS NOT NULL AND 
                 a.position_id = b.position_id AND 
                 (a.metadata->>'is_array_operation')::boolean IS TRUE AND
                 (b.metadata->>'is_array_operation')::boolean IS TRUE
                 THEN 'position_id_conflict'
                 
            -- Semantic conflicts: one operation deletes what another modifies
            WHEN a.operation_type = 'remove' AND 
                 b.operation_type IN ('replace', 'add') AND
                 a.path = b.path
                 THEN 'semantic_remove_modify'
                 
            WHEN b.operation_type = 'remove' AND 
                 a.operation_type IN ('replace', 'add') AND
                 a.path = b.path
                 THEN 'semantic_modify_remove'
                 
            -- In CRDT, other concurrent modifications don't conflict
            ELSE 'no_conflict'
        END as conflict_type,
        jsonb_build_object(
            'operation_a_type', a.operation_type,
            'operation_b_type', b.operation_type,
            'a_timestamp', a.lamport_timestamp,
            'b_timestamp', b.lamport_timestamp,
            'a_site_id', a.site_id,
            'b_site_id', b.site_id,
            'resolution_strategy', 
                CASE
                    WHEN a.position_id IS NOT NULL AND 
                         b.position_id IS NOT NULL AND 
                         a.position_id = b.position_id
                         THEN 'use_lamport_timestamp'
                    WHEN a.operation_type = 'remove' AND 
                         b.operation_type IN ('replace', 'add')
                         THEN 'apply_delete_after_modify'
                    WHEN b.operation_type = 'remove' AND 
                         a.operation_type IN ('replace', 'add')
                         THEN 'apply_delete_after_modify'
                    ELSE 'no_conflict_resolution_needed'
                END
        ) as metadata
    FROM 
        public.db_operations a,
        public.db_operations b
    WHERE 
        a.id = ANY(p_operations_a) AND
        b.id = ANY(p_operations_b) AND
        a.id != b.id AND
        ((a.path = b.path) OR  -- Same exact path
         -- Or same array with same position ID (rare but possible conflict)
         (a.position_id IS NOT NULL AND 
          b.position_id IS NOT NULL AND 
          a.position_id = b.position_id))
    AND
        -- Only return actual conflicts (in CRDT, many operations don't conflict)
        (
            -- Position ID conflicts
            (a.position_id IS NOT NULL AND 
             b.position_id IS NOT NULL AND 
             a.position_id = b.position_id) OR
            
            -- Semantic conflicts like delete/modify
            (a.operation_type = 'remove' AND b.operation_type IN ('replace', 'add') AND a.path = b.path) OR
            (b.operation_type = 'remove' AND a.operation_type IN ('replace', 'add') AND a.path = b.path)
        );
END;
$$ LANGUAGE plpgsql;

-- Create a function to create a random but valid UUID
CREATE OR REPLACE FUNCTION public.get_site_id()
RETURNS uuid AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql; 