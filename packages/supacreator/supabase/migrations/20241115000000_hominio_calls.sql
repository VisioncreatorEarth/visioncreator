-- Create hominio_calls table to track AI call minutes
CREATE TABLE IF NOT EXISTS hominio_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ultravox_call_id TEXT NOT NULL,
    ultravox_join_url TEXT,
    voice_id TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    temperature NUMERIC(4, 2) NOT NULL,
    max_duration TEXT NOT NULL,
    first_speaker TEXT NOT NULL,
    call_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    call_end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes NUMERIC(10, 2),
    end_reason TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'error')),
    error_message TEXT,
    transcript JSONB,
    tool_executions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT duration_check CHECK (
        (status = 'completed' AND duration_minutes IS NOT NULL) OR
        (status != 'completed')
    )
);

-- Enable RLS
ALTER TABLE hominio_calls ENABLE ROW LEVEL SECURITY;

-- Revoke all access from public
REVOKE ALL ON hominio_calls FROM PUBLIC;

-- Grant full access to service role
GRANT ALL ON hominio_calls TO service_role;

-- Create service role policy for full access
CREATE POLICY "service_role_full_access" ON hominio_calls
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'service_role');

-- Create policy for users to view their own calls
CREATE POLICY "users_view_own_calls" ON hominio_calls
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create function to start a new call
CREATE OR REPLACE FUNCTION start_hominio_call(
    p_user_id UUID,
    p_ultravox_call_id TEXT,
    p_ultravox_join_url TEXT,
    p_voice_id TEXT,
    p_system_prompt TEXT,
    p_temperature NUMERIC,
    p_max_duration TEXT,
    p_first_speaker TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    new_call_id UUID;
BEGIN
    INSERT INTO hominio_calls (
        user_id,
        ultravox_call_id,
        ultravox_join_url,
        voice_id,
        system_prompt,
        temperature,
        max_duration,
        first_speaker,
        status
    )
    VALUES (
        p_user_id,
        p_ultravox_call_id,
        p_ultravox_join_url,
        p_voice_id,
        p_system_prompt,
        p_temperature,
        p_max_duration,
        p_first_speaker,
        'active'
    )
    RETURNING id INTO new_call_id;
    
    RETURN new_call_id;
END;
$$;

-- Create function to end a call and calculate duration
CREATE OR REPLACE FUNCTION end_hominio_call(
    p_user_id UUID,
    p_call_id UUID,
    p_end_reason TEXT DEFAULT NULL,
    p_transcript JSONB DEFAULT NULL,
    p_tool_executions JSONB DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_duration NUMERIC;
BEGIN
    UPDATE hominio_calls
    SET call_end_time = NOW(),
        status = 'completed',
        duration_minutes = EXTRACT(EPOCH FROM (NOW() - call_start_time)) / 60,
        end_reason = p_end_reason,
        transcript = p_transcript,
        tool_executions = p_tool_executions,
        updated_at = NOW()
    WHERE id = p_call_id
    AND user_id = p_user_id
    AND status = 'active'
    RETURNING duration_minutes INTO v_duration;
    
    IF v_duration IS NULL THEN
        RAISE EXCEPTION 'Call not found or already completed';
    END IF;
    
    RETURN v_duration;
END;
$$;

-- Create function to mark call as error
CREATE OR REPLACE FUNCTION mark_hominio_call_error(
    p_user_id UUID,
    p_call_id UUID,
    p_error_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    UPDATE hominio_calls
    SET status = 'error',
        error_message = p_error_message,
        call_end_time = NOW(),
        updated_at = NOW()
    WHERE id = p_call_id
    AND user_id = p_user_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Call not found or not in active status';
    END IF;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_hominio_calls_updated_at
    BEFORE UPDATE ON hominio_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_hominio_calls_user_id ON hominio_calls(user_id);
CREATE INDEX idx_hominio_calls_status ON hominio_calls(status);
CREATE INDEX idx_hominio_calls_ultravox_call_id ON hominio_calls(ultravox_call_id);

-- Restrict function access to service role
REVOKE ALL ON FUNCTION start_hominio_call FROM PUBLIC;
REVOKE ALL ON FUNCTION end_hominio_call FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_hominio_call_error FROM PUBLIC;
GRANT EXECUTE ON FUNCTION start_hominio_call TO service_role;
GRANT EXECUTE ON FUNCTION end_hominio_call TO service_role;
GRANT EXECUTE ON FUNCTION mark_hominio_call_error TO service_role;
