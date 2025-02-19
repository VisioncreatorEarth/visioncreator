import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    input: z.object({
        userId: z.string().uuid(),
        proposalId: z.string().uuid()
    }),
    handler: async ({ input, context }) => {
        const { userId, proposalId } = input;

        // Get the notification context and check subscription in one query
        const { data, error } = await context.supabase
            .from('notification_contexts')
            .select(`
                id,
                notification_recipients!inner (
                    id
                )
            `)
            .eq('proposal_id', proposalId)
            .eq('notification_recipients.recipient_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error checking subscription:', error);
            throw new Error('Failed to check subscription status');
        }

        return {
            isSubscribed: !!data
        };
    }
}); 