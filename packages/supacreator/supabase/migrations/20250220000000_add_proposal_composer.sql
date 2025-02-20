-- Create composites table
CREATE TABLE composites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    schema_id UUID NOT NULL,
    instance_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- Create function to handle db versioning with composite references
CREATE OR REPLACE FUNCTION handle_db_version_with_composites()
RETURNS trigger AS $$
DECLARE
    v_old_version record;
    v_new_id uuid;
BEGIN
    -- Check if this entry is referenced by any composites
    IF EXISTS (
        SELECT 1 FROM composites 
        WHERE schema_id = OLD.id OR instance_id = OLD.id
    ) THEN
        -- For referenced entries, we:
        -- 1. Keep the old version in db_archive (for composite references)
        -- 2. Create a new version with new content
        -- 3. Don't update any composite references
        
        -- First archive the old version
        INSERT INTO db_archive (
            id,
            json,
            author,
            schema,
            version,
            variation,
            created_at,
            prev
        ) VALUES (
            OLD.id,
            OLD.json,
            OLD.author,
            OLD.schema,
            OLD.version,
            OLD.variation,
            OLD.created_at,
            OLD.prev
        );

        -- Create new version with new content
        INSERT INTO db (
            id,
            json,
            author,
            schema,
            version,
            variation,
            created_at,
            prev
        ) VALUES (
            gen_random_uuid(),  -- New ID for the new version
            NEW.json,
            OLD.author,
            OLD.schema,
            OLD.version + 1,
            OLD.variation,
            now(),
            OLD.id
        );
        
        -- Don't actually delete the old version since it's referenced
        RETURN NULL;
    END IF;
    
    -- For non-referenced entries, proceed with normal update
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS handle_db_version_composites ON db;
CREATE TRIGGER handle_db_version_composites
    BEFORE UPDATE ON db
    FOR EACH ROW
    EXECUTE FUNCTION handle_db_version_with_composites();

-- Modify get_db_entry to handle both active and archived entries
CREATE OR REPLACE FUNCTION get_db_entry(p_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_json jsonb;
BEGIN
    -- First try to get from active db
    SELECT json INTO v_json
    FROM db
    WHERE id = p_id;

    -- If not found in active db, try archive
    IF v_json IS NULL THEN
        SELECT json INTO v_json
        FROM db_archive
        WHERE id = p_id;
    END IF;

    RETURN v_json;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate composite references
CREATE OR REPLACE FUNCTION validate_composite_references()
RETURNS trigger AS $$
BEGIN
    -- Check if schema exists in either active or archive
    IF NOT EXISTS (
        SELECT 1 FROM db WHERE id = NEW.schema_id
        UNION
        SELECT 1 FROM db_archive WHERE id = NEW.schema_id
    ) THEN
        RAISE EXCEPTION 'Schema with ID % not found in db or archive', NEW.schema_id;
    END IF;

    -- Check if instance exists in either active or archive
    IF NOT EXISTS (
        SELECT 1 FROM db WHERE id = NEW.instance_id
        UNION
        SELECT 1 FROM db_archive WHERE id = NEW.instance_id
    ) THEN
        RAISE EXCEPTION 'Instance with ID % not found in db or archive', NEW.instance_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for composite validation
CREATE TRIGGER validate_composite_refs
    BEFORE INSERT OR UPDATE ON composites
    FOR EACH ROW
    EXECUTE FUNCTION validate_composite_references();

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
'00000000-0000-0000-0000-000000000001',  -- Meta schema
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
'11111111-1111-1111-1111-111111111111',  -- References the markdown schema
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
    ARRAY['platform', 'collaboration', 'vision']::text[],
    '33333333-3333-3333-3333-333333333333'  -- Link to our composite
);

-- Remove any old proposals
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

-- Create function to get composite data with versioning support
CREATE OR REPLACE FUNCTION get_composite_data(p_composite_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    schema_json jsonb,
    instance_json jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        (SELECT get_db_entry(c.schema_id)) as schema_json,
        (SELECT get_db_entry(c.instance_id)) as instance_json
    FROM composites c
    WHERE c.id = p_composite_id;
END;
$$ LANGUAGE plpgsql; 