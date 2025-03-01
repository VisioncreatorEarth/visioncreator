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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.find_nearest_common_ancestor IS 'Finds the nearest common ancestor between two composites by examining their variation relationships';

-- ===============================================
-- Part 3: Three-Way Merge Function
-- ===============================================

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
    
    SELECT json INTO v_target_content FROM public.db WHERE id = v_target_composite.compose_id;
    
    SELECT json INTO v_ancestor_content FROM public.db WHERE id = v_ancestor_composite.compose_id;
    
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
    )
    -- Handle the case when this relationship already exists (re-merging)
    ON CONFLICT (source_composite_id, target_composite_id, relationship_type) 
    DO UPDATE SET 
        metadata = jsonb_build_object(
            'merged_at', now(),
            'merged_by', p_user_id,
            'patch_request_id', v_patch_request_id,
            'strategy', 'three_way',
            'ancestor_id', v_ancestor_id,
            'conflicts_detected', v_conflicts_detected,
            'conflicts_resolved', v_conflicts_resolved,
            'previous_merges', 
            COALESCE(
                composite_relationships.metadata->'previous_merges', 
                '[]'::jsonb
            ) || jsonb_build_array(composite_relationships.metadata)
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
            'source_id', p_source_composite_id
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
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.find_merge_candidates IS 'Finds potential composite candidates for merging with the specified composite based on relationships and authorship'; 