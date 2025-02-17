create extension if not exists "wrappers" with schema "extensions";

create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb,
    "author" uuid,
    "schema" uuid references db(id) on delete restrict,
    "version" integer not null default 1,
    "created_at" timestamptz not null default now(),
    "updated_at" timestamptz not null default now(),
    constraint "db_pkey" primary key ("id"),
    constraint "db_author_fkey" foreign key ("author") references profiles(id) on delete set null
);

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

-- Enable RLS
alter table "public"."db" enable row level security;

-- Grant service role permissions
grant all privileges on table "public"."db" to service_role;

-- RLS Policies
-- Allow service_role to do everything
create policy "service_role_all"
  on "public"."db"
  as permissive
  for all
  to service_role
  using (true)
  with check (true);


-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_db_update
  before update on public.db
  for each row
  execute function public.handle_updated_at();

