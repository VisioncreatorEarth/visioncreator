import { createOperation, z } from "../generated/wundergraph.factory";

const TierType = z.enum(['free', 'homino', 'visioncreator']);

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        tier: TierType,
    }),
    requireAuthentication: true,
    handler: async ({ input }) => {
        // Define base capabilities that all tiers have
        const baseCapabilities = {
            SHOPPING_LISTS: { unlimited: true },
            HOMINIO_SKILLS: ['shopping']
        };

        // Define tier-specific capabilities
        const tiers = {
            'free': {
                aiLimit: 5,
                name: 'Free Tier',
                capabilities: {
                    ...baseCapabilities,
                }
            },
            'homino': {
                aiLimit: 100,
                name: 'Homino',
                capabilities: {
                    ...baseCapabilities,
                    HOMINIO_SKILLS: [...baseCapabilities.HOMINIO_SKILLS, 'email', 'todos'],
                    CUSTOM_PROMPTS: true,
                }
            },
            'visioncreator': {
                aiLimit: 500,
                name: 'Vision Creator',
                capabilities: {
                    ...baseCapabilities,
                    // Inherit all Homino capabilities
                    HOMINIO_SKILLS: [...baseCapabilities.HOMINIO_SKILLS, 'email', 'todos', 'projects'],
                    PROJECT_MANAGEMENT: true,
                    EMAIL_INTEGRATION: true,
                    BETA_ACCESS: true,
                }
            }
        };

        return {
            success: true,
            message: `Updated user tier to ${tiers[input.tier].name}`,
            capabilities: tiers[input.tier].capabilities
        };
    },
}); 