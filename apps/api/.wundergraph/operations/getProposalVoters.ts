import { createOperation, z } from '../generated/wundergraph.factory';

interface UserVote {
    user_id: string;
    user_votes: number;
    tokens_staked: number;
}

interface Profile {
    id: string;
    name: string | null;
}

interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
    tokens: number;
}

export default createOperation.query({
    input: z.object({
        proposalId: z.string()
    }),
    handler: async ({ input, context }) => {
        // Get all votes for the proposal from user_proposal_votes
        const { data: votes } = await context.supabase
            .from('user_proposal_votes')
            .select('user_id, user_votes, tokens_staked')
            .eq('proposal_id', input.proposalId)
            .gt('user_votes', 0)
            .order('user_votes', { ascending: false });

        if (!votes) return { voters: [] };

        // Get user profiles for voters
        const voterIds = (votes as UserVote[]).map(vote => vote.user_id);
        if (voterIds.length === 0) return { voters: [] };

        const { data: profiles } = await context.supabase
            .from('profiles')
            .select('id, name')
            .in('id', voterIds);

        if (!profiles) return { voters: [] };

        // Create a map of profiles for easy lookup
        const profileMap = new Map(
            (profiles as Profile[]).map(profile => [profile.id, profile])
        );

        // Combine profile info with vote counts
        const voters: VoterInfo[] = (votes as UserVote[])
            .map(vote => {
                const profile = profileMap.get(vote.user_id);
                if (!profile) return null;
                return {
                    id: profile.id,
                    name: profile.name,
                    votes: vote.user_votes,
                    tokens: vote.tokens_staked
                };
            })
            .filter((voter): voter is VoterInfo => voter !== null)
            .sort((a, b) => b.votes - a.votes);

        return { voters };
    }
}); 