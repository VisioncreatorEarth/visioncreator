import { createOperation, z } from "../generated/wundergraph.factory";
import type { Capability } from './types';

// Define the tier type explicitly
const TierType = z.enum(['free', 'homino', 'visioncreator']);
const AccessLevelType = z.enum(['read', 'write', 'owner']);

const CapabilityInput = z.object({
    type: z.enum(['TIER', 'RESOURCE']),
    name: z.string(),
    description: z.string(),
    config: z.discriminatedUnion('type', [
        z.object({
            type: z.literal('TIER'),
            tier: TierType,
            aiRequestsLimit: z.number(),
            aiRequestsUsed: z.number(),
            lastResetAt: z.string()
        }),
        z.object({
            type: z.literal('RESOURCE'),
            resourceId: z.string(),
            resourceType: z.string(),
            accessLevel: AccessLevelType
        })
    ])
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