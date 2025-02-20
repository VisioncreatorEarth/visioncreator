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
    handler: async ({ input, context }): Promise<{ success: boolean; patchRequest: any }> => {
        try {
            // Call the appropriate database function based on the action
            const { data: result, error } = await context.supabase
                .rpc(input.action === 'approve' ? 'approve_patch_request' : 'reject_patch_request', {
                    p_patch_request_id: input.id
                });

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
                patchRequest: null
            };
        }
    }
}); 