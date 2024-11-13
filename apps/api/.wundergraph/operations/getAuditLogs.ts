import { createOperation, z } from '../generated/wundergraph.factory';
import type { AuditLog } from './types';

export default createOperation.query({
    input: z.object({
        userId: z.string(),
        limit: z.number().optional(),
        offset: z.number().optional(),
    }),
    requireAuthentication: true,
    handler: async ({ input }): Promise<{ logs: AuditLog[] }> => {
        const mockLogs: AuditLog[] = [
            {
                id: 'audit-1',
                timestamp: new Date().toISOString(),
                action: 'GRANT_TIER',
                userId: input.userId,
                details: 'Granted Homino tier access',
                performedBy: 'admin@example.com',
                capabilityId: 'tier-1',
                capabilityType: 'TIER'
            },
            {
                id: 'audit-2',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                action: 'GRANT_RESOURCE',
                userId: input.userId,
                details: 'Granted write access to Shopping List "Groceries"',
                performedBy: 'owner@example.com',
                capabilityId: 'res-1',
                capabilityType: 'RESOURCE'
            }
        ];

        return {
            logs: mockLogs
        };
    },
}); 