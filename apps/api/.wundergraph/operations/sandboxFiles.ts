import { createOperation } from "../generated/wundergraph.factory";
import { z } from "zod";

export default createOperation.query({
    input: z.object({
        sandboxId: z.string().min(1, "Sandbox ID is required"),
        path: z.string().min(1, "Path is required")
    }),
    handler: async ({ input, context }) => {
        try {
            const sandbox = await context.sandbox.getSandboxInstance(input.sandboxId);
            const files = await sandbox.files.list(input.path);

            return {
                success: true,
                files
            };
        } catch (error) {
            console.error('❌ Error listing files:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                files: []
            };
        }
    },
});
