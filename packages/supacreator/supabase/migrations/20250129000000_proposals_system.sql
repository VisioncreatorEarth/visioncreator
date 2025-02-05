-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE proposal_state AS ENUM ('idea', 'draft', 'pending', 'accepted', 'rejected');
CREATE TYPE token_transaction_type AS ENUM ('mint', 'transfer', 'stake', 'unstake');

-- Create tables
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

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author UUID NOT NULL REFERENCES profiles(id),
    details TEXT,
    video_id TEXT,
    state proposal_state NOT NULL DEFAULT 'idea',
    total_votes INTEGER NOT NULL DEFAULT 0,
    total_tokens_staked BIGINT NOT NULL DEFAULT 0,
    responsible UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb
);

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

CREATE TABLE user_proposal_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    user_votes INTEGER NOT NULL DEFAULT 0,
    tokens_staked BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, proposal_id)
);

-- Create indexes
CREATE INDEX proposals_state_idx ON proposals(state);
CREATE INDEX proposals_votes_count_idx ON proposals(total_votes DESC);
CREATE INDEX token_balances_user_id_idx ON token_balances(user_id);
CREATE INDEX token_transactions_from_user_idx ON token_transactions(from_user_id);
CREATE INDEX token_transactions_to_user_idx ON token_transactions(to_user_id);
CREATE INDEX token_transactions_proposal_idx ON token_transactions(proposal_id);
CREATE INDEX token_transactions_created_at_idx ON token_transactions(created_at DESC);
CREATE INDEX idx_user_proposal_votes_user ON user_proposal_votes(user_id);
CREATE INDEX idx_user_proposal_votes_proposal ON user_proposal_votes(proposal_id);

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_token_balances()
RETURNS TRIGGER AS $$
DECLARE
    v_is_nested BOOLEAN;
BEGIN
    -- Check if this is a nested call by looking at the transaction context
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgrelid = TG_RELID 
        AND tgname = TG_NAME 
        AND tgenabled = 'D'
    ) INTO v_is_nested;

    -- Skip if this is a nested call during proposal creation
    IF v_is_nested AND NEW.transaction_type = 'stake' THEN
        RETURN NEW;
    END IF;

    -- First check if this is a proposal-related transaction
    IF NEW.proposal_id IS NOT NULL THEN
        -- Check if the proposal is in a final state
        IF EXISTS (
            SELECT 1 
            FROM proposals 
            WHERE id = NEW.proposal_id 
            AND state IN ('accepted', 'rejected')
        ) THEN
            -- For final states, only handle token balance changes
            IF NEW.transaction_type = 'unstake' THEN
                UPDATE token_balances
                SET balance = balance + NEW.amount,
                    staked_balance = staked_balance - NEW.amount,
                    updated_at = NOW()
                WHERE user_id = NEW.from_user_id
                AND staked_balance >= NEW.amount;
                RETURN NEW;
            END IF;
        END IF;
    END IF;

    -- Regular token balance handling
    CASE NEW.transaction_type
        WHEN 'mint' THEN
            INSERT INTO token_balances (user_id, balance)
            VALUES (NEW.to_user_id, NEW.amount)
            ON CONFLICT (user_id) DO UPDATE
            SET balance = token_balances.balance + NEW.amount,
                updated_at = NOW();
        
        WHEN 'transfer' THEN
            UPDATE token_balances
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND balance >= NEW.amount;
            
            INSERT INTO token_balances (user_id, balance)
            VALUES (NEW.to_user_id, NEW.amount)
            ON CONFLICT (user_id) DO UPDATE
            SET balance = token_balances.balance + NEW.amount,
                updated_at = NOW();
        
        WHEN 'stake' THEN
            -- Handle staking
            UPDATE token_balances
            SET balance = balance - NEW.amount,
                staked_balance = staked_balance + NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND balance >= NEW.amount;
            
            -- Update or create vote record
            INSERT INTO user_proposal_votes (user_id, proposal_id, user_votes, tokens_staked)
            VALUES (NEW.from_user_id, NEW.proposal_id, 1, NEW.amount)
            ON CONFLICT (user_id, proposal_id) DO UPDATE
            SET user_votes = user_proposal_votes.user_votes + 1,
                tokens_staked = user_proposal_votes.tokens_staked + NEW.amount;
            
            -- Update proposal totals
            UPDATE proposals
            SET total_tokens_staked = total_tokens_staked + NEW.amount,
                total_votes = (
                    SELECT SUM(user_votes)
                    FROM user_proposal_votes
                    WHERE proposal_id = NEW.proposal_id
                )
            WHERE id = NEW.proposal_id;
        
        WHEN 'unstake' THEN
            -- Check author restrictions
            DECLARE
                v_is_author BOOLEAN;
                v_current_votes INT;
            BEGIN
                IF NEW.proposal_id IS NOT NULL THEN
                    SELECT 
                        p.author = NEW.from_user_id,
                        upv.user_votes
                    INTO 
                        v_is_author,
                        v_current_votes
                    FROM proposals p
                    JOIN user_proposal_votes upv ON upv.proposal_id = p.id
                    WHERE p.id = NEW.proposal_id
                    AND upv.user_id = NEW.from_user_id;

                    IF v_is_author AND v_current_votes <= 1 THEN
                        RAISE EXCEPTION 'Authors cannot remove their last vote';
                    END IF;
                END IF;
            END;

            -- Process unstaking
            UPDATE token_balances
            SET balance = balance + NEW.amount,
                staked_balance = staked_balance - NEW.amount,
                updated_at = NOW()
            WHERE user_id = NEW.from_user_id
            AND staked_balance >= NEW.amount;
            
            -- Update vote record if this is a proposal unstake
            IF NEW.proposal_id IS NOT NULL THEN
                UPDATE user_proposal_votes
                SET user_votes = user_votes - 1,
                    tokens_staked = tokens_staked - NEW.amount
                WHERE user_id = NEW.from_user_id
                AND proposal_id = NEW.proposal_id;
                
                -- Update proposal totals
                UPDATE proposals
                SET total_tokens_staked = total_tokens_staked - NEW.amount,
                    total_votes = (
                        SELECT SUM(user_votes)
                        FROM user_proposal_votes
                        WHERE proposal_id = NEW.proposal_id
                    )
                WHERE id = NEW.proposal_id;
            END IF;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_proposal_state_on_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.state NOT IN ('accepted', 'rejected') THEN
        UPDATE proposals
        SET state = 
            CASE 
                WHEN NEW.total_votes >= 20 THEN 'pending'::proposal_state
                WHEN NEW.total_votes >= 10 THEN 'draft'::proposal_state
                ELSE 'idea'::proposal_state
            END
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_proposal_final_state()
RETURNS TRIGGER AS $$
DECLARE
    v_voter RECORD;
    v_unstake_tx UUID;
    v_original_votes INTEGER;
    v_is_nested BOOLEAN;
BEGIN
    -- Check if this is a nested call
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgrelid = TG_RELID 
        AND tgname = TG_NAME 
        AND tgenabled = 'D'
    ) INTO v_is_nested;

    IF v_is_nested THEN
        RETURN NEW;
    END IF;

    IF (NEW.state IN ('accepted', 'rejected')) AND OLD.state != NEW.state THEN
        -- Lock the proposal row for update to prevent concurrent modifications
        SELECT total_votes INTO v_original_votes
        FROM proposals
        WHERE id = NEW.id
        FOR UPDATE;

        NEW.decided_at = NOW();
        
        -- Store user votes before modification
        CREATE TEMP TABLE temp_user_votes AS
        SELECT user_id, user_votes, tokens_staked
        FROM user_proposal_votes
        WHERE proposal_id = NEW.id
        FOR UPDATE;
        
        -- Process unstaking for each voter
        FOR v_voter IN (
            SELECT user_id, tokens_staked
            FROM temp_user_votes
            WHERE tokens_staked > 0
        ) LOOP
            -- Create unstake transaction
            INSERT INTO token_transactions (
                transaction_type,
                from_user_id,
                proposal_id,
                amount
            ) VALUES (
                'unstake',
                v_voter.user_id,
                NEW.id,
                v_voter.tokens_staked
            )
            RETURNING id INTO v_unstake_tx;
        END LOOP;

        -- Update all user votes in a single transaction
        UPDATE user_proposal_votes upv
        SET tokens_staked = 0
        WHERE proposal_id = NEW.id;

        -- Preserve the original vote count
        NEW.total_tokens_staked = 0;
        NEW.total_votes = v_original_votes;
        
        DROP TABLE IF EXISTS temp_user_votes;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_proposal_final_state_trigger ON proposals;
DROP TRIGGER IF EXISTS update_proposal_state_on_votes_trigger ON proposals;

-- Recreate triggers in correct order
CREATE TRIGGER handle_proposal_final_state_trigger
    BEFORE UPDATE OF state ON proposals
    FOR EACH ROW
    WHEN (NEW.state IN ('accepted', 'rejected') AND OLD.state != NEW.state)
    EXECUTE FUNCTION handle_proposal_final_state();

CREATE TRIGGER update_proposal_state_on_votes_trigger
    AFTER UPDATE OF total_votes ON proposals
    FOR EACH ROW
    WHEN (OLD.total_votes IS DISTINCT FROM NEW.total_votes AND NEW.state NOT IN ('accepted', 'rejected'))
    EXECUTE FUNCTION update_proposal_state_on_votes();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER on_token_transaction
    AFTER INSERT ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_token_balances();

-- Enable RLS and grant permissions
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_proposal_votes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE proposals TO service_role;
GRANT ALL ON TABLE token_balances TO service_role;
GRANT ALL ON TABLE token_transactions TO service_role;
GRANT ALL ON TABLE user_proposal_votes TO service_role;

-- Create RLS policies
CREATE POLICY "service_role_policy" ON proposals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_policy" ON token_balances FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_policy" ON token_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_policy" ON user_proposal_votes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add helpful comments
COMMENT ON TRIGGER update_proposal_state_on_votes_trigger ON proposals IS 
    'Automatically updates proposal state based on vote count (only for non-final states):
     - Below 10 votes: idea
     - 10-19 votes: draft
     - 20+ votes: pending';

COMMENT ON TRIGGER handle_proposal_final_state_trigger ON proposals IS 
    'Handles token unstaking when proposals reach accepted or rejected state while preserving vote counts';

-- Insert default proposals with metadata
INSERT INTO proposals (title, author, details, metadata, state, tags) VALUES
    ('Hominio: The Shopify for Voice Agents',
    '00000000-0000-0000-0000-000000000001',
    E'## Live Life at Your Own Terms, Everywhere in the World\n\nIntroducing Hominio - the Shopify of voice agents for indie-hackers, solopreneurs, and X-Creators.\nTogether, we''re building more than just AI assistants - we''re creating a platform for financial independence through your personal AI-Agent. We empower Visioncreators to build their own recurring revenue streams.\n\n## The Opportunity: Build Your Own AI Agent Business\n\nCreate and monetize your own AI voice agent:\n- Zero technical skills required\n- Just 1 week from idea to launch\n- Full platform support\n- Weekly payouts\n\n## Your Revenue Model\n- Your customers pay €11/month to use your agent\n- You earn 60% revenue share (€6.60 per customer/month)\n- Scale your income with more customers\n- Example earnings:\n  * 100 customers = €660/month\n  * 500 customers = €3,300/month\n  * 1000 customers = €6,600/month\n- Infrastructure (30%) and platform fee (10%) included\n\n## Early Adopter Platform Pricing\nGet started with our Agent-as-a-Service platform (regular price: €500/month per agent).\n\nEarly adopter discounts - be quick to get the best deal:\n- First 1 customer: 90% off - €50/month\n- Next 2 customers (4-5): 85% off - €75/month\n- Next 3 customers (6-8): 80% off - €100/month\n- Next 5 customers (9-13): 70% off - €150/month\n- Next 8 customers (14-21): 60% off - €200/month\n- Next 13 customers (22-34): 50% off - €250/month\n- Next 21 customers (35-55): 40% off - €300/month\n- Next 34 customers (56-89): 30% off - €350/month\n- Next 55 customers (90-144): 20% off - €400/month\n- All customers after: Regular price €500/month\n\nWhat you get for your monthly platform fee:\n- Customized agent landing page\n- Your own domain\n- 10h AI agent fine-tuning support\n- 1-week guided setup\n- Problem discovery workshop\n- Golden offer creation support\n- Access to our creator community\n\n## Technical Foundation\n- Fully open-source architecture\n- Extensible skills framework\n- Privacy-focused design\n- Scalable infrastructure\n- 1h voice interaction per user/month included\n\n## Current Status\nWe have a working proof of concept with our first skill: A smart shopping list management system. Want to try it out? Just write "let me test please" in the chat!\n\n## Your Path to Success\n1. Book a discovery call\n2. Define your agent''s niche\n3. We help implement in 1 week\n4. Launch your agent shop\n5. Get your first customers\n6. Scale your monthly revenue',
    jsonb_build_object(
        'benefits', 'Launch your own AI voice agent business in one week. Earn 60% revenue share per customer with zero technical skills needed.',
        'pain', 'Creators lack easy ways to build recurring revenue streams and need technical expertise to create AI solutions.'
    ),
    'idea',
    ARRAY['startup']);

-- Create helper functions
CREATE OR REPLACE FUNCTION create_proposal_with_stake(
    p_title TEXT,
    p_details TEXT,
    p_author UUID,
    p_stake_amount BIGINT,
    p_tags TEXT[] DEFAULT '{}'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposal proposals;
    v_transaction token_transactions;
    v_user_balance BIGINT;
    v_valid_tags TEXT[] := ARRAY['startup', 'distribution', 'product'];
    v_filtered_tags TEXT[];
BEGIN
    -- Check user balance first
    SELECT balance INTO v_user_balance
    FROM token_balances
    WHERE user_id = p_author;

    IF v_user_balance < p_stake_amount THEN
        RAISE EXCEPTION 'Insufficient tokens for initial stake';
    END IF;

    -- Filter and validate tags
    SELECT ARRAY(
        SELECT DISTINCT unnest
        FROM unnest(p_tags) 
        WHERE unnest = ANY(v_valid_tags)
    ) INTO v_filtered_tags;

    -- Create proposal first
    INSERT INTO proposals (
        title,
        details,
        author,
        state,
        total_votes,
        total_tokens_staked,
        tags
    ) VALUES (
        p_title,
        p_details,
        p_author,
        'idea',
        1,  -- Start with 1 vote (author's vote)
        p_stake_amount,
        v_filtered_tags
    )
    RETURNING * INTO v_proposal;

    -- Then create the stake transaction
    INSERT INTO token_transactions (
        transaction_type,
        from_user_id,
        amount,
        proposal_id
    ) VALUES (
        'stake',
        p_author,
        p_stake_amount,
        v_proposal.id
    )
    RETURNING * INTO v_transaction;

    -- Initialize the author's vote record
    INSERT INTO user_proposal_votes (
        user_id,
        proposal_id,
        user_votes,
        tokens_staked
    ) VALUES (
        p_author,
        v_proposal.id,
        1,  -- Initial author vote
        p_stake_amount
    );

    RETURN json_build_object(
        'proposal', v_proposal,
        'token_transaction', v_transaction
    );
END;
$$;

-- Add mint_tokens function
CREATE OR REPLACE FUNCTION mint_tokens(
    p_user_id UUID,
    p_amount BIGINT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction token_transactions;
BEGIN
    -- Create mint transaction
    INSERT INTO token_transactions (
        transaction_type,
        to_user_id,
        amount
    ) VALUES (
        'mint',
        p_user_id,
        p_amount
    )
    RETURNING * INTO v_transaction;

    RETURN json_build_object(
        'success', true,
        'transaction', v_transaction
    );
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION mint_tokens(UUID, BIGINT) IS 
    'Mints new tokens for a user and creates a mint transaction record.
     Parameters:
     - p_user_id: The user to mint tokens for
     - p_amount: The amount of tokens to mint';

-- Add handle_proposal_decision function
DROP FUNCTION IF EXISTS handle_proposal_decision(UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.handle_proposal_decision(
    p_proposal_id UUID,
    p_decision TEXT,
    p_admin_id UUID
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_proposal proposals;
    v_new_state proposal_state;
    v_original_votes INTEGER;
    v_voter RECORD;
BEGIN
    -- Verify admin status
    IF p_admin_id != '00000000-0000-0000-0000-000000000001' THEN
        RAISE EXCEPTION 'Unauthorized: Only admin can make decisions';
    END IF;

    -- Lock the proposal row for update to prevent concurrent modifications
    SELECT * INTO v_proposal
    FROM proposals
    WHERE id = p_proposal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found';
    END IF;

    -- Store original vote count
    v_original_votes := v_proposal.total_votes;

    -- Set new state based on decision
    v_new_state := CASE 
        WHEN p_decision = 'pass' THEN 'accepted'::proposal_state
        WHEN p_decision = 'veto' THEN 'rejected'::proposal_state
        ELSE v_proposal.state
    END;

    -- Process unstaking for each voter directly from user_proposal_votes
    FOR v_voter IN (
        SELECT user_id, tokens_staked
        FROM user_proposal_votes
        WHERE proposal_id = p_proposal_id
        AND tokens_staked > 0
        FOR UPDATE
    ) LOOP
        -- Create unstake transaction
        INSERT INTO token_transactions (
            transaction_type,
            from_user_id,
            proposal_id,
            amount
        ) VALUES (
            'unstake',
            v_voter.user_id,
            p_proposal_id,
            v_voter.tokens_staked
        );
    END LOOP;

    -- Update all user votes in a single transaction
    UPDATE user_proposal_votes
    SET tokens_staked = 0
    WHERE proposal_id = p_proposal_id;

    -- Update proposal state in a single operation
    UPDATE proposals
    SET state = v_new_state,
        decided_at = NOW(),
        total_votes = v_original_votes,  -- Explicitly preserve vote count
        total_tokens_staked = 0
    WHERE id = p_proposal_id
    RETURNING * INTO v_proposal;

    RETURN json_build_object(
        'success', true,
        'proposal', v_proposal
    );
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.handle_proposal_decision(UUID, TEXT, UUID) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_proposal_decision(UUID, TEXT, UUID) IS 
    'Handles the decision (pass/veto) for a proposal in a single transaction.
     Parameters:
     - p_proposal_id: The proposal to update
     - p_decision: The decision to apply (pass/veto)
     - p_admin_id: The ID of the admin making the decision';
