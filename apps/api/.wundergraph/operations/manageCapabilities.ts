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
                type: ['AI_REQUESTS', 'SHOPPING_LISTS'],
                aiLimit: 5,
                shoppingListsLimit: 1,
                listSharingLimit: 5,
                name: 'Free Tier'
            },
            'homino': {
                type: ['AI_REQUESTS', 'SHOPPING_LISTS'],
                aiLimit: 100,
                shoppingListsLimit: 5,
                listSharingLimit: 10,
                name: 'Homino'
            },
            'visioncreator': {
                type: ['AI_REQUESTS', 'SHOPPING_LISTS'],
                aiLimit: 500,
                shoppingListsLimit: 20,
                listSharingLimit: 50,
                name: 'Vision Creator'
            }
        };

        const capabilities = [
            {
                type: 'AI_REQUESTS',
                limit: tiers[input.tier].aiLimit,
                tier: input.tier
            },
            {
                type: 'SHOPPING_LISTS',
                limit: tiers[input.tier].shoppingListsLimit,
                listSharingLimit: tiers[input.tier].listSharingLimit,
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