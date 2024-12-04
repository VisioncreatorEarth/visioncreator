import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    subscriptionId: z.string(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ['authenticated'],
  },
  handler: async ({ input, user, context }) => {
    if (!user?.customClaims?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Cancel subscription input:', {
        subscriptionId: input.subscriptionId
      });

      // Get current subscription
      const { data: subscription } = await context.supabase
        .from('polar_subscriptions')
        .select('*')
        .eq('id', input.subscriptionId)
        .eq('user_id', user.customClaims.id)
        .single();

      if (!subscription) {
        console.error('Subscription not found in database:', input.subscriptionId);
        throw new Error('Subscription not found');
      }

      console.log('Found subscription in database:', subscription);

      // Cancel subscription in Polar
      const result = await context.polar.users.subscriptions.cancel({
        id: input.subscriptionId
      });

      console.log('Polar subscription cancel result:', result);

      return {
        success: true,
        message: 'Subscription cancelled successfully',
        subscription: result
      };
    } catch (error: any) {
      console.error('Error cancelling subscription:', {
        error: error.message,
        details: error.response?.data || error,
        input
      });

      if (error.response?.status === 404) {
        throw new Error('Subscription not found in Polar');
      }

      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }
});
