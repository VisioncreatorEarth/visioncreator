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
    state: 'idea' | 'draft' | 'pending' | 'decision';
    total_votes: number;
    total_tokens_staked: number;
}

interface UserProposalVotes {
    user_votes: number;
    tokens_staked: number;
}

// Calculate quadratic cost for next vote
function getQuadraticCost(currentVotes: number): number {
    return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
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

        console.log('=== Quadratic Vote Update Debug Log ===');
        console.log('Action:', input.action);
        console.log('User ID:', input.userId);
        console.log('Proposal ID:', input.proposalId);

        // Get user's current votes and tokens for this proposal
        const { data: userVotes } = await context.supabase
            .from('user_proposal_votes')
            .select('user_votes, tokens_staked')
            .eq('proposal_id', input.proposalId)
            .eq('user_id', input.userId)
            .single();

        const currentVotes = (userVotes as UserProposalVotes)?.user_votes || 0;
        const currentTokens = (userVotes as UserProposalVotes)?.tokens_staked || 0;

        console.log('Current Votes:', currentVotes);
        console.log('Current Tokens Staked:', currentTokens);

        // Calculate token cost for this action
        let tokenAmount: number;
        if (input.action === 'stake') {
            tokenAmount = getQuadraticCost(currentVotes);
        } else {
            // For unstaking, calculate the cost of the last vote
            tokenAmount = getQuadraticCost(currentVotes - 1);
        }

        console.log('Token Amount for Action:', tokenAmount);

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

        // Validate the action
        if (input.action === 'stake' && balance.balance < tokenAmount) {
            throw new Error("Insufficient token balance.");
        }
        if (input.action === 'unstake' && currentVotes === 0) {
            throw new Error("No votes to unstake.");
        }

        // Create transaction
        const { data: transaction, error: transactionError } = await context.supabase
            .from('token_transactions')
            .insert({
                transaction_type: input.action,
                from_user_id: input.userId,
                proposal_id: input.proposalId,
                amount: tokenAmount,
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
            .select('state, total_votes, total_tokens_staked')
            .eq('id', input.proposalId)
            .single();

        if (!updatedProposal) {
            throw new Error("Failed to get updated proposal state.");
        }

        // Get updated user votes
        const { data: updatedUserVotes } = await context.supabase
            .from('user_proposal_votes')
            .select('user_votes, tokens_staked')
            .eq('proposal_id', input.proposalId)
            .eq('user_id', input.userId)
            .single();

        console.log('Updated State:', {
            proposal: updatedProposal,
            userVotes: updatedUserVotes
        });
        console.log('=== End Quadratic Vote Update Debug Log ===');

        return {
            success: true,
            message: `Successfully ${input.action}d vote with ${tokenAmount} token(s)`,
            transaction,
            debug: {
                beforeState: {
                    votes: currentVotes,
                    tokensStaked: currentTokens
                },
                afterState: {
                    proposal: updatedProposal as Proposal,
                    userVotes: updatedUserVotes as UserProposalVotes
                }
            }
        };
    }
}); 