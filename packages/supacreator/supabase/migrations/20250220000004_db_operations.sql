-- Migration: Implement JSON Patch operations with RFC 6902 standard
-- Description: Adds support for storing and applying JSON Patch operations for content editing

-- Create json_patch_operations table to store RFC 6902 operations
DROP TABLE IF EXISTS public.json_patch_operations CASCADE;

CREATE TABLE IF NOT EXISTS public.json_patch_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patch_request_id UUID NOT NULL,
    operation_type TEXT NOT NULL, -- add, remove, replace, move, copy, test as per RFC 6902
    path TEXT NOT NULL,  -- JSON path as a string (e.g., "/metadata/tags/2")
    from_path TEXT NULL, -- Used for 'move' and 'copy' operations
    value JSONB NULL,    -- Used for 'add', 'replace', 'test' operations
    old_value JSONB NULL, -- Original value before change (helpful for diffs)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT json_patch_operations_patch_request_fkey FOREIGN KEY (patch_request_id) REFERENCES public.patch_requests(id) ON DELETE CASCADE
);

-- Create indexes for the new table
CREATE INDEX idx_json_patch_operations_patch_request_id ON public.json_patch_operations(patch_request_id);
CREATE INDEX idx_json_patch_operations_operation_type ON public.json_patch_operations(operation_type);
CREATE INDEX idx_json_patch_operations_path ON public.json_patch_operations(path);

-- Drop existing functions that we will recreate with different signatures
DROP FUNCTION IF EXISTS public.approve_patch_request(uuid);
DROP FUNCTION IF EXISTS public.approve_patch_request(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_edit_request(uuid, text, uuid);
DROP FUNCTION IF EXISTS public.process_json_patch(uuid, jsonb, uuid, uuid, boolean);
DROP FUNCTION IF EXISTS public.apply_json_patch(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.get_patch_request_operations(uuid);
DROP FUNCTION IF EXISTS public.validate_json_against_schema(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.get_content_schema(uuid);
DROP FUNCTION IF EXISTS public.ensure_schema_restrictions(jsonb);

-- Function to get content schema for validation
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

-- Function to ensure additionalProperties: false is set
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

-- Function to validate JSON against a schema
CREATE OR REPLACE FUNCTION public.validate_json_against_schema(
    p_json jsonb,
    p_schema jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_type text;
    v_properties jsonb;
    v_required text[];
    v_prop_name text;
    v_prop_def jsonb;
    v_additional_properties_allowed boolean := true;
    v_content_keys text[];
    v_schema_keys text[];
    v_extra_key text;
    v_error_message text;
BEGIN
    -- Basic validation 
    IF p_json IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Content cannot be null',
            'details', 'JSON content must be provided'
        );
    END IF;
    
    IF p_schema IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Schema cannot be null',
            'details', 'JSON schema must be provided'
        );
    END IF;
    
    -- Get type from schema
    v_type := p_schema->>'type';
    
    -- Basic type validation
    IF v_type = 'object' AND jsonb_typeof(p_json) != 'object' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Type validation failed',
            'details', format('Content must be an object, but got %s', jsonb_typeof(p_json))
        );
    END IF;
    
    IF v_type = 'array' AND jsonb_typeof(p_json) != 'array' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Type validation failed',
            'details', format('Content must be an array, but got %s', jsonb_typeof(p_json))
        );
    END IF;
    
    -- For object type, validate properties
    IF v_type = 'object' THEN
        -- Get properties and required fields from schema
        v_properties := p_schema->'properties';
        
        IF p_schema ? 'required' AND jsonb_typeof(p_schema->'required') = 'array' THEN
            SELECT array_agg(x) INTO v_required
            FROM jsonb_array_elements_text(p_schema->'required') x;
        ELSE
            v_required := ARRAY[]::text[];
        END IF;
        
        -- Check if additionalProperties is restricted
        IF p_schema ? 'additionalProperties' THEN
            IF jsonb_typeof(p_schema->'additionalProperties') = 'boolean' THEN
                v_additional_properties_allowed := (p_schema->>'additionalProperties')::boolean;
            END IF;
        END IF;
        
        -- If additionalProperties is false, check that no extra properties exist
        IF NOT v_additional_properties_allowed THEN
            -- Get all keys in the content
            SELECT array_agg(key) INTO v_content_keys 
            FROM jsonb_object_keys(p_json) AS key;
            
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
            IF NOT p_json ? v_required[i] THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', 'Required field missing',
                    'details', format('Required field "%s" is missing', v_required[i])
                );
            END IF;
        END LOOP;
    END IF;
    
    -- If we reach here, validation passed
    RETURN jsonb_build_object('valid', true);
EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RETURN jsonb_build_object(
        'valid', false,
        'error', 'Schema validation error',
        'details', v_error_message
    );
END;
$$;

-- Function to store operations and create a patch request
CREATE OR REPLACE FUNCTION public.process_json_patch(
    p_content_id uuid,
    p_operations jsonb,
    p_user_id uuid,
    p_composite_id uuid DEFAULT NULL,
    p_create_variation boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_content record;
    v_new_content_id uuid := gen_random_uuid();
    v_patch_request_id uuid;
    v_composite_id uuid;
    v_composite record;
    v_new_composite_id uuid;
    v_title text;
    v_description text;
    v_variation_type text;
    v_op_count int;
BEGIN
    -- Initial logging for debugging
    RAISE NOTICE 'process_json_patch called with content_id=%, operations=%, create_variation=%', 
        p_content_id, jsonb_array_length(p_operations), p_create_variation;
        
    -- Get the operation count safely
    v_op_count := CASE WHEN p_operations IS NULL THEN 0 ELSE jsonb_array_length(p_operations) END;
    
    -- Get the current content
    SELECT * INTO v_current_content
    FROM public.db
    WHERE id = p_content_id;
    
    IF v_current_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', format('Could not find content with ID %s', p_content_id)
        );
    END IF;
    
    -- Find or use the provided composite ID
    IF p_composite_id IS NULL THEN
        SELECT c.id INTO v_composite_id
        FROM public.composites c
        WHERE c.compose_id = p_content_id
        LIMIT 1;
        
        IF v_composite_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'No composite found for this content',
                'details', format('No composite references content with ID %s', p_content_id)
            );
        END IF;
    ELSE
        v_composite_id := p_composite_id;
    END IF;
    
    -- Get composite details
    SELECT * INTO v_composite FROM public.composites WHERE id = v_composite_id;
    
    -- Handle variations
    IF p_create_variation THEN
        RAISE NOTICE 'Creating variation, extracting metadata...';
        
        -- Create a new content entry with the same initial content
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
            v_current_content.json, -- Start with the original content
            p_user_id,
            v_current_content.schema,
            now(),
            now(),
            gen_random_uuid()
        );
        
        -- Get title, description, and type from __variation_metadata or defaults
        v_title := COALESCE(
            (v_current_content.json->'__variation_metadata'->>'title'),
            format('Variation of %s', v_composite.title)
        );
        
        v_description := COALESCE(
            (v_current_content.json->'__variation_metadata'->>'description'),
            format('Variation of %s', v_composite.title)
        );
        
        v_variation_type := COALESCE(
            (v_current_content.json->'__variation_metadata'->>'type'),
            'alternative'
        );
        
        RAISE NOTICE 'Creating variation with title=%, description=%, type=%', 
            v_title, v_description, v_variation_type;
        
        -- Create a new composite for the variation
        v_new_composite_id := gen_random_uuid();
        
        INSERT INTO public.composites (
            id,
            title,
            description,
            compose_id,
            author,
            created_at,
            updated_at
        ) VALUES (
            v_new_composite_id,
            v_title,
            v_description, 
            v_new_content_id,
            p_user_id,
            now(),
            now()
        );
        
        -- Create relationship to original composite
        INSERT INTO public.composite_relationships (
            source_composite_id,
            target_composite_id,
            relationship_type,
            metadata
        ) VALUES (
            v_new_composite_id,
            v_composite_id,
            'variation_of',
            jsonb_build_object(
                'variation_type', v_variation_type,
                'created_at', now(),
                'description', v_description
            )
        );
        
        -- Create a patch request (auto-approved for variations)
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
            format('Variation of %s', v_composite.title),
            v_description,
            p_user_id,
            p_content_id,
            v_new_content_id,
            v_new_composite_id,
            'variation',
            'approved', -- Auto-approved for variations
            jsonb_build_object(
                'variation_type', v_variation_type,
                'original_composite_id', v_composite_id,
                'operation_count', v_op_count
            )
        )
        RETURNING id INTO v_patch_request_id;
        
        -- Store operations if there are any
        IF v_op_count > 0 THEN
            RAISE NOTICE 'Storing % operations for variation', v_op_count;
            
            FOR i IN 0..v_op_count-1 LOOP
                -- Retrieve old value for remove or replace operations
                DECLARE
                    v_old_value jsonb := NULL;
                    v_op_type text := p_operations->i->>'op';
                    v_path text := p_operations->i->>'path';
                    v_path_tokens text[] := string_to_array(CASE WHEN LEFT(v_path, 1) = '/' THEN SUBSTRING(v_path, 2) ELSE v_path END, '/');
                BEGIN
                    -- For remove and replace operations, get the old value from current content
                    IF v_op_type IN ('remove', 'replace') THEN
                        -- Extract the value from the current content JSON
                        v_old_value := v_current_content.json #> v_path_tokens;
                        RAISE NOTICE 'Found old value for % at path %: %', v_op_type, v_path, v_old_value;
                    END IF;
                
                    INSERT INTO json_patch_operations (
                        patch_request_id,
                        operation_type,
                        path,
                        from_path,
                        value,
                        old_value,
                        created_at
                    ) VALUES (
                        v_patch_request_id,
                        v_op_type,
                        v_path,
                        p_operations->i->>'from',
                        CASE 
                            WHEN v_op_type IN ('add', 'replace', 'test') THEN p_operations->i->'value'
                            ELSE NULL
                        END,
                        v_old_value,
                        now()
                    );
                END;
            END LOOP;
        ELSE
            RAISE NOTICE 'No operations to store for variation';
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Variation created successfully',
            'compositeId', v_new_composite_id,
            'contentId', v_new_content_id,
            'patchRequestId', v_patch_request_id
        );
    ELSE
        -- Regular edit path - create a patch request
        RAISE NOTICE 'Creating regular edit with % operations', v_op_count;
        
        -- Create a patch request for the edit
        INSERT INTO public.patch_requests (
            title,
            description,
            author,
            old_version_id,
            new_version_id, -- Will remain NULL until approved
            composite_id,
            operation_type,
            status,
            metadata
        ) VALUES (
            'Update to ' || v_composite.title,
            'Content update via JSON Patch',
            p_user_id,
            p_content_id,
            NULL, -- New version is created upon approval
            v_composite_id,
            'edit',
            'pending',
            jsonb_build_object(
                'operation_count', v_op_count,
                'timestamp', now()
            )
        )
        RETURNING id INTO v_patch_request_id;
        
        -- Store operations if there are any
        IF v_op_count > 0 THEN
            FOR i IN 0..v_op_count-1 LOOP
                -- Retrieve old value for remove or replace operations
                DECLARE
                    v_old_value jsonb := NULL;
                    v_op_type text := p_operations->i->>'op';
                    v_path text := p_operations->i->>'path';
                    v_path_tokens text[] := string_to_array(CASE WHEN LEFT(v_path, 1) = '/' THEN SUBSTRING(v_path, 2) ELSE v_path END, '/');
                BEGIN
                    -- For remove and replace operations, get the old value from current content
                    IF v_op_type IN ('remove', 'replace') THEN
                        -- Extract the value from the current content JSON
                        v_old_value := v_current_content.json #> v_path_tokens;
                        RAISE NOTICE 'Found old value for % at path %: %', v_op_type, v_path, v_old_value;
                    END IF;
                
                    INSERT INTO json_patch_operations (
                        patch_request_id,
                        operation_type,
                        path,
                        from_path,
                        value,
                        old_value,
                        created_at
                    ) VALUES (
                        v_patch_request_id,
                        v_op_type,
                        v_path,
                        p_operations->i->>'from',
                        CASE 
                            WHEN v_op_type IN ('add', 'replace', 'test') THEN p_operations->i->'value'
                            ELSE NULL
                        END,
                        v_old_value,
                        now()
                    );
                END;
            END LOOP;
        ELSE
            RAISE NOTICE 'No operations to store for edit request';
        END IF;
        
        -- Auto-approve for owner's own edits
        IF EXISTS (SELECT 1 FROM public.composites WHERE id = v_composite_id AND author = p_user_id) THEN
            -- Call the approve function directly
            RAISE NOTICE 'Auto-approving edit for owner';
            PERFORM public.approve_patch_request(v_patch_request_id, p_user_id);
        END IF;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Patch request created successfully',
            'patchRequestId', v_patch_request_id,
            'operation_count', v_op_count
        );
    END IF;
END;
$$;

-- Function to apply JSON Patch operations
CREATE OR REPLACE FUNCTION public.apply_json_patch(
    p_base_json jsonb,
    p_operations jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb := p_base_json;
    v_op jsonb;
    v_path text;
    v_normalized_path text;
    v_from_path text;
    v_normalized_from_path text;
    v_value jsonb;
    v_from_value jsonb;
    v_path_tokens text[];
    v_from_path_tokens text[];
    v_parent_path text;
    v_last_token text;
    v_parent_value jsonb;
    i integer;
    v_op_index integer := 0;
    v_array_index integer;
    v_array_value jsonb;
    v_is_last_token_array_index boolean;
BEGIN
    -- Loop through each operation in the array
    FOR v_op IN SELECT * FROM jsonb_array_elements(p_operations)
    LOOP
        v_op_index := v_op_index + 1;
        
        -- Get operation details
        v_path := v_op->>'path';
        
        -- Normalize path (remove leading slash and split into path tokens)
        v_normalized_path := CASE WHEN LEFT(v_path, 1) = '/' THEN SUBSTRING(v_path, 2) ELSE v_path END;
        v_path_tokens := string_to_array(v_normalized_path, '/');
        
        -- Get parent path and last token
        IF array_length(v_path_tokens, 1) > 1 THEN
            v_parent_path := '/' || array_to_string(v_path_tokens[1:array_length(v_path_tokens, 1)-1], '/');
            v_last_token := v_path_tokens[array_length(v_path_tokens, 1)];
            
            -- Check if the last token is an array index
            v_is_last_token_array_index := v_last_token ~ '^[0-9]+$';
            -- Get parent value for array operations
            v_parent_value := v_result #> v_path_tokens[1:array_length(v_path_tokens, 1)-1];
        ELSE
            v_parent_path := '';
            v_last_token := v_path_tokens[1];
            v_is_last_token_array_index := false;
            v_parent_value := null;
        END IF;
        
        BEGIN
            -- Process different operation types
            CASE v_op->>'op'
                WHEN 'add' THEN
                    v_value := v_op->'value';
                    
                    -- Special case for entire document replacement
                    IF v_normalized_path = '' THEN
                        v_result := v_value;
                    ELSE
                        -- Special case for array indices
                        IF v_is_last_token_array_index AND jsonb_typeof(v_parent_value) = 'array' THEN
                            -- Convert array index to integer
                            v_array_index := v_last_token::integer;
                            
                            -- Add element to array at specific index
                            -- First get all elements before the index
                            v_array_value := '[]'::jsonb;
                            FOR i IN 0..v_array_index-1 LOOP
                                IF i < jsonb_array_length(v_parent_value) THEN
                                    v_array_value := v_array_value || jsonb_build_array(v_parent_value->i);
                                END IF;
                            END LOOP;
                            
                            -- Add the new element
                            v_array_value := v_array_value || jsonb_build_array(v_value);
                            
                            -- Add remaining elements after the index
                            FOR i IN v_array_index..jsonb_array_length(v_parent_value)-1 LOOP
                                v_array_value := v_array_value || jsonb_build_array(v_parent_value->i);
                            END LOOP;
                            
                            -- Update the parent with the new array
                            v_result := jsonb_set(
                                v_result,
                                v_path_tokens[1:array_length(v_path_tokens, 1)-1],
                                v_array_value,
                                true
                            );
                        ELSE
                            -- Add property to object
                            v_result := jsonb_set(v_result, v_path_tokens, v_value, true);
                        END IF;
                    END IF;
                    
                WHEN 'remove' THEN
                    -- Check if the path exists before removing
                    IF v_result #> v_path_tokens IS NULL THEN
                        RAISE NOTICE 'Path does not exist for remove operation: %', v_path;
                    ELSE
                        -- Special case for array indices
                        IF v_is_last_token_array_index AND jsonb_typeof(v_parent_value) = 'array' THEN
                            -- Convert array index to integer
                            v_array_index := v_last_token::integer;
                            
                            -- Build a new array excluding the element at the specified index
                            v_array_value := '[]'::jsonb;
                            FOR i IN 0..jsonb_array_length(v_parent_value)-1 LOOP
                                IF i != v_array_index THEN
                                    v_array_value := v_array_value || jsonb_build_array(v_parent_value->i);
                                END IF;
                            END LOOP;
                            
                            -- Update the parent with the new array
                            v_result := jsonb_set(
                                v_result,
                                v_path_tokens[1:array_length(v_path_tokens, 1)-1],
                                v_array_value,
                                true
                            );
                        ELSE
                            -- Remove property from object
                            v_result := v_result #- v_path_tokens;
                        END IF;
                    END IF;
                    
                WHEN 'replace' THEN
                    v_value := v_op->'value';
                    
                    -- Check if the path exists before replacing
                    IF v_result #> v_path_tokens IS NULL AND v_normalized_path != '' THEN
                        RAISE NOTICE 'Path does not exist for replace operation: %', v_path;
                    ELSE
                        -- Special case for entire document replacement
                        IF v_normalized_path = '' THEN
                            v_result := v_value;
                        ELSE
                            -- Special case for array indices
                            IF v_is_last_token_array_index AND jsonb_typeof(v_parent_value) = 'array' THEN
                                -- Convert array index to integer
                                v_array_index := v_last_token::integer;
                                
                                -- Build a new array with the replaced element
                                v_array_value := '[]'::jsonb;
                                FOR i IN 0..jsonb_array_length(v_parent_value)-1 LOOP
                                    IF i = v_array_index THEN
                                        v_array_value := v_array_value || jsonb_build_array(v_value);
                                    ELSE
                                        v_array_value := v_array_value || jsonb_build_array(v_parent_value->i);
                                    END IF;
                                END LOOP;
                                
                                -- Update the parent with the new array
                                v_result := jsonb_set(
                                    v_result,
                                    v_path_tokens[1:array_length(v_path_tokens, 1)-1],
                                    v_array_value,
                                    true
                                );
                            ELSE
                                -- Replace property in object
                                v_result := jsonb_set(v_result, v_path_tokens, v_value, true);
                            END IF;
                        END IF;
                    END IF;
                    
                WHEN 'move' THEN
                    v_from_path := v_op->>'from';
                    v_normalized_from_path := CASE WHEN LEFT(v_from_path, 1) = '/' THEN SUBSTRING(v_from_path, 2) ELSE v_from_path END;
                    v_from_path_tokens := string_to_array(v_normalized_from_path, '/');
                    
                    -- Check if the from path exists
                    IF v_result #> v_from_path_tokens IS NULL THEN
                        RAISE NOTICE 'From path does not exist for move operation: %', v_from_path;
                    ELSE
                        -- Get value at from path
                        v_from_value := v_result #> v_from_path_tokens;
                        
                        -- First remove from the source path
                        v_result := v_result #- v_from_path_tokens;
                        
                        -- Then add to destination path
                        v_result := jsonb_set(v_result, v_path_tokens, v_from_value, true);
                    END IF;
                    
                WHEN 'copy' THEN
                    v_from_path := v_op->>'from';
                    v_normalized_from_path := CASE WHEN LEFT(v_from_path, 1) = '/' THEN SUBSTRING(v_from_path, 2) ELSE v_from_path END;
                    v_from_path_tokens := string_to_array(v_normalized_from_path, '/');
                    
                    -- Check if the from path exists
                    IF v_result #> v_from_path_tokens IS NULL THEN
                        RAISE NOTICE 'From path does not exist for copy operation: %', v_from_path;
                    ELSE
                        -- Get value at from path
                        v_from_value := v_result #> v_from_path_tokens;
                        
                        -- Add to destination path
                        v_result := jsonb_set(v_result, v_path_tokens, v_from_value, true);
                    END IF;
                    
                WHEN 'test' THEN
                    v_value := v_op->'value';
                    
                    -- Special case for entire document test
                    IF v_normalized_path = '' THEN
                        IF v_result != v_value THEN
                            RAISE EXCEPTION 'Test operation failed: Document does not match expected value';
                        END IF;
                    ELSE
                        -- Test value at path
                        IF v_result #> v_path_tokens != v_value THEN
                            RAISE EXCEPTION 'Test operation failed: Value at path % does not match expected value', v_path;
                        END IF;
                    END IF;
                
                ELSE
                    RAISE EXCEPTION 'Unsupported operation type: %', v_op->>'op';
            END CASE;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log detailed error information when an operation fails
            RAISE EXCEPTION 'Failed applying operation % (% %) with error: %', 
                v_op_index, v_op->>'op', v_path, SQLERRM;
        END;
    END LOOP;
    
    RETURN v_result;
END;
$$;

-- Function to get all operations for a patch request
CREATE OR REPLACE FUNCTION public.get_patch_request_operations(p_patch_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operations jsonb;
BEGIN
    SELECT json_agg(
        jsonb_build_object(
            'op', operation_type,
            'path', path,
            'from', from_path,
            'value', value
        )
        ORDER BY created_at
    ) INTO v_operations
    FROM json_patch_operations
    WHERE patch_request_id = p_patch_request_id;
    
    RETURN COALESCE(v_operations, '[]'::jsonb);
END;
$$;

-- Function to approve a patch request
CREATE OR REPLACE FUNCTION public.approve_patch_request(p_patch_request_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patch_request record;
    v_composite record;
    v_content record;
    v_operations jsonb;
    v_new_content jsonb;
    v_new_content_id uuid := gen_random_uuid();
    v_schema_id uuid;
    v_schema_data jsonb;
    v_validation_result jsonb;
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id;

    IF v_patch_request IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Patch request not found',
            'details', format('Could not find patch request with ID %s', p_patch_request_id)
        );
    END IF;
    
    -- If already approved, just return success
    IF v_patch_request.status = 'approved' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Patch request already approved',
            'patch_request_id', p_patch_request_id
        );
    END IF;
    
    -- If rejected, cannot approve
    IF v_patch_request.status = 'rejected' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cannot approve rejected patch request',
            'details', 'Patch request has already been rejected'
        );
    END IF;
    
    -- Get the composite
    SELECT * INTO v_composite
    FROM public.composites
    WHERE id = v_patch_request.composite_id;

    IF v_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Composite not found',
            'details', format('Could not find composite with ID %s', v_patch_request.composite_id)
        );
    END IF;
    
    -- Check permissions
    IF p_user_id IS NOT NULL AND p_user_id != v_composite.author THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized',
            'details', 'Only the composite author can approve patch requests'
        );
    END IF;
    
    -- For variations, the new version should already exist
    IF v_patch_request.operation_type = 'variation' THEN
        IF v_patch_request.new_version_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Missing new version',
                'details', 'Variation patch request does not have a new version ID'
            );
        END IF;
        
        -- Just update the status to approved
        UPDATE public.patch_requests
        SET status = 'approved',
            updated_at = now()
        WHERE id = p_patch_request_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Variation approved successfully',
            'patch_request_id', p_patch_request_id
        );
    END IF;
    
    -- Get original content
    SELECT * INTO v_content
    FROM public.db
    WHERE id = v_patch_request.old_version_id;
    
    IF v_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Original content not found',
            'details', format('Could not find content with ID %s', v_patch_request.old_version_id)
        );
    END IF;
    
    -- Get all operations for this patch request
    v_operations := public.get_patch_request_operations(p_patch_request_id);
    
    -- Apply operations to get new content
    BEGIN
        v_new_content := public.apply_json_patch(v_content.json, v_operations);
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to apply operations',
            'details', SQLERRM
        );
    END;
    
    -- Validate the new content against the schema
    v_schema_id := v_content.schema;
    
    -- Get schema data
    SELECT json INTO v_schema_data
    FROM public.db
    WHERE id = v_schema_id;
    
    IF v_schema_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Schema not found',
            'details', format('Could not find schema with ID %s', v_schema_id)
        );
    END IF;
    
    -- Validate content against schema
    v_validation_result := public.validate_json_against_schema(v_new_content, v_schema_data);
    
    IF NOT (v_validation_result->>'valid')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Schema validation failed',
            'details', v_validation_result
        );
    END IF;
    
    -- Create new content version
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
        v_new_content,
        COALESCE(p_user_id, v_patch_request.author),
        v_schema_id,
        now(),
        now(),
        gen_random_uuid()
    );
    
    -- Update the patch request with the new content ID
    UPDATE public.patch_requests
    SET status = 'approved',
        new_version_id = v_new_content_id,
        updated_at = now()
    WHERE id = p_patch_request_id;
    
    -- Update the composite to point to the new content
    UPDATE public.composites
    SET compose_id = v_new_content_id,
        updated_at = now()
    WHERE id = v_patch_request.composite_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Patch request approved successfully',
        'patch_request_id', p_patch_request_id,
        'new_content_id', v_new_content_id
    );
END;
$$;

-- API function to update patch request status
CREATE OR REPLACE FUNCTION public.update_edit_request(
    p_request_id uuid,
    p_status text,
    p_user_id uuid
)
RETURNS jsonb AS $$
BEGIN
    -- Check if status is 'approved'
    IF p_status = 'approved' THEN
        -- Call our approve function
        RETURN public.approve_patch_request(p_request_id, p_user_id);
    ELSIF p_status = 'rejected' THEN
        -- Handle rejection (simple status update)
        UPDATE public.patch_requests
        SET status = 'rejected',
            updated_at = now()
        WHERE id = p_request_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Patch request rejected successfully'
        );
    ELSE
        -- Invalid status
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid status',
            'details', format('Status %s is not valid for patch requests', p_status)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get content by ID
CREATE OR REPLACE FUNCTION public.get_content(
    p_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_content record;
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
    
    RETURN jsonb_build_object(
        'success', true,
        'content', v_content.json
    );
END;
$$; 