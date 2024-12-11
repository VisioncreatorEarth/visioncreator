import { createOperation, z, AuthorizationError } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        action: z.enum(['grant', 'revoke']),
        type: z.enum(['TIER', 'OTHER']).optional(),
        tier: z.enum(['5M', '30M', '1H', '4H', '10H']).nullable(),
        capabilityId: z.string().optional()
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
            '5M': {
                minutesLimit: 5,
                isOneTime: true
            },
            '30M': {
                minutesLimit: 30,
                isOneTime: false
            },
            '1H': {
                minutesLimit: 60,
                isOneTime: false
            },
            '4H': {
                minutesLimit: 240,
                isOneTime: false
            },
            '10H': {
                minutesLimit: 600,
                isOneTime: false
            }
        };

        // Get the current tier capability for this user
        const { data: existingCapability, error: fetchError } = await context.supabase
            .from('capabilities')
            .select('*')
            .eq('user_id', input.userId)
            .eq('type', input.action === 'grant' ? 'TIER' : input.type)
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
            console.log('Attempting to revoke capability:', {
                userId: input.userId,
                type: input.type,
                tier: input.tier
            });

            // Deactivate the capability directly using the input
            const { error: updateError } = await context.supabase
                .from('capabilities')
                .update({
                    active: false,
                    config: { deactivatedAt: now }
                })
                .eq('user_id', input.userId)
                .eq('id', input.capabilityId);

            if (updateError) {
                console.error('Failed to revoke capability:', updateError);
                throw new Error(`Failed to revoke capability: ${updateError.message}`);
            }

            return { success: true };
        }
    }
});

function getTierDescription(tier: '5M' | '30M' | '1H' | '4H' | '10H'): string {
    switch (tier) {
        case '5M':
            return '5 Minutes Trial';
        case '30M':
            return '30 Minutes Monthly';
        case '1H':
            return '1 Hour Monthly';
        case '4H':
            return '4 Hours Monthly';
        case '10H':
            return '10 Hours Monthly';
        default:
            return 'Unknown Tier';
    }
}