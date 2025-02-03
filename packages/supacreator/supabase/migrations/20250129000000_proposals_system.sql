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
    responsible UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vote_count INTEGER NOT NULL DEFAULT 0,
    token_count BIGINT NOT NULL DEFAULT 0
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

-- Create user votes tracking table
CREATE TABLE IF NOT EXISTS user_proposal_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    vote_count INTEGER NOT NULL DEFAULT 0,
    tokens_staked BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, proposal_id)
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
            
            -- Update user_proposal_votes
            INSERT INTO user_proposal_votes (user_id, proposal_id, vote_count, tokens_staked)
            VALUES (NEW.from_user_id, NEW.proposal_id, 1, NEW.amount)
            ON CONFLICT (user_id, proposal_id) DO UPDATE
            SET vote_count = user_proposal_votes.vote_count + 1,
                tokens_staked = user_proposal_votes.tokens_staked + NEW.amount;
            
            -- Update proposal's total staked amount and vote count
            UPDATE proposals
            SET token_count = token_count + NEW.amount,
                vote_count = (
                    SELECT SUM(vote_count)
                    FROM user_proposal_votes
                    WHERE proposal_id = NEW.proposal_id
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
            
            -- Update user_proposal_votes
            UPDATE user_proposal_votes
            SET vote_count = vote_count - 1,
                tokens_staked = tokens_staked - NEW.amount
            WHERE user_id = NEW.from_user_id
            AND proposal_id = NEW.proposal_id;
            
            -- Update proposal's total staked amount and vote count
            UPDATE proposals
            SET token_count = token_count - NEW.amount,
                vote_count = (
                    SELECT SUM(vote_count)
                    FROM user_proposal_votes
                    WHERE proposal_id = NEW.proposal_id
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
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Grant access to service role only
GRANT ALL ON TABLE proposals TO service_role;
GRANT ALL ON TABLE messages TO service_role;
GRANT ALL ON TABLE token_balances TO service_role;
GRANT ALL ON TABLE token_transactions TO service_role;

-- Create single service role policy for each table
CREATE POLICY "service_role_policy" ON proposals
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
CREATE INDEX messages_context_id_idx ON messages(context_id);
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX token_balances_user_id_idx ON token_balances(user_id);
CREATE INDEX token_transactions_from_user_idx ON token_transactions(from_user_id);
CREATE INDEX token_transactions_to_user_idx ON token_transactions(to_user_id);
CREATE INDEX token_transactions_proposal_idx ON token_transactions(proposal_id);
CREATE INDEX token_transactions_created_at_idx ON token_transactions(created_at DESC);

-- Add indexes for user_proposal_votes
CREATE INDEX IF NOT EXISTS idx_user_proposal_votes_user ON user_proposal_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_proposal_votes_proposal ON user_proposal_votes(proposal_id);

-- Grant access to service role
GRANT ALL ON TABLE user_proposal_votes TO service_role;

-- Create service role policy for user_proposal_votes
CREATE POLICY "service_role_policy" ON user_proposal_votes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert default proposals
INSERT INTO proposals (title, author, details, benefits, pain, state) VALUES
    ('Hominio: The Shopify for Voice Agents',
    '00000000-0000-0000-0000-000000000001',
    E'## Live Life at Your Own Terms, Everywhere in the World\n\nIntroducing Hominio - the Shopify of voice agents for indie-hackers, solopreneurs, and X-Creators.\nTogether, we''re building more than just AI assistants - we''re creating a platform for financial independence through your personal AI-Agent. We empower Visioncreators to build their own recurring revenue streams.\n\n## The Opportunity: Build Your Own AI Agent Business\n\nCreate and monetize your own AI voice agent:\n- Zero technical skills required\n- Just 1 week from idea to launch\n- Full platform support\n- Weekly payouts\n\n## Your Revenue Model\n- Your customers pay €11/month to use your agent\n- You earn 60% revenue share (€6.60 per customer/month)\n- Scale your income with more customers\n- Example earnings:\n  * 100 customers = €660/month\n  * 500 customers = €3,300/month\n  * 1000 customers = €6,600/month\n- Infrastructure (30%) and platform fee (10%) included\n\n## Early Adopter Platform Pricing\nGet started with our Agent-as-a-Service platform (regular price: €500/month per agent).\n\nEarly adopter discounts - be quick to get the best deal:\n- First 1 customer: 90% off - €50/month\n- Next 2 customers (4-5): 85% off - €75/month\n- Next 3 customers (6-8): 80% off - €100/month\n- Next 5 customers (9-13): 70% off - €150/month\n- Next 8 customers (14-21): 60% off - €200/month\n- Next 13 customers (22-34): 50% off - €250/month\n- Next 21 customers (35-55): 40% off - €300/month\n- Next 34 customers (56-89): 30% off - €350/month\n- Next 55 customers (90-144): 20% off - €400/month\n- All customers after: Regular price €500/month\n\nWhat you get for your monthly platform fee:\n- Customized agent landing page\n- Your own domain\n- 10h AI agent fine-tuning support\n- 1-week guided setup\n- Problem discovery workshop\n- Golden offer creation support\n- Access to our creator community\n\n## Technical Foundation\n- Fully open-source architecture\n- Extensible skills framework\n- Privacy-focused design\n- Scalable infrastructure\n- 1h voice interaction per user/month included\n\n## Current Status\nWe have a working proof of concept with our first skill: A smart shopping list management system. Want to try it out? Just write "let me test please" in the chat!\n\n## Your Path to Success\n1. Book a discovery call\n2. Define your agent''s niche\n3. We help implement in 1 week\n4. Launch your agent shop\n5. Get your first customers\n6. Scale your monthly revenue',
    'Transform your expertise into recurring revenue. Launch your own AI voice agent business in just one week, earning a consistent 60% revenue share (€6.60 per customer/month) with zero technical skills needed. Full platform and technical support included.',
    'Creators struggle to monetize their expertise and build sustainable income streams. Traditional platforms are either too technical, too expensive to start, or don''t offer clear paths to recurring revenue. Building AI solutions requires technical expertise most creators don''t have.',
    'idea');

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

-- Remove old index if it exists
DROP INDEX IF EXISTS messages_proposal_id_idx; 