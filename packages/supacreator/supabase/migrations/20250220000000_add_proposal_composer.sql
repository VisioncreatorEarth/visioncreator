-- Create composites table with new relationship architecture
CREATE TABLE composites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    compose_id UUID NOT NULL,  -- Main content version
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Keep variations array temporarily for backward compatibility
    variations UUID[] DEFAULT ARRAY[]::UUID[]
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

-- Add indexes for better query performance
CREATE INDEX idx_composites_compose ON composites(compose_id);
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
COMMENT ON TABLE composite_relationships IS 'Tracks relationships between composites (variations, forks, etc)';

-- Insert example data
-- First, insert the markdown schema
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

-- Insert main instance
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222222', 
'{
  "content": "# Example Content\n\nThis is a sample markdown content instance.\n\n## Features\n- Supports full markdown\n- Can be used in proposals\n- Easy to edit and version"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',
'11111111-1111-1111-1111-111111111111',
1,
'22222222-2222-2222-2222-222222222222'
);

-- Insert alternative design version
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222223', 
'{
  "content": "# Alternative Content\n\nThis is a variation of the markdown content.\n\n## Additional Features\n- Different content structure\n- Alternative approach\n- Experimental features"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',
'11111111-1111-1111-1111-111111111111',
1,
'22222222-2222-2222-2222-222222222223'
);

-- Insert platform vision version
INSERT INTO db (id, json, author, schema, version, variation) VALUES 
('22222222-2222-2222-2222-222222222224', 
'{
  "content": "# Vision Creator Platform\n\nA revolutionary platform for collaborative vision development.\n\n## Core Concepts\n- Vision as Code\n- Collaborative Decision Making\n- Transparent Evolution\n- Community-Driven Development"
}'::jsonb,
'00000000-0000-0000-0000-000000000001',
'11111111-1111-1111-1111-111111111111',
1,
'22222222-2222-2222-2222-222222222224'
);

-- Create main composite
INSERT INTO composites (
    id,
    title,
    description,
    compose_id
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Markdown Content Composite',
    'A composite for storing and versioning markdown content',
    '22222222-2222-2222-2222-222222222222'
);

-- Create alternative design composite
INSERT INTO composites (
    id,
    title,
    description,
    compose_id
) VALUES (
    '33333333-3333-3333-3333-333333333334',
    'Alternative Design',
    'Alternative design exploration',
    '22222222-2222-2222-2222-222222222223'
);

-- Create platform vision composite
INSERT INTO composites (
    id,
    title,
    description,
    compose_id
) VALUES (
    '33333333-3333-3333-3333-333333333335',
    'Platform Vision',
    'Vision for the platform',
    '22222222-2222-2222-2222-222222222224'
);

-- Create relationships between composites
INSERT INTO composite_relationships (
    source_composite_id,
    target_composite_id,
    relationship_type,
    metadata
) VALUES 
-- Alternative design is a variation of main composite
(
    '33333333-3333-3333-3333-333333333334',
    '33333333-3333-3333-3333-333333333333',
    'variation_of',
    jsonb_build_object(
        'created_at', now(),
        'variation_type', 'design',
        'description', 'Alternative design exploration'
    )
),
-- Platform vision is a variation of main composite
(
    '33333333-3333-3333-3333-333333333335',
    '33333333-3333-3333-3333-333333333333',
    'variation_of',
    jsonb_build_object(
        'created_at', now(),
        'variation_type', 'vision',
        'description', 'Platform vision exploration'
    )
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
    '00000000-0000-0000-0000-000000000001',
    '# The Visioncreator Platform\n\nA collaborative platform for creating, sharing, and evolving visions together.',
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