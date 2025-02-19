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

interface DBNotificationContext {
    id: string;
    proposal_id: string;
}

interface NotificationRecipient {
    id: string;
    notification_id: string;
}

interface DBNotification {
    id: string;
    context_id: string;
}

interface NotificationContext {
    id: string;
    proposal_id: string;
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

export default createOperation.query({
    handler: async ({ context, user }): Promise<{ proposals: Proposal[] }> => {
        const userId = user?.customClaims?.id;

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
                // First get all notification recipients for the user
                const { data: recipients, error: recipientsError } = await context.supabase
                    .from('notification_recipients')
                    .select('id, notification_id')
                    .eq('recipient_id', userId);

                if (recipientsError) throw recipientsError;
                if (!recipients || recipients.length === 0) {
                    // No subscriptions found, continue with empty map
                    console.log('No notification recipients found for user:', userId);
                } else {
                    // Get notifications for these recipients
                    const notificationIds = (recipients as NotificationRecipient[])
                        .map(r => r.notification_id);

                    const { data: notifications, error: notificationsError } = await context.supabase
                        .from('notifications')
                        .select('id, context_id')
                        .in('id', notificationIds);

                    if (notificationsError) throw notificationsError;
                    if (!notifications || notifications.length === 0) {
                        console.log('No notifications found for recipients');
                    } else {
                        // Get contexts for these notifications
                        const contextIds = (notifications as DBNotification[])
                            .map(n => n.context_id);

                        const { data: contexts, error: contextsError } = await context.supabase
                            .from('notification_contexts')
                            .select('id, proposal_id')
                            .in('id', contextIds);

                        if (contextsError) throw contextsError;
                        if (!contexts || contexts.length === 0) {
                            console.log('No contexts found for notifications');
                        } else {
                            // Create subscription map from proposal IDs
                            subscriptionMap = new Map(
                                (contexts as NotificationContext[])
                                    .map(ctx => [ctx.proposal_id, true])
                            );
                        }
                    }
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
            isSubscribed: subscriptionMap.get(proposal.id) || false
        })) as Proposal[];

        return {
            proposals: proposalsWithVoters
        };
    }
}); 
