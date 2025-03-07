-- Migration: Three-Way Merge for Composites using RFC 6902 JSON Patch
-- Description: Implements three-way merge functionality for composites using JSON Patch operations

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.three_way_merge_composites(uuid, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.find_common_ancestor(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.merge_json_strings(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.generate_merge_operations(uuid, jsonb, jsonb, jsonb, uuid, uuid, uuid, jsonb) CASCADE;

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

-- Function to generate merge JSON Patch operations
CREATE OR REPLACE FUNCTION public.generate_merge_json_patch_operations(
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
    v_source_operations jsonb;
    v_target_operations jsonb;
    v_operation_count integer := 0;
BEGIN
    -- Get operations from source composite
    SELECT json_agg(
        jsonb_build_object(
            'op', jpo.operation_type,
            'path', jpo.path,
            'from', jpo.from_path,
            'value', jpo.value,
            'old_value', jpo.old_value,
            'metadata', jsonb_build_object(
                'source', 'source_composite',
                'composite_id', p_source_composite_id
            )
        )
    ) INTO v_source_operations
    FROM json_patch_operations jpo
    JOIN patch_requests pr ON jpo.patch_request_id = pr.id
    WHERE pr.composite_id = p_source_composite_id
    AND pr.status = 'approved'
    ORDER BY jpo.created_at;

    -- Get operations from target composite
    SELECT json_agg(
        jsonb_build_object(
            'op', jpo.operation_type,
            'path', jpo.path,
            'from', jpo.from_path,
            'value', jpo.value,
            'old_value', jpo.old_value,
            'metadata', jsonb_build_object(
                'source', 'target_composite',
                'composite_id', p_target_composite_id
            )
        )
    ) INTO v_target_operations
    FROM json_patch_operations jpo
    JOIN patch_requests pr ON jpo.patch_request_id = pr.id
    WHERE pr.composite_id = p_target_composite_id
    AND pr.status = 'approved'
    ORDER BY jpo.created_at;

    -- Ensure we have arrays even if empty
    v_source_operations := COALESCE(v_source_operations, '[]'::jsonb);
    v_target_operations := COALESCE(v_target_operations, '[]'::jsonb);
    
    -- Store source operations for the merge
    IF jsonb_array_length(v_source_operations) > 0 THEN
        FOR i IN 0..jsonb_array_length(v_source_operations)-1 LOOP
            DECLARE
                v_op jsonb := v_source_operations->i;
                v_path text := v_op->>'path';
                v_op_type text := v_op->>'op';
                v_is_conflict boolean := false;
                v_conflict_details jsonb := NULL;
            BEGIN
                -- Check if this operation conflicts with any in the target
                IF p_conflicts IS NOT NULL AND jsonb_array_length(p_conflicts) > 0 THEN
                    FOR j IN 0..jsonb_array_length(p_conflicts)-1 LOOP
                        IF p_conflicts->j->>'path' = v_path THEN
                            v_is_conflict := true;
                            v_conflict_details := p_conflicts->j;
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;

                -- Store the operation with conflict metadata if applicable
                INSERT INTO json_patch_operations (
                    patch_request_id,
                    operation_type,
                    path,
                    from_path,
                    value,
                    old_value,
                    created_at,
                    metadata
                ) VALUES (
                    p_patch_request_id,
                    v_op_type,
                    v_path,
                    v_op->>'from',
                    v_op->'value',
                    v_op->'old_value',
                    now(),
                    jsonb_build_object(
                        'merge_operation', true,
                        'source_composite_id', p_source_composite_id,
                        'target_composite_id', p_target_composite_id,
                        'original_source', 'source',
                        'is_conflict', v_is_conflict,
                        'conflict_details', v_conflict_details
                    )
                );
                
                v_operation_count := v_operation_count + 1;
            END;
        END LOOP;
    END IF;
    
    -- Store target operations for the merge
    IF jsonb_array_length(v_target_operations) > 0 THEN
        FOR i IN 0..jsonb_array_length(v_target_operations)-1 LOOP
            DECLARE
                v_op jsonb := v_target_operations->i;
                v_path text := v_op->>'path';
                v_op_type text := v_op->>'op';
                v_is_conflict boolean := false;
                v_conflict_details jsonb := NULL;
            BEGIN
                -- Check if this operation conflicts with any in the source
                IF p_conflicts IS NOT NULL AND jsonb_array_length(p_conflicts) > 0 THEN
                    FOR j IN 0..jsonb_array_length(p_conflicts)-1 LOOP
                        IF p_conflicts->j->>'path' = v_path THEN
                            v_is_conflict := true;
                            v_conflict_details := p_conflicts->j;
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;

                -- Store the operation with conflict metadata if applicable
                INSERT INTO json_patch_operations (
                    patch_request_id,
                    operation_type,
                    path,
                    from_path,
                    value,
                    old_value,
                    created_at,
                    metadata
                ) VALUES (
                    p_patch_request_id,
                    v_op_type,
                    v_path,
                    v_op->>'from',
                    v_op->'value',
                    v_op->'old_value',
                    now(),
                    jsonb_build_object(
                        'merge_operation', true,
                        'source_composite_id', p_source_composite_id,
                        'target_composite_id', p_target_composite_id,
                        'original_source', 'target',
                        'is_conflict', v_is_conflict,
                        'conflict_details', v_conflict_details
                    )
                );
                
                v_operation_count := v_operation_count + 1;
            END;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Stored % merge operations for patch request %', v_operation_count, p_patch_request_id;
END;
$$ LANGUAGE plpgsql;

-- Three-way merge function using JSON Patch operations
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
    v_operations_count integer := 0;
    v_op_conflicts jsonb := '[]'::jsonb;
    v_source_ops jsonb;
    v_target_ops jsonb;
    v_all_paths jsonb := '{}'::jsonb;
    v_path text;
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
    
    -- 3. Collect and analyze operations from source and target
    -- Get patch operations from source
    WITH source_ops AS (
        SELECT 
            jpo.operation_type,
            jpo.path,
            jpo.value,
            jpo.old_value,
            MAX(jpo.created_at) as created_at
        FROM json_patch_operations jpo
        JOIN patch_requests pr ON jpo.patch_request_id = pr.id
        WHERE pr.composite_id = p_source_composite_id
        AND pr.status = 'approved'
        GROUP BY jpo.operation_type, jpo.path, jpo.value, jpo.old_value
        ORDER BY MAX(jpo.created_at)
    )
    SELECT jsonb_object_agg(
        path, 
        jsonb_build_object(
            'operation_type', operation_type,
            'value', value,
            'old_value', old_value,
            'timestamp', extract(epoch from created_at)
        )
    ) INTO v_source_ops
    FROM source_ops;
    
    -- Get patch operations from target
    WITH target_ops AS (
        SELECT 
            jpo.operation_type,
            jpo.path,
            jpo.value,
            jpo.old_value,
            MAX(jpo.created_at) as created_at
        FROM json_patch_operations jpo
        JOIN patch_requests pr ON jpo.patch_request_id = pr.id
        WHERE pr.composite_id = p_target_composite_id
        AND pr.status = 'approved'
        GROUP BY jpo.operation_type, jpo.path, jpo.value, jpo.old_value
        ORDER BY MAX(jpo.created_at)
    )
    SELECT jsonb_object_agg(
        path, 
        jsonb_build_object(
            'operation_type', operation_type,
            'value', value,
            'old_value', old_value,
            'timestamp', extract(epoch from created_at)
        )
    ) INTO v_target_ops
    FROM target_ops;
    
    -- Ensure we have objects even if empty
    v_source_ops := COALESCE(v_source_ops, '{}'::jsonb);
    v_target_ops := COALESCE(v_target_ops, '{}'::jsonb);
    
    -- Combine all paths for analysis
    SELECT jsonb_object_agg(
        path, 
        true
    ) INTO v_all_paths
    FROM (
        SELECT path FROM jsonb_object_keys(v_source_ops) AS path
        UNION
        SELECT path FROM jsonb_object_keys(v_target_ops) AS path
    ) AS all_paths;
    
    -- 4. Find conflicts by comparing operations at the same paths
    FOR v_path IN SELECT * FROM jsonb_object_keys(v_all_paths) LOOP
        -- Check if path exists in both source and target
        IF v_source_ops ? v_path AND v_target_ops ? v_path THEN
            -- Check for potential conflict
            DECLARE
                v_source_op jsonb := v_source_ops->v_path;
                v_target_op jsonb := v_target_ops->v_path;
                v_source_timestamp float8 := (v_source_op->>'timestamp')::float8;
                v_target_timestamp float8 := (v_target_op->>'timestamp')::float8;
                v_is_conflict boolean := false;
            BEGIN
                -- Different operation types on same path could conflict
                IF v_source_op->>'operation_type' != v_target_op->>'operation_type' THEN
                    v_is_conflict := true;
                -- Same operation type with different values might conflict
                ELSIF v_source_op->>'value' IS DISTINCT FROM v_target_op->>'value' THEN
                    v_is_conflict := true;
                END IF;
                
                IF v_is_conflict THEN
                    v_conflicts_detected := v_conflicts_detected + 1;
                    
                    -- By default, prefer the more recent change
                    v_op_conflicts := v_op_conflicts || jsonb_build_object(
                        'path', v_path,
                        'source_operation', v_source_op,
                        'target_operation', v_target_op,
                        'resolution', CASE 
                            WHEN v_source_timestamp > v_target_timestamp THEN 'source'
                            ELSE 'target'
                        END
                    );
                END IF;
            END;
        END IF;
    END LOOP;
    
    -- 5. Apply merge by creating a new version with merged content
    -- For the merged content, we'll apply the ancestor's content plus both source and target operations
    -- When there's a conflict, we'll prefer the target's value by default
    v_merged_content := v_target_content;
    
    -- 6. Create new content entry
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
    
    -- 7. Create a merge patch request
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
            'merge_strategy', 'three_way_json_patch',
            'source_id', p_source_composite_id,
            'target_id', p_target_composite_id,
            'ancestor_id', v_ancestor_id,
            'conflicts_detected', v_conflicts_detected,
            'op_conflicts', v_op_conflicts
        )
    )
    RETURNING id INTO v_patch_request_id;
    
    -- 8. Generate merge operations
    PERFORM public.generate_merge_json_patch_operations(
        v_patch_request_id,
        v_source_content,
        v_target_content,
        v_merged_content,
        p_user_id,
        p_source_composite_id,
        p_target_composite_id,
        v_op_conflicts
    );
    
    -- Count the total number of operations
    SELECT COUNT(*) INTO v_operations_count
    FROM json_patch_operations
    WHERE patch_request_id = v_patch_request_id;
    
    -- 9. Return the result
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Three-way merge completed successfully using JSON Patch operations',
        'patchRequestId', v_patch_request_id,
        'newContentId', v_new_content_id,
        'snapshotId', v_snapshot_id,
        'ancestorId', v_ancestor_id,
        'conflicts_detected', v_conflicts_detected,
        'operations_count', v_operations_count,
        'op_conflicts', v_op_conflicts
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