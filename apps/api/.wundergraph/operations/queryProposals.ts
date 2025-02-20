import { createOperation } from '../generated/wundergraph.factory';

interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
    tokens: number;
    tokens_staked_vce?: number;
}

interface Profile {
    id: string;
    name: string | null;
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
    voters: VoterInfo[];
    isSubscribed: boolean;
}

interface RawVote {
    proposal_id: string;
    user_id: string;
    user_votes: number;
    tokens_staked: number;
}

interface RawProposal {
    id: string;
    title: string;
    author: {
        id: string;
        name: string | null;
    };
    responsible: {
        id: string;
        name: string | null;
    } | null;
    details: string | null;
    video_id: string | null;
    state: 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';
    total_votes: number;
    total_tokens_staked: number;
    created_at: string;
    updated_at: string;
    tags: string[];
    metadata: {
        benefits?: string | null;
        pain?: string | null;
        [key: string]: any;
    };
}

interface NotificationContext {
    context: {
        proposal_id: string;
    };
}

export default createOperation.query({
    handler: async ({ context, user }): Promise<{ proposals: Proposal[] }> => {
        const userId = user?.customClaims?.id;

        // Get all proposals
        const { data: proposals, error } = await context.supabase
            .from('proposals')
            .select(`
                *,
                responsible:profiles!proposals_responsible_fkey(id, name),
                author:profiles!proposals_author_fkey(id, name)
            `) as { data: RawProposal[] | null; error: any };

        if (error) {
            throw new Error(`Failed to fetch proposals: ${error.message}`);
        }

        // Get all votes and profiles in one go
        const { data: allVotes, error: votesError } = await context.supabase
            .from('user_proposal_votes')
            .select('proposal_id, user_id, user_votes, tokens_staked')
            .gt('user_votes', 0) as { data: RawVote[] | null; error: any };

        if (votesError) {
            console.error('Error fetching votes:', votesError);
            throw new Error(`Failed to fetch votes: ${votesError.message}`);
        }

        // Get all voter profiles
        const voterIds = [...new Set((allVotes || []).map(vote => vote.user_id))];
        const { data: profiles, error: profilesError } = await context.supabase
            .from('profiles')
            .select('id, name')
            .in('id', voterIds) as { data: Profile[] | null; error: any };

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        // Create a map of profiles for quick lookup
        const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));

        // Organize votes by proposal
        const votesByProposal = (allVotes || []).reduce((acc, vote) => {
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
                    tokens_staked_vce: vote.tokens_staked
                });
            }
            return acc;
        }, {} as Record<string, VoterInfo[]>);

        // Get subscription status for all proposals if user is logged in
        let subscriptionMap = new Map<string, boolean>();

        if (userId) {
            try {
                // Get all subscribed proposals for the user
                const { data: subscriptions, error: subError } = await context.supabase
                    .from('notification_recipients')
                    .select(`
                        context:notification_contexts!inner (
                            proposal_id
                        )
                    `)
                    .eq('recipient_id', userId) as { data: NotificationContext[] | null; error: any };

                if (subError) {
                    console.error('Error fetching subscriptions:', subError);
                } else if (subscriptions && subscriptions.length > 0) {
                    // Create subscription map from proposal IDs
                    subscriptionMap = new Map(
                        subscriptions.map(sub => [sub.context.proposal_id, true])
                    );
                }
            } catch (error) {
                console.error('Error fetching subscription status:', error);
                // Continue with empty subscription map on error
            }
        }

        // Combine proposals with their voters and subscription status
        const proposalsWithVoters = (proposals || []).map(proposal => ({
            ...proposal,
            voters: votesByProposal[proposal.id] || [],
            isSubscribed: subscriptionMap.get(proposal.id) || false,
            responsible: proposal.responsible?.id || null,
            author: proposal.author?.id || null
        })) as Proposal[];

        return {
            proposals: proposalsWithVoters
        };
    }
}); 
