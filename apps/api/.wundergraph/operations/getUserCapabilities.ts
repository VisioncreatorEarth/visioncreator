import { createOperation, z } from '../generated/wundergraph.factory';
import { AccessLevel, UserCapabilities } from './types';

export default createOperation.query({
    input: z.object({
        userId: z.string(),
    }),
    requireAuthentication: true,
    handler: async ({ input }): Promise<UserCapabilities> => {
        // Mock user capabilities
        const mockTier = input.userId.includes('admin') ? 'visioncreator' : 'free';

        const tierCapabilities = [
            {
                type: 'AI_REQUESTS',
                limit: mockTier === 'visioncreator' ? 500 : mockTier === 'homino' ? 100 : 5,
                tier: mockTier
            },
            {
                type: 'SHOPPING_LISTS',
                limit: mockTier === 'visioncreator' ? 20 : mockTier === 'homino' ? 5 : 1,
                tier: mockTier
            }
        ];

        // Mock resource capabilities (shopping lists)
        const mockShoppingList = {
            resourceId: 'default-list',
            resourceType: 'SHOPPING_LIST',
            accessLevel: 'owner' as AccessLevel,
            grantedAt: new Date().toISOString(),
            grantedBy: 'system'
        };

        return {
            tier: mockTier,
            tierCapabilities,
            resourceCapabilities: [mockShoppingList]
        };
    },
}); 