-- Add proposal composer field to proposals table
ALTER TABLE proposals
ADD COLUMN compose uuid;

-- Add index for the compose field
CREATE INDEX idx_proposals_compose ON proposals(compose);

-- Add comment explaining the field
COMMENT ON COLUMN proposals.compose IS 'Reference to a db id that composes this proposal. Can reference either active or archived db versions.';

-- Update existing proposals to have null compose field
UPDATE proposals SET compose = NULL;

-- Add trigger to ensure compose references only valid db entries
CREATE OR REPLACE FUNCTION check_compose_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.compose IS NOT NULL THEN
        -- Check if the id exists in either db or db_archive table directly
        IF NOT EXISTS (
            SELECT 1 FROM db WHERE id = NEW.compose
            UNION ALL
            SELECT 1 FROM db_archive WHERE id = NEW.compose
        ) THEN
            RAISE EXCEPTION 'Invalid compose reference. Must reference a valid db or archived db id.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_compose_reference_trigger
    BEFORE INSERT OR UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION check_compose_reference();

-- Add foreign key that allows referencing either active or archived versions
ALTER TABLE proposals
DROP CONSTRAINT IF EXISTS proposals_compose_fkey;

-- Note: We don't add a direct foreign key constraint since we need to reference two tables.
-- The check_compose_reference trigger handles the referential integrity instead.

-- Modify the existing update_db_version function to handle proposal references
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

-- Create function to get latest versions (useful for UI display)
CREATE OR REPLACE FUNCTION get_latest_versions()
RETURNS TABLE (
    id uuid,
    variation uuid,
    version integer,
    json jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_versions AS (
        SELECT DISTINCT ON (variation)
            id,
            variation,
            version,
            json
        FROM db
        ORDER BY variation, version DESC
    )
    SELECT * FROM latest_versions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 