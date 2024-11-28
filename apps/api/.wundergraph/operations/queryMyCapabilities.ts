import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ user, context }): Promise<{ capabilities: Capability[] }> => {
        if (!user?.customClaims?.id) {
            throw new Error('User not authenticated');
        }

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
            .eq('user_id', user.customClaims.id)
            .eq('active', true);

        if (error) {
            throw new Error('Failed to fetch capabilities');
        }

        return { capabilities };
    }
});
