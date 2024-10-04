
create extension if not exists "wrappers" with schema "extensions";

create table "public"."db" (
    "id" uuid not null default gen_random_uuid(),
    "json" jsonb
);

alter table "public"."db" enable row level security;

CREATE UNIQUE INDEX db_pkey ON public.db USING btree (id);

alter table "public"."db" add constraint "db_pkey" PRIMARY KEY using index "db_pkey";

set check_function_bodies = off;

grant delete on table "public"."db" to "service_role";

grant insert on table "public"."db" to "service_role";

grant references on table "public"."db" to "service_role";

grant select on table "public"."db" to "service_role";

grant trigger on table "public"."db" to "service_role";

grant truncate on table "public"."db" to "service_role";

grant update on table "public"."db" to "service_role";
