-- Create composites table
CREATE TABLE composites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    schema_id UUID NOT NULL,
    instance_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT composites_schema_fkey FOREIGN KEY (schema_id) REFERENCES db(id),
    CONSTRAINT composites_instance_fkey FOREIGN KEY (instance_id) REFERENCES db(id)
);

-- Add index for better query performance
CREATE INDEX idx_composites_schema ON composites(schema_id);
CREATE INDEX idx_composites_instance ON composites(instance_id);

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

-- Add comment explaining the field
COMMENT ON COLUMN proposals.compose IS 'Reference to a composite that contains both schema and instance data for this proposal';

-- Update existing proposals to have null compose field
UPDATE proposals SET compose = NULL;

-- Insert a markdown schema based on the meta schema
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('11111111-1111-1111-1111-111111111111', 
'{
  "type": "object",
  "title": "Markdown Content",
  "description": "A simple schema for markdown content",
  "properties": {
    "content": {
      "type": "string",
      "title": "Content",
      "description": "Markdown formatted content",
      "format": "markdown"
    }
  },
  "required": ["content"]
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'00000000-0000-0000-0000-000000000001',  -- Meta schema (using UUID instead of integer)
1,  -- Initial version
'11111111-1111-1111-1111-111111111111'   -- Unique variation ID
);

-- Insert an instance of the markdown schema
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222222', 
'{
  "content": "# Example Content\n\nThis is a sample markdown content instance.\n\n## Features\n- Supports full markdown\n- Can be used in proposals\n- Easy to edit and version"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'11111111-1111-1111-1111-111111111111',  -- References the markdown schema (using UUID)
1,  -- Initial version
'22222222-2222-2222-2222-222222222222'   -- Unique variation ID
);

-- Create a composite linking the schema and instance
INSERT INTO composites (id, title, description, schema_id, instance_id) VALUES 
('33333333-3333-3333-3333-333333333333',
'Markdown Content Composite',
'A composite for storing and versioning markdown content',
'11111111-1111-1111-1111-111111111111',  -- Schema ID
'22222222-2222-2222-2222-222222222222'   -- Instance ID
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
    'The Visioncreator Platform',
    '00000000-0000-0000-0000-000000000001',  -- System user
    '# The Visioncreator Platform

A collaborative platform for creating, sharing, and evolving visions together.

## Features
- Proposal-based collaboration
- Token-weighted voting system
- Composable data structures
- Version control for knowledge
- Real-time updates and notifications',
    'accepted',  -- Set as accepted by default
    0,          -- Initial votes
    0,          -- Initial tokens staked
    NOW(),
    NOW(),
    ARRAY['startup']::text[],
    '33333333-3333-3333-3333-333333333333'  -- Link to our composite
);

-- Remove the old update that tried to find HominioDB proposal
DELETE FROM proposals WHERE title = 'HominioDB: A Collaborative Database for Human Knowledge';

-- Enable RLS
ALTER TABLE composites ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE composites TO service_role;

-- Create RLS policy
CREATE POLICY "service_role_policy" ON composites
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Add trigger to ensure compose references only valid db entries
CREATE OR REPLACE FUNCTION check_compose_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.compose IS NOT NULL THEN
        -- Check if the id exists in either db or db_archive table directly
        IF NOT EXISTS (
            SELECT 1 FROM db WHERE id = NEW.compose
            UNION ALL
            SELECT 1 FROM db_archive WHERE id = NEW.compose
        ) THEN
            RAISE EXCEPTION 'Invalid compose reference. Must reference a valid db or archived db id.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_compose_reference_trigger
    BEFORE INSERT OR UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION check_compose_reference();

-- Modify the existing update_db_version function to handle proposal references
CREATE OR REPLACE FUNCTION public.update_db_version(
    p_id uuid,
    p_json jsonb
) RETURNS "public"."db" AS $$
DECLARE
    v_old_version "public"."db";
    v_new_id uuid;
    v_result "public"."db";
BEGIN
    -- Get the current version
    SELECT * INTO v_old_version 
    FROM "public"."db" 
    WHERE id = p_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Record with ID % not found', p_id;
    END IF;

    -- Generate new ID
    v_new_id := gen_random_uuid();

    -- Create new version first
    INSERT INTO "public"."db" (
        id,
        json,
        author,
        schema,
        version,
        variation,
        created_at,
        prev
    ) VALUES (
        v_new_id,
        p_json,
        v_old_version.author,
        v_old_version.schema,
        v_old_version.version + 1,
        v_old_version.variation,
        now(),
        null  -- Will update this after archiving
    )
    RETURNING * INTO v_result;

    -- Archive the old version
    INSERT INTO public.db_archive (
        id,
        json,
        author,
        schema,
        version,
        variation,
        created_at,
        prev
    ) VALUES (
        v_old_version.id,
        v_old_version.json,
        v_old_version.author,
        v_old_version.schema,
        v_old_version.version,
        v_old_version.variation,
        v_old_version.created_at,
        v_old_version.prev
    );

    -- Update the new version's prev to point to the archived version
    UPDATE "public"."db"
    SET prev = v_old_version.id
    WHERE id = v_new_id;

    -- Finally delete the old version
    DELETE FROM "public"."db" WHERE id = p_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get latest versions (useful for UI display)
CREATE OR REPLACE FUNCTION get_latest_versions()
RETURNS TABLE (
    id uuid,
    variation uuid,
    version integer,
    json jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_versions AS (
        SELECT DISTINCT ON (variation)
            id,
            variation,
            version,
            json
        FROM db
        ORDER BY variation, version DESC
    )
    SELECT * FROM latest_versions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 