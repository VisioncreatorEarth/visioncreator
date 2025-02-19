import { createOperation, z } from '../generated/wundergraph.factory';

interface NotificationContext {
    id: string;
    proposal_id: string;
}

interface NotificationRecipient {
    id: string;
    context_id: string;
    recipient_id: string;
    subscribed_at: string;
}

export default createOperation.mutation({
    input: z.object({
        userId: z.string().uuid(),
        proposalId: z.string().uuid()
    }),
    handler: async ({ input, context }) => {
        const { userId, proposalId } = input;
        console.log('Toggle subscription for:', { userId, proposalId });

        try {
            // First, get or create the notification context
            let { data: contextData, error: contextError } = await context.supabase
                .from('notification_contexts')
                .select('id')
                .eq('proposal_id', proposalId)
                .single() as { data: NotificationContext | null; error: { code: string } | null };

            if (contextError) {
                if (contextError.code === 'PGRST116') {
                    // Context doesn't exist, create it
                    console.log('Creating new notification context');
                    const { data: newContext, error: createError } = await context.supabase
                        .from('notification_contexts')
                        .insert({ proposal_id: proposalId })
                        .select('id')
                        .single() as { data: NotificationContext | null; error: any };

                    if (createError) {
                        throw new Error('Failed to create notification context');
                    }
                    contextData = newContext;
                } else {
                    throw new Error('Failed to get notification context');
                }
            }

            if (!contextData) {
                throw new Error('Failed to get or create notification context');
            }

            const contextId = contextData.id;
            console.log('Using context ID:', contextId);

            // Check if user is currently subscribed
            const { data: currentSub, error: subError } = await context.supabase
                .from('notification_recipients')
                .select('id')
                .eq('context_id', contextId)
                .eq('recipient_id', userId)
                .maybeSingle() as { data: NotificationRecipient | null; error: any };

            if (subError) {
                throw new Error('Failed to check subscription status');
            }

            if (currentSub) {
                console.log('Unsubscribing user');
                // User is currently subscribed, so unsubscribe
                const { error: deleteError } = await context.supabase
                    .from('notification_recipients')
                    .delete()
                    .eq('context_id', contextId)
                    .eq('recipient_id', userId);

                if (deleteError) {
                    throw new Error('Failed to remove subscription');
                }

                return { subscribed: false };
            } else {
                console.log('Subscribing user');
                // Create new subscription with current timestamp
                const { error: insertError } = await context.supabase
                    .from('notification_recipients')
                    .insert({
                        context_id: contextId,
                        recipient_id: userId,
                        subscribed_at: new Date().toISOString()
                    });

                if (insertError) {
                    throw new Error('Failed to create subscription');
                }

                return { subscribed: true };
            }
        } catch (error) {
            console.error('Subscription toggle error:', error);
            throw error;
        }
    }
}); 