import { createOperation } from "../generated/wundergraph.factory";
import { z } from "zod";

export default createOperation.query({
    input: z.object({
        sandboxId: z.string().min(1, "Sandbox ID is required"),
        path: z.string().min(1, "Path is required")
    }),
    requireAuthentication: true,
    rbac: {
      requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context }) => {
        try {
            console.log('Reading file:', input);
            const sandbox = await context.sandbox.getSandboxInstance(input.sandboxId);
            const content = await sandbox.files.read(input.path);
            console.log('File content length:', content?.length);
            
            return {
                success: true,
                content: content || ''
            };
        } catch (error) {
            console.error('❌ Error reading file:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                content: ''
            };
        }
    },
});
