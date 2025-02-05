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
        tags: z.array(z.enum(validTags)).optional()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({ message: "No authenticated user found." });
        }

        const initialStakeAmount = 1; // 1 token required for proposal creation

        try {
            const { data, error } = await context.supabase.rpc('create_proposal_with_stake', {
                p_title: input.title,
                p_details: input.details,
                p_author: user.customClaims.id,
                p_stake_amount: initialStakeAmount,
                p_tags: input.tags || []
            });

            if (error) {
                throw new Error(`Failed to create proposal: ${error.message}`);
            }

            if (!data) {
                throw new Error('No data returned from create_proposal_with_stake');
            }

            const proposalData = data as ProposalData;

            return {
                success: true,
                message: 'Proposal created successfully',
                proposal: proposalData.proposal
            } as const;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create proposal: ${error.message}`);
            }
            throw new Error('An unknown error occurred while creating the proposal');
        }
    },
}); 