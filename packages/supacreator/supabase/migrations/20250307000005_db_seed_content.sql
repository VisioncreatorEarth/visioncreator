-- Migration: Seed content with TipTap-like structure
-- Description: Adds seed content and schema with TipTap rich text format

-- First, insert the rich text content schema
INSERT INTO db (id, json, author, schema, snapshot_id) VALUES 
('11111111-1111-1111-1111-111111111111', 
'{
  "type": "object",
  "title": "Rich Text Content",
  "description": "A schema for TipTap/Prose.io style rich text content with strict validation",
  "properties": {
    "content": {
      "type": "object",
      "title": "Rich Text Content",
      "description": "ProseMirror/TipTap formatted content",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["doc"]
        },
        "content": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "enum": ["paragraph", "heading", "blockquote", "bulletList", "orderedList", "codeBlock", "horizontalRule", "image"]
              },
              "attrs": {
                "type": "object"
              },
              "content": {
                "type": "array",
                "items": {
                  "type": "object"
                }
              },
              "marks": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": ["bold", "italic", "underline", "strike", "code", "link"]
                    },
                    "attrs": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "required": ["type", "content"]
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
        },
        "examples": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "value": { "type": "number" }
            }
          },
          "description": "Example items with name and value"
        },
        "nested": {
          "type": "object",
          "description": "Nested object structure for complex metadata"
        }
      },
      "additionalProperties": true
    }
  },
  "required": ["content", "title", "metadata"],
  "additionalProperties": false
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user
'00000000-0000-0000-0000-000000000001',  -- Meta schema
gen_random_uuid()  -- Generate a random UUID for snapshot_id
);

-- Insert main instance with TipTap structure
INSERT INTO db (id, json, author, schema, snapshot_id) VALUES 
('22222222-2222-2222-2222-222222222222', 
'{
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": { "level": 1 },
        "content": [
          { "type": "text", "text": "Business Model Proposal" }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "The FORGE is a community-owned ecosystem where Visioncreators craft AI solutions." }
        ]
      },
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Key stakeholders include SMBs, Visioncreators, and the FORGE Platform." }
        ]
      },
      {
        "type": "heading",
        "attrs": { "level": 2 },
        "content": [
          { "type": "text", "text": "Value Proposition" }
        ]
      },
      {
        "type": "bulletList",
        "content": [
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "For Visioncreators: ", "marks": [{ "type": "bold" }] },
                  { "type": "text", "text": "Access to clients and shared infrastructure" }
                ]
              }
            ]
          },
          {
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "For SMBs: ", "marks": [{ "type": "bold" }] },
                  { "type": "text", "text": "Custom AI solutions at affordable prices" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "title": "The FORGE: Where Visioncreator Thrive",
  "description": "A business model proposal for a community-owned organization where Visioncreators craft AI solutions for SMBs",
  "metadata": {
    "benefits": "Launch your own AI business in a supportive ecosystem with built-in infrastructure and client base.",
    "pain": "Independent creators struggle to find steady work and lack the infrastructure to scale their businesses.",
    "tags": ["product", "business-model", "community"],
    "examples": [
      {"name": "Example 1", "value": 100},
      {"name": "Example 2", "value": 200},
      {"name": "Example 3", "value": 300}
    ],
    "nested": {
      "level1": {
        "name": "Level 1",
        "level2": {
          "name": "Level 2",
          "level3": {
            "name": "Level 3",
            "level4": {
              "name": "Level 4",
              "value": 4,
              "isActive": true,
              "items": ["item1", "item2", "item3"]
            }
          }
        }
      }
    }
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
    'The FORGE',
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