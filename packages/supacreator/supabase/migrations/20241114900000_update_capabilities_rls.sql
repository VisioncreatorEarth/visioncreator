-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view their own capabilities" ON capabilities;
DROP POLICY IF EXISTS "Admins can manage all capabilities" ON capabilities;
DROP POLICY IF EXISTS "Users can view their own requests" ON hominio_requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON hominio_requests;

-- Add service role policies
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
