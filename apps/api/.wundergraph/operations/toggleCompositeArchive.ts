import { createOperation, z } from '../generated/wundergraph.factory';

/**
 * Operation to toggle the archive status of a composite.
 * This operation calls the toggle_composite_archive_status database function.
 */
export default createOperation.mutation({
    input: z.object({
        compositeId: z.string().uuid(),
        archive: z.boolean(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated or missing ID");
        }

        try {
            // Call the database function to toggle archive status
            const { data, error } = await context.supabase.rpc('toggle_composite_archive_status', {
                p_user_id: user.customClaims.id,
                p_composite_id: input.compositeId,
                p_archive: input.archive
            });

            if (error) {
                console.error('[toggleCompositeArchive] Error:', error);
                return {
                    success: false,
                    error: error.message,
                    details: error.details
                };
            }

            return data;
        } catch (error) {
            console.error('[toggleCompositeArchive] Unexpected error:', error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    },
});
