import { createOperation, z, AuthorizationError } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        action: z.enum(['grant', 'revoke']),
        tier: z.enum(['FREE', 'HOMINIO', 'VISIONCREATOR']).nullable()
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
            FREE: { 
                minutesLimit: 5,
                isOneTime: true
            },
            HOMINIO: { 
                minutesLimit: 60,
                isOneTime: false
            },
            VISIONCREATOR: { 
                minutesLimit: 240,
                isOneTime: false
            }
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
                minutesLimit: tierConfig[input.tier].minutesLimit,
                minutesUsed: 0,
                lastResetAt: now,
                isOneTime: tierConfig[input.tier].isOneTime
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
                        description: getTierDescription(input.tier),
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

            return {
                success: true,
                message: `Successfully granted ${input.tier} tier to user`,
                capabilityId
            };
        } else {
            // Revoke action
            if (!existingCapability) {
                throw new Error('No tier capability found to revoke');
            }

            // Deactivate the capability
            const { error: updateError } = await context.supabase
                .from('capabilities')
                .update({
                    active: false,
                    config: { ...existingCapability.config, deactivatedAt: now }
                })
                .eq('id', existingCapability.id);

            if (updateError) {
                throw new Error(`Failed to revoke capability: ${updateError.message}`);
            }

            // Log the action
            await context.supabase
                .from('audit_logs')
                .insert({
                    user_id: input.userId,
                    action: 'TIER_REVOKED',
                    performed_by: user.customClaims.id,
                    capability_id: existingCapability.id,
                    capability_type: 'TIER',
                    details: `Tier capability revoked`
                });

            return { success: true };
        }
    }
});

function getTierDescription(tier: 'FREE' | 'HOMINIO' | 'VISIONCREATOR'): string {
    switch (tier) {
        case 'FREE':
            return 'Free Tier - 5 minutes per month';
        case 'HOMINIO':
            return 'Hominio Tier - 60 minutes per month';
        case 'VISIONCREATOR':
            return 'Visioncreator Tier - 240 minutes per month';
        default:
            return 'Unknown Tier';
    }
}