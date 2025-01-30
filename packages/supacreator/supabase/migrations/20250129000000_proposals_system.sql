-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for proposal states
CREATE TYPE proposal_state AS ENUM ('idea', 'draft', 'decision');

-- Create enum for transaction types
CREATE TYPE token_transaction_type AS ENUM ('mint', 'transfer', 'stake', 'unstake');

-- Create token balances table
CREATE TABLE token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    balance BIGINT NOT NULL DEFAULT 0,
    staked_balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_balances CHECK (balance >= 0 AND staked_balance >= 0),
    UNIQUE(user_id)
);

-- Create proposals table
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author UUID NOT NULL REFERENCES profiles(id),
    details TEXT,
    benefits TEXT,
    pain TEXT,
    video_id TEXT,
    state proposal_state NOT NULL DEFAULT 'idea',
    votes_count INTEGER NOT NULL DEFAULT 0,
    total_tokens_staked BIGINT NOT NULL DEFAULT 0,
    budget_requested INTEGER NOT NULL DEFAULT 0,
    responsible UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create token transactions table
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type token_transaction_type NOT NULL,
    from_user_id UUID REFERENCES profiles(id),
    to_user_id UUID REFERENCES profiles(id),
    amount BIGINT NOT NULL,
    proposal_id UUID REFERENCES proposals(id),
    transaction_hash TEXT NOT NULL UNIQUE DEFAULT encode(sha256(uuid_generate_v4()::text::bytea), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_transfer CHECK (
        (transaction_type = 'transfer' AND from_user_id IS NOT NULL AND to_user_id IS NOT NULL) OR
        (transaction_type = 'mint' AND from_user_id IS NULL AND to_user_id IS NOT NULL) OR
        ((transaction_type = 'stake' OR transaction_type = 'unstake') AND from_user_id IS NOT NULL AND proposal_id IS NOT NULL)
    )
);

-- Create work package offers table
CREATE TABLE work_package_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    budget INTEGER NOT NULL DEFAULT 0,
    assignee UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update token balance update function
CREATE OR REPLACE FUNCTION update_token_balances()
RETURNS TRIGGER AS $$
BEGIN
    CASE NEW.transaction_type
        WHEN 'mint' THEN
            INSERT INTO token_balances (user_id, balance)
            VALUES (NEW.to_user_id, NEW.amount)
            ON CONFLICT (user_id) DO UPDATE
            SET balance = token_balances.balance + NEW.amount,
                updated_at = NOW();
        
        WHEN 'transfer' THEN
            -- Deduct from sender
            UPDATE token_balances
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND balance >= NEW.amount;
            
            -- Add to receiver
            INSERT INTO token_balances (user_id, balance)
            VALUES (NEW.to_user_id, NEW.amount)
            ON CONFLICT (user_id) DO UPDATE
            SET balance = token_balances.balance + NEW.amount,
                updated_at = NOW();
        
        WHEN 'stake' THEN
            -- Move tokens from balance to staked_balance
            UPDATE token_balances
            SET balance = balance - NEW.amount,
                staked_balance = staked_balance + NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND balance >= NEW.amount;
            
            -- Update proposal's total staked amount and votes count
            UPDATE proposals
            SET total_tokens_staked = total_tokens_staked + NEW.amount,
                votes_count = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM token_transactions
                    WHERE proposal_id = NEW.proposal_id
                    AND transaction_type = 'stake'
                ) - (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM token_transactions
                    WHERE proposal_id = NEW.proposal_id
                    AND transaction_type = 'unstake'
                )
            WHERE id = NEW.proposal_id;
        
        WHEN 'unstake' THEN
            -- Move tokens from staked_balance back to balance
            UPDATE token_balances
            SET balance = balance + NEW.amount,
                staked_balance = staked_balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND staked_balance >= NEW.amount;
            
            -- Update proposal's total staked amount and votes count
            UPDATE proposals
            SET total_tokens_staked = total_tokens_staked - NEW.amount,
                votes_count = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM token_transactions
                    WHERE proposal_id = NEW.proposal_id
                    AND transaction_type = 'stake'
                ) - (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM token_transactions
                    WHERE proposal_id = NEW.proposal_id
                    AND transaction_type = 'unstake'
                )
            WHERE id = NEW.proposal_id;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_work_package_offers_updated_at
    BEFORE UPDATE ON work_package_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Apply token transaction trigger
CREATE TRIGGER on_token_transaction
    AFTER INSERT ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_token_balances();

-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_package_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Grant access to service role only
GRANT ALL ON TABLE proposals TO service_role;
GRANT ALL ON TABLE work_package_offers TO service_role;
GRANT ALL ON TABLE messages TO service_role;
GRANT ALL ON TABLE token_balances TO service_role;
GRANT ALL ON TABLE token_transactions TO service_role;

-- Create single service role policy for each table
CREATE POLICY "service_role_policy" ON proposals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_policy" ON work_package_offers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_policy" ON messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_policy" ON token_balances
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_policy" ON token_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX proposals_state_idx ON proposals(state);
CREATE INDEX proposals_votes_count_idx ON proposals(votes_count DESC);
CREATE INDEX work_package_offers_proposal_id_idx ON work_package_offers(proposal_id);
CREATE INDEX messages_context_id_idx ON messages(context_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX token_balances_user_id_idx ON token_balances(user_id);
CREATE INDEX token_transactions_from_user_idx ON token_transactions(from_user_id);
CREATE INDEX token_transactions_to_user_idx ON token_transactions(to_user_id);
CREATE INDEX token_transactions_proposal_idx ON token_transactions(proposal_id);
CREATE INDEX token_transactions_created_at_idx ON token_transactions(created_at DESC);

-- Insert default proposals
INSERT INTO proposals (
    title,
    author,
    details,
    benefits,
    pain,
    video_id,
    state
) VALUES (
    'Hominio: Opensource Personal AI Voice Assistant',
    '00000000-0000-0000-0000-000000000001', -- Admin user ID
    '## The Vision
Hominio is more than just another AI assistant - it''s your personal companion that truly understands and respects your privacy. Built on open-source principles, Hominio works exclusively with your own data, ensuring your information stays yours.

## Current Status
We already have a working proof of concept with our first skill: A smart shopping list management system. Want to try it out? Just write "let me test please" in the chat, and we''ll get you started!

## Technical Foundation
- Built on Ultravox AI - a custom fork of Llama 70B 3.3
- Fully open-source architecture
- Extensible skills framework for community contributions

## Community-Driven Development
What makes Hominio unique is that YOU decide what comes next. Through our democratic proposal system, the Visioncreator community votes on which skills should be developed next. Have an idea? Share it, and if the community agrees, we''ll make it happen!

## Business Model
- Monthly Subscription: 11.11$ (net) for 1h of voice-assisted interaction
- Revenue Sharing: 3.33$ per month per subscribed user goes to Visioncreators, in the form of provisions. 
- Sustainable open-source development through fair profit sharing

## Next Steps
1. Community Vote: Which skill should Hominio learn next?
2. Skill Implementation: Develop the most-voted feature
3. Landing Page Creation: Build a compelling user acquisition funnel
4. AI Influencer Outreach: Connect with X (Twitter) AI multiplicators

## Join the Revolution
Together, we''re building more than just an AI assistant - we''re creating a community-driven platform where privacy meets innovation. Let''s shape the future of AI assistance together!

Want to contribute? Here is how:
- Vote on upcoming skills
- Test new features
- Spread the word
- Contribute to the codebase',
    'A community-driven, privacy-focused AI voice assistant that works on your terms. Revenue sharing opportunities for creators. Democratic feature development.',
    'Current AI assistants either compromise privacy or lack customization. Users need a solution that respects their data while providing powerful, community-driven features.',
    '8fee2d57-e3c3-4580-bd11-ae828d86978d',
    'idea'
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
CREATE POLICY "Users can delete their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id AND is_deleted = false)
    WITH CHECK (is_deleted = true);

-- Add trigger for updated_at
CREATE TRIGGER messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Remove old index if it exists
DROP INDEX IF EXISTS messages_proposal_id_idx; 