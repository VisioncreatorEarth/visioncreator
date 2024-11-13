import { createOperation, z } from "../generated/wundergraph.factory";
import type { Capability } from './types';

const CapabilityInput = z.object({
    type: z.enum(['TIER', 'RESOURCE']),
    name: z.string(),
    description: z.string(),
    config: z.object({
        // Tier specific
        tier: z.enum(['free', 'homino', 'visioncreator']).optional(),
        // Resource specific
        resourceId: z.string().optional(),
        resourceType: z.string().optional(),
        accessLevel: z.enum(['read', 'write', 'owner']).optional(),
    })
});

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        action: z.enum(['grant', 'revoke']),
        capability: CapabilityInput
    }),
    requireAuthentication: true,
    handler: async ({ input, user }) => {
        const timestamp = new Date().toISOString();
        const capabilityId = `cap-${Date.now()}`;

        const capability: Capability = {
            id: capabilityId,
            userId: input.userId,
            type: input.capability.type,
            name: input.capability.name,
            description: input.capability.description,
            grantedAt: timestamp,
            grantedBy: user?.email || 'system',
            active: input.action === 'grant',
            config: input.capability.config
        };

        return {
            success: true,
            capability
        };
    },
}); 