import { createOperation, z } from '../generated/wundergraph.factory';
import type { Capability } from './types';

export default createOperation.query({
    input: z.object({
        userId: z.string(),
    }),
    requireAuthentication: true,
    handler: async ({ input }): Promise<{ capabilities: Capability[] }> => {
        // Still mocked, but structured according to new unified system
        const mockCapabilities: Capability[] = [
            {
                id: 'cap-1',
                userId: input.userId,
                type: 'TIER',
                name: 'Homino Tier',
                description: 'Homino tier subscription with advanced features',
                grantedAt: new Date().toISOString(),
                grantedBy: 'system',
                active: true,
                config: {
                    tier: 'homino',
                    aiRequestsLimit: 100,
                    aiRequestsUsed: 45,
                    lastResetAt: new Date().toISOString()
                }
            },
            {
                id: 'cap-2',
                userId: input.userId,
                type: 'RESOURCE',
                name: 'Shopping List Access',
                description: 'Access to shared shopping list',
                grantedAt: new Date().toISOString(),
                grantedBy: 'user-1',
                active: true,
                config: {
                    resourceId: 'list-1',
                    resourceType: 'SHOPPING_LIST',
                    accessLevel: 'write'
                }
            }
        ];

        return { capabilities: mockCapabilities };
    },
}); 