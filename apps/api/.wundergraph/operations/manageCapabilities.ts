import { createOperation, z, AuthorizationError } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        action: z.enum(['grant', 'revoke']),
        tier: z.enum(['free', 'homino', 'visioncreator'])
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context, user }) => {
        // Check if user is authenticated and has valid ID
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({
                message: "User not authenticated or missing ID.",
            });
        }

        // Check if user has required roles
        if (!user?.customClaims?.roles?.includes("admin")) {
            throw new AuthorizationError({
                message: "User does not have required permissions.",
            });
        }

        const tierLimits = {
            free: 5,
            homino: 100,
            visioncreator: 500
        };

        // First, deactivate any existing tier capabilities
        const { error: deactivateError } = await context.supabase
            .from('capabilities')
            .update({ active: false })
            .eq('user_id', input.userId)
            .eq('type', 'TIER');

        if (deactivateError) {
            throw new Error(`Failed to deactivate existing capabilities: ${deactivateError.message}`);
        }

        if (input.action === 'revoke') {
            // Create audit trail entry for revoke action
            const { error: auditError } = await context.supabase
                .from('capability_audit_trail')
                .insert({
                    action: `${input.action.toUpperCase()}_TIER`,
                    user_id: input.userId,
                    performed_by: user.customClaims.id,
                    details: {
                        action: 'revoke',
                        timestamp: new Date().toISOString(),
                        description: 'Revoked all tier capabilities'
                    }
                });

            if (auditError) {
                throw new Error(`Failed to create audit log: ${auditError.message}`);
            }

            return { success: true };
        }

        // Insert new capability with the authenticated user's ID
        const { data: capability, error: insertError } = await context.supabase
            .from('capabilities')
            .insert({
                user_id: input.userId,
                type: 'TIER',
                name: `${input.tier} Tier`,
                description: `${input.tier} tier subscription`,
                config: {
                    type: 'TIER',
                    tier: input.tier,
                    aiRequestsLimit: tierLimits[input.tier],
                    aiRequestsUsed: 0,
                    lastResetAt: new Date().toISOString()
                },
                granted_by: user.customClaims.id,
                active: true
            })
            .select()
            .single();

        if (insertError) {
            throw new Error(`Failed to create new capability: ${insertError.message}`);
        }

        // Create audit trail entry for grant action
        const { error: auditError } = await context.supabase
            .from('capability_audit_trail')
            .insert({
                capability_id: capability.id,
                action: `${input.action.toUpperCase()}_TIER`,
                user_id: input.userId,
                performed_by: user.customClaims.id,
                details: {
                    tier: input.tier,
                    aiRequestsLimit: tierLimits[input.tier],
                    timestamp: new Date().toISOString(),
                    description: `Granted ${input.tier} tier access`,
                    previousConfig: null,
                    newConfig: capability.config
                }
            });

        if (auditError) {
            throw new Error(`Failed to create audit log: ${auditError.message}`);
        }

        return { success: true, capability };
    },
});