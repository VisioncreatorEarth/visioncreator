-- Migration: Add patch-requests table and related functionality
-- Description: Adds support for git-like patch requests for content updates

-- Drop existing objects if they exist, but check if tables exist first
DO $$
BEGIN
    -- Check if the tables exist before trying to drop triggers
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'db') THEN
        DROP TRIGGER IF EXISTS generate_patch_request_trigger ON public.db;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patch_requests') THEN
        DROP TRIGGER IF EXISTS update_patch_requests_updated_at ON public.patch_requests;
        DROP TRIGGER IF EXISTS auto_approve_own_patch_requests ON public.patch_requests;
    END IF;
    
    -- Drop functions regardless of table existence
    DROP FUNCTION IF EXISTS public.generate_patch_request() CASCADE;
    DROP FUNCTION IF EXISTS public.approve_patch_request(uuid) CASCADE;
    DROP FUNCTION IF EXISTS public.reject_patch_request(uuid) CASCADE;
    DROP FUNCTION IF EXISTS public.update_patch_request_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS public.auto_approve_own_patch_requests() CASCADE;
END
$$;

-- Drop the table if it exists
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
    constraint "patch_requests_status_check" check (status in ('pending', 'approved', 'rejected'))
);

-- Create a trigger to validate old_version_id exists in either db or db_archive
CREATE OR REPLACE FUNCTION public.validate_old_version_id() 
RETURNS trigger AS $$
BEGIN
  -- Check if the old_version_id exists in either active or archive table
  IF EXISTS (SELECT 1 FROM public.db WHERE id = NEW.old_version_id) 
     OR EXISTS (SELECT 1 FROM public.db_archive WHERE id = NEW.old_version_id) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Referenced old_version_id % not found in db or db_archive', NEW.old_version_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate old_version_id
CREATE TRIGGER validate_old_version_id
  BEFORE INSERT OR UPDATE ON public.patch_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_old_version_id();

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
RETURNS uuid AS $$
DECLARE
    v_title text;
    v_description text;
    v_composite_record record;
    v_new_version record;
    v_old_version record;
    v_existing_request record;
    v_patch_request_id uuid;
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

    -- Find all composites that reference this content version
    FOR v_composite_record IN 
        SELECT c.id, c.title, c.compose_id 
        FROM public.composites c
        WHERE c.compose_id = p_old_version_id
    LOOP
        -- Check if a patch request already exists for this composite
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
                'Content update for %s.%s%s',
                v_composite_record.title,
                E'\n\nPrevious version: ' || p_old_version_id,
                E'\nNew version: ' || p_new_version_id
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
            )
            RETURNING id INTO v_patch_request_id;
            
            -- Generate operations for this patch request if the function exists
            IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_operations_from_diff') THEN
                PERFORM public.generate_operations_from_diff(
                    v_old_version.json,
                    v_new_version.json,
                    v_patch_request_id,
                    v_new_version.author,
                    v_composite_record.id,
                    p_new_version_id
                );
            END IF;
        ELSE
            v_patch_request_id := v_existing_request.id;
        END IF;
    END LOOP;
    
    RETURN v_patch_request_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to watch for version updates
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

-- Add function to approve patch request
CREATE OR REPLACE FUNCTION public.approve_patch_request(p_patch_request_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
    v_composite "public"."composites";
    v_operations record;
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;

    -- Get the composite
    SELECT * INTO v_composite
    FROM public.composites
    WHERE id = v_patch_request.composite_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Composite not found for patch request';
    END IF;
    
    -- Check permissions if a user ID is provided
    IF p_user_id IS NOT NULL THEN
        -- Only the composite author can approve patch requests
        IF p_user_id != v_composite.author THEN
            RAISE EXCEPTION 'Only the composite author can approve patch requests';
        END IF;
    END IF;

    -- Update the composite to point to the new version
    UPDATE public.composites
    SET compose_id = v_patch_request.new_version_id,
        updated_at = now()
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
CREATE OR REPLACE FUNCTION public.reject_patch_request(p_patch_request_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS "public"."patch_requests" AS $$
DECLARE
    v_patch_request "public"."patch_requests";
    v_composite record;
BEGIN
    -- Get the patch request
    SELECT * INTO v_patch_request 
    FROM public.patch_requests 
    WHERE id = p_patch_request_id 
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patch request not found or not in pending status';
    END IF;
    
    -- Get the composite author
    SELECT c.id, c.author INTO v_composite 
    FROM public.composites c
    WHERE c.id = v_patch_request.composite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Composite not found for patch request';
    END IF;
    
    -- Check if the user is the author of the composite
    -- Skip this check if p_user_id is NULL (for internal calls)
    IF p_user_id IS NOT NULL AND p_user_id != v_composite.author THEN
        RAISE EXCEPTION 'Only the composite author can reject patch requests';
    END IF;

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

-- Create function to auto-approve patch requests when the author is editing their own content
CREATE OR REPLACE FUNCTION public.auto_approve_own_patch_requests()
RETURNS TRIGGER AS $$
DECLARE
    v_composite_author uuid;
    v_old_content_record record;
    v_new_content_record record;
BEGIN
    -- Get the author of the composite
    SELECT author INTO v_composite_author
    FROM public.composites
    WHERE id = NEW.composite_id;
    
    IF v_composite_author IS NULL THEN
        RAISE WARNING 'Composite % not found or has no author for patch request %', NEW.composite_id, NEW.id;
        RETURN NULL;
    END IF;
    
    -- Get the old content record
    SELECT * INTO v_old_content_record
    FROM public.db_archive
    WHERE id = NEW.old_version_id;
    
    -- If not found in archive, check active db
    IF v_old_content_record IS NULL THEN
        SELECT * INTO v_old_content_record
        FROM public.db
        WHERE id = NEW.old_version_id;
    END IF;
    
    IF v_old_content_record IS NULL OR v_old_content_record.author IS NULL THEN
        RAISE WARNING 'Old content version % not found or has no author for patch request %', NEW.old_version_id, NEW.id;
        RETURN NULL;
    END IF;
    
    -- Get the new content record
    SELECT * INTO v_new_content_record
    FROM public.db
    WHERE id = NEW.new_version_id;
    
    IF v_new_content_record IS NULL OR v_new_content_record.author IS NULL THEN
        RAISE WARNING 'New content version % not found or has no author for patch request %', NEW.new_version_id, NEW.id;
        RETURN NULL;
    END IF;
    
    -- Log detailed information for debugging
    RAISE NOTICE 'Patch request details: id=%, author=%, composite_id=%, composite_author=%, old_version_id=%, old_version_author=%, new_version_id=%, new_version_author=%',
        NEW.id, 
        NEW.author, 
        NEW.composite_id, 
        v_composite_author, 
        NEW.old_version_id, 
        v_old_content_record.author, 
        NEW.new_version_id, 
        v_new_content_record.author;
    
    -- Only auto-approve if the user is editing their own content
    -- This means:
    -- 1. The user must be the author of the composite
    -- 2. The user must be the author of the old content version
    -- 3. The user must be the author of the new content version
    IF NEW.author = v_composite_author AND 
       NEW.author = v_old_content_record.author AND 
       NEW.author = v_new_content_record.author THEN
        
        -- Log that we're auto-approving
        RAISE NOTICE 'Auto-approving patch request % - user is editing their own content', NEW.id;
        
        -- Call the approve function
        PERFORM public.approve_patch_request(NEW.id, NULL);
    -- Special case: Auto-approve if this is a variation (user creating their own new composite)
    -- In this case, the user is the author of the new composite and the new content
    ELSIF NEW.author = v_composite_author AND 
         NEW.author = v_new_content_record.author THEN
        
        -- Check if there's a composite relationship indicating this is a variation
        DECLARE
            v_is_variation boolean := false;
        BEGIN
            SELECT EXISTS (
                SELECT 1 
                FROM public.composite_relationships cr
                WHERE cr.source_composite_id = NEW.composite_id
                AND cr.relationship_type = 'variation_of'
            ) INTO v_is_variation;
            
            IF v_is_variation THEN
                -- Log that we're auto-approving a variation
                RAISE NOTICE 'Auto-approving patch request % - this is a new variation created by the composite author', NEW.id;
                
                -- Call the approve function
                PERFORM public.approve_patch_request(NEW.id, NULL);
            ELSE
                RAISE NOTICE 'Not auto-approving patch request % - this appears to be a content update, not a variation', NEW.id;
            END IF;
        END;
    ELSE
        -- Log why we're not auto-approving
        RAISE NOTICE 'Not auto-approving patch request % - conditions not met: author_match_composite=%, author_match_old_content=%, author_match_new_content=%',
            NEW.id,
            (NEW.author = v_composite_author),
            (NEW.author = v_old_content_record.author),
            (NEW.author = v_new_content_record.author);
    END IF;
    
    RETURN NULL; -- For AFTER triggers, the return value is ignored
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-approve own patch requests
CREATE TRIGGER auto_approve_own_patch_requests
    AFTER INSERT ON public.patch_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_own_patch_requests();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patch_requests_composite_id ON public.patch_requests(composite_id);
CREATE INDEX IF NOT EXISTS idx_patch_requests_status ON public.patch_requests(status);
CREATE INDEX IF NOT EXISTS idx_patch_requests_author ON public.patch_requests(author);
CREATE INDEX IF NOT EXISTS idx_patch_requests_old_version ON public.patch_requests(old_version_id);
CREATE INDEX IF NOT EXISTS idx_patch_requests_new_version ON public.patch_requests(new_version_id);

-- Enable RLS on patch_requests
ALTER TABLE "public"."patch_requests" ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE "public"."patch_requests" TO service_role;

-- RLS Policies for patch_requests
CREATE POLICY "service_role_all" ON "public"."patch_requests"
AS PERMISSIVE FOR ALL TO service_role
USING (true) WITH CHECK (true); 