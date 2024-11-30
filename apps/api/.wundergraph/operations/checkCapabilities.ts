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

        // Get actual minutes used from completed calls
        const { data: calls, error: callsError } = await context.supabase
            .from('hominio_calls')
            .select('duration_minutes')
            .eq('user_id', user.customClaims.id)
            .eq('status', 'completed');

        if (callsError) {
            console.error('Error fetching calls:', callsError);
            throw new Error('Failed to fetch call history');
        }

        const actualMinutesUsed = Number(calls.reduce((total, call) => total + (call.duration_minutes || 0), 0).toFixed(4));
        const minutesLimit = capability.config?.minutesLimit || 0;
        const remainingMinutes = Number((minutesLimit - actualMinutesUsed).toFixed(4));

        console.log('Minutes used:', actualMinutesUsed);
        console.log('Minutes limit:', minutesLimit);
        console.log('Remaining minutes:', remainingMinutes);

        if (remainingMinutes <= 0) {
            return {
                status: 'NO_MINUTES',
                message: 'No available minutes in current plan',
                tier: capability.config.tier,
                minutesLimit,
                minutesUsed: actualMinutesUsed,
                remainingMinutes: 0
            };
        }

        // All good - user can proceed
        return {
            status: 'OK',
            tier: capability.config.tier,
            minutesLimit,
            minutesUsed: actualMinutesUsed,
            remainingMinutes
        };
    }
});
