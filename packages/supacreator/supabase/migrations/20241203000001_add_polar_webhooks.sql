-- Create polar_webhooks table
CREATE TABLE IF NOT EXISTS public.polar_webhooks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_polar_webhooks_event ON public.polar_webhooks(event);
CREATE INDEX IF NOT EXISTS idx_polar_webhooks_created_at ON public.polar_webhooks(created_at DESC);

-- Set up RLS policies
ALTER TABLE public.polar_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read webhooks"
    ON public.polar_webhooks
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "Allow system to insert webhooks"
    ON public.polar_webhooks
    FOR INSERT
    TO service_role
    WITH CHECK (true);
