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

        // Initialize stats with default values
        const stats = {
            total_calls: calls.length,
            total_minutes: 0,
            minutes_limit: 0,
            minutes_used: 0,
            minutes_remaining: 0,
            success_rate: 0,
            recent_calls: calls.slice(0, 5).map(call => ({
                id: call.id,
                start_time: call.call_start_time,
                end_time: call.call_end_time,
                duration: call.duration_minutes,
                status: call.status,
                error: call.error_message
            }))
        };

        // If there's an active capability, update the stats with its values
        if (!capError && capabilities) {
            stats.minutes_limit = capabilities.config.minutesLimit || 0;
            stats.minutes_used = capabilities.config.minutesUsed || 0;
            stats.minutes_remaining = Math.max(0, (capabilities.config.minutesLimit || 0) - (capabilities.config.minutesUsed || 0));
        }

        calls.forEach(call => {
            stats.total_minutes += call.duration_minutes;
        });

        // Calculate success rate
        const completedCalls = calls.filter(call => call.status === 'completed').length;
        stats.success_rate = calls.length > 0 ? (completedCalls / calls.length) * 100 : 0;

        return {
            stats
        };
    }
});
