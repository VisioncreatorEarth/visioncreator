import { createOperation, z } from "../generated/wundergraph.factory";

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
            .select('votes_count, total_tokens_staked')
            .eq('id', input.proposalId)
            .single();

        console.log('Current Proposal State:', currentProposal);

        // Get user's current staked amount
        const { data: userTransactions } = await context.supabase
            .from('token_transactions')
            .select('*')
            .eq('proposal_id', input.proposalId)
            .eq('from_user_id', input.userId);

        const userStakedAmount = userTransactions?.reduce((total, tx) => {
            return total + (tx.transaction_type === 'stake' ? tx.amount : -tx.amount);
        }, 0) || 0;

        console.log('User Current Staked Amount:', userStakedAmount);

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

        // Get updated proposal state
        const { data: updatedProposal } = await context.supabase
            .from('proposals')
            .select('votes_count, total_tokens_staked')
            .eq('id', input.proposalId)
            .single();

        console.log('Updated Proposal State:', updatedProposal);

        // Get updated user staked amount
        const { data: updatedTransactions } = await context.supabase
            .from('token_transactions')
            .select('*')
            .eq('proposal_id', input.proposalId)
            .eq('from_user_id', input.userId);

        const updatedUserStakedAmount = updatedTransactions?.reduce((total, tx) => {
            return total + (tx.transaction_type === 'stake' ? tx.amount : -tx.amount);
        }, 0) || 0;

        console.log('User Updated Staked Amount:', updatedUserStakedAmount);
        console.log('=== End Vote Update Debug Log ===');

        return {
            success: true,
            message: `Successfully ${input.action}d ${input.amount} token(s)`,
            transaction,
            debug: {
                beforeState: {
                    proposal: currentProposal,
                    userStaked: userStakedAmount
                },
                afterState: {
                    proposal: updatedProposal,
                    userStaked: updatedUserStakedAmount
                }
            }
        };
    }
}); 