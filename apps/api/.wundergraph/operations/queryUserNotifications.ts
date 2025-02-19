import { createOperation, z } from '../generated/wundergraph.factory';

interface Message {
    id: string;
    content: string;
    created_at: string;
}

interface Profile {
    id: string;
    name: string;
}

interface Proposal {
    id: string;
    title: string;
}

interface NotificationContext {
    proposal: Proposal;
}

interface Notification {
    id: string;
    created_at: string;
    message?: Message;
    sender: Profile;
    context: NotificationContext;
    notification_type: 'message' | 'vote_up' | 'vote_down';
    metadata: {
        transaction_type?: string;
        amount?: number;
        proposal_id?: string;
    };
}

interface NotificationRecipient {
    id: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    notification: Notification;
}

export default createOperation.query({
    requireAuthentication: true,
    handler: async ({ user, context }): Promise<{ notifications: any[] }> => {
        const userId = user?.customClaims?.id;

        if (!userId) {
            console.log('No user ID available in customClaims');
            return { notifications: [] };
        }

        // Get only unread notifications with all related data in a single query
        const { data: notifications, error: notificationsError } = await context.supabase
            .from('notification_recipients')
            .select(`
                id,
                is_read,
                read_at,
                created_at,
                notification:notifications!inner (
                    id,
                    created_at,
                    notification_type,
                    metadata,
                    message:messages (
                        id,
                        content,
                        created_at
                    ),
                    sender:profiles!inner (
                        id,
                        name
                    ),
                    context:notification_contexts!inner (
                        proposal:proposals!inner (
                            id,
                            title
                        )
                    )
                )
            `)
            .eq('recipient_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(50) as { data: NotificationRecipient[] | null; error: any };

        if (notificationsError) {
            console.error('Error fetching notifications:', notificationsError);
            throw new Error(`Failed to fetch notifications: ${notificationsError.message}`);
        }

        if (!notifications) {
            return { notifications: [] };
        }

        // Transform the data to match the expected format and generate appropriate content
        const transformedNotifications = notifications.map(recipient => {
            const notification = recipient.notification;
            let content = '';

            // Generate appropriate content based on notification type
            switch (notification.notification_type) {
                case 'message':
                    content = notification.message?.content || '';
                    break;
                case 'vote_up':
                    content = `voted on proposal "${notification.context.proposal.title}"`;
                    break;
                case 'vote_down':
                    content = `removed their vote from proposal "${notification.context.proposal.title}"`;
                    break;
            }

            return {
                id: recipient.id,
                content,
                sender: notification.sender,
                proposal: notification.context.proposal,
                is_read: recipient.is_read,
                read_at: recipient.read_at,
                created_at: notification.created_at,
                type: notification.notification_type,
                metadata: notification.metadata
            };
        });

        return {
            notifications: transformedNotifications
        };
    }
}); 