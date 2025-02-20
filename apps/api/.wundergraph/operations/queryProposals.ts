import { createOperation } from '../generated/wundergraph.factory';

interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
    tokens: number;
    tokens_staked_vce?: number;
}

interface Vote {
    proposal_id: string;
    user_id: string;
    user_votes: number;
    tokens_staked: number;
}

interface Profile {
    id: string;
    name: string | null;
}

interface NotificationContext {
    id: string;
    proposal_id: string;
}

interface NotificationRecipient {
    context_id: string;
}

interface SubscriptionContext {
    context: {
        proposal_id: string;
    };
}

interface DBVersion {
    id: string;
    json: any;
    version: number;
    variation: string;
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
    compose?: string;
    compose_data?: {
        id: string;
        json: any;
        version: number;
        variation: string;
    };
}

export default createOperation.query({
    handler: async ({ context, user }): Promise<{ proposals: Proposal[] }> => {
        const userId = user?.customClaims?.id;

        // Get all proposals first
        const { data: proposals, error } = await context.supabase
            .from('proposals')
            .select(`
                *,
                responsible:profiles!proposals_responsible_fkey(id, name),
                author:profiles!proposals_author_fkey(id, name)
            `);

        if (error) {
            throw new Error(`Failed to fetch proposals: ${error.message}`);
        }

        // Get compose data from both active and archived versions
        const composeIds = proposals
            .map(p => p.compose)
            .filter((id): id is string => id !== null);

        if (composeIds.length > 0) {
            // Get active versions
            const { data: activeVersions, error: activeError } = await context.supabase
                .from('db')
                .select('id, json, version, variation')
                .in('id', composeIds);

            if (activeError) {
                throw new Error(`Failed to fetch active versions: ${activeError.message}`);
            }

            // Get archived versions
            const { data: archivedVersions, error: archiveError } = await context.supabase
                .from('db_archive')
                .select('id, json, version, variation')
                .in('id', composeIds);

            if (archiveError) {
                throw new Error(`Failed to fetch archived versions: ${archiveError.message}`);
            }

            // Type assertion for database responses
            const typedActiveVersions = (activeVersions || []) as DBVersion[];
            const typedArchivedVersions = (archivedVersions || []) as DBVersion[];

            // Combine all versions into a map with proper typing
            const composeDataMap = new Map<string, DBVersion>();
            [...typedActiveVersions, ...typedArchivedVersions].forEach(version => {
                composeDataMap.set(version.id, version);
            });

            // Add compose data to proposals
            proposals.forEach(proposal => {
                if (proposal.compose && typeof proposal.compose === 'string') {
                    const composeData = composeDataMap.get(proposal.compose);
                    if (composeData) {
                        proposal.compose_data = {
                            id: composeData.id,
                            json: composeData.json,
                            version: composeData.version,
                            variation: composeData.variation
                        };
                    }
                }
            });
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
        const voterIds = [...new Set((allVotes as Vote[]).map(vote => vote.user_id))];
        const { data: profiles, error: profilesError } = await context.supabase
            .from('profiles')
            .select('id, name')
            .in('id', voterIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
        }

        // Create a map of profiles for quick lookup
        const profileMap = new Map((profiles as Profile[]).map(profile => [profile.id, profile]));

        // Organize votes by proposal
        const votesByProposal = (allVotes as Vote[]).reduce((acc, vote) => {
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
                    .eq('recipient_id', userId) as { data: SubscriptionContext[] | null; error: any };

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
        const proposalsWithVoters = (proposals as any[]).map(proposal => ({
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
