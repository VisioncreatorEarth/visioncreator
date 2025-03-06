-- Migration to implement JSON Patch operations for content editing
-- This migration adds functions for PostgreSQL-based JSON schema validation
-- and operations-based content editing using RFC 6902 (JSON Patch)

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

-- Function to get content for operations-based editing
CREATE OR REPLACE FUNCTION public.get_content(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_content jsonb;
BEGIN
    -- Get content by ID
    SELECT json INTO v_content
    FROM public.db
    WHERE id = p_id;
    
    IF v_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'content', v_content
    );
END;
$$;

-- Function to validate JSON against a schema using PostgreSQL
CREATE OR REPLACE FUNCTION public.validate_json_against_schema(
    p_json jsonb,
    p_schema jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validation_result jsonb;
    v_is_valid boolean;
    v_error_details jsonb;
BEGIN
    -- Basic validation check - additional properties
    IF p_schema->>'additionalProperties' = 'false' THEN
        -- Check for properties in p_json that are not in the schema properties
        -- This is a simplified version, in a production system this would be more comprehensive
        FOR v_error_details IN 
            SELECT jsonb_build_object(
                'path', '',
                'message', 'Object contains properties not defined in the schema',
                'keyword', 'additionalProperties',
                'params', jsonb_build_object('additionalProperty', key)
            )
            FROM jsonb_object_keys(p_json) AS key
            WHERE NOT EXISTS (
                SELECT 1 FROM jsonb_object_keys(p_schema->'properties') AS schema_key
                WHERE schema_key = key
            )
            AND key NOT IN ('id', 'created_at', 'updated_at')  -- Skip standard fields
        LOOP
            RETURN jsonb_build_object(
                'valid', false,
                'errors', jsonb_build_array(v_error_details)
            );
        END LOOP;
    END IF;
    
    -- Check required properties
    IF p_schema ? 'required' AND jsonb_array_length(p_schema->'required') > 0 THEN
        FOR v_error_details IN 
            SELECT jsonb_build_object(
                'path', '',
                'message', 'Required property missing',
                'keyword', 'required',
                'params', jsonb_build_object('missingProperty', required_prop)
            )
            FROM jsonb_array_elements_text(p_schema->'required') AS required_prop
            WHERE NOT p_json ? required_prop
        LOOP
            RETURN jsonb_build_object(
                'valid', false,
                'errors', jsonb_build_array(v_error_details)
            );
        END LOOP;
    END IF;
    
    -- Check property types (simplified)
    -- In a production system, this would be more comprehensive and handle nested objects
    IF p_schema ? 'properties' THEN
        FOR v_error_details IN
            SELECT jsonb_build_object(
                'path', '/' || key,
                'message', 'Property has wrong type',
                'keyword', 'type',
                'params', jsonb_build_object('expected', prop->'type', 'actual', jsonb_typeof(p_json->key))
            )
            FROM jsonb_each(p_schema->'properties') AS props(key, prop)
            WHERE p_json ? key 
              AND prop ? 'type'
              AND (
                (prop->>'type' = 'string' AND jsonb_typeof(p_json->key) != 'string') OR
                (prop->>'type' = 'number' AND jsonb_typeof(p_json->key) NOT IN ('number', 'integer')) OR
                (prop->>'type' = 'integer' AND jsonb_typeof(p_json->key) != 'number') OR
                (prop->>'type' = 'boolean' AND jsonb_typeof(p_json->key) != 'boolean') OR
                (prop->>'type' = 'object' AND jsonb_typeof(p_json->key) != 'object') OR
                (prop->>'type' = 'array' AND jsonb_typeof(p_json->key) != 'array')
              )
        LOOP
            RETURN jsonb_build_object(
                'valid', false,
                'errors', jsonb_build_array(v_error_details)
            );
        END LOOP;
    END IF;
    
    -- If we reach here, validation passed
    RETURN jsonb_build_object(
        'valid', true
    );
END;
$$;

-- Function to apply JSON Patch operations (RFC 6902) to a JSONB object
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
    -- Log the base JSON for debugging
    RAISE NOTICE 'Base JSON: %', p_base_json;
    RAISE NOTICE 'Operations to apply: %', p_operations;
    
    -- Loop through each operation in the array
    FOR v_op IN SELECT * FROM jsonb_array_elements(p_operations)
    LOOP
        v_op_index := v_op_index + 1;
        
        -- Get operation details
        v_path := v_op->>'path';
        
        -- Log the current operation for debugging
        RAISE NOTICE 'Processing operation %: % %', v_op_index, v_op->>'op', v_path;
        
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
        
        -- Log path details for debugging
        RAISE NOTICE 'Path tokens: %, Parent path: %, Last token: %, Is array index: %', 
            v_path_tokens, v_parent_path, v_last_token, v_is_last_token_array_index;
        
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
                            RAISE NOTICE 'Adding at array index: % to array of length: %', 
                                v_array_index, jsonb_array_length(v_parent_value);
                            
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
                            RAISE NOTICE 'Removing from array at index: % from array of length: %', 
                                v_array_index, jsonb_array_length(v_parent_value);
                            
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
                                RAISE NOTICE 'Replacing array element at index: % in array of length: %', 
                                    v_array_index, jsonb_array_length(v_parent_value);
                                
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
            
            -- Log the result after applying this operation
            RAISE NOTICE 'Result after operation %: %', v_op_index, v_result;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log detailed error information when an operation fails
            RAISE EXCEPTION 'Failed applying operation % (% %) with error: %', 
                v_op_index, v_op->>'op', v_path, SQLERRM;
        END;
    END LOOP;
    
    RETURN v_result;
END;
$$;

-- Main function to process JSON Patch operations
-- This function processes operations, validates against schema, and creates appropriate database records
CREATE OR REPLACE FUNCTION public.process_json_patch_operations(
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
    v_current_content jsonb;
    v_schema_id uuid;
    v_schema_json jsonb;
    v_new_content jsonb;
    v_validation_result jsonb;
    v_patch_request_id uuid;
    v_operation jsonb;
    v_user_name text;
    v_composite_record record;
    v_current_content_record record;
    v_new_content_id uuid;
    v_now timestamp;
    v_content_type text;
    v_error_message text;
BEGIN
    -- Log inputs for debugging
    RAISE NOTICE 'Processing JSON patch operations for content ID: %', p_content_id;
    RAISE NOTICE 'Operations received: %', p_operations;
    
    -- Get current timestamp for consistency
    v_now := now();
    
    -- Get the user's name for recording in patch requests
    SELECT name INTO v_user_name FROM profiles WHERE id = p_user_id;
    IF v_user_name IS NULL THEN
        RAISE NOTICE 'Could not find user with ID: %', p_user_id;
    END IF;
    
    -- Get current content and schema ID
    SELECT id, json, schema, snapshot_id 
    INTO v_current_content_record 
    FROM public.db 
    WHERE id = p_content_id;
    
    IF v_current_content_record IS NULL THEN
        RAISE NOTICE 'Content not found with ID: %', p_content_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', format('Could not find content with ID %s', p_content_id)
        );
    END IF;
    
    RAISE NOTICE 'Retrieved content record: %', row_to_json(v_current_content_record);
    
    v_current_content := v_current_content_record.json;
    v_schema_id := v_current_content_record.schema;
    
    -- Determine content type from json if available, or use a default value
    v_content_type := 'content';  -- Default value
    
    -- Get schema definition
    SELECT json INTO v_schema_json 
    FROM public.db 
    WHERE id = v_schema_id;
    
    IF v_schema_json IS NULL THEN
        RAISE NOTICE 'Schema not found with ID: %', v_schema_id;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Schema not found',
            'details', format('Could not find schema with ID %s', v_schema_id)
        );
    END IF;
    
    -- Apply operations to get new content
    BEGIN
        RAISE NOTICE 'Applying JSON patch operations to content...';
        v_new_content := public.apply_json_patch(v_current_content, p_operations);
        RAISE NOTICE 'Successfully applied patch operations. New content: %', v_new_content;
    EXCEPTION WHEN OTHERS THEN
        v_error_message := SQLERRM;
        RAISE NOTICE 'Failed to apply JSON patch operations: %', v_error_message;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to apply JSON patch operations',
            'details', v_error_message
        );
    END;
    
    -- Validate new content against schema
    RAISE NOTICE 'Validating new content against schema...';
    v_validation_result := public.validate_json_against_schema(v_new_content, v_schema_json);
    RAISE NOTICE 'Validation result: %', v_validation_result;
    
    -- If validation fails, return error
    IF NOT (v_validation_result->>'valid')::boolean THEN
        RAISE NOTICE 'Schema validation failed: %', v_validation_result;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Schema validation failed',
            'details', v_validation_result
        );
    END IF;
    
    -- Get composite information if not creating a variation
    IF NOT p_create_variation THEN
        -- Find the composite that uses this content
        IF p_composite_id IS NULL THEN
            RAISE NOTICE 'Finding composite for content ID: %', p_content_id;
            -- Find the composite that references this content
            SELECT c.id, c.title, c.description, c.compose_id 
            INTO v_composite_record
            FROM composites c
            WHERE c.compose_id = p_content_id
            LIMIT 1;
            
            IF v_composite_record IS NULL THEN
                RAISE NOTICE 'No composite found for content ID: %', p_content_id;
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Composite not found for this content',
                    'details', format('No composite references content ID %s', p_content_id)
                );
            END IF;
        ELSE
            RAISE NOTICE 'Using provided composite ID: %', p_composite_id;
            -- Use the provided composite ID
            SELECT c.id, c.title, c.description, c.compose_id 
            INTO v_composite_record
            FROM composites c
            WHERE c.id = p_composite_id
            LIMIT 1;
            
            IF v_composite_record IS NULL THEN
                RAISE NOTICE 'Specified composite not found: %', p_composite_id;
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Specified composite not found',
                    'details', format('Could not find composite with ID %s', p_composite_id)
                );
            END IF;
        END IF;
        
        RAISE NOTICE 'Found composite: %', row_to_json(v_composite_record);
    
        -- Create patch request
        RAISE NOTICE 'Creating patch request...';
        BEGIN
            INSERT INTO patch_requests(
                composite_id, 
                old_version_id, 
                status, 
                author,
                metadata,
                created_at,
                title,
                description
            )
            VALUES (
                v_composite_record.id,
                p_content_id,
                'pending',
                p_user_id,
                jsonb_build_object(
                    'author', v_user_name,
                    'operation_count', jsonb_array_length(p_operations),
                    'timestamp', v_now
                ),
                v_now,
                'JSON Patch Operations', -- Default title for patch requests
                'Operations created via JSON Patch RFC 6902' -- Default description
            )
            RETURNING id INTO v_patch_request_id;
            
            RAISE NOTICE 'Created patch request with ID: %', v_patch_request_id;
        EXCEPTION WHEN OTHERS THEN
            v_error_message := SQLERRM;
            RAISE NOTICE 'Failed to create patch request: %', v_error_message;
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Failed to create patch request',
                'details', v_error_message
            );
        END;
        
        -- Store operations in json_patch_operations table
        RAISE NOTICE 'Storing operations in json_patch_operations table...';
        BEGIN
            FOR v_operation IN SELECT * FROM jsonb_array_elements(p_operations)
            LOOP
                RAISE NOTICE 'Storing operation: % %', v_operation->>'op', v_operation->>'path';
                
                INSERT INTO json_patch_operations(
                    patch_request_id,
                    operation_type,
                    path,
                    from_path,
                    value,
                    old_value,
                    created_at
                )
                VALUES (
                    v_patch_request_id,
                    v_operation->>'op',
                    v_operation->>'path',
                    v_operation->>'from',
                    CASE 
                        WHEN v_operation->>'op' IN ('add', 'replace', 'test') THEN v_operation->'value'
                        ELSE NULL
                    END,
                    CASE 
                        WHEN v_operation->>'op' IN ('replace', 'remove') THEN 
                            -- Extract old value from the path for replace/remove operations
                            -- Safe extraction that works with array indices
                            CASE 
                                WHEN v_operation->>'path' LIKE '%/%' THEN
                                    -- Convert RFC 6902 path to PostgreSQL JSON path accessor
                                    (SELECT v_current_content #> 
                                        string_to_array(
                                            CASE 
                                                WHEN left(v_operation->>'path', 1) = '/' 
                                                THEN substring(v_operation->>'path', 2) 
                                                ELSE v_operation->>'path' 
                                            END, 
                                            '/'
                                        )
                                    )
                                ELSE
                                    -- Direct property access
                                    v_current_content->(v_operation->>'path')
                            END
                        ELSE NULL
                    END,
                    v_now
                );
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            v_error_message := SQLERRM;
            RAISE NOTICE 'Failed to store operations: %', v_error_message;
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Failed to store operations',
                'details', v_error_message
            );
        END;
        
        RAISE NOTICE 'Successfully processed all operations.';
        RETURN jsonb_build_object(
            'success', true,
            'patch_request_id', v_patch_request_id,
            'message', 'Patch request created successfully',
            'operation_count', jsonb_array_length(p_operations)
        );
    ELSE
        -- Handle creating a variation (simplified for now)
        RAISE NOTICE 'Creating variation...';
        BEGIN
            -- Create new content record
            INSERT INTO public.db(
                json,
                schema,
                created_at
            )
            VALUES (
                v_new_content,
                v_current_content_record.schema,
                v_now
            )
            RETURNING id INTO v_new_content_id;
            
            RAISE NOTICE 'Created new content with ID: %', v_new_content_id;
            
            -- Create new composite as a variation
            INSERT INTO composites(
                title,
                description,
                compose_id,
                author_id,
                created_at
            )
            VALUES (
                'Variation of ' || v_content_type,
                'Created from ' || p_content_id::text,
                v_new_content_id,
                p_user_id,
                v_now
            )
            RETURNING id INTO v_composite_record.id;
            
            RAISE NOTICE 'Created new composite as variation with ID: %', v_composite_record.id;
            
            -- Create relationship to original
            INSERT INTO composite_relationships(
                parent_id,
                child_id,
                relationship_type,
                metadata,
                created_at
            )
            VALUES (
                p_composite_id,
                v_composite_record.id,
                'variation',
                jsonb_build_object(
                    'variation_type', 'alternative',
                    'created_from', p_content_id,
                    'operation_count', jsonb_array_length(p_operations)
                ),
                v_now
            );
            
            RAISE NOTICE 'Created relationship between composites.';
        EXCEPTION WHEN OTHERS THEN
            v_error_message := SQLERRM;
            RAISE NOTICE 'Failed to create variation: %', v_error_message;
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Failed to create variation',
                'details', v_error_message
            );
        END;
        
        RETURN jsonb_build_object(
            'success', true,
            'compositeId', v_composite_record.id,
            'contentId', v_new_content_id,
            'message', 'Variation created successfully'
        );
    END IF;
END;
$$;

-- Function to get operations for a specific patch request
CREATE OR REPLACE FUNCTION public.get_patch_request_operations(p_patch_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operations jsonb;
    v_request_info record;
BEGIN
    -- Get the patch request first to verify it exists
    SELECT id, status INTO v_request_info
    FROM public.patch_requests
    WHERE id = p_patch_request_id;
    
    IF v_request_info IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Patch request not found',
            'details', format('No patch request found with ID %s', p_patch_request_id)
        );
    END IF;
    
    -- Retrieve all operations for this patch request
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', o.id, 
            'operation_type', o.operation_type,
            'path', o.path,
            'from_path', o.from_path,
            'value', o.value,
            'old_value', o.old_value,
            'created_at', o.created_at
        ) ORDER BY o.created_at
    ) INTO v_operations
    FROM public.json_patch_operations o
    WHERE o.patch_request_id = p_patch_request_id;
    
    -- Handle no operations found
    IF v_operations IS NULL THEN
        v_operations := '[]'::jsonb;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'patch_request_id', p_patch_request_id,
        'status', v_request_info.status,
        'operations', v_operations
    );
END;
$$; 