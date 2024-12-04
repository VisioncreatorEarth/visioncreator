import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    input: z.object({
        active: z.boolean().optional(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ['authenticated'],
    },
    handler: async ({ user, input, context }) => {
        try {
            // Build query
            let query = context.supabase
                .from('polar_subscriptions')
                .select('*')
                .eq('user_id', user?.customClaims?.id)
                .order('started_at', { ascending: false });

            // Add active filter if specified
            if (input.active !== undefined) {
                query = query.eq('status', input.active ? 'active' : 'inactive');
            }

            // Execute query
            const { data: subscriptions, error } = await query;

            if (error) {
                console.error('Error fetching Polar subscriptions:', error);
                throw new Error('Failed to fetch subscriptions');
            }

            // If no subscriptions found
            if (!subscriptions?.length) {
                return {
                    subscriptions: [],
                };
            }

            const mappedSubscriptions = subscriptions.map(sub => ({
                id: sub.id,
                status: sub.status,
                started_at: sub.started_at,
                ended_at: sub.ended_at,
                current_period_end: sub.current_period_end,
                cancel_at_period_end: sub.cancel_at_period_end,
                product: {
                    id: sub.product_id,
                    name: sub.product_name
                },
                amount: sub.amount,
                currency: sub.currency,
                recurring_interval: sub.recurring_interval,
                metadata: sub.metadata,
                user: {
                    email: user?.email || '',
                    name: user?.name || ''
                }
            }));

            return {
                subscriptions: mappedSubscriptions,
            };
        } catch (error) {
            console.error('Error fetching Polar subscriptions:', error);
            throw new Error('Failed to fetch subscriptions');
        }
    }
});
