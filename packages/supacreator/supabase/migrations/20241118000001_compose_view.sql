-- Create views table
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_by UUID NOT NULL REFERENCES auth.users(id),
    version TEXT NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{"name": "", "description": ""}'::jsonb,
    render JSONB NOT NULL,
    state_machine JSONB DEFAULT '{}'::jsonb,
    custom_config JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE views ENABLE ROW LEVEL SECURITY;

-- Create views_history table for version history
CREATE TABLE views_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id UUID NOT NULL REFERENCES views(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{"name": "", "description": ""}'::jsonb,
    render JSONB NOT NULL,
    state_machine JSONB DEFAULT '{}'::jsonb,
    custom_config JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies for history
ALTER TABLE views_history ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_views_timestamp
    BEFORE UPDATE ON views
    FOR EACH ROW
    EXECUTE FUNCTION update_views_updated_at();

-- Create function to create a version when view is updated
CREATE OR REPLACE FUNCTION create_view_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO views_history (
        view_id,
        version,
        created_by,
        metadata,
        render,
        state_machine,
        custom_config
    ) VALUES (
        OLD.id,
        OLD.version,
        OLD.updated_by,
        OLD.metadata,
        OLD.render,
        OLD.state_machine,
        OLD.custom_config
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for versioning
CREATE TRIGGER create_view_history_trigger
    BEFORE UPDATE ON views
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION create_view_history();

-- Simple RLS Policies for service role
CREATE POLICY "Enable all access for service role"
    ON views
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role on history"
    ON views_history
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_views_created_by ON views(created_by);
CREATE INDEX idx_views_history_view_id ON views_history(view_id);

-- Comments
COMMENT ON TABLE views IS 'Stores view configurations for dynamic rendering';
COMMENT ON TABLE views_history IS 'Stores version history of view configurations';
COMMENT ON COLUMN views.metadata IS 'Metadata including name, description, author, composer, etc.';
COMMENT ON COLUMN views.render IS 'Required rendering configuration for the view';
COMMENT ON COLUMN views.state_machine IS 'Optional state machine configuration';
COMMENT ON COLUMN views.custom_config IS 'Optional custom configuration (showSpacer, etc.)';
