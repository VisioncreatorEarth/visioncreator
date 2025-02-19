import { createOperation, z } from '../generated/wundergraph.factory';

interface NotificationRecipient {
    id: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    notifications: {
        id: string;
        created_at: string;
        messages: {
            id: string;
            content: string;
            created_at: string;
        };
        sender: {
            id: string;
            name: string;
        };
        context: {
            proposal: {
                id: string;
                title: string;
            };
        };
    };
}

export default createOperation.query({
    requireAuthentication: true,
    handler: async ({ user, context }): Promise<{ notifications: any[] }> => {
        const userId = user?.customClaims?.id;

        if (!userId) {
            console.log('No user ID available in customClaims');
            return { notifications: [] };
        }

        console.log('Starting notification query for user:', userId);

        // Get notifications with all related data in a single query
        const { data: notifications, error: notificationsError } = await context.supabase
            .from('notification_recipients')
            .select(`
                id,
                is_read,
                read_at,
                created_at,
                notifications (
                    id,
                    created_at,
                    messages (
                        id,
                        content,
                        created_at
                    ),
                    sender:profiles (
                        id,
                        name
                    ),
                    context:notification_contexts (
                        proposal:proposals (
                            id,
                            title
                        )
                    )
                )
            `)
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(50) as {
                data: NotificationRecipient[] | null;
                error: any
            };

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
            notification_id: recipient.notifications.id,
            message: recipient.notifications.messages,
            sender: recipient.notifications.sender,
            proposal: recipient.notifications.context.proposal,
            is_read: recipient.is_read,
            read_at: recipient.read_at,
            created_at: recipient.notifications.created_at
        }));

        return {
            notifications: transformedNotifications
        };
    }
}); 