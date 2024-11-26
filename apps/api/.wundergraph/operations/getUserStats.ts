import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    input: z.object({
        userId: z.string()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context }) => {
        // Helper functions
        const calculateSuccessRate = (calls: any[]) => {
            if (calls.length === 0) return 0;
            const successfulCalls = calls.filter(call => call.status === 'completed').length;
            return Math.round((successfulCalls / calls.length) * 100);
        };

        const formatRecentCalls = (calls: any[]) => {
            return calls.slice(0, 5).map(call => ({
                id: call.id,
                start_time: call.call_start_time,
                end_time: call.call_end_time,
                duration: call.duration_minutes,
                status: call.status,
                error: call.error_message
            }));
        };

        // Get user's hominio calls
        const { data: calls, error: callsError } = await context.supabase
            .from('hominio_calls')
            .select(`
                id,
                call_start_time,
                call_end_time,
                duration_minutes,
                status,
                error_message
            `)
            .eq('user_id', input.userId)
            .order('call_start_time', { ascending: false });

        if (callsError) {
            console.error('Error fetching calls:', callsError);
            throw new Error('Failed to fetch user statistics');
        }

        // Get user's capability information
        const { data: capabilities, error: capError } = await context.supabase
            .from('capabilities')
            .select('*')
            .eq('user_id', input.userId)
            .eq('type', 'TIER')
            .eq('active', true)
            .single();

        // Handle case where user has no capabilities
        if (capError && capError.code === 'PGRST116') { // No rows returned
            console.log('No capabilities found for user:', input.userId);
            return {
                total_calls: calls.length,
                total_minutes: calls.reduce((sum, call) => sum + (call.duration_minutes || 0), 0),
                minutes_limit: 0,
                minutes_used: 0,
                minutes_remaining: 0,
                success_rate: calculateSuccessRate(calls),
                recent_calls: formatRecentCalls(calls)
            };
        }

        if (capError) {
            console.error('Error fetching capabilities:', capError);
            throw new Error('Failed to fetch user capabilities');
        }

        // Calculate totals
        return {
            total_calls: calls.length,
            total_minutes: calls.reduce((sum, call) => sum + (call.duration_minutes || 0), 0),
            minutes_limit: capabilities?.config?.minutesLimit || 0,
            minutes_used: capabilities?.config?.minutesUsed || 0,
            minutes_remaining: Math.max(0, (capabilities?.config?.minutesLimit || 0) - (capabilities?.config?.minutesUsed || 0)),
            success_rate: calculateSuccessRate(calls),
            recent_calls: formatRecentCalls(calls)
        };
    }
});
