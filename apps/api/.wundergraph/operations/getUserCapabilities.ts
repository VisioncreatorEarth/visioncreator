import { createOperation, z } from '../generated/wundergraph.factory';
import { AccessLevel, UserCapabilities } from './types';

export default createOperation.query({
    input: z.object({
        userId: z.string(),
    }),
    requireAuthentication: true,
    handler: async ({ input }): Promise<UserCapabilities> => {
        const mockTier = input.userId.includes('admin') ? 'visioncreator' : 'free';

        const tierCapabilities = [
            {
                type: 'AI_REQUESTS',
                limit: mockTier === 'visioncreator' ? 500 : mockTier === 'homino' ? 100 : 5,
                tier: mockTier
            }
        ];

        // Mock resource capabilities (shopping lists)
        const mockShoppingLists = [
            {
                resourceId: 'default-list',
                resourceType: 'SHOPPING_LIST',
                accessLevel: 'owner' as AccessLevel,
                grantedAt: new Date().toISOString(),
                grantedBy: 'system'
            },
            {
                resourceId: 'groceries',
                resourceType: 'SHOPPING_LIST',
                accessLevel: 'write' as AccessLevel,
                grantedAt: new Date().toISOString(),
                grantedBy: 'user-1'
            }
        ];

        return {
            tier: mockTier,
            tierCapabilities,
            resourceCapabilities: mockShoppingLists
        };
    },
}); 