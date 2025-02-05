import { createOperation, z } from '../generated/wundergraph.factory';

interface Proposal {
    id: string;
    state: 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';
    total_votes: number;
    total_tokens_staked: number;
    decided_at?: string;
}

interface ProposalDecisionResponse {
    success: boolean;
    proposal: Proposal;
}

export default createOperation.mutation({
    input: z.object({
        proposalId: z.string(),
        decision: z.enum(['veto', 'pass']),
        adminId: z.string()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context, user }) => {
        // Verify admin status (using a hardcoded admin ID for now)
        if (input.adminId !== '00000000-0000-0000-0000-000000000001') {
            throw new Error('Unauthorized: Only admin can make decisions');
        }

        try {
            // Call the function with exact parameter names matching the SQL function
            const { data, error } = await context.supabase.rpc('handle_proposal_decision', {
                p_proposal_id: input.proposalId,
                p_decision: input.decision,
                p_admin_id: input.adminId
            });

            if (error) {
                throw new Error(`Failed to update proposal: ${error.message}`);
            }

            const result = data as ProposalDecisionResponse;

            return {
                success: true,
                message: `Proposal ${input.decision === 'pass' ? 'accepted' : 'rejected'} successfully`,
                proposal: result.proposal
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to handle decision: ${error.message}`);
            }
            throw new Error('An unknown error occurred while handling the decision');
        }
    }
}); 