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

        // Get all active tier capabilities for the user
        const { data: capabilities, error: capError } = await context.supabase
            .from('capabilities')
            .select('*')
            .eq('user_id', user.customClaims.id)
            .eq('type', 'TIER')
            .eq('active', true);

        if (capError) {
            throw new Error(`Failed to fetch capabilities: ${capError.message}`);
        }

        // If no capabilities found, user needs to join waitlist
        if (!capabilities || capabilities.length === 0) {
            return {
                status: 'NO_CAPABILITY',
                message: 'No active capability found'
            };
        }

        // Calculate total minutes limit from all active tiers
        const totalMinutesLimit = capabilities.reduce((total, cap) => {
            return total + (cap.config?.minutesLimit || 0);
        }, 0);

        // Get actual minutes used from completed calls
        const now = new Date();
        const { data: calls, error: callsError } = await context.supabase
            .from('hominio_calls')
            .select('duration_minutes, created_at')
            .eq('user_id', user.customClaims.id)
            .eq('status', 'completed');

        if (callsError) {
            console.error('Error fetching calls:', callsError);
            throw new Error('Failed to fetch call history');
        }

        // Calculate minutes used based on tier type
        let actualMinutesUsed = 0;
        for (const capability of capabilities) {
            const isSubscriptionTier = capability.config?.tier === 'HOMINIO' || capability.config?.tier === 'VISIONCREATOR';
            const subscriptionStart = isSubscriptionTier ? new Date(capability.granted_at) : null;
            const subscriptionEnd = isSubscriptionTier ? new Date(capability.config?.subscriptionEnd) : null;

            // Filter calls based on tier type
            const relevantCalls = calls.filter(call => {
                const callDate = new Date(call.created_at);
                if (isSubscriptionTier) {
                    // For subscription tiers, only count calls within the current subscription period
                    return callDate >= subscriptionStart && callDate <= subscriptionEnd;
                } else {
                    // For manual/prepaid tiers, count all calls since the tier was granted
                    return callDate >= new Date(capability.granted_at);
                }
            });

            // Sum up minutes for this capability
            const tierMinutesUsed = Number(relevantCalls.reduce((total, call) => total + (call.duration_minutes || 0), 0).toFixed(4));
            actualMinutesUsed += tierMinutesUsed;
        }

        const remainingMinutes = Number((totalMinutesLimit - actualMinutesUsed).toFixed(4));

        console.log('Backend - Actual minutes used:', actualMinutesUsed.toFixed(4));
        console.log('Backend - Minutes limit:', totalMinutesLimit);
        console.log('Backend - Remaining minutes:', remainingMinutes.toFixed(4));

        // Check if enough minutes are available for the minimum required duration
        const minimumRequiredMinutes = 0.1667; // 10 seconds
        if (remainingMinutes < minimumRequiredMinutes) {
            console.log(`Backend - Not enough minutes left, minimum required: ${minimumRequiredMinutes}, remaining: ${remainingMinutes}`);
            return {
                status: 'NO_MINUTES',
                message: 'No available minutes in your current plan',
                minutesUsed: actualMinutesUsed,
                minutesLimit: totalMinutesLimit,
                remainingMinutes: remainingMinutes,
                capabilities
            };
        }

        return {
            status: 'OK',
            minutesUsed: actualMinutesUsed,
            minutesLimit: totalMinutesLimit,
            remainingMinutes: remainingMinutes,
            capabilities
        };
    }
});
