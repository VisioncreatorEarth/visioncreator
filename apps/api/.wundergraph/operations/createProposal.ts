import {
    createOperation,
    z,
    AuthorizationError,
} from "../generated/wundergraph.factory";

const validTags = ['startup', 'distribution', 'product'] as const;
type ValidTag = typeof validTags[number];

interface ProposalData {
    proposal: {
        id: string;
        title: string;
        details: string;
        state: string;
        total_votes: number;
        total_tokens_staked: number;
        total_tokens_staked_vce: number;
        total_tokens_staked_eure: number;
        tags?: string[];
    };
    token_transaction: {
        id: string;
        transaction_type: string;
        amount: number;
    };
}

export default createOperation.mutation({
    input: z.object({
        title: z.string(),
        details: z.string(),
        tags: z.array(z.string()).optional()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated");
        }

        const userId = user.customClaims.id;

        // Start a transaction
        const { data: proposal, error: proposalError } = await context.supabase
            .from('proposals')
            .insert({
                title: input.title,
                details: input.details,
                author: userId,
                state: 'idea',
                total_votes: 1, // Initial author vote
                total_tokens_staked: 1, // Initial stake
                total_tokens_staked_vce: 1, // Initial VCE stake
                total_tokens_staked_eure: 0, // No initial EURe stake
                tags: input.tags || []
            })
            .select()
            .single();

        if (proposalError) {
            throw new Error(`Failed to create proposal: ${proposalError.message}`);
        }

        // Create initial stake transaction
        const { error: stakeError } = await context.supabase
            .from('token_transactions')
            .insert({
                transaction_type: 'stake',
                token_type: 'VCE',
                from_user_id: userId,
                proposal_id: proposal.id,
                amount: 1
            });

        if (stakeError) {
            throw new Error(`Failed to create stake transaction: ${stakeError.message}`);
        }

        // Create initial vote record with UPSERT
        const { error: voteError } = await context.supabase
            .from('user_proposal_votes')
            .upsert({
                user_id: userId,
                proposal_id: proposal.id,
                user_votes: 1,
                tokens_staked: 1,
                tokens_staked_vce: 1,
                tokens_staked_eure: 0
            }, {
                onConflict: 'user_id,proposal_id',
                ignoreDuplicates: false
            });

        if (voteError) {
            throw new Error(`Failed to create vote record: ${voteError.message}`);
        }

        return {
            success: true,
            proposal
        };
    },
}); 