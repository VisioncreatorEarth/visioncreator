-- Migration: Comprehensive Database Merging System
-- Description: Implements a complete three-way merge system, common ancestor detection, 
-- merge candidate finding, and supporting metadata columns

-- ===============================================
-- Part 1: Add metadata to patch_requests table
-- ===============================================

-- Add metadata column to patch_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patch_requests' 
                  AND column_name = 'metadata') THEN
        ALTER TABLE public.patch_requests ADD COLUMN metadata jsonb;
        COMMENT ON COLUMN public.patch_requests.metadata IS 'JSON metadata for the patch request, including merge-specific data';
    END IF;
END $$;

-- Add operation_type column to patch_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'patch_requests' 
                  AND column_name = 'operation_type') THEN
        ALTER TABLE public.patch_requests ADD COLUMN operation_type text;
        COMMENT ON COLUMN public.patch_requests.operation_type IS 'Type of operation, e.g. edit, merge, branch';
    END IF;
END $$;

-- Create index for faster querying with operation_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                  FROM pg_indexes 
                  WHERE tablename = 'patch_requests' 
                  AND indexname = 'patch_requests_operation_type_idx') THEN
        CREATE INDEX patch_requests_operation_type_idx ON public.patch_requests (operation_type);
    END IF;
END $$;

-- ===============================================
-- Part 2: Find Nearest Common Ancestor Function
-- ===============================================

-- Function to find the nearest common ancestor between two composites
CREATE OR REPLACE FUNCTION public.find_nearest_common_ancestor(
    p_composite_a uuid,
    p_composite_b uuid
) RETURNS uuid AS $$
DECLARE
    v_ancestor_id uuid = NULL;
BEGIN
    -- Check if they're the same composite
    IF p_composite_a = p_composite_b THEN
        RETURN p_composite_a;
    END IF;
    
    -- First check: Are they direct variations of each other?
    SELECT target_composite_id INTO v_ancestor_id
    FROM composite_relationships
    WHERE source_composite_id = p_composite_a 
      AND target_composite_id = p_composite_b 
      AND relationship_type = 'variation_of';
      
    IF v_ancestor_id IS NOT NULL THEN
        RETURN p_composite_b; -- B is the ancestor of A
    END IF;
    
    -- Check the reverse relation
    SELECT target_composite_id INTO v_ancestor_id
    FROM composite_relationships
    WHERE source_composite_id = p_composite_b 
      AND target_composite_id = p_composite_a 
      AND relationship_type = 'variation_of';
      
    IF v_ancestor_id IS NOT NULL THEN
        RETURN p_composite_a; -- A is the ancestor of B
    END IF;
    
    -- Look for a common parent one level up
    SELECT cr1.target_composite_id INTO v_ancestor_id
    FROM composite_relationships cr1
    JOIN composite_relationships cr2 ON cr1.target_composite_id = cr2.target_composite_id
    WHERE cr1.source_composite_id = p_composite_a
      AND cr2.source_composite_id = p_composite_b
      AND cr1.relationship_type = 'variation_of'
      AND cr2.relationship_type = 'variation_of'
    LIMIT 1;
    
    -- Return either the found ancestor or null
    RETURN v_ancestor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.find_nearest_common_ancestor IS 'Finds the nearest common ancestor between two composites by examining their variation relationships';

-- ===============================================
-- Part 3: Three-Way Merge Function
-- ===============================================

-- Create function to merge composites using three-way merge and CRDT principles
CREATE OR REPLACE FUNCTION public.three_way_merge_composites(
    p_user_id uuid,
    p_source_composite_id uuid,
    p_target_composite_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_source_composite record;
    v_target_composite record;
    v_ancestor_id uuid;
    v_ancestor_content jsonb;
    v_source_content jsonb;
    v_target_content jsonb;
    v_merged_content jsonb;
    v_operations_source uuid[];
    v_operations_target uuid[];
    v_all_ops uuid[] := ARRAY[]::uuid[];
    v_generated_ops uuid[] := ARRAY[]::uuid[];
    v_conflicts record;
    v_new_content_id uuid := gen_random_uuid();
    v_patch_request_id uuid;
    v_new_snapshot_id uuid := gen_random_uuid();
    v_conflict_count integer := 0;
    v_operation_count integer := 0;
    v_source_array_ops jsonb := '{}'::jsonb;
    v_target_array_ops jsonb := '{}'::jsonb;
    v_lamport_timestamp bigint;
    v_site_id uuid := p_user_id;
    v_operation_id uuid;
    v_result jsonb;
    v_source_ancestors uuid[] := ARRAY[]::uuid[];
    v_target_ancestors uuid[] := ARRAY[]::uuid[];
    v_common_ancestors uuid[] := ARRAY[]::uuid[];
    v_most_recent_common_ancestor uuid;
    v_ancestor_depth integer;
    v_min_depth integer := 999999;
    v_operation_result jsonb := '{}'::jsonb;
BEGIN
    -- Get source composite
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
    
    -- Get target composite
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
    
    -- Get all ancestors for source composite using recursive CTE with depth tracking
    WITH RECURSIVE source_ancestry AS (
        -- Start with the direct ancestor of source
        SELECT target_composite_id, source_composite_id, 1 AS depth
        FROM public.composite_relationships
        WHERE target_composite_id = p_source_composite_id AND relationship_type = 'branch'
        
        UNION ALL
        
        -- Add ancestors of each ancestor
        SELECT cr.target_composite_id, cr.source_composite_id, sa.depth + 1
        FROM public.composite_relationships cr
        JOIN source_ancestry sa ON cr.target_composite_id = sa.source_composite_id
        WHERE cr.relationship_type = 'branch'
    )
    SELECT array_agg(source_composite_id) INTO v_source_ancestors
    FROM source_ancestry;
    
    -- Get all ancestors for target composite using recursive CTE with depth tracking
    WITH RECURSIVE target_ancestry AS (
        -- Start with the direct ancestor of target
        SELECT target_composite_id, source_composite_id, 1 AS depth
        FROM public.composite_relationships
        WHERE target_composite_id = p_target_composite_id AND relationship_type = 'branch'
        
        UNION ALL
        
        -- Add ancestors of each ancestor
        SELECT cr.target_composite_id, cr.source_composite_id, ta.depth + 1
        FROM public.composite_relationships cr
        JOIN target_ancestry ta ON cr.target_composite_id = ta.source_composite_id
        WHERE cr.relationship_type = 'branch'
    )
    SELECT array_agg(source_composite_id) INTO v_target_ancestors
    FROM target_ancestry;
    
    -- Handle null arrays
    v_source_ancestors := COALESCE(v_source_ancestors, ARRAY[]::uuid[]);
    v_target_ancestors := COALESCE(v_target_ancestors, ARRAY[]::uuid[]);
    
    -- Find common ancestors
    SELECT array(
        SELECT unnest(v_source_ancestors)
        INTERSECT
        SELECT unnest(v_target_ancestors)
    ) INTO v_common_ancestors;
    
    -- Find the most recent common ancestor (lowest depth)
    IF array_length(v_common_ancestors, 1) > 0 THEN
        -- For each common ancestor, find the minimum depth in both trees
        FOREACH v_ancestor_id IN ARRAY v_common_ancestors
        LOOP
            -- Find depth in source ancestry
            WITH RECURSIVE source_depth AS (
                SELECT target_composite_id, source_composite_id, 1 AS depth
                FROM public.composite_relationships
                WHERE target_composite_id = p_source_composite_id AND relationship_type = 'branch'
                
                UNION ALL
                
                SELECT cr.target_composite_id, cr.source_composite_id, sd.depth + 1
                FROM public.composite_relationships cr
                JOIN source_depth sd ON cr.target_composite_id = sd.source_composite_id
                WHERE cr.relationship_type = 'branch'
            )
            SELECT MIN(depth) INTO v_ancestor_depth
            FROM source_depth
            WHERE source_composite_id = v_ancestor_id;
            
            -- If this is the most recent common ancestor so far, update
            IF v_ancestor_depth < v_min_depth THEN
                v_min_depth := v_ancestor_depth;
                v_most_recent_common_ancestor := v_ancestor_id;
            END IF;
        END LOOP;
        
        -- Set the ancestor ID to the most recent common ancestor
        v_ancestor_id := v_most_recent_common_ancestor;
    ELSE
        -- Check direct relationship between source and target
        IF p_source_composite_id = ANY(v_target_ancestors) THEN
            v_ancestor_id := p_source_composite_id;  -- Source is an ancestor of target
        ELSIF p_target_composite_id = ANY(v_source_ancestors) THEN
            v_ancestor_id := p_target_composite_id;  -- Target is an ancestor of source
        ELSE
            -- If no common ancestor, use an empty object as base
            v_ancestor_id := NULL;
        END IF;
    END IF;
    
    -- Get the content
    SELECT json INTO v_source_content
    FROM public.db
    WHERE id = v_source_composite.compose_id;
    
    SELECT json INTO v_target_content
    FROM public.db
    WHERE id = v_target_composite.compose_id;
    
    -- Get or infer ancestor content
    IF v_ancestor_id IS NOT NULL THEN
        -- Get the ancestor's content
        IF v_ancestor_id = p_source_composite_id THEN
            v_ancestor_content := v_source_content;
        ELSIF v_ancestor_id = p_target_composite_id THEN
            v_ancestor_content := v_target_content;
        ELSE
            -- Get the compose_id for the ancestor
            SELECT compose_id INTO v_ancestor_id
            FROM public.composites
            WHERE id = v_ancestor_id;
            
            -- Get the ancestor content
            SELECT json INTO v_ancestor_content
            FROM public.db
            WHERE id = v_ancestor_id;
        END IF;
    ELSE
        -- If no common ancestor, use an empty object as base
        v_ancestor_content := '{}'::jsonb;
    END IF;
    
    -- Create a patch request for the merge - set status to 'pending' to allow manual review
    INSERT INTO public.patch_requests (
        title,
        description,
        author,
        old_version_id,
        new_version_id,
        composite_id,
        operation_type,
        metadata,
        status
    ) VALUES (
        'Merge from ' || v_source_composite.title,
        'Three-way merge from ' || v_source_composite.title || ' to ' || v_target_composite.title,
        p_user_id,
        v_target_composite.compose_id,
        v_new_content_id,
        p_target_composite_id,
        'merge',
        jsonb_build_object(
            'merge_strategy', 'three_way',
            'source_composite', p_source_composite_id,
            'target_composite', p_target_composite_id,
            'ancestor_composite', v_ancestor_id,
            'source_ancestors', v_source_ancestors,
            'target_ancestors', v_target_ancestors,
            'common_ancestors', v_common_ancestors,
            'most_recent_common_ancestor_depth', v_min_depth,
            'timestamp', now()
        ),
        'pending'  -- Set to pending so it can be manually reviewed
    )
    RETURNING id INTO v_patch_request_id;
    
    -- Get the latest Lamport timestamp for this site
    SELECT MAX(lamport_timestamp) INTO v_lamport_timestamp
    FROM public.db_operations
    WHERE site_id = v_site_id;
    
    v_lamport_timestamp := COALESCE(v_lamport_timestamp, 0);
    v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);
    
    -- Get operations from source to ancestor
    IF v_ancestor_id IS NOT NULL AND v_ancestor_id != p_source_composite_id THEN
        WITH RECURSIVE operation_chain AS (
            -- Start with operations directly applied to ancestor
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            WHERE pr.old_version_id = v_ancestor_id
            AND pr.status = 'approved'
            
            UNION ALL
            
            -- Also include operations directly on the source composite
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            WHERE pr.composite_id = p_source_composite_id
            AND pr.status = 'approved'
            
            UNION ALL
            
            -- Add operations from each step in the chain
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            JOIN operation_chain oc ON pr.old_version_id = (
                SELECT new_version_id 
                FROM public.patch_requests 
                WHERE id = oc.patch_request_id
            )
            -- Stop when we reach the source
            WHERE pr.new_version_id <> v_source_composite.compose_id
            AND pr.status = 'approved'
        )
        SELECT array_agg(id) INTO v_operations_source
        FROM operation_chain;
    ELSE
        -- If source is ancestor or no ancestor, no operations needed
        v_operations_source := ARRAY[]::uuid[];
    END IF;
    
    -- Get operations from target to ancestor
    IF v_ancestor_id IS NOT NULL AND v_ancestor_id != p_target_composite_id THEN
        WITH RECURSIVE operation_chain AS (
            -- Start with operations directly applied to ancestor
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            WHERE pr.old_version_id = v_ancestor_id
            AND pr.status = 'approved'
            
            UNION ALL
            
            -- Also include operations directly on the source composite
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            WHERE pr.composite_id = p_source_composite_id
            AND pr.status = 'approved'
            
            UNION ALL
            
            -- Also include operations directly on the target composite
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            WHERE pr.composite_id = p_target_composite_id
            AND pr.status = 'approved'
            
            UNION ALL
            
            -- Add operations from each step in the chain
            SELECT o.id, o.patch_request_id
            FROM public.db_operations o
            JOIN public.patch_requests pr ON o.patch_request_id = pr.id
            JOIN operation_chain oc ON pr.old_version_id = (
                SELECT new_version_id 
                FROM public.patch_requests 
                WHERE id = oc.patch_request_id
            )
            -- Stop when we reach the target
            WHERE pr.new_version_id <> v_target_composite.compose_id
            AND pr.status = 'approved'
        )
        SELECT array_agg(id) INTO v_operations_target
        FROM operation_chain;
    ELSE
        -- If target is ancestor or no ancestor, no operations needed
        v_operations_target := ARRAY[]::uuid[];
    END IF;
    
    -- Handle null arrays
    v_operations_source := COALESCE(v_operations_source, ARRAY[]::uuid[]);
    v_operations_target := COALESCE(v_operations_target, ARRAY[]::uuid[]);
    
    -- Combine all operations and apply them in lamport timestamp order
    v_all_ops := COALESCE(v_operations_source, ARRAY[]::uuid[]) || COALESCE(v_operations_target, ARRAY[]::uuid[]);
    
    -- Apply operations to the ancestor content
    v_merged_content := v_ancestor_content;
    
    -- Create a recursive function to merge arrays found in the JSON content
    -- This is now fully generic without special handling for specific array types
    CREATE OR REPLACE FUNCTION merge_arrays_recursively(
        source jsonb,
        target jsonb,
        ancestor jsonb
    ) RETURNS jsonb AS $merge_arrays$
    DECLARE
        merged jsonb;
        key text;
        source_value jsonb;
        target_value jsonb;
        ancestor_value jsonb;
        result_value jsonb;
    BEGIN
        -- First handle the case where one input is null
        IF source IS NULL THEN
            RETURN target;
        ELSIF target IS NULL THEN
            RETURN source;
        END IF;

        -- Handle the case where one or both inputs are arrays
        IF jsonb_typeof(source) = 'array' AND jsonb_typeof(target) = 'array' THEN
            -- Enhanced universal array merge logic
            DECLARE
                merged_array jsonb := '[]'::jsonb;
                source_array jsonb := source;
                target_array jsonb := target;
                ancestor_array jsonb := ancestor;
                item jsonb;
                found boolean;
                i integer;
                j integer;
                
                -- Track items to be removed
                removed_items jsonb := '[]'::jsonb;
            BEGIN
                -- Initialize ancestor_array if it's null or not an array
                IF ancestor_array IS NULL OR jsonb_typeof(ancestor_array) != 'array' THEN
                    ancestor_array := '[]'::jsonb;
                END IF;

                -- First, identify items that were removed in both branches
                IF jsonb_array_length(ancestor_array) > 0 THEN
                    FOR i IN 0..jsonb_array_length(ancestor_array) - 1 LOOP
                        item := ancestor_array->i;
                        
                        -- Check if item exists in source
                        found := false;
                        FOR j IN 0..jsonb_array_length(source_array) - 1 LOOP
                            -- For simple values (strings, numbers, etc.), use direct comparison
                            -- For objects and arrays, use type check and equality
                            IF (jsonb_typeof(item) IN ('string', 'number', 'boolean') AND source_array->j = item) OR
                               (jsonb_typeof(item) IN ('object', 'array') AND 
                                jsonb_typeof(source_array->j) = jsonb_typeof(item) AND 
                                source_array->j = item) THEN
                                found := true;
                                EXIT;
                            END IF;
                        END LOOP;
                        
                        -- If not in source, check if in target
                        IF NOT found THEN
                            FOR j IN 0..jsonb_array_length(target_array) - 1 LOOP
                                -- For simple values (strings, numbers, etc.), use direct comparison
                                -- For objects and arrays, use type check and equality
                                IF (jsonb_typeof(item) IN ('string', 'number', 'boolean') AND target_array->j = item) OR
                                   (jsonb_typeof(item) IN ('object', 'array') AND 
                                    jsonb_typeof(target_array->j) = jsonb_typeof(item) AND 
                                    target_array->j = item) THEN
                                    found := true;
                                    EXIT;
                                END IF;
                            END LOOP;
                            
                            -- If item exists in neither source nor target, add to removed items
                            -- (it was deleted in both branches)
                            IF NOT found THEN
                                removed_items := removed_items || jsonb_build_array(item);
                            END IF;
                        END IF;
                    END LOOP;
                END IF;

                -- Now merge the arrays, starting with all items from source
                merged_array := source_array;
                
                -- Add items from target that aren't in source
                FOR i IN 0..jsonb_array_length(target_array) - 1 LOOP
                    item := target_array->i;
                    found := false;
                    
                    -- Check if item exists in source
                    FOR j IN 0..jsonb_array_length(source_array) - 1 LOOP
                        -- For simple values (strings, numbers, etc.), use direct comparison
                        -- For objects and arrays, use type check and equality
                        IF (jsonb_typeof(item) IN ('string', 'number', 'boolean') AND source_array->j = item) OR
                           (jsonb_typeof(item) IN ('object', 'array') AND 
                            jsonb_typeof(source_array->j) = jsonb_typeof(item) AND 
                            source_array->j = item) THEN
                            found := true;
                            EXIT;
                        END IF;
                    END LOOP;
                    
                    -- Add if not found
                    IF NOT found THEN
                        merged_array := merged_array || jsonb_build_array(item);
                    END IF;
                END LOOP;
                
                -- Remove items that were intentionally deleted in both branches
                IF jsonb_array_length(removed_items) > 0 THEN
                    DECLARE
                        final_array jsonb := '[]'::jsonb;
                        should_keep boolean;
                    BEGIN
                        FOR i IN 0..jsonb_array_length(merged_array) - 1 LOOP
                            item := merged_array->i;
                            should_keep := true;
                            
                            -- Check if this item is in the removed_items list
                            FOR j IN 0..jsonb_array_length(removed_items) - 1 LOOP
                                -- For simple values (strings, numbers, etc.), use direct comparison
                                -- For objects and arrays, use type check and equality
                                IF (jsonb_typeof(item) IN ('string', 'number', 'boolean') AND removed_items->j = item) OR
                                   (jsonb_typeof(item) IN ('object', 'array') AND 
                                    jsonb_typeof(removed_items->j) = jsonb_typeof(item) AND 
                                    removed_items->j = item) THEN
                                    should_keep := false;
                                    EXIT;
                                END IF;
                            END LOOP;
                            
                            -- Keep the item if it's not in the removed list
                            IF should_keep THEN
                                final_array := final_array || jsonb_build_array(item);
                            END IF;
                        END LOOP;
                        
                        merged_array := final_array;
                    END;
                END IF;
                
                RETURN merged_array;
            END;
        ELSIF jsonb_typeof(source) = 'object' AND jsonb_typeof(target) = 'object' THEN
            -- For objects, start with target as the base
            merged := target;
            
            -- Iterate through all keys in source and recursively merge
            FOR key IN SELECT jsonb_object_keys(source)
            LOOP
                source_value := source->key;
                target_value := target->key;
                
                -- Get ancestor value if it exists
                IF ancestor IS NOT NULL AND jsonb_typeof(ancestor) = 'object' THEN
                    ancestor_value := ancestor->key;
                ELSE
                    ancestor_value := NULL;
                END IF;
                
                -- Skip null values in source
                IF source_value IS NULL THEN
                    CONTINUE;
                END IF;
                
                -- If target doesn't have this key, just use source value
                IF target_value IS NULL THEN
                    merged := jsonb_set(merged, ARRAY[key], source_value);
                ELSE
                    -- Both have the key, recursively merge the values
                    result_value := merge_arrays_recursively(source_value, target_value, ancestor_value);
                    merged := jsonb_set(merged, ARRAY[key], result_value);
                END IF;
            END LOOP;
            
            RETURN merged;
        ELSE
            -- For conflicting value types or primitive values, prefer target if changed from ancestor
            -- otherwise use source value
            IF ancestor IS NOT NULL AND target = ancestor THEN
                RETURN source;
            ELSE
                RETURN target;
            END IF;
        END IF;
    END;
    $merge_arrays$ LANGUAGE plpgsql;
    
    -- Apply our generic array merging algorithm to merge all arrays recursively
    v_merged_content := merge_arrays_recursively(v_source_content, v_target_content, v_ancestor_content);
    
    -- Apply operations if available
    IF v_all_ops IS NOT NULL AND array_length(v_all_ops, 1) > 0 THEN
        -- Use the CRDT-based apply_operations function for all operations
        -- The array merging logic will be preserved as we've already merged arrays
        v_merged_content := public.apply_operations(v_merged_content, v_all_ops);
    END IF;
    
    -- Create a new content entry with the merged result BEFORE generating operations
    -- This fixes the foreign key constraint violation
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
        v_target_composite.schema_id,
        now(),
        now(),
        v_new_snapshot_id
    );
    
    -- CRITICAL FIX: We need to generate operations based on the ACTUAL changes from ancestor to merged
    -- rather than from target to merged, which loses information about which changes came from which branch
    
    -- Explicitly generate operations to track what changed
    -- For a proper 3-way merge, we generate operations based on what actually changed since the ancestor
    -- This ensures we track what was truly added or removed during the merge
    PERFORM public.generate_operations_from_diff(
        v_ancestor_content,
        v_merged_content,
        v_patch_request_id,
        p_user_id,
        p_target_composite_id,
        v_new_content_id
    );
    
    -- Since generate_operations_from_diff doesn't return operation IDs, we need to query them separately
    SELECT array_agg(id) INTO v_generated_ops
    FROM public.db_operations
    WHERE patch_request_id = v_patch_request_id;
    
    -- Use empty array if no operations were found
    v_generated_ops := COALESCE(v_generated_ops, ARRAY[]::uuid[]);
    
    -- Check if there are any conflicts that need manual resolution
    -- In CRDT, conflicts are resolved automatically by the apply_operations function,
    -- but we might still want to track semantic conflicts
    FOR v_conflicts IN 
        SELECT * FROM public.detect_operation_conflicts(
            COALESCE(v_operations_source, ARRAY[]::uuid[]),
            COALESCE(v_operations_target, ARRAY[]::uuid[])
        )
    LOOP
        -- Just count conflicts for reporting
        v_conflict_count := v_conflict_count + 1;
        
        -- We could record conflicts here if needed
    END LOOP;
    
    -- Count operations - ensure we handle null values
    v_all_ops := COALESCE(v_all_ops, ARRAY[]::uuid[]);
    v_generated_ops := COALESCE(v_generated_ops, ARRAY[]::uuid[]);
    v_operation_count := COALESCE(array_length(v_all_ops || v_generated_ops, 1), 0);
    
    -- Clean up temporary function
    DROP FUNCTION IF EXISTS merge_arrays_recursively(jsonb, jsonb, jsonb);
    
    -- Update metadata for the patch request to include operation information
    UPDATE public.patch_requests
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb), 
        '{operations}', 
        jsonb_build_object(
            'all_ops', COALESCE(v_all_ops, ARRAY[]::uuid[]),
            'generated_ops', COALESCE(v_generated_ops, ARRAY[]::uuid[]),
            'operation_count', COALESCE(v_operation_count, 0)
        )
    )
    WHERE id = v_patch_request_id;
    
    -- Prepare result with proper null handling
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Merge created with operations - please review and approve',
        'newContentId', v_new_content_id,
        'patchRequestId', v_patch_request_id,
        'operationCount', COALESCE(v_operation_count, 0),
        'conflictCount', COALESCE(v_conflict_count, 0),
        'semanticConflicts', COALESCE(v_conflict_count, 0) > 0,
        'ancestorId', v_ancestor_id,
        'status', 'pending', -- Indicate that merge requires manual approval
        'generatedOperations', COALESCE(v_generated_ops, ARRAY[]::uuid[]),
        'existingOperations', COALESCE(v_all_ops, ARRAY[]::uuid[])
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.three_way_merge_composites IS 'Performs a three-way merge between two composites using their common ancestor for conflict resolution';

-- ===============================================
-- Part 4: Simple Merge Function (Fallback)
-- ===============================================

-- Simple merge function used as a fallback when no common ancestor is found
CREATE OR REPLACE FUNCTION public.simple_merge_composites(
    p_user_id uuid,
    p_source_composite_id uuid,
    p_target_composite_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_source_composite record;
    v_target_composite record;
    v_source_content jsonb;
    v_target_content jsonb;
    v_merged_content jsonb;
    v_new_content_id uuid := gen_random_uuid();
    v_new_snapshot_id uuid := gen_random_uuid();
    v_patch_request_id uuid;
    v_vector_clock jsonb;
    key text;
BEGIN
    -- 1. Get source and target composites
    SELECT * INTO v_source_composite FROM public.composites WHERE id = p_source_composite_id;
    SELECT * INTO v_target_composite FROM public.composites WHERE id = p_target_composite_id;
    
    IF v_source_composite IS NULL OR v_target_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Composite not found',
            'details', 'One or more of the required composites does not exist'
        );
    END IF;
    
    -- 2. Get content from both composites
    SELECT json INTO v_source_content FROM public.db WHERE id = v_source_composite.compose_id;
    
    SELECT json INTO v_target_content FROM public.db WHERE id = v_target_composite.compose_id;
    
    IF v_source_content IS NULL OR v_target_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', 'One or more of the required content versions does not exist'
        );
    END IF;
    
    -- 3. Simple merge - start with target content and overlay source content
    -- This effectively keeps target content and adds/overwrites with source
    v_merged_content := v_target_content;
    
    -- For each key in source, add or replace in target
    FOR key IN SELECT jsonb_object_keys(v_source_content)
    LOOP
        v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_content -> key);
    END LOOP;
    
    -- 4. Create a patch request for the merge
    INSERT INTO public.patch_requests (
        title,
        description,
        author,
        old_version_id,
        new_version_id,
        composite_id,
        status,
        operation_type,
        metadata
    ) VALUES (
        'Simple merge from ' || v_source_composite.title || ' to ' || v_target_composite.title,
        'Content merged using simple strategy (no common ancestor found)',
        p_user_id,
        v_target_composite.compose_id,
        v_new_content_id,
        p_target_composite_id,
        'pending',
        'merge',
        jsonb_build_object(
            'merge_strategy', 'simple',
            'source_composite_id', p_source_composite_id
        )
    )
    RETURNING id INTO v_patch_request_id;
    
    -- 5. Update vector clock
    v_vector_clock := public.update_vector_clock('{}'::jsonb, p_user_id);
    
    -- 6. Create operations records by generating diff
    PERFORM public.generate_operations_from_diff(
        v_target_content,
        v_merged_content,
        v_patch_request_id,
        p_user_id,
        p_target_composite_id,
        v_new_content_id
    );
    
    -- 7. Create new content version
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
        v_target_composite.compose_id,  -- Keep the same schema
        now(),
        now(),
        v_new_snapshot_id
    );
    
    -- 8. Add relationship to track the merge
    INSERT INTO public.composite_relationships (
        source_composite_id,
        target_composite_id,
        relationship_type,
        metadata
    ) VALUES (
        p_target_composite_id,
        p_source_composite_id,
        'merged_from',
        jsonb_build_object(
            'merged_at', now(),
            'merged_by', p_user_id,
            'patch_request_id', v_patch_request_id,
            'strategy', 'simple'
        )
    )
    -- Handle the case when this relationship already exists (re-merging)
    ON CONFLICT (source_composite_id, target_composite_id, relationship_type) 
    DO UPDATE SET 
        metadata = jsonb_build_object(
            'merged_at', now(),
            'merged_by', p_user_id,
            'patch_request_id', v_patch_request_id,
            'strategy', 'simple',
            'previous_merges', 
            COALESCE(
                composite_relationships.metadata->'previous_merges', 
                '[]'::jsonb
            ) || jsonb_build_array(composite_relationships.metadata)
        );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Created simple merge patch request',
        'patchRequestId', v_patch_request_id,
        'newContentId', v_new_content_id,
        'snapshotId', v_new_snapshot_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.simple_merge_composites IS 'Performs a simple merge between two composites without using a common ancestor';

-- ===============================================
-- Part 5: Find Merge Candidates Function
-- ===============================================

-- Function to find composites that are potential merge candidates
CREATE OR REPLACE FUNCTION public.find_merge_candidates(
    p_composite_id uuid
) RETURNS SETOF json AS $$
BEGIN
    -- Return composites that are related to the given composite
    -- or share a common ancestor
    RETURN QUERY
    WITH source_composite AS (
        SELECT 
            c.id,
            c.title,
            c.author,
            c.created_at,
            c.updated_at,
            c.compose_id,
            p.name as author_name
        FROM 
            public.composites c
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            c.id = p_composite_id
    ),
    -- Find direct variations
    direct_variations AS (
        SELECT 
            c.id as composite_id,
            c.title,
            c.author,
            c.updated_at as last_updated,
            p.name as author_name,
            CASE 
                WHEN cr.source_composite_id = p_composite_id THEN 'variation_of'
                WHEN cr.target_composite_id = p_composite_id THEN 'parent_of'
                ELSE cr.relationship_type
            END as relationship_type
        FROM 
            public.composite_relationships cr
            JOIN public.composites c ON 
                (cr.source_composite_id = c.id AND cr.target_composite_id = p_composite_id)
                OR (cr.target_composite_id = c.id AND cr.source_composite_id = p_composite_id)
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            cr.relationship_type IN ('variation_of', 'branched_from', 'merged_from')
            AND c.id != p_composite_id
    ),
    -- Find siblings (composites that share the same parent)
    siblings AS (
        SELECT 
            c.id as composite_id,
            c.title,
            c.author,
            c.updated_at as last_updated,
            p.name as author_name,
            'sibling' as relationship_type
        FROM 
            public.composite_relationships cr1
            JOIN public.composite_relationships cr2 ON cr1.target_composite_id = cr2.target_composite_id
            JOIN public.composites c ON cr2.source_composite_id = c.id
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            cr1.source_composite_id = p_composite_id
            AND cr2.source_composite_id != p_composite_id
            AND cr1.relationship_type = 'variation_of'
            AND cr2.relationship_type = 'variation_of'
    ),
    -- Find other composites by the same author (excluding the current one)
    -- Only include this if we have very few other candidates
    same_author_composites AS (
        SELECT 
            c.id as composite_id,
            c.title,
            c.author,
            c.updated_at as last_updated,
            p.name as author_name,
            'same_author' as relationship_type
        FROM 
            public.composites c
            JOIN source_composite sc ON c.author = sc.author
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            c.id != p_composite_id
            -- Only consider recent ones
            AND c.updated_at > (NOW() - INTERVAL '30 days')
        LIMIT 5
    ),
    -- First count direct variations and siblings
    variant_count AS (
        SELECT COUNT(*) as count FROM direct_variations
        UNION ALL
        SELECT COUNT(*) as count FROM siblings
    ),
    -- Combine all results
    combined_results AS (
        SELECT * FROM direct_variations
        UNION
        SELECT * FROM siblings
        UNION
        -- Only include same_author if we don't have many direct relationships
        SELECT * FROM same_author_composites 
        WHERE (SELECT SUM(count) FROM variant_count) < 5
    )
    -- Return unique results sorted by relevance
    SELECT 
        json_build_object(
            'composite_id', cr.composite_id,
            'title', cr.title,
            'relationship_type', cr.relationship_type,
            'last_updated', cr.last_updated,
            'author_id', cr.author,
            'author_name', cr.author_name
        )
    FROM 
        combined_results cr
    WHERE
        -- Explicitly exclude the current composite
        cr.composite_id != p_composite_id
    ORDER BY 
        -- Sort by relationship type relevance and then by last update date
        CASE 
            WHEN cr.relationship_type = 'parent_of' THEN 1
            WHEN cr.relationship_type = 'variation_of' THEN 2
            WHEN cr.relationship_type = 'branched_from' THEN 3
            WHEN cr.relationship_type = 'merged_from' THEN 4
            WHEN cr.relationship_type = 'sibling' THEN 5
            ELSE 6
        END,
        cr.last_updated DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.find_merge_candidates IS 'Finds potential composite candidates for merging with the specified composite based on relationships and authorship'; 