-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context_id UUID NOT NULL,
    context_type TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- Add indexes for better query performance
CREATE INDEX idx_messages_context ON messages(context_id, context_type);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Add RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for reading messages (anyone can read)
CREATE POLICY "Anyone can read messages"
    ON messages FOR SELECT
    USING (true);

-- Policy for inserting messages (authenticated users only)
CREATE POLICY "Authenticated users can insert messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Policy for updating messages (only message sender)
CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (auth.uid() = sender_id);

-- Policy for soft deleting messages (only message sender)
CREATE POLICY "Users can soft delete their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id AND is_deleted = false)
    WITH CHECK (is_deleted = true);

-- Add trigger for updated_at
CREATE TRIGGER messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Grant access to service role
GRANT ALL ON TABLE messages TO service_role;

-- Create service role policy
CREATE POLICY "service_role_policy" ON messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true); 