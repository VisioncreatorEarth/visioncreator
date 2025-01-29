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

-- Create proposals table FIRST (moved up)
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

-- Create token transactions table AFTER proposals table
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

-- Create votes table with staking information
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    tokens_staked BIGINT NOT NULL DEFAULT 0,
    quadratic_weight INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(proposal_id, user_id),
    CONSTRAINT positive_stake CHECK (tokens_staked >= 0)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create votes count trigger function
CREATE OR REPLACE FUNCTION update_proposal_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE proposals 
        SET votes_count = votes_count + NEW.tokens_used
        WHERE id = NEW.proposal_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE proposals 
        SET votes_count = votes_count - OLD.tokens_used
        WHERE id = OLD.proposal_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create budget calculation trigger function
CREATE OR REPLACE FUNCTION update_proposal_budget()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE proposals 
        SET budget_requested = (
            SELECT COALESCE(SUM(budget), 0)
            FROM work_package_offers
            WHERE proposal_id = NEW.proposal_id
        )
        WHERE id = NEW.proposal_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE proposals 
        SET budget_requested = (
            SELECT COALESCE(SUM(budget), 0)
            FROM work_package_offers
            WHERE proposal_id = OLD.proposal_id
        )
        WHERE id = OLD.proposal_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Token balance update function
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
            
            -- Update proposal's total staked amount
            UPDATE proposals
            SET total_tokens_staked = total_tokens_staked + NEW.amount
            WHERE id = NEW.proposal_id;
            
            -- Update or create vote record
            INSERT INTO votes (proposal_id, user_id, tokens_staked)
            VALUES (NEW.proposal_id, NEW.from_user_id, NEW.amount)
            ON CONFLICT (proposal_id, user_id) DO UPDATE
            SET tokens_staked = votes.tokens_staked + NEW.amount,
                updated_at = NOW();
        
        WHEN 'unstake' THEN
            -- Move tokens from staked_balance back to balance
            UPDATE token_balances
            SET balance = balance + NEW.amount,
                staked_balance = staked_balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND staked_balance >= NEW.amount;
            
            -- Update proposal's total staked amount
            UPDATE proposals
            SET total_tokens_staked = total_tokens_staked - NEW.amount
            WHERE id = NEW.proposal_id;
            
            -- Update vote record
            UPDATE votes
            SET tokens_staked = tokens_staked - NEW.amount,
                updated_at = NOW()
            WHERE proposal_id = NEW.proposal_id
            AND user_id = NEW.from_user_id
            AND tokens_staked >= NEW.amount;
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

-- Apply votes count trigger
CREATE TRIGGER update_proposal_votes
    AFTER INSERT OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_proposal_votes_count();

-- Apply budget calculation trigger
CREATE TRIGGER update_proposal_budget
    AFTER INSERT OR UPDATE OR DELETE ON work_package_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_proposal_budget();

-- Apply token transaction trigger
CREATE TRIGGER on_token_transaction
    AFTER INSERT ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_token_balances();

-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_package_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Grant access to service role only
GRANT ALL ON TABLE proposals TO service_role;
GRANT ALL ON TABLE work_package_offers TO service_role;
GRANT ALL ON TABLE votes TO service_role;
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

CREATE POLICY "service_role_policy" ON votes
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
CREATE INDEX votes_proposal_id_user_id_idx ON votes(proposal_id, user_id);
CREATE INDEX messages_proposal_id_idx ON messages(proposal_id);
CREATE INDEX messages_created_at_idx ON messages(created_at DESC);

-- Create indexes for token-related queries
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
    '## Features & Skills
- Shopping List Management
  * Add/remove items via voice

- Task Management
  * Voice-controlled todo lists
  * Priority setting
  * Due date reminders

## Definition of Done
- [ ] Core voice calling system
- [ ] Basic skills framework
- [ ] Shopping list skill complete
- [ ] Task management skill complete
',
    'Personal AI Voice assistant that respects privacy and works on your own data',
    'Lack of open-source, privacy-focused voice assistants',
    '8fee2d57-e3c3-4580-bd11-ae828d86978d',
    'idea'
); 