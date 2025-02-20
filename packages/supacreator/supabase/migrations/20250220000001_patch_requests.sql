-- Migration: Add patch-requests table and related functionality
-- Description: Adds support for git-like patch requests for content updates

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS generate_patch_request_trigger ON public.db;
DROP FUNCTION IF EXISTS public.generate_patch_request() CASCADE;
DROP FUNCTION IF EXISTS public.approve_patch_request(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_patch_request(uuid) CASCADE;
DROP TRIGGER IF EXISTS update_patch_requests_updated_at ON public.patch_requests;
DROP FUNCTION IF EXISTS public.update_patch_request_updated_at() CASCADE;
DROP TABLE IF EXISTS public.patch_requests CASCADE;

-- Create patch-requests table
CREATE TABLE IF NOT EXISTS "public"."patch_requests" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "status" text not null default 'pending',
    "author" uuid not null,
    "created_at" timestamptz not null default now(),
    "updated_at" timestamptz not null default now(),
    "old_version_id" uuid not null,
    "new_version_id" uuid not null,
    "composite_id" uuid not null,
    constraint "patch_requests_pkey" primary key ("id"),
    constraint "patch_requests_author_fkey" foreign key ("author") references public.profiles(id),
    constraint "patch_requests_composite_id_fkey" foreign key ("composite_id") references public.composites(id),
    constraint "patch_requests_old_version_fkey" foreign key ("old_version_id") references public.db_archive(id),
    constraint "patch_requests_status_check" check (status in ('pending', 'approved', 'rejected'))
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_patch_request_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patch_requests_updated_at
    BEFORE UPDATE ON public.patch_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_patch_request_updated_at();

-- Create function to generate patch requests on db updates
CREATE OR REPLACE FUNCTION public.generate_patch_request(
    p_old_version_id uuid,
    p_new_version_id uuid
)
RETURNS void AS $$
DECLARE
    v_title text;
    v_description text;
    v_composite_record record;
    v_new_version record;
    v_old_version record;
    v_existing_request record;
BEGIN
    -- Get the new version details
    SELECT * INTO v_new_version 
    FROM public.db 
    WHERE id = p_new_version_id;

    IF v_new_version IS NULL THEN
        RAISE EXCEPTION 'New version % not found in db', p_new_version_id;
    END IF;

    -- Try to get the old version from archive first
    SELECT * INTO v_old_version 
    FROM public.db_archive 
    WHERE id = p_old_version_id;

    -- If not in archive, it might be in active db (about to be archived)
    IF v_old_version IS NULL THEN
        SELECT * INTO v_old_version 
        FROM public.db 
        WHERE id = p_old_version_id;
    END IF;

    IF v_old_version IS NULL THEN
        RAISE EXCEPTION 'Old version % not found in either db or db_archive', p_old_version_id;
    END IF;

    -- Find composites that were referencing the old version
    FOR v_composite_record IN 
        SELECT id, title, compose_id 
        FROM public.composites 
        WHERE compose_id = p_old_version_id
    LOOP
        -- Check if a patch request already exists
        SELECT * INTO v_existing_request
        FROM public.patch_requests
        WHERE composite_id = v_composite_record.id
        AND old_version_id = p_old_version_id
        AND status = 'pending';

        -- Only create a new patch request if one doesn't exist
        IF v_existing_request IS NULL THEN
            -- Generate descriptive title and description
            v_title := 'Update request for ' || v_composite_record.title;
            v_description := format(
                'Content update for %s.%s%s%s',
                v_composite_record.title,
                E'\n\nPrevious version: ' || p_old_version_id,
                E'\nNew version: ' || p_new_version_id,
                CASE 
                    WHEN v_new_version.variation <> v_old_version.variation 
                    THEN E'\n(Created as new variation)' 
                    ELSE '' 
                END
            );

            -- Create patch request
            INSERT INTO public.patch_requests (
                title,
                description,
                author,
                old_version_id,
                new_version_id,
                composite_id
            ) VALUES (
                v_title,
                v_description,
                v_new_version.author,
                p_old_version_id,
                p_new_version_id,
                v_composite_record.id
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS generate_patch_request_trigger ON public.db;
DROP TRIGGER IF EXISTS generate_patch_request_trigger_archive ON public.db_archive;

-- Enable RLS on patch_requests
ALTER TABLE "public"."patch_requests" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE "public"."patch_requests" TO service_role;

-- RLS Policies for patch_requests
DO $$ BEGIN
    DROP POLICY IF EXISTS "service_role_all" ON "public"."patch_requests";
    CREATE POLICY "service_role_all" ON "public"."patch_requests"
    AS PERMISSIVE FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patch_requests_composite_id ON public.patch_requests(composite_id);
CREATE INDEX IF NOT EXISTS idx_patch_requests_status ON public.patch_requests(status);
CREATE INDEX IF NOT EXISTS idx_patch_requests_author ON public.patch_requests(author);
CREATE INDEX IF NOT EXISTS idx_patch_requests_old_version ON public.patch_requests(old_version_id);
CREATE INDEX IF NOT EXISTS idx_patch_requests_new_version ON public.patch_requests(new_version_id);

-- Add function to approve patch request
CREATE OR REPLACE FUNCTION public.approve_patch_request(p_patch_request_id uuid)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
    v_composite "public"."composites";
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;

    -- Update the composite to point to the new version
    UPDATE public.composites
    SET compose_id = v_patch_request.new_version_id
    WHERE id = v_patch_request.composite_id
    RETURNING * INTO v_composite;

    -- Update the patch request status
    UPDATE public.patch_requests
    SET status = 'approved',
        updated_at = now()
    WHERE id = p_patch_request_id
    RETURNING * INTO v_patch_request;

    RETURN v_patch_request;
END;
$$ LANGUAGE plpgsql;

-- Add function to reject patch request
CREATE OR REPLACE FUNCTION public.reject_patch_request(p_patch_request_id uuid)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
BEGIN
    -- Update the patch request status
    UPDATE public.patch_requests
    SET status = 'rejected',
        updated_at = now()
    WHERE id = p_patch_request_id
      AND status = 'pending'
    RETURNING * INTO v_patch_request;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;

    RETURN v_patch_request;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate version references
CREATE OR REPLACE FUNCTION public.validate_patch_request_versions()
RETURNS trigger AS $$
BEGIN
    -- Check if new version exists in either db or archive
    IF NOT EXISTS (
        SELECT 1 FROM public.db WHERE id = NEW.new_version_id
        UNION ALL
        SELECT 1 FROM public.db_archive WHERE id = NEW.new_version_id
    ) THEN
        RAISE EXCEPTION 'New version % not found in db or db_archive', NEW.new_version_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate version references
CREATE TRIGGER validate_patch_request_versions
    BEFORE INSERT OR UPDATE ON public.patch_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_patch_request_versions();

-- Create function to watch for version updates
CREATE OR REPLACE FUNCTION public.on_version_updated()
RETURNS trigger AS $$
BEGIN
    -- Only proceed if prev field was updated and is not null
    IF NEW.prev IS NOT NULL THEN
        -- Call the patch request generation with the correct version IDs
        PERFORM public.generate_patch_request(NEW.prev, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to watch for prev field updates
CREATE TRIGGER on_version_updated_trigger
    AFTER UPDATE OF prev ON public.db
    FOR EACH ROW
    WHEN (NEW.prev IS NOT NULL)
    EXECUTE FUNCTION public.on_version_updated();

-- Drop existing archive trigger if it exists
DROP TRIGGER IF EXISTS on_version_archived_trigger ON public.db_archive;
DROP FUNCTION IF EXISTS public.on_version_archived() CASCADE; 