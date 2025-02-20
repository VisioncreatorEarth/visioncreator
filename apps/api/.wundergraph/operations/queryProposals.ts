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

interface Composite {
    id: string;
    title: string;
    description: string;
    schema_id: string;
    instance_id: string;
    schema_data: {
        json: any;
    };
    instance_data: {
        json: any;
    };
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
        title: string;
        description: string;
        schema: any;
        instance: any;
    };
}

export default createOperation.query({
    handler: async ({ context, user }): Promise<{ proposals: Proposal[] }> => {
        const userId = user?.customClaims?.id;

        // Get all proposals with their composites
        const { data: proposals, error } = await context.supabase
            .from('proposals')
            .select(`
                *,
                responsible:profiles!proposals_responsible_fkey(id, name),
                author:profiles!proposals_author_fkey(id, name),
                composite:composites!proposals_compose_fkey(
                    id,
                    title,
                    description,
                    schema_id,
                    instance_id
                )
            `);

        if (error) {
            throw new Error(`Failed to fetch proposals: ${error.message}`);
        }

        // Get all db entries for composites
        const compositeIds = (proposals as any[])
            .filter(p => p.composite)
            .map(p => p.composite);

        const schemaIds = compositeIds.map(c => c.schema_id);
        const instanceIds = compositeIds.map(c => c.instance_id);
        const allDbIds = [...new Set([...schemaIds, ...instanceIds])];

        const { data: dbEntries, error: dbError } = await context.supabase
            .from('db')
            .select('id, json')
            .in('id', allDbIds);

        if (dbError) {
            throw new Error(`Failed to fetch db entries: ${dbError.message}`);
        }

        // Create a map for quick lookup
        const dbMap = new Map((dbEntries as any[]).map(entry => [entry.id, entry.json]));

        // If not found in active db, try archive
        if (allDbIds.length > 0) {
            const missingIds = allDbIds.filter(id => !dbMap.has(id));
            if (missingIds.length > 0) {
                const { data: archivedEntries, error: archiveError } = await context.supabase
                    .from('db_archive')
                    .select('id, json')
                    .in('id', missingIds);

                if (!archiveError && archivedEntries) {
                    archivedEntries.forEach((entry: any) => {
                        dbMap.set(entry.id, entry.json);
                    });
                }
            }
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

        // Combine proposals with their voters, subscription status, and composite data
        const proposalsWithVoters = (proposals as any[]).map(proposal => ({
            ...proposal,
            voters: votesByProposal[proposal.id] || [],
            isSubscribed: subscriptionMap.get(proposal.id) || false,
            responsible: proposal.responsible?.id || null,
            author: proposal.author?.id || null,
            compose_data: proposal.composite ? {
                title: proposal.composite.title,
                description: proposal.composite.description,
                schema: dbMap.get(proposal.composite.schema_id),
                instance: dbMap.get(proposal.composite.instance_id)
            } : undefined
        })) as Proposal[];

        return {
            proposals: proposalsWithVoters
        };
    }
}); 
