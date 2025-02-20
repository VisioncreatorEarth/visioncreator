-- Create composites table
CREATE TABLE composites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    compose_id UUID NOT NULL,  -- Main production/master version
    variations UUID[] DEFAULT ARRAY[]::UUID[],  -- Array of alternative variation IDs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX idx_composites_compose ON composites(compose_id);
CREATE INDEX idx_composites_variations ON composites USING GIN(variations);

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

-- Add comment explaining the fields
COMMENT ON COLUMN proposals.compose IS 'Reference to a composite that contains instance data for this proposal';
COMMENT ON COLUMN composites.compose_id IS 'The main production/master version of the content';
COMMENT ON COLUMN composites.variations IS 'Array of alternative variation IDs, similar to git branches';

-- Create function to handle db version with composite references
CREATE OR REPLACE FUNCTION handle_db_version_with_composites()
RETURNS trigger AS $$
DECLARE
    v_old_version record;
    v_new_id uuid;
BEGIN
    -- Check if this entry is referenced by any composites
    IF EXISTS (
        SELECT 1 FROM composites 
        WHERE compose_id = OLD.id 
        OR OLD.id = ANY(variations)
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
    -- Check if main compose_id exists
    IF NOT EXISTS (
        SELECT 1 FROM db WHERE id = NEW.compose_id
        UNION
        SELECT 1 FROM db_archive WHERE id = NEW.compose_id
    ) THEN
        RAISE EXCEPTION 'Main compose_id % not found in db or archive', NEW.compose_id;
    END IF;

    -- Check if all variation IDs exist
    IF EXISTS (
        SELECT 1
        FROM unnest(NEW.variations) AS variation_id
        WHERE NOT EXISTS (
            SELECT 1 FROM db WHERE id = variation_id
            UNION
            SELECT 1 FROM db_archive WHERE id = variation_id
        )
    ) THEN
        RAISE EXCEPTION 'One or more variation IDs not found in db or archive';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for composite validation
CREATE TRIGGER validate_composite_refs
    BEFORE INSERT OR UPDATE ON composites
    FOR EACH ROW
    EXECUTE FUNCTION validate_composite_references();

-- Create function to get composite data with all variations
CREATE OR REPLACE FUNCTION get_composite_data(p_composite_id uuid)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    instance_json jsonb,
    variations_json jsonb[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        (SELECT get_db_entry(c.compose_id)) as instance_json,
        ARRAY(
            SELECT get_db_entry(variation_id)
            FROM unnest(c.variations) AS variation_id
        ) as variations_json
    FROM composites c
    WHERE c.id = p_composite_id;
END;
$$ LANGUAGE plpgsql;

-- Insert the markdown schema first
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

-- Insert main instance (master) of the markdown schema
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222222', 
'{
  "content": "# Example Content\n\nThis is a sample markdown content instance.\n\n## Features\n- Supports full markdown\n- Can be used in proposals\n- Easy to edit and version",
  "schema": "11111111-1111-1111-1111-111111111111"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'11111111-1111-1111-1111-111111111111',  -- References the markdown schema
1,  -- Initial version
'22222222-2222-2222-2222-222222222222'   -- Unique variation ID
);

-- Insert a variation of the instance
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222223', 
'{
  "content": "# Alternative Content\n\nThis is a variation of the markdown content.\n\n## Additional Features\n- Different content structure\n- Alternative approach\n- Experimental features",
  "schema": "11111111-1111-1111-1111-111111111111"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'11111111-1111-1111-1111-111111111111',  -- References the markdown schema
1,  -- Initial version
'22222222-2222-2222-2222-222222222223'   -- Variation ID
);

-- Insert another variation of the instance with different variation ID
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222224', 
'{
  "content": "# Vision Creator Platform\n\nA revolutionary platform for collaborative vision development.\n\n## Core Concepts\n- Vision as Code\n- Collaborative Decision Making\n- Transparent Evolution\n- Community-Driven Development\n\n## How It Works\n1. Create Proposals\n2. Discuss & Refine\n3. Vote & Implement\n4. Track Progress",
  "schema": "11111111-1111-1111-1111-111111111111"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'11111111-1111-1111-1111-111111111111',  -- References the markdown schema
1,  -- Initial version
'33333333-3333-3333-3333-333333333333'   -- Different variation ID for clustering
);

-- Create a composite linking to the instance with multiple variations
INSERT INTO composites (id, title, description, compose_id, variations) VALUES 
('33333333-3333-3333-3333-333333333333',
'Markdown Content Composite',
'A composite for storing and versioning markdown content',
'22222222-2222-2222-2222-222222222222',   -- Main/master instance ID
ARRAY[
    '22222222-2222-2222-2222-222222222223',  -- First variation ID
    '22222222-2222-2222-2222-222222222224'   -- Second variation ID
]::UUID[]
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
    'idea',  -- Set as accepted by default
    0,          -- Initial votes
    0,          -- Initial tokens staked
    NOW(),
    NOW(),
    ARRAY['product']::text[],
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