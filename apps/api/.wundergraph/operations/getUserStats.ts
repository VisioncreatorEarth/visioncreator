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
        // Get user's requests for the current week
        const { data: requests, error } = await context.supabase
            .from('hominio_requests')
            .select(`
                id,
                timestamp,
                input_tokens,
                output_tokens,
                processing_time,
                model,
                success,
                metadata
            `)
            .eq('user_id', input.userId)
            .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('timestamp', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch user statistics');
        }

        // Calculate totals
        const stats = {
            total_requests: requests.length,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_processing_time: 0,
            total_cost: 0,
            success_rate: 0,
            requests_by_model: {} as Record<string, number>,
            recent_requests: requests.slice(0, 5)
        };

        requests.forEach(req => {
            stats.total_input_tokens += req.input_tokens;
            stats.total_output_tokens += req.output_tokens;
            stats.total_processing_time += req.processing_time;

            // Add costs from metadata
            const cost = req.metadata?.cost || {
                input: (req.input_tokens / 1000000) * 1,
                output: (req.output_tokens / 1000000) * 5
            };
            stats.total_cost += cost.input + cost.output;

            // Track model usage
            stats.requests_by_model[req.model] = (stats.requests_by_model[req.model] || 0) + 1;
        });

        // Calculate success rate
        stats.success_rate = requests.length > 0
            ? (requests.filter(r => r.success).length / requests.length) * 100
            : 0;

        return {
            stats
        };
    }
});
