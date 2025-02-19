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
    message: Message;
    sender: Profile;
    context: NotificationContext;
}

interface NotificationRecipient {
    id: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    notification_id: string;
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
                notification_id,
                notification:notifications!inner (
                    id,
                    created_at,
                    message_id,
                    message:messages!inner (
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

        // Transform the data to match the expected format
        const transformedNotifications = notifications.map(recipient => ({
            id: recipient.id,
            message: recipient.notification.message,
            sender: recipient.notification.sender,
            proposal: recipient.notification.context.proposal,
            is_read: recipient.is_read,
            read_at: recipient.read_at,
            created_at: recipient.notification.created_at
        }));

        return {
            notifications: transformedNotifications
        };
    }
}); 