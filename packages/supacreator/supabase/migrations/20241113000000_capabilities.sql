-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE SCHEMA IF NOT EXISTS cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enums for capability types and tiers
CREATE TYPE capability_type AS ENUM ('TIER', 'RESOURCE');
CREATE TYPE tier_level AS ENUM ('free', 'homino', 'visioncreator');

-- Capabilities table with flexible JSONB config
CREATE TABLE capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type capability_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID NOT NULL REFERENCES public.profiles(id),
    active BOOLEAN NOT NULL DEFAULT true
);

-- Audit trail for capability changes
CREATE TABLE capability_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    capability_id UUID REFERENCES capabilities(id),
    action TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Hominio requests tracking
CREATE TABLE hominio_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input JSONB NOT NULL,
    response JSONB NOT NULL,
    tokens_used INTEGER NOT NULL,
    processing_time DECIMAL NOT NULL,
    model TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Function to check and increment AI request count
CREATE OR REPLACE FUNCTION check_and_increment_ai_requests(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    capability_record RECORD;
    current_count INTEGER;
    request_limit INTEGER;
BEGIN
    -- Get user's active tier capability
    SELECT * INTO capability_record
    FROM capabilities c
    WHERE c.user_id = p_user_id
    AND c.type = 'TIER'
    AND c.active = true;

    IF capability_record IS NULL THEN
        RETURN FALSE;
    END IF;

    current_count := (capability_record.config->>'aiRequestsUsed')::integer;
    request_limit := (capability_record.config->>'aiRequestsLimit')::integer;

    -- Check if user has reached their limit
    IF current_count >= request_limit THEN
        RETURN FALSE;
    END IF;

    -- Increment the usage count
    UPDATE capabilities
    SET config = jsonb_set(
        config,
        '{aiRequestsUsed}',
        to_jsonb(current_count + 1)
    )
    WHERE id = capability_record.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset AI request counts weekly
CREATE OR REPLACE FUNCTION reset_weekly_ai_requests()
RETURNS void AS $$
BEGIN
    UPDATE capabilities
    SET config = jsonb_set(
        config,
        '{aiRequestsUsed}',
        '0'::jsonb
    )
    WHERE type = 'TIER'
    AND (config->>'lastResetAt')::timestamptz <= NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly reset
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'reset-ai-requests',
            '0 0 * * 0',
            'SELECT reset_weekly_ai_requests()'
        );
    END IF;
END $$;

-- RLS Policies
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE hominio_requests ENABLE ROW LEVEL SECURITY;

-- Capabilities policies
CREATE POLICY "Users can view their own capabilities"
    ON capabilities FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all capabilities"
    ON capabilities FOR ALL
    USING (EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.uid() = id 
        AND raw_user_meta_data->>'role' = 'admin'
    ));

-- Hominio requests policies
CREATE POLICY "Users can view their own requests"
    ON hominio_requests FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own requests"
    ON hominio_requests FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Grants
GRANT ALL ON TABLE capabilities TO service_role;
GRANT ALL ON TABLE capability_audit_trail TO service_role;
GRANT ALL ON TABLE hominio_requests TO service_role; 