import { createOperation, z } from "../generated/wundergraph.factory";

interface TokenTransaction {
    id: string;
    transaction_type: 'stake' | 'unstake';
    amount: number;
    proposal_id: string;
    from_user_id: string;
    created_at: string;
}

interface TokenBalance {
    balance: number;
    staked_balance: number;
}

interface Proposal {
    state: 'idea' | 'draft' | 'decision';
    votes_count: number;
    total_tokens_staked: number;
}

export default createOperation.mutation({
    input: z.object({
        proposalId: z.string(),
        userId: z.string(),
        action: z.enum(['stake', 'unstake']),
        amount: z.number().int().positive()
    }),
    requireAuthentication: true,
    handler: async ({ input, context, user }) => {
        // Check if user is authenticated and has valid ID
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated or missing ID.");
        }

        // Verify the user matches the input userId
        if (user.customClaims.id !== input.userId) {
            throw new Error("User ID mismatch.");
        }

        // Log current state before transaction
        console.log('=== Vote Update Debug Log ===');
        console.log('Action:', input.action);
        console.log('User ID:', input.userId);
        console.log('Proposal ID:', input.proposalId);
        console.log('Amount:', input.amount);

        // Get current proposal state
        const { data: currentProposal } = await context.supabase
            .from('proposals')
            .select('state, votes_count, total_tokens_staked')
            .eq('id', input.proposalId)
            .single();

        if (!currentProposal) {
            throw new Error("Proposal not found.");
        }

        const proposal = currentProposal as Proposal;
        console.log('Current Proposal State:', proposal);

        // Get user's current token balance
        const { data: userBalance } = await context.supabase
            .from('token_balances')
            .select('balance, staked_balance')
            .eq('user_id', input.userId)
            .single();

        if (!userBalance && input.action === 'stake') {
            throw new Error("Insufficient token balance.");
        }

        const balance = userBalance as TokenBalance;

        // Get user's current staked amount for this proposal
        const { data: userTransactions } = await context.supabase
            .from('token_transactions')
            .select('*')
            .eq('proposal_id', input.proposalId)
            .eq('from_user_id', input.userId);

        const typedTransactions = ((userTransactions || []) as { [key: string]: any }[]).map(tx => ({
            id: tx.id,
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            proposal_id: tx.proposal_id,
            from_user_id: tx.from_user_id,
            created_at: tx.created_at
        } as TokenTransaction));

        const userStakedAmount = typedTransactions.reduce((total, tx) => {
            return total + (tx.transaction_type === 'stake' ? tx.amount : -tx.amount);
        }, 0);

        console.log('User Current Staked Amount:', userStakedAmount);

        // Validate the action
        if (input.action === 'stake' && balance.balance < input.amount) {
            throw new Error("Insufficient token balance.");
        }
        if (input.action === 'unstake' && userStakedAmount < input.amount) {
            throw new Error("Insufficient staked amount.");
        }

        // Create transaction
        const { data: transaction, error: transactionError } = await context.supabase
            .from('token_transactions')
            .insert({
                transaction_type: input.action,
                from_user_id: input.userId,
                proposal_id: input.proposalId,
                amount: input.amount,
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Transaction Error:', transactionError);
            throw new Error(`Failed to update votes: ${transactionError.message}`);
        }

        // Check if proposal should transition from idea to draft
        if (proposal.state === 'idea') {
            const totalVotes = proposal.votes_count + (input.action === 'stake' ? input.amount : -input.amount);
            if (totalVotes >= 10) {
                // Transition to draft state
                const { error: stateUpdateError } = await context.supabase
                    .from('proposals')
                    .update({ state: 'draft' })
                    .eq('id', input.proposalId);

                if (stateUpdateError) {
                    console.error('State Transition Error:', stateUpdateError);
                }
            }
        }

        // Get updated proposal state
        const { data: updatedProposal } = await context.supabase
            .from('proposals')
            .select('state, votes_count, total_tokens_staked')
            .eq('id', input.proposalId)
            .single();

        if (!updatedProposal) {
            throw new Error("Failed to get updated proposal state.");
        }

        console.log('Updated Proposal State:', updatedProposal);

        // Get updated user staked amount
        const { data: updatedTransactions } = await context.supabase
            .from('token_transactions')
            .select('*')
            .eq('proposal_id', input.proposalId)
            .eq('from_user_id', input.userId);

        const typedUpdatedTransactions = ((updatedTransactions || []) as { [key: string]: any }[]).map(tx => ({
            id: tx.id,
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            proposal_id: tx.proposal_id,
            from_user_id: tx.from_user_id,
            created_at: tx.created_at
        } as TokenTransaction));

        const updatedUserStakedAmount = typedUpdatedTransactions.reduce((total, tx) => {
            return total + (tx.transaction_type === 'stake' ? tx.amount : -tx.amount);
        }, 0);

        console.log('User Updated Staked Amount:', updatedUserStakedAmount);
        console.log('=== End Vote Update Debug Log ===');

        return {
            success: true,
            message: `Successfully ${input.action}d ${input.amount} token(s)`,
            transaction,
            debug: {
                beforeState: {
                    proposal,
                    userStaked: userStakedAmount
                },
                afterState: {
                    proposal: updatedProposal as Proposal,
                    userStaked: updatedUserStakedAmount
                }
            }
        };
    }
}); 