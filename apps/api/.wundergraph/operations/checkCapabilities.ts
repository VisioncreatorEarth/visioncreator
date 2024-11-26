import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context, user }) => {
        if (!user?.customClaims?.id) {
            throw new Error('User ID not found');
        }

        // Get user's active tier capability
        const { data: capability, error: capError } = await context.supabase
            .from('capabilities')
            .select('*')
            .eq('user_id', user.customClaims.id)
            .eq('type', 'TIER')
            .eq('active', true)
            .single();

        if (capError && capError.code !== 'PGRST116') { // Ignore "no rows returned" error
            throw new Error(`Failed to fetch capability: ${capError.message}`);
        }

        // If no capability found, user needs to join waitlist
        if (!capability) {
            return {
                status: 'NO_CAPABILITY',
                message: 'No active capability found'
            };
        }

        // Check if user has available minutes
        const minutesUsed = capability.config?.minutesUsed || 0;
        const minutesLimit = capability.config?.minutesLimit || 0;

        if (minutesUsed >= minutesLimit) {
            return {
                status: 'NO_MINUTES',
                message: 'No available minutes in current plan',
                tier: capability.config.tier,
                minutesLimit,
                minutesUsed
            };
        }

        // All good - user can proceed
        return {
            status: 'OK',
            tier: capability.config.tier,
            minutesLimit,
            minutesUsed,
            remainingMinutes: minutesLimit - minutesUsed
        };
    }
});
