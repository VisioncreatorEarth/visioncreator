import { createOperation } from "../generated/wundergraph.factory";
import { z } from "zod";

export default createOperation.query({
    input: z.object({
        sandboxId: z.string().min(1, "Sandbox ID is required"),
        path: z.string().optional()
    }),
    handler: async ({ input, context }) => {
        try {
            const sandbox = await context.sandbox.getSandboxInstance(input.sandboxId);
            // Remove any existing /root/app prefix from the input path
            const cleanPath = input.path?.replace(/^\/root\/app\/?/, '') || '';
            const fullPath = cleanPath ? `/root/app/${cleanPath}` : '/root/app';
            
            console.log('📂 Listing files at path:', fullPath);
            const files = await sandbox.files.list(fullPath);

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
