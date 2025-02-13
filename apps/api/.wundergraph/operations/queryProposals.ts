import { createOperation } from '../generated/wundergraph.factory';

interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
    tokens: number;
    tokens_staked_vce?: number;
}

interface Proposal {
    id: string;
    title: string;
    author: string;
    details: string | null;
    video_id: string | null;
    state: 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';
    total_votes: number;
    total_tokens_staked: number;
    responsible: string | null;
    created_at: string;
    updated_at: string;
    tags: string[];
    metadata: {
        benefits?: string | null;
        pain?: string | null;
        [key: string]: any;
    };
    voters: VoterInfo[]; // Add voters directly to proposal
}

export default createOperation.query({
    handler: async ({ context }): Promise<{ proposals: Proposal[] }> => {
        // Get all proposals
        const { data: proposals, error: proposalsError } = await context.supabase
            .from('proposals')
            .select('*')
            .order('total_votes', { ascending: false });

        if (proposalsError) {
            console.error('Error fetching proposals:', proposalsError);
            throw new Error(`Failed to fetch proposals: ${proposalsError.message}`);
        }

        // Get all votes and profiles in one go
        const { data: allVotes, error: votesError } = await context.supabase
            .from('user_proposal_votes')
            .select('proposal_id, user_id, user_votes, tokens_staked')
            .gt('user_votes', 0);

        if (votesError) {
            console.error('Error fetching votes:', votesError);
            throw new Error(`Failed to fetch votes: ${votesError.message}`);
        }

        // Get all voter profiles
        const voterIds = [...new Set(allVotes.map(vote => vote.user_id))];
        const { data: profiles, error: profilesError } = await context.supabase
            .from('profiles')
            .select('id, name')
            .in('id', voterIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        // Create a map of profiles for quick lookup
        const profileMap = new Map(profiles.map(profile => [profile.id, profile]));

        // Organize votes by proposal
        const votesByProposal = allVotes.reduce((acc, vote) => {
            if (!acc[vote.proposal_id]) {
                acc[vote.proposal_id] = [];
            }
            const profile = profileMap.get(vote.user_id);
            if (profile) {
                acc[vote.proposal_id].push({
                    id: vote.user_id,
                    name: profile.name,
                    votes: vote.user_votes,
                    tokens: vote.tokens_staked,
                    tokens_staked_vce: vote.tokens_staked // Include VCE specific staking
                });
            }
            return acc;
        }, {} as Record<string, VoterInfo[]>);

        // Combine proposals with their voters
        const proposalsWithVoters = proposals.map(proposal => ({
            ...proposal,
            voters: votesByProposal[proposal.id] || []
        }));

        return {
            proposals: proposalsWithVoters
        };
    }
}); 
