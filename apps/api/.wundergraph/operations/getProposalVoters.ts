import { createOperation, z } from '../generated/wundergraph.factory';

interface Transaction {
    from_user_id: string;
    amount: number;
    transaction_type: 'stake' | 'unstake';
}

interface Profile {
    id: string;
    name: string | null;
}

interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
}

export default createOperation.query({
    input: z.object({
        proposalId: z.string()
    }),
    handler: async ({ input, context }) => {
        // Get all stake transactions for the proposal
        const { data: transactions } = await context.supabase
            .from('token_transactions')
            .select('from_user_id, amount, transaction_type')
            .eq('proposal_id', input.proposalId)
            .order('created_at', { ascending: true });

        if (!transactions) return { voters: [] };

        // Calculate net votes per user
        const voterVotes = (transactions as Transaction[]).reduce((acc, tx) => {
            const userId = tx.from_user_id;
            if (!userId) return acc;

            const currentVotes = acc.get(userId) || 0;
            const voteChange = tx.transaction_type === 'stake' ? tx.amount : -tx.amount;
            const newTotal = currentVotes + voteChange;

            // Only keep users with positive vote counts
            if (newTotal > 0) {
                acc.set(userId, newTotal);
            } else {
                acc.delete(userId);
            }

            return acc;
        }, new Map<string, number>());

        // Get user profiles for voters
        const voterIds = Array.from(voterVotes.keys());
        if (voterIds.length === 0) return { voters: [] };

        const { data: profiles } = await context.supabase
            .from('profiles')
            .select('id, name')
            .in('id', voterIds);

        if (!profiles) return { voters: [] };

        // Combine profile info with vote counts and sort by votes
        const voters: VoterInfo[] = (profiles as Profile[])
            .map(profile => ({
                id: profile.id,
                name: profile.name,
                votes: voterVotes.get(profile.id) || 0
            }))
            .sort((a, b) => b.votes - a.votes); // Sort by vote count descending

        return { voters };
    }
}); 