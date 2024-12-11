import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        productPriceId: z.string(),
        successUrl: z.string(),
        customerEmail: z.string().optional(),
        customerName: z.string().optional(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        try {
            const checkout = await context.polar.checkouts.custom.create({
                productPriceId: input.productPriceId,
                successUrl: input.successUrl,
                customerEmail: input.customerEmail,
                customerName: input.customerName,
                metadata: {
                    userId: user.customClaims?.id
                }
            });

            return {
                success: true,
                checkoutUrl: checkout.url,
            };
        } catch (error) {
            console.error("Error creating Polar checkout:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
