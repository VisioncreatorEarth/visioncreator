-- Migration: Add three-way merge and common ancestor functions
-- Description: Implements simplified common ancestor detection and automatic three-way merging

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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.find_nearest_common_ancestor IS 'Finds the nearest common ancestor between two composites by examining their variation relationships';

-- Simple three-way merge function with automatic conflict resolution
CREATE OR REPLACE FUNCTION public.three_way_merge_composites(
    p_user_id uuid,
    p_source_composite_id uuid,
    p_target_composite_id uuid
) RETURNS jsonb AS $$
DECLARE
    v_ancestor_id uuid;
    v_source_composite record;
    v_target_composite record;
    v_ancestor_composite record;
    v_source_content jsonb;
    v_target_content jsonb;
    v_ancestor_content jsonb;
    v_merged_content jsonb;
    v_new_content_id uuid := gen_random_uuid();
    v_new_snapshot_id uuid := gen_random_uuid();
    v_patch_request_id uuid;
    v_conflicts_detected int := 0;
    v_conflicts_resolved int := 0;
    v_vector_clock jsonb;
    key text;
BEGIN
    -- 1. Find common ancestor
    v_ancestor_id := public.find_nearest_common_ancestor(p_source_composite_id, p_target_composite_id);
    
    -- If no common ancestor, fall back to simple merge (source wins)
    IF v_ancestor_id IS NULL THEN
        RETURN public.simple_merge_composites(p_user_id, p_source_composite_id, p_target_composite_id);
    END IF;
    
    -- 2. Get all three composites
    SELECT * INTO v_source_composite FROM public.composites WHERE id = p_source_composite_id;
    SELECT * INTO v_target_composite FROM public.composites WHERE id = p_target_composite_id;
    SELECT * INTO v_ancestor_composite FROM public.composites WHERE id = v_ancestor_id;
    
    IF v_source_composite IS NULL OR v_target_composite IS NULL OR v_ancestor_composite IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Composite not found',
            'details', 'One or more of the required composites does not exist'
        );
    END IF;
    
    -- 3. Get content from all three
    SELECT json INTO v_source_content FROM public.db WHERE id = v_source_composite.compose_id;
    IF v_source_content IS NULL THEN
        SELECT json INTO v_source_content FROM public.db_archive WHERE id = v_source_composite.compose_id;
    END IF;
    
    SELECT json INTO v_target_content FROM public.db WHERE id = v_target_composite.compose_id;
    IF v_target_content IS NULL THEN
        SELECT json INTO v_target_content FROM public.db_archive WHERE id = v_target_composite.compose_id;
    END IF;
    
    SELECT json INTO v_ancestor_content FROM public.db WHERE id = v_ancestor_composite.compose_id;
    IF v_ancestor_content IS NULL THEN
        SELECT json INTO v_ancestor_content FROM public.db_archive WHERE id = v_ancestor_composite.compose_id;
    END IF;
    
    IF v_source_content IS NULL OR v_target_content IS NULL OR v_ancestor_content IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Content not found',
            'details', 'One or more of the required content versions does not exist'
        );
    END IF;
    
    -- 4. Perform three-way merge
    v_merged_content := jsonb_build_object();
    
    -- For each key in any of the three documents
    FOR key IN 
        SELECT DISTINCT k 
        FROM (
            SELECT jsonb_object_keys(v_source_content) AS k
            UNION 
            SELECT jsonb_object_keys(v_target_content) AS k
            UNION
            SELECT jsonb_object_keys(v_ancestor_content) AS k
        ) keys
    LOOP
        -- Check if the key exists in all three versions
        DECLARE
            v_in_source boolean := v_source_content ? key;
            v_in_target boolean := v_target_content ? key;
            v_in_ancestor boolean := v_ancestor_content ? key;
            v_source_value jsonb := v_source_content -> key;
            v_target_value jsonb := v_target_content -> key;
            v_ancestor_value jsonb := v_ancestor_content -> key;
        BEGIN
            -- Case 1: No change from ancestor in one branch but changed in the other
            IF v_in_source AND v_in_target AND v_in_ancestor AND 
               v_source_value = v_ancestor_value AND v_target_value != v_ancestor_value THEN
                -- Target changed, source didn't - use target's changes
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_target_value);
                
            ELSIF v_in_source AND v_in_target AND v_in_ancestor AND 
                  v_target_value = v_ancestor_value AND v_source_value != v_ancestor_value THEN
                -- Source changed, target didn't - use source's changes
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                
            -- Case 2: Key modified in both branches - conflict!
            ELSIF v_in_source AND v_in_target AND v_in_ancestor AND 
                  v_source_value != v_ancestor_value AND v_target_value != v_ancestor_value AND
                  v_source_value != v_target_value THEN
                -- Conflict detected! For now, prefer source value
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                v_conflicts_detected := v_conflicts_detected + 1;
                v_conflicts_resolved := v_conflicts_resolved + 1;
                
            -- Case 3: Key added in one branch only
            ELSIF v_in_source AND NOT v_in_ancestor AND NOT v_in_target THEN
                -- Added only in source - include it
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                
            ELSIF v_in_target AND NOT v_in_ancestor AND NOT v_in_source THEN
                -- Added only in target - include it
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_target_value);
                
            -- Case 4: Key deleted in one branch only
            ELSIF NOT v_in_source AND v_in_ancestor AND v_in_target AND v_target_value = v_ancestor_value THEN
                -- Deleted in source, unchanged in target - delete it
                -- (do nothing as we start with empty object)
                
            ELSIF NOT v_in_target AND v_in_ancestor AND v_in_source AND v_source_value = v_ancestor_value THEN
                -- Deleted in target, unchanged in source - delete it
                -- (do nothing as we start with empty object)
                
            -- Case 5: Key deleted in one branch but modified in other - conflict!
            ELSIF NOT v_in_source AND v_in_target AND v_in_ancestor AND v_target_value != v_ancestor_value THEN
                -- Deleted in source but modified in target - keep target's modification
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_target_value);
                v_conflicts_detected := v_conflicts_detected + 1;
                v_conflicts_resolved := v_conflicts_resolved + 1;
                
            ELSIF NOT v_in_target AND v_in_source AND v_in_ancestor AND v_source_value != v_ancestor_value THEN
                -- Deleted in target but modified in source - keep source's modification
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                v_conflicts_detected := v_conflicts_detected + 1;
                v_conflicts_resolved := v_conflicts_resolved + 1;
                
            -- Case 6: Same change in both branches
            ELSIF v_in_source AND v_in_target AND v_source_value = v_target_value THEN
                -- Both made the same change - keep it
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                
            -- Case 7: Added in both branches with different values - conflict!
            ELSIF v_in_source AND v_in_target AND NOT v_in_ancestor AND v_source_value != v_target_value THEN
                -- Added in both but with different values - prefer source
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                v_conflicts_detected := v_conflicts_detected + 1;
                v_conflicts_resolved := v_conflicts_resolved + 1;
                
            -- Fallbacks
            ELSIF v_in_source THEN
                -- If all else fails but key is in source, use source value
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_source_value);
                
            ELSIF v_in_target THEN
                -- If all else fails but key is in target, use target value
                v_merged_content := jsonb_set(v_merged_content, ARRAY[key], v_target_value);
            END IF;
        END;
    END LOOP;
    
    -- 5. Create a patch request for the three-way merge
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
        'Three-way merge from ' || v_source_composite.title || ' to ' || v_target_composite.title,
        'Content merged using common ancestor ' || v_ancestor_id || 
        CASE WHEN v_conflicts_detected > 0 
             THEN ' with ' || v_conflicts_detected || ' conflicts auto-resolved' 
             ELSE ' with no conflicts'
        END,
        p_user_id,
        v_target_composite.compose_id,
        v_new_content_id,
        p_target_composite_id,
        'pending',
        'merge',
        jsonb_build_object(
            'ancestor_id', v_ancestor_id,
            'merge_strategy', 'three_way',
            'source_id', p_source_composite_id,
            'conflicts_detected', v_conflicts_detected,
            'conflicts_resolved', v_conflicts_resolved
        )
    )
    RETURNING id INTO v_patch_request_id;
    
    -- 6. Update vector clock
    v_vector_clock := public.update_vector_clock('{}'::jsonb, p_user_id);
    
    -- 7. Create operations records by generating diff
    PERFORM public.generate_operations_from_diff(
        v_target_content,
        v_merged_content,
        v_patch_request_id,
        p_user_id,
        p_target_composite_id,
        v_new_content_id
    );
    
    -- 8. Create new content version
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
    
    -- 9. Add relationship to track the merge
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
            'strategy', 'three_way',
            'ancestor_id', v_ancestor_id,
            'conflicts_detected', v_conflicts_detected,
            'conflicts_resolved', v_conflicts_resolved
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Created three-way merge patch request',
        'patchRequestId', v_patch_request_id,
        'newContentId', v_new_content_id,
        'snapshotId', v_new_snapshot_id,
        'ancestorId', v_ancestor_id,
        'conflicts_detected', v_conflicts_detected,
        'conflicts_resolved', v_conflicts_resolved
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.three_way_merge_composites IS 'Performs a three-way merge between two composites using their common ancestor for conflict resolution'; 