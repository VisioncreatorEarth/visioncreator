import { createOperation, z } from '../generated/wundergraph.factory';

interface NotificationContext {
    id: string;
    proposal_id: string;
}

interface Notification {
    id: string;
}

interface NotificationRecipient {
    id: string;
    recipient_id: string;
    notification_id: string;
}

export default createOperation.mutation({
    input: z.object({
        userId: z.string().uuid(),
        proposalId: z.string().uuid()
    }),
    handler: async ({ input, context }) => {
        const { userId, proposalId } = input;

        try {
            // First, get or create the notification context
            const { data: contextData, error: contextError } = await context.supabase
                .from('notification_contexts')
                .select('id')
                .eq('proposal_id', proposalId)
                .single() as { data: NotificationContext | null; error: { code: string } | null };


            if (contextError && contextError.code !== 'PGRST116') {
                throw new Error('Failed to get notification context');
            }

            let contextId: string;

            if (!contextData) {
                console.log('Creating new notification context');
                // Create new context if it doesn't exist
                const { data: newContext, error: createError } = await context.supabase
                    .from('notification_contexts')
                    .insert({ proposal_id: proposalId })
                    .select('id')
                    .single() as { data: NotificationContext | null; error: any };


                if (createError || !newContext) {
                    throw new Error('Failed to create notification context');
                }

                contextId = newContext.id;
            } else {
                contextId = contextData.id;
            }

            console.log('Using context ID:', contextId);

            // Get all notifications for this context
            const { data: notifications, error: notificationsError } = await context.supabase
                .from('notifications')
                .select('id')
                .eq('context_id', contextId) as { data: Notification[] | null; error: any };


            if (notificationsError) {
                throw new Error('Failed to get notifications');
            }

            if (!notifications || notifications.length === 0) {
                // Create a default notification for the context
                const { data: newNotification, error: createNotifError } = await context.supabase
                    .from('notifications')
                    .insert({
                        context_id: contextId,
                        message_id: null,
                        sender_id: userId
                    })
                    .select('id')
                    .single() as { data: Notification | null; error: any };


                if (createNotifError || !newNotification) {
                    throw new Error('Failed to create notification');
                }

                // Return subscribed state since we'll create the subscription next
                const { error: insertError } = await context.supabase
                    .from('notification_recipients')
                    .insert({
                        recipient_id: userId,
                        notification_id: newNotification.id
                    });

                if (insertError) {
                    throw new Error('Failed to subscribe');
                }

                return { subscribed: true };
            }

            // Get existing subscriptions
            const { data: existingSubscriptions, error: subError } = await context.supabase
                .from('notification_recipients')
                .select('notification_id')
                .eq('recipient_id', userId)
                .in('notification_id', notifications.map(n => n.id)) as { data: NotificationRecipient[] | null; error: any };


            if (subError) {
                throw new Error('Failed to check existing subscriptions');
            }

            if (existingSubscriptions && existingSubscriptions.length > 0) {
                // User is already subscribed, so unsubscribe
                const { error: deleteError } = await context.supabase
                    .from('notification_recipients')
                    .delete()
                    .eq('recipient_id', userId)
                    .in('notification_id', notifications.map(n => n.id));

                if (deleteError) {
                    throw new Error('Failed to unsubscribe');
                }

                return { subscribed: false };
            } else {
                // Subscribe user to all notifications
                const subscriptions = notifications.map(notification => ({
                    recipient_id: userId,
                    notification_id: notification.id
                }));

                const { error: insertError } = await context.supabase
                    .from('notification_recipients')
                    .insert(subscriptions);

                if (insertError) {
                    throw new Error('Failed to subscribe');
                }

                return { subscribed: true };
            }
        } catch (error) {
            console.error('Subscription toggle error:', error);
            throw error;
        }
    }
}); 