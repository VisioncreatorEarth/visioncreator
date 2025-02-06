import { createOperation, z } from "../generated/wundergraph.factory";

interface TokenBalance {
    balance: number;
    staked_balance: number;
    token_type: 'VCE' | 'EURe';
}

interface Proposal {
    state: 'idea' | 'draft' | 'pending' | 'decision';
    total_votes: number;
    total_tokens_staked: number;
    total_tokens_staked_vce: number;
    total_tokens_staked_eure: number;
}

interface UserProposalVotes {
    user_votes: number;
    tokens_staked: number;
    tokens_staked_vce: number;
    tokens_staked_eure: number;
}

// Calculate quadratic cost for next vote
function getQuadraticCost(currentVotes: number): number {
    // For voting: cost = (n+1)^2 - n^2
    // For unstaking: cost = n^2 - (n-1)^2
    return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
}

export default createOperation.mutation({
    input: z.object({
        proposalId: z.string(),
        userId: z.string(),
        action: z.enum(['stake', 'unstake']),
        amount: z.number().int().positive(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        // Check if user is authenticated and has valid ID
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated or missing ID.");
        }

        // Verify the user matches the input userId
        if (user.customClaims.id !== input.userId) {
            throw new Error("User ID mismatch.");
        }

        // Get user's current votes and tokens for this proposal
        const { data: userVotes } = await context.supabase
            .from('user_proposal_votes')
            .select('user_votes, tokens_staked, tokens_staked_vce')
            .eq('proposal_id', input.proposalId)
            .eq('user_id', input.userId)
            .single();

        const currentVotes = (userVotes as UserProposalVotes)?.user_votes || 0;
        const currentTokens = (userVotes as UserProposalVotes)?.tokens_staked || 0;
        const currentTokensVCE = (userVotes as UserProposalVotes)?.tokens_staked_vce || 0;

        // Get proposal details to check if user is author
        const { data: proposal } = await context.supabase
            .from('proposals')
            .select('author')
            .eq('id', input.proposalId)
            .single();

        const isAuthor = proposal?.author === input.userId;

        // Calculate token cost for this action
        let tokenAmount: number;
        if (input.action === 'stake') {
            // For staking: cost = (n+1)^2 - n^2
            tokenAmount = getQuadraticCost(currentVotes);
        } else {
            // For unstaking: cost = n^2 - (n-1)^2
            // If author is unstaking their last vote, use the initial stake amount
            if (isAuthor && currentVotes <= 1) {
                tokenAmount = 1; // Initial stake amount
            } else {
                tokenAmount = getQuadraticCost(currentVotes - 1);
            }
        }

        // Get user's current VCE token balance
        const { data: userBalance } = await context.supabase
            .from('token_balances')
            .select('balance, staked_balance')
            .eq('user_id', input.userId)
            .eq('token_type', 'VCE')
            .single();

        if (!userBalance && input.action === 'stake') {
            throw new Error('Insufficient VCE balance.');
        }

        const balance = userBalance as TokenBalance;

        // Validate the action
        if (input.action === 'stake' && balance.balance < tokenAmount) {
            throw new Error('Insufficient VCE balance.');
        }
        if (input.action === 'unstake' && currentVotes === 0) {
            throw new Error("No votes to unstake.");
        }

        // Create transaction with VCE token type
        const { data: transaction, error: transactionError } = await context.supabase
            .from('token_transactions')
            .insert({
                transaction_type: input.action,
                token_type: 'VCE',
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
            .select('state, total_votes, total_tokens_staked, total_tokens_staked_vce, total_tokens_staked_eure')
            .eq('id', input.proposalId)
            .single();

        if (!updatedProposal) {
            throw new Error("Failed to get updated proposal state.");
        }

        // Get updated user votes
        const { data: updatedUserVotes } = await context.supabase
            .from('user_proposal_votes')
            .select('user_votes, tokens_staked, tokens_staked_vce')
            .eq('proposal_id', input.proposalId)
            .eq('user_id', input.userId)
            .single();

        return {
            success: true,
            message: `Successfully ${input.action}d vote with ${tokenAmount} VCE token(s)`,
            transaction,
            debug: {
                beforeState: {
                    votes: currentVotes,
                    tokensStaked: currentTokens,
                    tokensStakedVCE: currentTokensVCE
                },
                afterState: {
                    proposal: updatedProposal as Proposal,
                    userVotes: updatedUserVotes as UserProposalVotes
                }
            }
        };
    }
}); 