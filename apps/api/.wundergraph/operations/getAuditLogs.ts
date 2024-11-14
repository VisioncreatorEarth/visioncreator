import { createOperation, z } from '../generated/wundergraph.factory';
import type { AuditLog } from './types';

export default createOperation.query({
    input: z.object({
        userId: z.string(),
        limit: z.number().optional(),
        offset: z.number().optional(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ context, input }): Promise<{ logs: AuditLog[] }> => {
        const { data: auditLogs, error } = await context.supabase
            .from('capability_audit_trail')
            .select(`
                id,
                timestamp,
                action,
                user_id,
                performed_by,
                capability_id,
                details,
                capabilities!capability_id (
                    type
                ),
                performer:profiles!capability_audit_trail_performed_by_fkey (
                    name
                )
            `)
            .eq('user_id', input.userId)
            .order('timestamp', { ascending: false })
            .limit(input.limit || 50);

        if (error) {
            throw new Error(`Failed to fetch audit logs: ${error.message}`);
        }

        return {
            logs: (auditLogs || []).map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                action: log.action,
                userId: log.user_id,
                details: typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details),
                performedBy: log.performer?.name || 'System',
                capabilityId: log.capability_id,
                capabilityType: log.capabilities?.type || 'UNKNOWN'
            }))
        };
    },
});