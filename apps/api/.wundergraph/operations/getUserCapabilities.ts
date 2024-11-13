import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
    input: z.object({
        userId: z.string(),
    }),
    requireAuthentication: true,
    handler: async ({ input }) => {
        // Mock different tiers of capabilities
        const tiers = {
            'free': {
                type: 'AI_REQUESTS',
                limit: 5,
                name: 'Free Tier'
            },
            'homino': {
                type: 'AI_REQUESTS',
                limit: 100,
                name: 'Homino'
            },
            'visioncreator': {
                type: 'AI_REQUESTS',
                limit: 500,
                name: 'Vision Creator'
            }
        };

        // Mock user capabilities based on user ID
        const mockUserTier = input.userId.startsWith('vision') ? 'visioncreator' :
            input.userId.startsWith('homino') ? 'homino' : 'free';

        const capabilities = [
            {
                type: 'AI_REQUESTS',
                limit: tiers[mockUserTier].limit,
                tier: mockUserTier
            }
        ];

        // Mock audit logs
        const auditLogs = [
            {
                timestamp: new Date().toISOString(),
                modified_by: 'admin',
                action: 'tier_assigned',
                details: `Assigned ${tiers[mockUserTier].name} tier`,
                capabilities
            }
        ];

        return {
            capabilities,
            auditLogs,
            tier: mockUserTier
        };
    },
}); 