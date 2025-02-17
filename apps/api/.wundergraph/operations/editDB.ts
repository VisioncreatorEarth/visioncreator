import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        id: z.string().uuid(),
        json: z.any(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }) => {
        try {
            // Start a transaction
            const { data: result, error } = await context.supabase.rpc('update_db_version', {
                p_id: input.id,
                p_json: input.json
            });

            if (error) throw error;

            return {
                success: true,
                updatedData: result
            };
        } catch (error) {
            console.error("Error in editDB:", error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    },
}); 