-- Create composites table with new relationship architecture
CREATE TABLE composites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    compose_id UUID NOT NULL,  -- Main content version
    schema_id UUID,            -- Reference to the schema used by this composite
    author UUID NOT NULL,      -- Reference to profiles.id
    is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Flag to mark a composite as archived
    is_public BOOLEAN NOT NULL DEFAULT TRUE,    -- Flag to control visibility
    metadata JSONB DEFAULT '{}'::jsonb,         -- Metadata for storing additional information
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (author) REFERENCES profiles(id)
);

-- Create composite relationships table
CREATE TABLE composite_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_composite_id UUID NOT NULL,
    target_composite_id UUID NOT NULL,
    relationship_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (source_composite_id) REFERENCES composites(id),
    FOREIGN KEY (target_composite_id) REFERENCES composites(id),
    UNIQUE (source_composite_id, target_composite_id, relationship_type)
);

-- Add function to toggle composite archive status
CREATE OR REPLACE FUNCTION public.toggle_composite_archive_status(
    p_user_id uuid,
    p_composite_id uuid,
    p_archive boolean
) RETURNS jsonb AS $$
DECLARE
    v_composite record;
    v_is_author boolean;
BEGIN
    -- 1. Get the composite
    SELECT id, title, author, is_archived
    INTO v_composite
    FROM public.composites
    WHERE id = p_composite_id;
    
    IF v_composite IS NULL THEN
        RAISE EXCEPTION 'Composite % not found', p_composite_id;
    END IF;

    -- 2. Check if user is the author (for permission checking)
    v_is_author := (v_composite.author = p_user_id);
    
    -- Only allow archiving/unarchiving if user is the author
    IF NOT v_is_author THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only the author can archive or unarchive a composite'
        );
    END IF;
    
    -- 3. Don't update if already in desired state
    IF v_composite.is_archived = p_archive THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', CASE 
                WHEN p_archive THEN 'Composite was already archived'
                ELSE 'Composite was already unarchived'
            END,
            'changed', false
        );
    END IF;

    -- 4. Update the composite
    UPDATE public.composites
    SET is_archived = p_archive,
        updated_at = now()
    WHERE id = p_composite_id;

    -- 5. Return success message
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE 
            WHEN p_archive THEN 'Composite archived successfully'
            ELSE 'Composite unarchived successfully'
        END,
        'changed', true
    );
END;
$$ LANGUAGE plpgsql;

-- Add function to create variations of composites
CREATE OR REPLACE FUNCTION public.create_composite_variation(
    p_user_id uuid,
    p_composite_id uuid,
    p_new_json jsonb,
    p_variation_title text DEFAULT NULL,
    p_variation_description text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_source_composite record;
    v_source_content record;
    v_clone_content_id uuid;
    v_cloned_content record;
    v_new_content_id uuid;
    v_new_content record;
    v_new_composite_id uuid;
    v_new_composite record;
    v_patch_request_id uuid;
    v_patch_request record;
    v_old_json jsonb;
    v_new_json jsonb;
    v_key text;
    v_vector_clock jsonb := '{}'::jsonb;
    v_new_snapshot_id uuid := gen_random_uuid();
    v_operation_ids uuid[];
BEGIN
    -- 1. Get the source composite
    SELECT id, title, description, compose_id, author 
    INTO v_source_composite
    FROM public.composites
    WHERE id = p_composite_id;
    
    IF v_source_composite IS NULL THEN
        RAISE EXCEPTION 'Source composite % not found', p_composite_id;
    END IF;

    -- 2. Get the content from the source composite
    SELECT id, json, author, schema, snapshot_id
    INTO v_source_content
    FROM public.db
    WHERE id = v_source_composite.compose_id;
    
    IF v_source_content IS NULL THEN
        RAISE EXCEPTION 'Source content % not found in DB', v_source_composite.compose_id;
    END IF;

    -- 3. Create a clone of the original content to serve as our "before" state
    v_clone_content_id := gen_random_uuid();
    
    INSERT INTO public.db (
        id,
        json,
        author,
        schema,
        created_at,
        last_modified_at,
        snapshot_id
    ) VALUES (
        v_clone_content_id,
        v_source_content.json,
        p_user_id,
        v_source_content.schema,
        now(),
        now(),
        v_source_content.snapshot_id
    )
    RETURNING * INTO v_cloned_content;

    -- 4. Create a new content entry with the new JSON (the "after" state)
    v_new_content_id := gen_random_uuid();
    
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
        p_new_json,
        p_user_id,
        v_source_content.schema,
        now(),
        now(),
        v_new_snapshot_id
    )
    RETURNING * INTO v_new_content;

    -- 5. Create a new composite
    v_new_composite_id := gen_random_uuid();
    
    -- Set a title and description for the variation
    DECLARE
        v_variation_type text := 'edit_variation';
        v_variation_title text;
        v_variation_description text;
    BEGIN
        v_variation_title := COALESCE(p_variation_title, 'Variation of ' || v_source_composite.title);
        v_variation_description := COALESCE(p_variation_description, 'Created by ' || p_user_id || ' as a variation of composite ' || p_composite_id);
        
        INSERT INTO public.composites (
            id,
            title,
            description,
            compose_id,
            author
        ) VALUES (
            v_new_composite_id,
            v_variation_title,
            v_variation_description,
            v_new_content_id,
            p_user_id
        )
        RETURNING * INTO v_new_composite;
    END;

    -- 6. Create a relationship between the new and original composite
    INSERT INTO public.composite_relationships (
        source_composite_id,
        target_composite_id,
        relationship_type,
        metadata
    ) VALUES (
        v_new_composite_id,
        v_source_composite.id,
        'variation_of',
        jsonb_build_object(
            'created_at', now(),
            'variation_type', 'edit_variation',
            'description', format('Created automatically when %s tried to edit a composite they don''t own', p_user_id),
            'target_composite_id', v_source_composite.id
        )
    );

    -- 7. Create a patch request to track the changes
    DECLARE
        v_patch_title text;
        v_patch_description text;
        v_operation_type text;
    BEGIN
        -- Set the title and description for the variation
        v_patch_title := 'Edit variation for ' || v_source_composite.title;
        v_patch_description := 'Changes made by ' || p_user_id || ' to create a variation of ' || v_source_composite.title;
        v_operation_type := 'branch';
        
        -- Create the patch request using the clone as the old version (which is now in the active DB)
        INSERT INTO public.patch_requests (
            title,
            description,
            author,
            old_version_id,
            new_version_id,
            composite_id,
            status,
            operation_type
        ) VALUES (
            v_patch_title,
            v_patch_description,
            p_user_id,
            v_clone_content_id,  -- Using the clone we just created which is guaranteed to be in the active DB
            v_new_content_id,
            v_new_composite_id,
            'pending',  -- Set as pending so the auto-approve trigger can process it
            v_operation_type
        )
        RETURNING * INTO v_patch_request;
        
        v_patch_request_id := v_patch_request.id;
    END;

    -- 8. Create operations to track the changes
    -- Compare the old and new JSON to find differences
    v_old_json := v_cloned_content.json;
    v_new_json := p_new_json;
    
    -- Generate diff and create operations
    DECLARE
        v_diff jsonb;
        v_operations jsonb;
    BEGIN
        -- Generate diff between old and new content
        v_diff := public.generate_diff(v_old_json, v_new_json);
        v_operations := v_diff -> 'operations';
        
        -- Update vector clock
        v_vector_clock := public.update_vector_clock(v_vector_clock, p_user_id);
        
        -- Create an array to store operation IDs
        v_operation_ids := ARRAY[]::uuid[];
        
        -- Process each operation from the diff
        FOR i IN 0..jsonb_array_length(v_operations) - 1 LOOP
            DECLARE
                v_op jsonb := v_operations -> i;
                v_op_id uuid;
            BEGIN
                INSERT INTO public.db_operations (
                    patch_request_id,
                    operation_type,
                    path,
                    old_value,
                    new_value,
                    author,
                    composite_id,
                    content_id,
                    vector_clock,
                    metadata
                ) VALUES (
                    v_patch_request_id,
                    v_op ->> 'op',
                    string_to_array(substring((v_op ->> 'path'), 2), '/'),  -- Remove leading '/' and split
                    CASE WHEN v_op ? 'old_value' THEN v_op -> 'old_value' ELSE NULL END,
                    CASE WHEN v_op ? 'value' THEN v_op -> 'value' ELSE NULL END,
                    p_user_id,
                    v_new_composite_id,
                    v_new_content_id,
                    v_vector_clock,
                    jsonb_build_object(
                        'timestamp', now(),
                        'snapshot_id', v_new_snapshot_id
                    )
                )
                RETURNING id INTO v_op_id;
                
                -- Add to operation IDs array
                v_operation_ids := array_append(v_operation_ids, v_op_id);
            END;
        END LOOP;
    END;

    -- 9. Auto-approve the patch request
    UPDATE public.patch_requests
    SET status = 'approved',
        updated_at = now()
    WHERE id = v_patch_request_id;

    -- Return a JSON object with the result
    RETURN jsonb_build_object(
        'success', true,
        'createdVariation', true,
        'newCompositeId', v_new_composite_id,
        'patchRequestId', v_patch_request_id,
        'operationCount', array_length(v_operation_ids, 1),
        'snapshotId', v_new_snapshot_id,
        'message', 'Created a new variation instead of editing the original content'
    );
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better query performance
CREATE INDEX idx_composites_compose ON composites(compose_id);
CREATE INDEX idx_composites_author ON composites(author);
CREATE INDEX idx_composite_relationships_source ON composite_relationships(source_composite_id);
CREATE INDEX idx_composite_relationships_target ON composite_relationships(target_composite_id);
CREATE INDEX idx_composite_relationships_type ON composite_relationships(relationship_type);

-- Add proposal composer field to proposals table
ALTER TABLE proposals
ADD COLUMN compose uuid;

-- Add foreign key constraint with proper name
ALTER TABLE proposals
ADD CONSTRAINT proposals_compose_fkey 
FOREIGN KEY (compose) 
REFERENCES composites(id);

-- Add index for the compose field
CREATE INDEX idx_proposals_compose ON proposals(compose);

-- Add comments explaining the fields
COMMENT ON COLUMN proposals.compose IS 'Reference to a composite that contains instance data for this proposal';
COMMENT ON COLUMN composites.compose_id IS 'The main content version of the composite';
COMMENT ON COLUMN composites.author IS 'Reference to the profile that created this composite';
COMMENT ON TABLE composite_relationships IS 'Tracks relationships between composites (variations, forks, etc)';

-- Note: Seed data has been moved to a separate migration file (20250220000017_seed_content_with_tiptap.sql)
-- which uses the TipTap/Prose.io rich text format instead of simple markdown

-- Enable RLS
ALTER TABLE composites ENABLE ROW LEVEL SECURITY;
ALTER TABLE composite_relationships ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE composites TO service_role;
GRANT ALL ON TABLE composite_relationships TO service_role;

-- Create RLS policies
CREATE POLICY "service_role_policy" ON composites
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_policy" ON composite_relationships
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to create a new composite with CRDT-enabled operations
CREATE OR REPLACE FUNCTION public.create_composite_with_crdt(
    p_title text,
    p_description text,
    p_content jsonb,
    p_author uuid,
    p_schema_id uuid DEFAULT NULL,
    p_parent_composite_id uuid DEFAULT NULL,
    p_relationship_type text DEFAULT 'branch'
) RETURNS jsonb AS $$
DECLARE
    v_composite_id uuid := gen_random_uuid();
    v_content_id uuid := gen_random_uuid();
    v_snapshot_id uuid := gen_random_uuid();
    v_parent_content_id uuid;
    v_patch_request_id uuid;
    v_site_id uuid := p_author;
    v_lamport_timestamp bigint;
    v_result jsonb;
BEGIN
    -- Get the latest Lamport timestamp for this site
    SELECT MAX(lamport_timestamp) INTO v_lamport_timestamp
    FROM public.db_operations
    WHERE site_id = v_site_id;
    
    v_lamport_timestamp := COALESCE(v_lamport_timestamp, 0);
    v_lamport_timestamp := update_lamport_timestamp(v_lamport_timestamp, NULL);

    -- Create the content entry
    INSERT INTO public.db (
        id,
        json,
        author,
        schema,
        created_at,
        last_modified_at,
        snapshot_id
    ) VALUES (
        v_content_id,
        p_content,
        p_author,
        p_schema_id,
        now(),
        now(),
        v_snapshot_id
    );
    
    -- Create the composite
    INSERT INTO public.composites (
        id,
        title,
        description,
        compose_id,
        schema_id,
        author,
        created_at,
        updated_at,
        is_public,
        metadata
    ) VALUES (
        v_composite_id,
        p_title,
        p_description,
        v_content_id,
        p_schema_id,
        p_author,
        now(),
        now(),
        true,
        jsonb_build_object(
            'crdt_enabled', true,
            'site_id', v_site_id,
            'initial_lamport_timestamp', v_lamport_timestamp
        )
    );
    
    -- Create a relationship if parent composite is provided
    IF p_parent_composite_id IS NOT NULL THEN
        -- Get the parent content ID for creating operations
        SELECT compose_id INTO v_parent_content_id
        FROM public.composites
        WHERE id = p_parent_composite_id;
        
        -- Create a relationship
        INSERT INTO public.composite_relationships (
            source_composite_id,
            target_composite_id,
            relationship_type,
            created_at,
            updated_at,
            metadata
        ) VALUES (
            p_parent_composite_id,
            v_composite_id,
            p_relationship_type,
            now(),
            now(),
            jsonb_build_object(
                'created_by', p_author,
                'crdt_enabled', true
            )
        );
        
        -- Create a patch request to record the operations
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
            'Initial branch from ' || p_parent_composite_id,
            'Created branch with CRDT operations',
            p_author,
            v_parent_content_id,
            v_content_id,
            v_composite_id,
            'create_branch',
            'approved',
            jsonb_build_object(
                'parent_composite', p_parent_composite_id,
                'relationship_type', p_relationship_type,
                'crdt_enabled', true
            )
        )
        RETURNING id INTO v_patch_request_id;
        
        -- If parent has content, generate CRDT operations for the differences
        IF v_parent_content_id IS NOT NULL THEN
            -- Only generate operations if the content differs
            IF p_content IS DISTINCT FROM (SELECT json FROM public.db WHERE id = v_parent_content_id) THEN
                PERFORM public.generate_operations_from_diff(
                    (SELECT json FROM public.db WHERE id = v_parent_content_id),
                    p_content,
                    v_patch_request_id,
                    p_author,
                    v_composite_id,
                    v_content_id
                );
            END IF;
        END IF;
    END IF;
    
    -- Prepare result
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Composite created successfully with CRDT support',
        'composite_id', v_composite_id,
        'content_id', v_content_id,
        'snapshot_id', v_snapshot_id
    );
    
    IF p_parent_composite_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'parent_composite_id', p_parent_composite_id,
            'relationship_type', p_relationship_type,
            'patch_request_id', v_patch_request_id
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql; 