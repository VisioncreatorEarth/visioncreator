create extension if not exists "wrappers" with schema "extensions";

create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb,
    "author" uuid references auth.users(id) on delete set null,
    "version" integer not null default 1,
    "created_at" timestamptz not null default now(),
    "updated_at" timestamptz not null default now(),
    constraint "db_pkey" primary key ("id")
);

-- Set the root schema ID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
INSERT INTO "public"."db" (id, json, author, version) VALUES 
('00000000-0000-0000-0000-000000000001', 
'{ 
  "type": "object",
  "title": "Meta Schema",
  "description": "Root schema for defining all other schemas",
  "schema_id": "00000000-0000-0000-0000-000000000001",
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
  "required": ["type", "schema_id", "title", "description", "properties"]
}'::jsonb,
'00000000-0000-0000-0000-000000000001',  -- System user ID for root schema
1  -- Initial version
);

-- Create indexes
CREATE INDEX idx_db_author ON public.db(author);
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

-- Allow authenticated users to read all records
create policy "authenticated_users_read"
  on "public"."db"
  as permissive
  for select
  to authenticated
  using (true);

-- Allow users to create their own records
create policy "users_create_own"
  on "public"."db"
  as permissive
  for insert
  to authenticated
  with check (author = auth.uid());

-- Allow users to update their own records
create policy "users_update_own"
  on "public"."db"
  as permissive
  for update
  to authenticated
  using (author = auth.uid())
  with check (author = auth.uid());

-- Allow users to delete their own records
create policy "users_delete_own"
  on "public"."db"
  as permissive
  for delete
  to authenticated
  using (author = auth.uid());

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

