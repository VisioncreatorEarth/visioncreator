import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({}),
    handler: async ({ context }) => {
        try {
            console.log('🚀 Starting SvelteKit sandbox...');
            const sandbox = await context.sandbox.startSandbox();
            console.log('✅ Sandbox started:', sandbox);

            return {
                success: true,
                sandboxId: sandbox.id,
                status: sandbox.status,
                url: sandbox.url // Include the URL in the response
            };
        } catch (error) {
            console.error('❌ Error starting sandbox:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
});
