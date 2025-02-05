import { createOperation, z } from '../generated/wundergraph.factory';

interface Proposal {
    id: string;
    state: 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';
    total_votes: number;
    total_tokens_staked: number;
}

export default createOperation.mutation({
    input: z.object({
        proposalId: z.string(),
        decision: z.enum(['veto', 'pass']),
        adminId: z.string()
    }),
    requireAuthentication: true,
    handler: async ({ input, context, user }) => {
        // Verify admin status (using a hardcoded admin ID for now)
        if (input.adminId !== '00000000-0000-0000-0000-000000000001') {
            throw new Error('Unauthorized: Only admin can make decisions');
        }

        const newState = input.decision === 'pass' ? 'accepted' : 'rejected';

        // Start a transaction
        const { data: proposal, error: proposalError } = await context.supabase
            .from('proposals')
            .update({ state: newState })
            .eq('id', input.proposalId)
            .select()
            .single();

        if (proposalError) {
            throw new Error(`Failed to update proposal: ${proposalError.message}`);
        }

        // Create a snapshot of the current votes
        const { data: votes } = await context.supabase
            .from('user_proposal_votes')
            .select('user_id, user_votes, tokens_staked')
            .eq('proposal_id', input.proposalId);

        // Create the snapshot
        const { error: snapshotError } = await context.supabase
            .from('proposal_vote_snapshots')
            .insert({
                proposal_id: input.proposalId,
                total_votes: proposal.total_votes,
                total_tokens_staked: proposal.total_tokens_staked,
                voter_snapshots: votes || [],
                reached_decision_at: new Date().toISOString()
            });

        if (snapshotError) {
            console.error('Failed to create snapshot:', snapshotError);
            // Don't throw error here as the main action succeeded
        }

        return {
            success: true,
            message: `Proposal ${input.decision === 'pass' ? 'accepted' : 'rejected'} successfully`,
            proposal
        };
    }
}); 