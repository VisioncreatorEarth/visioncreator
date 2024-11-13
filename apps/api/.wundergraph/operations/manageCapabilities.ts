import { createOperation, z } from "../generated/wundergraph.factory";

// Define available tiers
const TierType = z.enum(['free', 'homino', 'visioncreator']);

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        tier: TierType,
    }),
    requireAuthentication: true,
    handler: async ({ input }) => {
        const tiers = {
            'free': {
                type: ['AI_REQUESTS'],
                aiLimit: 5,
                name: 'Free Tier'
            },
            'homino': {
                type: ['AI_REQUESTS'],
                aiLimit: 100,
                name: 'Homino'
            },
            'visioncreator': {
                type: ['AI_REQUESTS'],
                aiLimit: 500,
                name: 'Vision Creator'
            }
        };

        const capabilities = [
            {
                type: 'AI_REQUESTS',
                limit: tiers[input.tier].aiLimit,
                tier: input.tier
            }
        ];

        return {
            success: true,
            message: `Updated user tier to ${tiers[input.tier].name}`,
            capabilities
        };
    },
}); 