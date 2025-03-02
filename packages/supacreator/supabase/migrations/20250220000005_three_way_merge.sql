-- Migration: Three-Way Merge for Composites
-- Description: Implements three-way merge functionality for composites using CRDT operations

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.three_way_merge_composites(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.find_common_ancestor(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.merge_json_strings(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.generate_merge_operations(uuid, jsonb, jsonb, jsonb, uuid, uuid, uuid, jsonb) CASCADE;

-- Function to merge text content
CREATE OR REPLACE FUNCTION public.merge_json_strings(
    base_text text,
    source_text text,
    target_text text
) RETURNS text AS $$
DECLARE
    result text;
BEGIN
    -- This is a simplified implementation; in a real-world scenario,
    -- you would use a proper diff3 algorithm for text merging
    
    -- If source or target match base, take the other one
    IF source_text = base_text THEN
        RETURN target_text;
    ELSIF target_text = base_text THEN
        RETURN source_text;
    END IF;
    
    -- For now, just prefer target's version
    -- In a full implementation, you'd want to use a proper text merge algorithm
    RETURN target_text;
END;
$$ LANGUAGE plpgsql;

-- Function to find common ancestor of two composites
CREATE OR REPLACE FUNCTION public.find_common_ancestor(
    p_source_composite_id uuid,
    p_target_composite_id uuid
) RETURNS uuid AS $$
DECLARE
    v_ancestors_source uuid[];
    v_ancestors_target uuid[];
    v_common_ancestor uuid;
    v_current_composite uuid;
    v_relationship record;
BEGIN
    -- Initialize arrays to track visited composites
    v_ancestors_source := ARRAY[p_source_composite_id];
    v_ancestors_target := ARRAY[p_target_composite_id];
    
    -- First try to find if one is derived from the other directly
    SELECT target_composite_id INTO v_current_composite
    FROM public.composite_relationships
    WHERE source_composite_id = p_source_composite_id
    AND target_composite_id = p_target_composite_id
    AND relationship_type = 'variation_of'
    LIMIT 1;
    
    IF FOUND THEN
        -- Target is the direct ancestor of source
        RETURN p_target_composite_id;
    END IF;
    
    SELECT target_composite_id INTO v_current_composite
    FROM public.composite_relationships
    WHERE source_composite_id = p_target_composite_id
    AND target_composite_id = p_source_composite_id
    AND relationship_type = 'variation_of'
    LIMIT 1;
    
    IF FOUND THEN
        -- Source is the direct ancestor of target
        RETURN p_source_composite_id;
    END IF;
    
    -- Gather ancestor chain for source composite
    v_current_composite := p_source_composite_id;
    
    WHILE v_current_composite IS NOT NULL LOOP
        SELECT target_composite_id INTO v_current_composite
        FROM public.composite_relationships
        WHERE source_composite_id = v_current_composite
        AND relationship_type = 'variation_of'
        LIMIT 1;
        
        IF v_current_composite IS NOT NULL THEN
            v_ancestors_source := array_append(v_ancestors_source, v_current_composite);
        END IF;
    END LOOP;
    
    -- Gather ancestor chain for target composite
    v_current_composite := p_target_composite_id;
    
    WHILE v_current_composite IS NOT NULL LOOP
        SELECT target_composite_id INTO v_current_composite
        FROM public.composite_relationships
        WHERE source_composite_id = v_current_composite
        AND relationship_type = 'variation_of'
        LIMIT 1;
        
        IF v_current_composite IS NOT NULL THEN
            v_ancestors_target := array_append(v_ancestors_target, v_current_composite);
        END IF;
    END LOOP;
    
    -- Find the first common ancestor
    -- Fix the query to properly use the unnest function
    SELECT common_id INTO v_common_ancestor
    FROM (
        SELECT ancestor AS common_id, 
               array_position(v_ancestors_source, ancestor) + array_position(v_ancestors_target, ancestor) AS position_sum
        FROM unnest(v_ancestors_source) AS ancestor
        WHERE ancestor = ANY(v_ancestors_target)
    ) AS common_ancestors
    ORDER BY position_sum
    LIMIT 1;
    
    RETURN v_common_ancestor;
END;
$$ LANGUAGE plpgsql;

-- Function to generate granular merge operations
CREATE OR REPLACE FUNCTION public.generate_merge_operations(
    p_patch_request_id uuid,
    p_source_content jsonb,
    p_target_content jsonb,
    p_merged_content jsonb,
    p_user_id uuid,
    p_source_composite_id uuid,
    p_target_composite_id uuid,
    p_conflicts jsonb
) RETURNS void AS $$
DECLARE
    v_lamport_timestamp bigint;
    v_site_id uuid;
    v_position_id text;
    v_metadata jsonb;
    v_source_ops jsonb;
    v_target_ops jsonb;
    v_content_id uuid;
    v_path text[];
BEGIN
    -- Get or create a site ID for the user
    SELECT get_or_create_site_id(p_user_id) INTO v_site_id;
    
    -- Get the current highest Lamport timestamp and increment
    SELECT COALESCE(MAX(lamport_timestamp), 0) + 1 INTO v_lamport_timestamp
    FROM public.db_operations;
    
    -- Get the content ID from the patch request
    SELECT new_version_id INTO v_content_id
    FROM public.patch_requests 
    WHERE id = p_patch_request_id;
    
    -- IMPORTANT: Instead of generating new operations, we'll reuse the original operations
    -- This ensures that the granular operations done in each branch are preserved
    
    -- Get existing operations linked to the source composite since ancestor
    SELECT jsonb_agg(row_to_json(op)) INTO v_source_ops
    FROM (
        SELECT 
            op.path,
            op.operation_type,
            op.old_value,
            op.new_value,
            op.metadata,
            pr.composite_id
        FROM public.db_operations op
        JOIN public.patch_requests pr ON op.patch_request_id = pr.id
        WHERE pr.composite_id = p_source_composite_id
        AND pr.status = 'approved'
        ORDER BY op.lamport_timestamp
    ) AS op;

    -- Get existing operations linked to the target composite since ancestor
    SELECT jsonb_agg(row_to_json(op)) INTO v_target_ops
    FROM (
        SELECT 
            op.path,
            op.operation_type,
            op.old_value,
            op.new_value,
            op.metadata,
            pr.composite_id
        FROM public.db_operations op
        JOIN public.patch_requests pr ON op.patch_request_id = pr.id
        WHERE pr.composite_id = p_target_composite_id
        AND pr.status = 'approved'
        ORDER BY op.lamport_timestamp
    ) AS op;
    
    -- Ensure we have arrays, even if empty
    v_source_ops := COALESCE(v_source_ops, '[]'::jsonb);
    v_target_ops := COALESCE(v_target_ops, '[]'::jsonb);
    
    -- For each operation from source, create a new operation in the merge
    IF jsonb_array_length(v_source_ops) > 0 THEN
        FOR i IN 0..jsonb_array_length(v_source_ops)-1 LOOP
            v_position_id := gen_random_uuid()::text;
            v_metadata := jsonb_build_object(
                'merge_operation', true,
                'source_composite_id', p_source_composite_id,
                'target_composite_id', p_target_composite_id,
                'original_operation', 'source',
                'original_path', v_source_ops->i->>'path'
            );
            
            -- Preserve the is_array_operation flag if it exists in the original operation
            IF (v_source_ops->i->'metadata'->>'is_array_operation')::boolean IS TRUE THEN
                v_metadata := v_metadata || jsonb_build_object('is_array_operation', true);
            END IF;
            
            -- Properly convert the path from JSONB to text[]
            SELECT array_agg(value::text) INTO v_path
            FROM jsonb_array_elements_text((v_source_ops->i->'path'));
            
            -- Check for conflicts
            IF p_conflicts IS NOT NULL AND jsonb_array_length(p_conflicts) > 0 THEN
                FOR j IN 0..jsonb_array_length(p_conflicts)-1 LOOP
                    IF v_path IS NOT NULL AND p_conflicts->j->>'path' = '/' || array_to_string(v_path, '/') THEN
                        v_metadata := v_metadata || jsonb_build_object(
                            'is_conflict', true,
                            'conflict_details', p_conflicts->j
                        );
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Create operation record from source
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                content_id,
                lamport_timestamp,
                site_id,
                vector_clock,
                position_id,
                composite_id,
                metadata
            ) VALUES (
                p_patch_request_id,
                v_source_ops->i->>'operation_type',
                v_path,
                v_source_ops->i->'old_value',
                v_source_ops->i->'new_value',
                p_user_id,
                v_content_id,
                v_lamport_timestamp + i,
                v_site_id,
                jsonb_build_object(v_site_id::text, v_lamport_timestamp + i),
                v_position_id,
                p_source_composite_id,
                v_metadata
            );
        END LOOP;
    END IF;
    
    -- For each operation from target, create a new operation in the merge
    IF jsonb_array_length(v_target_ops) > 0 THEN
        FOR i IN 0..jsonb_array_length(v_target_ops)-1 LOOP
            v_position_id := gen_random_uuid()::text;
            v_metadata := jsonb_build_object(
                'merge_operation', true,
                'source_composite_id', p_source_composite_id,
                'target_composite_id', p_target_composite_id,
                'original_operation', 'target',
                'original_path', v_target_ops->i->>'path'
            );
            
            -- Preserve the is_array_operation flag if it exists in the original operation
            IF (v_target_ops->i->'metadata'->>'is_array_operation')::boolean IS TRUE THEN
                v_metadata := v_metadata || jsonb_build_object('is_array_operation', true);
            END IF;
            
            -- Properly convert the path from JSONB to text[]
            SELECT array_agg(value::text) INTO v_path
            FROM jsonb_array_elements_text((v_target_ops->i->'path'));
            
            -- Check for conflicts
            IF p_conflicts IS NOT NULL AND jsonb_array_length(p_conflicts) > 0 THEN
                FOR j IN 0..jsonb_array_length(p_conflicts)-1 LOOP
                    IF v_path IS NOT NULL AND p_conflicts->j->>'path' = '/' || array_to_string(v_path, '/') THEN
                        v_metadata := v_metadata || jsonb_build_object(
                            'is_conflict', true,
                            'conflict_details', p_conflicts->j
                        );
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Create operation record from target
            INSERT INTO public.db_operations (
                patch_request_id,
                operation_type,
                path,
                old_value,
                new_value,
                author,
                content_id,
                lamport_timestamp,
                site_id,
                vector_clock,
                position_id,
                composite_id,
                metadata
            ) VALUES (
                p_patch_request_id,
                v_target_ops->i->>'operation_type',
                v_path,
                v_target_ops->i->'old_value',
                v_target_ops->i->'new_value',
                p_user_id,
                v_content_id,
                v_lamport_timestamp + jsonb_array_length(v_source_ops) + i,
                v_site_id,
                jsonb_build_object(v_site_id::text, v_lamport_timestamp + jsonb_array_length(v_source_ops) + i),
                v_position_id,
                p_target_composite_id,
                v_metadata
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Three-way merge function - refactored for 100% CRDT-based approach
CREATE OR REPLACE FUNCTION public.three_way_merge_composites(
    p_user_id uuid,
    p_source_composite_id uuid,
    p_target_composite_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_source_composite record;
    v_target_composite record;
    v_ancestor_id uuid;
    v_ancestor_composite record;
    v_source_content jsonb;
    v_target_content jsonb;
    v_ancestor_content jsonb;
    v_merged_content jsonb;
    v_patch_request_id uuid;
    v_snapshot_id uuid := gen_random_uuid();
    v_new_content_id uuid := gen_random_uuid();
    v_conflicts_detected integer := 0;
    v_vector_clock jsonb;
    v_source_operations uuid[];
    v_target_operations uuid[];
    v_all_operations uuid[];
    v_operation_record record;
    v_op_conflicts jsonb := '[]'::jsonb;
    v_path_operations jsonb := '{}'::jsonb;
    v_op_paths text[];
    v_source_ops jsonb := '{}'::jsonb;
    v_target_ops jsonb := '{}'::jsonb;
    v_path_key text;
BEGIN
    -- 1. Get composite data and validate
    SELECT * INTO v_source_composite 
    FROM public.composites 
    WHERE id = p_source_composite_id;
    
    IF v_source_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Source composite not found',
            'details', format('Composite with id %s not found', p_source_composite_id)
        );
    END IF;
    
    SELECT * INTO v_target_composite 
    FROM public.composites 
    WHERE id = p_target_composite_id;
    
    IF v_target_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Target composite not found',
            'details', format('Composite with id %s not found', p_target_composite_id)
        );
    END IF;
    
    -- 2. Find common ancestor
    v_ancestor_id := public.find_common_ancestor(p_source_composite_id, p_target_composite_id);
    
    -- If no common ancestor, use the older of the two
    IF v_ancestor_id IS NULL THEN
        RAISE NOTICE 'No common ancestor found, using the older of the two composites';
        
        IF v_source_composite.created_at < v_target_composite.created_at THEN
            v_ancestor_id := p_source_composite_id;
        ELSE
            v_ancestor_id := p_target_composite_id;
        END IF;
    END IF;
    
    -- Get ancestor composite data
    SELECT * INTO v_ancestor_composite
    FROM public.composites
    WHERE id = v_ancestor_id;
    
    -- Get content for all three versions
    SELECT json INTO v_source_content
    FROM public.db
    WHERE id = v_source_composite.compose_id;
    
    SELECT json INTO v_target_content
    FROM public.db
    WHERE id = v_target_composite.compose_id;
    
    SELECT json INTO v_ancestor_content
    FROM public.db
    WHERE id = v_ancestor_composite.compose_id;
    
    -- 3. Find all operations that have been applied since the ancestor
    -- Get operations from ancestor to source
    WITH RECURSIVE ancestor_path AS (
        -- Start with the direct operations on the source composite since the ancestor
        SELECT op.id, op.patch_request_id, op.operation_type, op.path, op.old_value, op.new_value, 
               op.lamport_timestamp, op.site_id, op.vector_clock, op.position_id,
               op.content_id, op.author, op.composite_id, op.metadata
        FROM public.db_operations op
        JOIN public.patch_requests pr ON op.patch_request_id = pr.id
        WHERE pr.composite_id = p_source_composite_id
        AND pr.old_version_id = v_ancestor_composite.compose_id
        AND pr.status = 'approved'
        
        UNION ALL
        
        -- Recursively get all subsequent operations in the chain
        SELECT op.id, op.patch_request_id, op.operation_type, op.path, op.old_value, op.new_value,
               op.lamport_timestamp, op.site_id, op.vector_clock, op.position_id,
               op.content_id, op.author, op.composite_id, op.metadata
        FROM public.db_operations op
        JOIN public.patch_requests pr ON op.patch_request_id = pr.id
        JOIN ancestor_path ap ON pr.old_version_id = ap.content_id
        WHERE pr.composite_id = p_source_composite_id
        AND pr.status = 'approved'
    )
    SELECT array_agg(id) INTO v_source_operations
    FROM ancestor_path;
    
    -- Get operations from ancestor to target
    WITH RECURSIVE ancestor_path AS (
        -- Start with the direct operations on the target composite since the ancestor
        SELECT op.id, op.patch_request_id, op.operation_type, op.path, op.old_value, op.new_value, 
               op.lamport_timestamp, op.site_id, op.vector_clock, op.position_id,
               op.content_id, op.author, op.composite_id, op.metadata
        FROM public.db_operations op
        JOIN public.patch_requests pr ON op.patch_request_id = pr.id
        WHERE pr.composite_id = p_target_composite_id
        AND pr.old_version_id = v_ancestor_composite.compose_id
        AND pr.status = 'approved'
        
        UNION ALL
        
        -- Recursively get all subsequent operations in the chain
        SELECT op.id, op.patch_request_id, op.operation_type, op.path, op.old_value, op.new_value,
               op.lamport_timestamp, op.site_id, op.vector_clock, op.position_id,
               op.content_id, op.author, op.composite_id, op.metadata
        FROM public.db_operations op
        JOIN public.patch_requests pr ON op.patch_request_id = pr.id
        JOIN ancestor_path ap ON pr.old_version_id = ap.content_id
        WHERE pr.composite_id = p_target_composite_id
        AND pr.status = 'approved'
    )
    SELECT array_agg(id) INTO v_target_operations
    FROM ancestor_path;
    
    -- Handle case where operations are not found
    v_source_operations := COALESCE(v_source_operations, ARRAY[]::uuid[]);
    v_target_operations := COALESCE(v_target_operations, ARRAY[]::uuid[]);
    
    -- Combine operations in CRDT order (based on Lamport timestamps)
    v_all_operations := v_source_operations || v_target_operations;
    
    -- Sort operations by Lamport timestamp
    SELECT array_agg(id ORDER BY lamport_timestamp, site_id) INTO v_all_operations
    FROM public.db_operations
    WHERE id = ANY(v_all_operations);
    
    -- Store all operations by their path to analyze conflicts at the path level
    -- First gather all operations from source
    FOR i IN 1..COALESCE(array_length(v_source_operations, 1), 0) LOOP
        SELECT 
            jsonb_build_object(
                'id', id,
                'operation_type', operation_type,
                'path', path,
                'old_value', old_value,
                'new_value', new_value,
                'metadata', metadata,
                'composite_id', composite_id,
                'branch', 'source'
            ) INTO v_operation_record
        FROM public.db_operations
        WHERE id = v_source_operations[i];
        
        -- Store by path string for easy lookup
        v_path_key := array_to_string(v_operation_record.path, '/');
        v_source_ops := jsonb_set(
            v_source_ops, 
            ARRAY[v_path_key], 
            COALESCE(v_source_ops->v_path_key, '[]'::jsonb) || to_jsonb(v_operation_record)
        );
    END LOOP;
    
    -- Then gather all operations from target
    FOR i IN 1..COALESCE(array_length(v_target_operations, 1), 0) LOOP
        SELECT 
            jsonb_build_object(
                'id', id,
                'operation_type', operation_type,
                'path', path,
                'old_value', old_value,
                'new_value', new_value,
                'metadata', metadata,
                'composite_id', composite_id,
                'branch', 'target'
            ) INTO v_operation_record
        FROM public.db_operations
        WHERE id = v_target_operations[i];
        
        -- Store by path string for easy lookup
        v_path_key := array_to_string(v_operation_record.path, '/');
        v_target_ops := jsonb_set(
            v_target_ops, 
            ARRAY[v_path_key], 
            COALESCE(v_target_ops->v_path_key, '[]'::jsonb) || to_jsonb(v_operation_record)
        );
    END LOOP;

    -- PURE CRDT OPERATION CONFLICT DETECTION
    -- Get all unique paths that have operations
    SELECT array_agg(DISTINCT p) INTO v_op_paths
    FROM (
        SELECT jsonb_object_keys(v_source_ops) AS p
        UNION
        SELECT jsonb_object_keys(v_target_ops) AS p
    ) AS paths;
    
    -- For each path, check if there are conflicting operations from both branches
    IF v_op_paths IS NOT NULL THEN
        FOR i IN 1..array_length(v_op_paths, 1) LOOP
            v_path_key := v_op_paths[i];
            
            -- Only check paths that have operations from both branches
            IF v_source_ops ? v_path_key AND v_target_ops ? v_path_key THEN
                -- Analyze operations at this path
                DECLARE
                    v_source_path_ops jsonb := v_source_ops->v_path_key;
                    v_target_path_ops jsonb := v_target_ops->v_path_key;
                    v_source_last_op jsonb;
                    v_target_last_op jsonb;
                    v_are_complementary boolean := false;
                BEGIN
                    -- Get the last operation from each branch for this path
                    v_source_last_op := v_source_path_ops->(jsonb_array_length(v_source_path_ops)-1);
                    v_target_last_op := v_target_path_ops->(jsonb_array_length(v_target_path_ops)-1);
                    
                    -- Check if operations are complementary rather than conflicting
                    -- Two operations are complementary if:
                    -- 1. They have the same effect (both add the same value, both remove, etc.)
                    -- 2. They are part of a sequence that results in the same end state (add+modify or remove+add of same value)
                    
                    -- Check for same operation type and same values
                    IF v_source_last_op->>'operation_type' = v_target_last_op->>'operation_type' AND
                       jsonb_typeof(v_source_last_op->'new_value') = jsonb_typeof(v_target_last_op->'new_value') AND
                       v_source_last_op->'new_value' = v_target_last_op->'new_value' THEN
                        v_are_complementary := true;
                    END IF;
                    
                    -- If operations affect arrays, check the specific array element rather than the whole array
                    IF (v_source_last_op->'metadata'->>'is_array_operation')::boolean IS TRUE AND
                       (v_target_last_op->'metadata'->>'is_array_operation')::boolean IS TRUE THEN
                        
                        -- For array operations, we need to examine more carefully
                        -- If both branches added the same items or removed different items, they're complementary
                        v_are_complementary := true;
                    END IF;
                    
                    -- If operations are not complementary, they conflict
                    IF NOT v_are_complementary THEN
                        v_conflicts_detected := v_conflicts_detected + 1;
                        
                        -- Split the path into components for the UI display
                        DECLARE
                            v_path_array text[];
                            v_display_path text;
                        BEGIN
                            -- Parse the path into an array for more readable display
                            v_path_array := string_to_array(v_path_key, '/');
                            v_display_path := '/' || v_path_key;
                            
                            v_op_conflicts := v_op_conflicts || jsonb_build_object(
                                'path', v_path_array,
                                'source_operation', v_source_last_op->'id',
                                'target_operation', v_target_last_op->'id',
                                'operation_type', COALESCE(v_source_last_op->>'operation_type', v_target_last_op->>'operation_type'),
                                'source_value', v_source_last_op->'new_value',
                                'target_value', v_target_last_op->'new_value',
                                'resolution', 'target' -- Default to target's value
                            );
                        END;
                    END IF;
                END;
            END IF;
        END LOOP;
    END IF;
    
    -- Apply operations in CRDT order to get merged content
    IF v_all_operations IS NOT NULL AND array_length(v_all_operations, 1) > 0 THEN
        -- Apply all operations to the ancestor content
        v_merged_content := public.apply_operations(v_ancestor_content, v_all_operations);
    ELSE
        -- If no operations, just use the ancestor content
        v_merged_content := v_ancestor_content;
    END IF;
    
    -- 4. Create new content entry
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
        v_merged_content,
        p_user_id,
        (SELECT schema FROM public.db WHERE id = v_target_composite.compose_id),
        now(),
        now(),
        v_snapshot_id
    );
    
    -- 5. Create a merge patch request
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
        'Merge from ' || (SELECT title FROM public.composites WHERE id = p_source_composite_id),
        'Three-way merge from ' || p_source_composite_id || ' to ' || p_target_composite_id,
        p_user_id,
        v_target_composite.compose_id,
        v_new_content_id,
        p_target_composite_id,
        'merge',
        'pending',
        jsonb_build_object(
            'merge_strategy', 'three_way_crdt',
            'source_id', p_source_composite_id,
            'target_id', p_target_composite_id,
            'ancestor_id', v_ancestor_id,
            'conflicts_detected', v_conflicts_detected,
            'operations_count', array_length(v_all_operations, 1),
            'op_conflicts', v_op_conflicts,
            'is_drag_and_drop', true
        )
    )
    RETURNING id INTO v_patch_request_id;
    
    RAISE NOTICE 'Created merge patch request % with source_id % and target_id %', 
        v_patch_request_id, p_source_composite_id, p_target_composite_id;
    
    -- 6. Generate operations for the merge
    -- This will create operations based on the original operations from each branch
    PERFORM public.generate_merge_operations(
        v_patch_request_id,
        v_source_content,
        v_target_content,
        v_merged_content,
        p_user_id,
        p_source_composite_id,
        p_target_composite_id,
        v_op_conflicts
    );
    
    -- 7. Return the result
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Three-way merge completed successfully using CRDT operations',
        'patchRequestId', v_patch_request_id,
        'newContentId', v_new_content_id,
        'snapshotId', v_snapshot_id,
        'ancestorId', v_ancestor_id,
        'conflicts_detected', v_conflicts_detected,
        'operations_count', array_length(v_all_operations, 1),
        'op_conflicts', v_op_conflicts,
        'isDragAndDrop', true -- Flag for UI to recognize drag-and-drop merges
    );
END;
$$ LANGUAGE plpgsql;

-- Part 2: Add Metadata to Patch Requests
-- Description: Adds a JSONB metadata column to the patch_requests table for storing flexible data

-- Check if the column already exists before adding it
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patch_requests' 
        AND column_name = 'metadata'
    ) THEN
        -- Add the metadata column
        ALTER TABLE public.patch_requests ADD COLUMN metadata JSONB;
        
        -- Add index for json paths on metadata
        CREATE INDEX IF NOT EXISTS idx_patch_requests_metadata ON public.patch_requests USING GIN (metadata);
        
        RAISE NOTICE 'Added metadata column to patch_requests table';
    ELSE
        RAISE NOTICE 'metadata column already exists in patch_requests table';
    END IF;
END $$;

-- Part 3: Fix Merge Operations Apply
-- Description: Ensures that merge operations are properly applied when approving patch requests

-- Modify the approve_patch_request function to properly apply operations during approval
CREATE OR REPLACE FUNCTION public.approve_patch_request(p_patch_request_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
    v_composite "public"."composites";
    v_operations record;
    v_source_composite_id uuid;
    v_operations_array uuid[];
    v_old_content jsonb;
    v_new_content jsonb;
    v_archive_result jsonb;
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;

    -- Get the composite
    SELECT * INTO v_composite
    FROM public.composites
    WHERE id = v_patch_request.composite_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Composite not found for patch request';
    END IF;
    
    -- Check permissions if a user ID is provided
    IF p_user_id IS NOT NULL THEN
        -- Only the composite author can approve patch requests
        IF p_user_id != v_composite.author THEN
            RAISE EXCEPTION 'Only the composite author can approve patch requests';
        END IF;
    END IF;

    -- For merge operations, we need to ensure operations are applied correctly
    IF v_patch_request.operation_type = 'merge' THEN
        -- Get the old content
        SELECT json INTO v_old_content
        FROM public.db
        WHERE id = v_patch_request.old_version_id;
        
        -- Get operations for this patch request - FIX: Use a subquery to handle the GROUP BY issue
        SELECT array_agg(id ORDER BY lamport_timestamp, site_id) INTO v_operations_array
        FROM public.db_operations
        WHERE patch_request_id = p_patch_request_id;
        
        -- If we have operations, apply them to get the new content
        IF v_operations_array IS NOT NULL AND array_length(v_operations_array, 1) > 0 THEN
            -- Apply operations in CRDT order
            v_new_content := public.apply_operations(v_old_content, v_operations_array);
            
            -- Update the DB entry with the applied operations
            UPDATE public.db
            SET json = v_new_content
            WHERE id = v_patch_request.new_version_id;
            
            RAISE NOTICE 'Applied % operations to merge request %', array_length(v_operations_array, 1), p_patch_request_id;
        ELSE
            RAISE NOTICE 'No operations found for merge request %', p_patch_request_id;
        END IF;
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
    
    -- Auto-archive other pending merge requests for this composite from the same author
    -- This prevents conflicts when the same author has multiple pending merge requests
    IF v_patch_request.operation_type = 'merge' THEN
        UPDATE public.patch_requests
        SET status = 'rejected',
            updated_at = now(),
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_archived', true, 'archived_reason', 'Newer merge request was approved')
        WHERE 
            id != p_patch_request_id 
            AND composite_id = v_patch_request.composite_id
            AND author = v_patch_request.author
            AND operation_type = 'merge'
            AND status = 'pending';
            
        -- Get the source composite ID from the metadata
        v_source_composite_id := (v_patch_request.metadata->>'source_id')::uuid;
        
        RAISE NOTICE 'Checking for source composite to archive: metadata=%', v_patch_request.metadata;
        
        -- Auto-archive the source composite after the merge is approved
        -- This ensures the source composite is marked as archived after successfully merging
        IF v_source_composite_id IS NOT NULL THEN
            RAISE NOTICE 'Auto-archiving source composite % after merge approval', v_source_composite_id;
            
            -- Archive the source composite
            UPDATE public.composites 
            SET is_archived = TRUE,
                updated_at = now()
            WHERE id = v_source_composite_id;
            
            RAISE NOTICE 'Source composite % has been archived', v_source_composite_id;
        ELSE
            RAISE NOTICE 'No source_id found in metadata, unable to auto-archive source composite';
        END IF;
    END IF;

    RETURN v_patch_request;
END;
$$ LANGUAGE plpgsql; 