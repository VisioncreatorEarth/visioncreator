import { createOperation } from "../generated/wundergraph.factory";
import { z } from "zod";

export default createOperation.mutation({
    input: z.object({
        sandboxId: z.string().min(1, "Sandbox ID is required"),
        path: z.string().min(1, "Path is required"),
        content: z.string()
    }),
    handler: async ({ input, context }) => {
        try {
            console.log('Writing file:', input.path);
            const sandbox = await context.sandbox.getSandboxInstance(input.sandboxId);
            await sandbox.files.write(input.path, input.content);
            
            return {
                success: true
            };
        } catch (error) {
            console.error('❌ Error writing file:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    },
});
