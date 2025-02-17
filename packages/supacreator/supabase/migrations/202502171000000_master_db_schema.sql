create extension if not exists "wrappers" with schema "extensions";

create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb,
    constraint "db_pkey" primary key ("id")
);

-- Set the root schema ID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
INSERT INTO "public"."db" (id, json) VALUES 
('00000000-0000-0000-0000-000000000001', 
'{ 
  "type": "object",
  "title": "Meta Schema",
  "description": "Root schema for defining all other schemas",
  "schema_id": "00000000-0000-0000-0000-000000000001",
  "version": 1,
  "author": "HominioAlpha",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["object", "array", "string", "number", "integer", "boolean", "null"],
      "title": "Type",
      "description": "The type of the schema"
    },
    "schema_id": {
      "type": "string",
      "format": "uuid",
      "title": "Schema ID",
      "description": "Reference to the schema this object conforms to"
    },
    "title": {
      "type": "string",
      "title": "Title",
      "description": "The title of the schema"
    },
    "description": {
      "type": "string",
      "title": "Description", 
      "description": "A description of the schema"
    },
    "version": {
      "type": "integer",
      "minimum": 1,
      "title": "Version",
      "description": "Schema version number"
    },
    "author": {
      "type": "string",
      "title": "Author",
      "description": "Schema author"
    },
    "properties": {
      "type": "object",
      "title": "Properties",
      "description": "Schema properties definition"
    },
    "required": {
      "type": "array",
      "items": {"type": "string"},
      "title": "Required Fields",
      "description": "List of required properties"
    }
  },
  "required": ["type", "schema_id", "title", "description", "version", "properties"]
}'::jsonb);

alter table "public"."db" enable row level security;

grant delete on table "public"."db" to "service_role";
grant insert on table "public"."db" to "service_role";
grant references on table "public"."db" to "service_role";
grant select on table "public"."db" to "service_role";
grant trigger on table "public"."db" to "service_role";
grant truncate on table "public"."db" to "service_role";
grant update on table "public"."db" to "service_role";

