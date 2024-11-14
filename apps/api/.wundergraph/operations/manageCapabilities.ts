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

        const now = new Date().toISOString();
        const tierConfig = {
            free: { aiRequestsLimit: 5 },
            homino: { aiRequestsLimit: 100 },
            visioncreator: { aiRequestsLimit: 500 }
        };

        // Get the current tier capability for this user
        const { data: existingCapability, error: fetchError } = await context.supabase
            .from('capabilities')
            .select('*')
            .eq('user_id', input.userId)
            .eq('type', 'TIER')
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows returned" error
            throw new Error(`Failed to fetch existing capability: ${fetchError.message}`);
        }

        if (input.action === 'grant') {
            const newConfig = {
                tier: input.tier,
                type: 'TIER',
                lastResetAt: now,
                aiRequestsUsed: 0,
                aiRequestsLimit: tierConfig[input.tier].aiRequestsLimit
            };

            let capabilityId: string;

            if (existingCapability) {
                // Update existing capability
                const { error: updateError } = await context.supabase
                    .from('capabilities')
                    .update({
                        config: newConfig,
                        granted_at: now,
                        granted_by: user.customClaims.id,
                        active: true
                    })
                    .eq('id', existingCapability.id);

                if (updateError) {
                    throw new Error(`Failed to update capability: ${updateError.message}`);
                }

                capabilityId = existingCapability.id;
            } else {
                // Create new capability
                const { data: newCapability, error: insertError } = await context.supabase
                    .from('capabilities')
                    .insert({
                        user_id: input.userId,
                        type: 'TIER',
                        name: `${input.tier} Tier`,
                        description: `${input.tier} tier subscription`,
                        config: newConfig,
                        granted_at: now,
                        granted_by: user.customClaims.id,
                        active: true
                    })
                    .select()
                    .single();

                if (insertError || !newCapability) {
                    throw new Error(`Failed to create capability: ${insertError?.message}`);
                }

                capabilityId = newCapability.id;
            }

            // Create audit log
            await context.supabase.from('capability_audit_trail').insert({
                user_id: input.userId,
                performed_by: user.customClaims.id,
                capability_id: capabilityId,
                action: 'GRANT_TIER',
                details: {
                    tier: input.tier,
                    timestamp: now,
                    description: existingCapability 
                        ? `Changed tier to ${input.tier}`
                        : `Granted ${input.tier} tier`,
                    previousConfig: existingCapability?.config || null,
                    newConfig,
                    aiRequestsLimit: tierConfig[input.tier].aiRequestsLimit
                }
            });
        } else if (input.action === 'revoke' && existingCapability) {
            // Deactivate the capability
            const { error: updateError } = await context.supabase
                .from('capabilities')
                .update({ active: false })
                .eq('id', existingCapability.id);

            if (updateError) {
                throw new Error(`Failed to revoke capability: ${updateError.message}`);
            }

            // Create audit log
            await context.supabase.from('capability_audit_trail').insert({
                user_id: input.userId,
                performed_by: user.customClaims.id,
                capability_id: existingCapability.id,
                action: 'REVOKE_TIER',
                details: {
                    tier: existingCapability.config.tier,
                    timestamp: now,
                    description: `Revoked ${existingCapability.config.tier} tier`,
                    previousConfig: existingCapability.config,
                    aiRequestsLimit: 0
                }
            });
        }

        return { success: true };
    }
});