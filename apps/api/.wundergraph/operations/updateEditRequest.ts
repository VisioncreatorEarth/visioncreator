import { createOperation, z } from '../generated/wundergraph.factory';

// Define the input schema for the edit request update
const EditRequestInput = z.object({
    id: z.string(),
    proposalId: z.string(),
    title: z.string(),
    description: z.string(),
    changes: z.object({
        content: z.string().optional(),
        schema: z.any().optional(),
        instance: z.any().optional()
    }),
    previousVersion: z.object({
        content: z.string().optional(),
        schema: z.any().optional(),
        instance: z.any().optional()
    })
});

export default createOperation.mutation({
    input: z.object({
        id: z.string(),
        action: z.enum(['approve', 'reject'])
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }): Promise<{ success: boolean; patchRequest: any; message?: string }> => {
        try {
            if (!user?.customClaims?.id) {
                throw new Error("User not authenticated or missing ID");
            }

            const userId = user.customClaims.id;

            // Call the appropriate database function based on the action
            let result;
            let error;

            if (input.action === 'approve') {
                // For approve, pass the user ID to check permissions
                const response = await context.supabase
                    .rpc('approve_patch_request', {
                        p_patch_request_id: input.id,
                        p_user_id: userId
                    });
                result = response.data;
                error = response.error;
            } else {
                // For reject, we also need to pass the user ID for permission check
                const response = await context.supabase
                    .rpc('reject_patch_request', {
                        p_patch_request_id: input.id,
                        p_user_id: userId
                    });
                result = response.data;
                error = response.error;
            }

            if (error) {
                console.error(`Error ${input.action}ing patch request:`, error);
                throw new Error(`Failed to ${input.action} patch request: ${error.message}`);
            }

            return {
                success: true,
                patchRequest: result
            };
        } catch (error) {
            console.error(`Unexpected error ${input.action}ing patch request:`, error);
            return {
                success: false,
                patchRequest: null,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }
}); 