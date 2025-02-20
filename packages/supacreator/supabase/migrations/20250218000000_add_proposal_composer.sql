-- First create a unique constraint on db.variation
ALTER TABLE db
ADD CONSTRAINT db_variation_unique UNIQUE (variation);

-- Add proposal composer field to proposals table
ALTER TABLE proposals
ADD COLUMN compose uuid;

-- Add foreign key constraint that references db table
ALTER TABLE proposals
ADD CONSTRAINT proposals_compose_fkey FOREIGN KEY (compose) REFERENCES db(variation);

-- Add index for the compose field
CREATE INDEX idx_proposals_compose ON proposals(compose);

-- Add comment explaining the field
COMMENT ON COLUMN proposals.compose IS 'Reference to a db variation that composes this proposal. Links to db.variation field.';

-- Update existing proposals to have null compose field
UPDATE proposals SET compose = NULL;

-- Add trigger to ensure compose references only valid variations
CREATE OR REPLACE FUNCTION check_compose_variation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.compose IS NOT NULL THEN
        -- Check if the variation exists in the db table
        IF NOT EXISTS (
            SELECT 1 FROM db 
            WHERE variation = NEW.compose
        ) THEN
            RAISE EXCEPTION 'Invalid compose variation reference. Must reference a valid db variation.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_compose_variation_trigger
    BEFORE INSERT OR UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION check_compose_variation();

-- Create function to get latest versions
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