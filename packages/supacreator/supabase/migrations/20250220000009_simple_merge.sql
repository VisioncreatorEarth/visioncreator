-- Migration: Add simple merge function
-- Description: Creates a simple merge function used as a fallback when no common ancestor is found

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
    IF v_source_content IS NULL THEN
        SELECT json INTO v_source_content FROM public.db_archive WHERE id = v_source_composite.compose_id;
    END IF;
    
    SELECT json INTO v_target_content FROM public.db WHERE id = v_target_composite.compose_id;
    IF v_target_content IS NULL THEN
        SELECT json INTO v_target_content FROM public.db_archive WHERE id = v_target_composite.compose_id;
    END IF;
    
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