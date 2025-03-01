-- Create composites table with new relationship architecture
CREATE TABLE composites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    compose_id UUID NOT NULL,  -- Main content version
    author UUID NOT NULL,      -- Reference to profiles.id
    is_archived BOOLEAN NOT NULL DEFAULT FALSE, -- Flag to mark a composite as archived
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

-- Insert example data
-- First, insert the markdown schema
INSERT INTO db (id, json, author, schema, snapshot_id) VALUES 
('11111111-1111-1111-1111-111111111111', 
'{
  "type": "object",
  "title": "Markdown Content",
  "description": "A schema for markdown content with strict validation",
  "properties": {
    "content": {
      "type": "string",
      "title": "Content",
      "description": "Markdown formatted content",
      "format": "markdown",
      "minLength": 1,
      "pattern": "^[\\s\\S]*$"
    },
    "title": {
      "type": "string",
      "title": "Title",
      "description": "Title of the content"
    },
    "description": {
      "type": "string",
      "title": "Description",
      "description": "Brief description of the content"
    },
    "metadata": {
      "type": "object",
      "title": "Metadata",
      "description": "Optional metadata for content",
      "properties": {
        "benefits": {
          "type": "string",
          "description": "Benefits provided by this content"
        },
        "pain": {
          "type": "string",
          "description": "Pain points addressed by this content"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Tags associated with this content"
        }
      },
      "additionalProperties": false
    }
  },
  "required": ["content", "title", "metadata"],
  "additionalProperties": false
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'00000000-0000-0000-0000-000000000001',  -- Meta schema
gen_random_uuid()  -- Generate a random UUID for snapshot_id
);

-- Insert main instance
INSERT INTO db (id, json, author, schema, snapshot_id) VALUES 
('22222222-2222-2222-2222-222222222222', 
'{
  "content": "# Business Model Proposal for a Community-Owned Organization\n\n## The FORGE: Where Visioncreators Thrive\n\nThe FORGE is a community-owned ecosystem where Visioncreators craft AI solutions for SMBs, earn substantial income working on their terms, and build co-owned infrastructure that increases in value over time.\n\n## Key Stakeholders\n\n- **SMBs**: Businesses needing AI solutions\n- **Visioncreators**: Community members with AI expertise\n- **FORGE Platform**: Community-owned infrastructure\n\n## Value Proposition\n\n- Visioncreators earn €125/hour while maintaining flexibility\n- SMBs get affordable AI expertise without hiring full-time experts\n- Platform reinvests 25% of revenue into shared infrastructure\n\nThis creates a self-sustaining ecosystem that benefits all stakeholders while building a valuable community asset.",
  "title": "The FORGE: Where Visioncreators Thrive",
  "description": "A business model proposal for a community-owned organization where Visioncreators craft AI solutions for SMBs",
  "metadata": {
    "benefits": "Launch your own AI business in a supportive ecosystem with built-in infrastructure and client base.",
    "pain": "Independent creators struggle to find steady work and lack the infrastructure to scale their businesses.",
    "tags": ["product", "business-model"]
  }
}'::jsonb,
'00000000-0000-0000-0000-000000000001',
'11111111-1111-1111-1111-111111111111',
gen_random_uuid()  -- Generate a random UUID for snapshot_id
);

-- Create main composite
INSERT INTO composites (
    id,
    title,
    description,
    compose_id,
    author
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'The FORGE: Where Visioncreators Thrive',
    'A business model proposal for a community-owned organization where Visioncreators craft AI solutions for SMBs',
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001'  -- System user as author
);

-- Create default Visioncreator Platform proposal
INSERT INTO proposals (
    id,
    title,
    author,
    details,
    state,
    total_votes,
    total_tokens_staked,
    created_at,
    updated_at,
    tags,
    compose
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'The FORGE: Where Visioncreators Thrive',
    '00000000-0000-0000-0000-000000000001',
    '# The FORGE: Where Visioncreators Thrive\n\nA community-owned ecosystem where Visioncreators craft AI solutions for SMBs, earning substantial income and building co-owned infrastructure.',
    'idea',
    0,
    0,
    NOW(),
    NOW(),
    ARRAY['product']::text[],
    '33333333-3333-3333-3333-333333333333'
);

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