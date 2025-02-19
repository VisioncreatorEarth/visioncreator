create extension if not exists "wrappers" with schema "extensions";

-- First, drop any existing objects that might conflict
DROP FUNCTION IF EXISTS public.update_db_version CASCADE;
DROP TRIGGER IF EXISTS on_db_update_archive ON public.db CASCADE;
DROP FUNCTION IF EXISTS public.archive_db_version CASCADE;

-- Drop tables if they exist (this will also drop their constraints)
DROP TABLE IF EXISTS "public"."db_archive" CASCADE;
DROP TABLE IF EXISTS "public"."db" CASCADE;

-- Create archive table first since it's referenced by db table
CREATE TABLE "public"."db_archive" (
    "id" uuid not null,
    "json" jsonb,
    "author" uuid,
    "schema" uuid,
    "version" integer not null,
    "variation" uuid not null,
    "created_at" timestamptz not null,
    "archived_at" timestamptz not null default now(),
    "prev" uuid,  -- Self-referential constraint added later
    constraint "db_archive_pkey" primary key ("id"),
    constraint "db_archive_author_fkey" foreign key ("author") references profiles(id)
);

-- Then create the main db table
create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb,
    "author" uuid,
    "schema" uuid,  -- Self-referential constraint added later
    "version" integer not null default 1,
    "variation" uuid not null default gen_random_uuid(),
    "created_at" timestamptz not null default now(),
    "prev" uuid,  -- Reference to archive added later
    constraint "db_pkey" primary key ("id"),
    constraint "db_author_fkey" foreign key ("author") references profiles(id) on delete set null
);

-- Add constraints after tables exist
ALTER TABLE "public"."db_archive" 
ADD CONSTRAINT "db_archive_prev_fkey" 
FOREIGN KEY ("prev") REFERENCES "public"."db_archive"(id);

-- First drop existing constraints
ALTER TABLE "public"."db" DROP CONSTRAINT IF EXISTS "db_schema_fkey";
ALTER TABLE "public"."db" DROP CONSTRAINT IF EXISTS "db_prev_fkey";
ALTER TABLE "public"."db_archive" DROP CONSTRAINT IF EXISTS "db_archive_schema_fkey";

-- Create a function to validate schema references across both tables
CREATE OR REPLACE FUNCTION public.validate_schema_reference() 
RETURNS trigger AS $$
BEGIN
  -- Allow self-reference for root schema
  IF NEW.id = '00000000-0000-0000-0000-000000000001' AND 
     NEW.schema = '00000000-0000-0000-0000-000000000001' THEN
    RETURN NEW;
  END IF;

  -- Check if the schema exists in either active or archive table
  IF EXISTS (SELECT 1 FROM public.db WHERE id = NEW.schema) 
     OR EXISTS (SELECT 1 FROM public.db_archive WHERE id = NEW.schema) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Referenced schema % not found in db or db_archive', NEW.schema;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to validate schema references
CREATE TRIGGER validate_schema_ref_db
  BEFORE INSERT OR UPDATE ON public.db
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_schema_reference();

CREATE TRIGGER validate_schema_ref_archive
  BEFORE INSERT OR UPDATE ON public.db_archive
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_schema_reference();

-- Create indexes
CREATE INDEX idx_db_author ON public.db(author);
CREATE INDEX idx_db_schema ON public.db(schema);
CREATE INDEX idx_db_version ON public.db(version);
CREATE INDEX idx_db_variation ON public.db(variation);
CREATE INDEX idx_db_archive_schema ON public.db_archive(schema);
CREATE INDEX idx_db_archive_prev ON public.db_archive(prev);
CREATE INDEX idx_db_archive_variation ON public.db_archive(variation);

-- Create version update function
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

-- Enable RLS
ALTER TABLE "public"."db" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."db_archive" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE "public"."db" TO service_role;
GRANT ALL PRIVILEGES ON TABLE "public"."db_archive" TO service_role;

-- RLS Policies
CREATE POLICY "service_role_all" ON "public"."db"
AS PERMISSIVE FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON "public"."db_archive"
AS PERMISSIVE FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Insert root schema
INSERT INTO "public"."db" (id, json, author, version, schema, variation) VALUES 
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
      "description": "The type of the schema",
      "isMetadata": true
    },
    "title": {
      "type": "string",
      "title": "Title",
      "description": "The title of the schema",
      "isMetadata": true
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
'00000000-0000-0000-0000-000000000001',  -- Self-reference for meta schema
'00000000-0000-0000-0000-000000000001'   -- Variation ID (same as ID for root schema)
);

