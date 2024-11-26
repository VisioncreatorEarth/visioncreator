-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE SCHEMA IF NOT EXISTS cron;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Enums for capability types and tiers
CREATE TYPE capability_type AS ENUM ('TIER', 'RESOURCE');
DROP TYPE IF EXISTS tier_level CASCADE;
CREATE TYPE tier_level AS ENUM ('FREE', 'HOMINIO', 'HOMINIO_PLUS');

-- Capabilities table with flexible JSONB config
DROP TABLE IF EXISTS capabilities;
CREATE TABLE capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type capability_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{
        "minutesLimit": 2,
        "minutesUsed": 0,
        "lastResetAt": null,
        "isOneTime": true
    }'::jsonb,
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
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    processing_time DECIMAL NOT NULL,
    model TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Function to check and increment AI minutes
CREATE OR REPLACE FUNCTION check_and_increment_ai_minutes(p_user_id UUID, p_minutes NUMERIC)
RETURNS BOOLEAN AS $$
DECLARE
    capability_record RECORD;
    current_minutes NUMERIC;
    minutes_limit NUMERIC;
    is_one_time BOOLEAN;
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

    current_minutes := (capability_record.config->>'minutesUsed')::numeric;
    minutes_limit := (capability_record.config->>'minutesLimit')::numeric;
    is_one_time := (capability_record.config->>'isOneTime')::boolean;

    -- Check if user has reached their limit
    IF current_minutes >= minutes_limit THEN
        RETURN FALSE;
    END IF;

    -- Increment the usage count
    UPDATE capabilities
    SET config = jsonb_set(
        config,
        '{minutesUsed}',
        to_jsonb(current_minutes + p_minutes)
    )
    WHERE id = capability_record.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly AI minutes (only for non-one-time tiers)
CREATE OR REPLACE FUNCTION reset_monthly_ai_minutes()
RETURNS void AS $$
BEGIN
    UPDATE capabilities
    SET config = jsonb_set(
        config,
        '{minutesUsed}',
        '0'
    )
    WHERE type = 'TIER'
    AND active = true
    AND (config->>'isOneTime')::boolean = false;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly reset using pg_cron
SELECT cron.schedule('reset-monthly-ai-minutes', '0 0 1 * *', 'SELECT reset_monthly_ai_minutes()');

-- RLS Policies
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE hominio_requests ENABLE ROW LEVEL SECURITY;

-- Service role policies for full access
CREATE POLICY "Service role has full access to capabilities"
    ON capabilities
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to audit trail"
    ON capability_audit_trail
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to hominio requests"
    ON hominio_requests
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE capabilities TO service_role;
GRANT ALL ON TABLE capability_audit_trail TO service_role;
GRANT ALL ON TABLE hominio_requests TO service_role;