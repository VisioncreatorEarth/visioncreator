import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        event: z.string(),
        payload: z.any()
    }),
    handler: async ({ input, context }) => {
        try {
            const { error } = await context.supabase
                .from('polar_webhooks')
                .insert({
                    event: input.event,
                    payload: input.payload
                });

            if (error) {
                throw error;
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Error storing Polar webhook:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    },
});
