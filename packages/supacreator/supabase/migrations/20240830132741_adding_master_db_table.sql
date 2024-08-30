create extension if not exists "wrappers" with schema "extensions";

create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb
);

alter table "public"."db" enable row level security;

create table "public"."schemas" (
    "json" jsonb not null,
    "cid" text not null
);

alter table "public"."schemas" enable row level security;

CREATE UNIQUE INDEX db_pkey ON public.db USING btree (id);

CREATE UNIQUE INDEX schemas_jsonschema_key ON public.schemas USING btree (json);

CREATE UNIQUE INDEX schemas_pkey ON public.schemas USING btree (cid);

alter table "public"."db" add constraint "db_pkey" PRIMARY KEY using index "db_pkey";

alter table "public"."schemas" add constraint "schemas_pkey" PRIMARY KEY using index "schemas_pkey";

alter table "public"."schemas" add constraint "schemas_jsonschema_key" UNIQUE using index "schemas_jsonschema_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_content_hash()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    cid text;
BEGIN
    -- Generate SHA-256 hash and encode in Base64
    cid = encode(digest(NEW.json::text, 'sha256'), 'base64');

    -- Remove padding characters (=) from the end
    cid = rtrim(cid, '=');

    -- Replace characters to make it URL-safe
    cid = replace(replace(cid, '+', '-'), '/', '_');

    NEW.cid = cid;
    RETURN NEW;
END;$function$
;

grant delete on table "public"."db" to "service_role";

grant insert on table "public"."db" to "service_role";

grant references on table "public"."db" to "service_role";

grant select on table "public"."db" to "service_role";

grant trigger on table "public"."db" to "service_role";

grant truncate on table "public"."db" to "service_role";

grant update on table "public"."db" to "service_role";

grant delete on table "public"."schemas" to "service_role";

grant insert on table "public"."schemas" to "service_role";

grant references on table "public"."schemas" to "service_role";

grant select on table "public"."schemas" to "service_role";

grant trigger on table "public"."schemas" to "service_role";

grant truncate on table "public"."schemas" to "service_role";

grant update on table "public"."schemas" to "service_role";

CREATE TRIGGER update_content_hash BEFORE INSERT OR UPDATE ON public.schemas FOR EACH ROW EXECUTE FUNCTION generate_content_hash();
