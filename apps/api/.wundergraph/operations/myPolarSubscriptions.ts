import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    input: z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(10),
        active: z.boolean().optional(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ['authenticated'],
    },
    handler: async ({ input, context }) => {
        try {
            const response = await context.polar.subscriptions.list({
                page: input.page,
                limit: input.limit,
                active: input.active,
                sorting: ['-started_at']
            });

            // If no response or no items
            if (!response?.result?.items) {
                return {
                    subscriptions: [],
                    total: 0,
                    page: input.page,
                    limit: input.limit
                };
            }

            const mappedSubscriptions = response.result.items.map(item => ({
                id: item.id,
                status: item.status,
                started_at: item.startedAt,
                ended_at: item.endedAt,
                current_period_end: item.currentPeriodEnd,
                cancel_at_period_end: item.cancelAtPeriodEnd,
                product: {
                    id: item.product.id,
                    name: item.product.name
                },
                amount: item.amount,
                currency: item.currency,
                recurring_interval: item.recurringInterval,
                metadata: item.metadata,
                user: {
                    email: item.user.email,
                    name: item.user.publicName
                }
            }));

            return {
                subscriptions: mappedSubscriptions,
                total: response.result.pagination.totalCount || 0,
                page: input.page,
                limit: input.limit
            };
        } catch (error) {
            console.error('Error fetching Polar subscriptions:', error);
            throw new Error('Failed to fetch subscriptions');
        }
    }
});
