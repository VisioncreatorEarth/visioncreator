create extension if not exists "wrappers" with schema "extensions";

-- Create archive table first since it's referenced by db table
CREATE TABLE "public"."db_archive" (
    "id" uuid not null,
    "json" jsonb,
    "author" uuid,
    "schema" uuid,  -- Will be updated to reference db(id) after db table creation
    "version" integer not null,
    "created_at" timestamptz not null,
    "archived_at" timestamptz not null default now(),
    "prev" uuid references db_archive(id),
    constraint "db_archive_pkey" primary key ("id"),
    constraint "db_archive_author_fkey" foreign key ("author") references profiles(id)
);

-- Then create the main db table
create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb,
    "author" uuid,
    "schema" uuid references db(id) on delete restrict,
    "version" integer not null default 1,
    "created_at" timestamptz not null default now(),
    "prev" uuid references db_archive(id),
    constraint "db_pkey" primary key ("id"),
    constraint "db_author_fkey" foreign key ("author") references profiles(id) on delete set null
);

-- Now add the foreign key constraint to db_archive.schema
ALTER TABLE "public"."db_archive" 
ADD CONSTRAINT "db_archive_schema_fkey" 
FOREIGN KEY ("schema") REFERENCES "public"."db"(id);

-- Set the root schema ID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
INSERT INTO "public"."db" (id, json, author, version, schema) VALUES 
('00000000-0000-0000-0000-000000000001', 
'{ 
  "type": "object",
  "title": "Meta Schema",
  "description": "Root schema for defining all other schemas",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["object", "array", "string", "number", "integer", "boolean", "null"],
      "title": "Type",
      "description": "The type of the schema"
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
    "display_field": {
      "type": "string",
      "title": "Display Field",
      "description": "The field to use for displaying the object"
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
  "required": ["type", "title", "description", "properties"]
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user ID for root schema
1,  -- Initial version
'00000000-0000-0000-0000-000000000001'  -- Self-reference for meta schema
);

-- Create indexes
CREATE INDEX idx_db_author ON public.db(author);
CREATE INDEX idx_db_schema ON public.db(schema);
CREATE INDEX idx_db_version ON public.db(version);
CREATE INDEX idx_db_archive_schema ON public.db_archive(schema);
CREATE INDEX idx_db_archive_prev ON public.db_archive(prev);

-- Enable RLS
alter table "public"."db" enable row level security;
alter table "public"."db_archive" enable row level security;

-- Grant service role permissions
grant all privileges on table "public"."db" to service_role;
grant all privileges on table "public"."db_archive" to service_role;

-- RLS Policies for db table
create policy "service_role_all"
  on "public"."db"
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- RLS Policies for archive table
create policy "service_role_all"
  on "public"."db_archive"
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- Create version update function with proper ID handling
CREATE OR REPLACE FUNCTION public.update_db_version(
    p_id uuid,
    p_json jsonb
) RETURNS "public"."db" AS $$
DECLARE
    v_old_version "public"."db";
    v_new_id uuid;
    v_result "public"."db";
BEGIN
    -- Get the current version before deletion
    SELECT * INTO v_old_version 
    FROM "public"."db" 
    WHERE id = p_id;

    -- Generate new ID for the new version
    v_new_id := gen_random_uuid();

    -- Move current version to archive
    INSERT INTO public.db_archive (
        id,
        json,
        author,
        schema,
        version,
        created_at,
        prev
    ) VALUES (
        v_old_version.id,
        v_old_version.json,
        v_old_version.author,
        v_old_version.schema,
        v_old_version.version,
        v_old_version.created_at,
        v_old_version.prev
    );

    -- Delete the current version
    DELETE FROM "public"."db" WHERE id = p_id;

    -- Create new version with new ID
    INSERT INTO "public"."db" (
        id,
        json,
        author,
        schema,
        version,
        created_at,
        prev
    ) VALUES (
        v_new_id,
        p_json,
        v_old_version.author,
        v_old_version.schema,
        v_old_version.version + 1,
        now(),
        p_id  -- Previous version's ID
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Remove the old trigger since we're handling archiving in the function
DROP TRIGGER IF EXISTS on_db_update_archive ON public.db;
DROP FUNCTION IF EXISTS public.archive_db_version();

