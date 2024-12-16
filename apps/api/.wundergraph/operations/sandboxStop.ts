import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        sandboxId: z.string().min(1, "Sandbox ID is required")
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context }) => {
        try {
            console.log('🛑 Operation: Stopping sandbox:', input.sandboxId);
            const success = await context.sandbox.stopSandbox(input.sandboxId);

            if (!success) {
                console.error('❌ Operation: Failed to stop sandbox:', input.sandboxId);
                return {
                    success: false,
                    error: 'Failed to stop sandbox - check server logs for details'
                };
            }

            console.log('✅ Operation: Successfully stopped sandbox:', input.sandboxId);
            return {
                success: true
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Operation: Error stopping sandbox:', errorMessage);
            return {
                success: false,
                error: `Error stopping sandbox: ${errorMessage}`
            };
        }
    },
});
