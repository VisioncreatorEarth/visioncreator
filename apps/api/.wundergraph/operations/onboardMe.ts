import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.mutation({
    input: z.object({
        name: z.string().optional(),
        inviter: z.string().uuid().optional()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ['authenticated'],
    },
    handler: async ({ user, input, operations, context }) => {
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({ message: 'No authenticated user found.' });
        }

        // Check if user already has a name
        const { data: profile } = await context.supabase
            .from("profiles")
            .select("name")
            .eq("id", user.customClaims.id)
            .single();

        // Only update name if user doesn't have one or if a new name is provided
        if (!profile?.name || input.name) {
            const updateResult = await operations.mutate({
                operationName: 'updateMe',
                input: { name: input.name || '' }
            });

            if (!updateResult.data) {
                console.error('Error updating name:', updateResult.error);
                return { success: false, message: "Failed to update name" };
            }
        }

        // Check for existing invite before creating a new one
        if (input.inviter) {
            const { data: existingInvite } = await context.supabase
                .from('invites')
                .select()
                .match({ invitee: user.customClaims.id })
                .single();

            if (!existingInvite) {
                const createInviteResult = await operations.mutate({
                    operationName: 'createInvite',
                    input: { inviter: input.inviter }
                });

                if (!createInviteResult.data) {
                    console.error('Error creating invite:', createInviteResult.error);
                    return { success: false, message: "Failed to create invite" };
                }
            }
        }

        return { success: true };
    }
});
