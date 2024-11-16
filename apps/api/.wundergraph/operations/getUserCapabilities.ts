import { createOperation, z } from '../generated/wundergraph.factory';
import type { Capability } from '../utils/types';

export default createOperation.query({
    input: z.object({
        userId: z.string(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ context, input }): Promise<{ capabilities: Capability[] }> => {
        const { data: capabilities, error } = await context.supabase
            .from('capabilities')
            .select(`
                id,
                user_id,
                type,
                name,
                description,
                config,
                granted_at,
                granted_by,
                active,
                profiles:granted_by (name)
            `)
            .eq('user_id', input.userId)
            .eq('active', true);

        if (error) {
            throw new Error('Failed to fetch capabilities');
        }

        return { capabilities };
    },
}); 