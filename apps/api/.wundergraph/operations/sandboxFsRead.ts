import { createOperation } from "../generated/wundergraph.factory";
import { z } from "zod";

export default createOperation.query({
    input: z.object({
        sandboxId: z.string().min(1, "Sandbox ID is required"),
        path: z.string().min(1, "Path is required")
    }),
    handler: async ({ input, context }) => {
        try {
            console.log('📥 sandboxFsRead: Received request:', input);
            
            const sandbox = await context.sandbox.getSandboxInstance(input.sandboxId);
            if (!sandbox) {
                console.error('❌ sandboxFsRead: No sandbox instance found for ID:', input.sandboxId);
                return {
                    success: false,
                    error: 'Sandbox instance not found',
                    content: ''
                };
            }
            
            console.log('🔗 sandboxFsRead: Got sandbox instance:', {
                sandboxId: input.sandboxId,
                path: input.path
            });
            
            try {
                // Try to read the file
                const content = await sandbox.files.read(input.path);
                
                if (!content && content !== '') {
                    console.error('❌ sandboxFsRead: No content returned for file:', input.path);
                    return {
                        success: false,
                        error: 'No content returned from file',
                        content: ''
                    };
                }
                
                console.log('✅ sandboxFsRead: Successfully read file:', {
                    path: input.path,
                    contentLength: content?.length || 0
                });
                
                return {
                    success: true,
                    content: content
                };
            } catch (readError) {
                // Check if it's a directory error
                if (readError.message?.includes('is a directory')) {
                    console.error('❌ sandboxFsRead: Path is a directory:', input.path);
                    return {
                        success: false,
                        error: 'Cannot read directory as file',
                        content: ''
                    };
                }
                
                console.error('❌ sandboxFsRead: Error reading file:', {
                    path: input.path,
                    error: readError.message,
                    stack: readError.stack
                });
                
                return {
                    success: false,
                    error: readError instanceof Error ? readError.message : String(readError),
                    content: ''
                };
            }
        } catch (error) {
            console.error('💥 sandboxFsRead: Exception in handler:', {
                error: error.message,
                stack: error.stack
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                content: ''
            };
        }
    },
});
