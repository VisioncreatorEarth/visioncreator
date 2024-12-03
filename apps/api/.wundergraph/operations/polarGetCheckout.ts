import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
    input: z.object({
        checkoutId: z.string(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }) => {
        try {
            const checkout = await context.polar.checkouts.custom.get({
                id: input.checkoutId
            });

            return {
                success: true,
                status: checkout.status,
                metadata: checkout.metadata,
            };
        } catch (error) {
            console.error("Error fetching Polar checkout:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
