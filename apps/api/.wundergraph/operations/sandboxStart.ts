import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        code: z.string()
    }),
    handler: async ({ input, context }) => {
        try {
            console.log('🚀 Creating new sandbox...');
            const sandbox = await context.sandbox.createSandbox();
            console.log('✅ Sandbox created');

            console.log('🏃 Running code in sandbox:', input.code);
            const result = await context.sandbox.runCode(sandbox, input.code);
            console.log('Code execution result:', result);

            return {
                success: true,
                output: result.output,
                error: result.error
            };
        } catch (error) {
            console.error('❌ Error in sandbox operation:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
