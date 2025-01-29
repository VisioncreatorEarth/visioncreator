import { createOperation, z, AuthorizationError } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        amount: z.number().int().positive()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context, user }) => {
        // Check if user is authenticated and has valid ID
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({
                message: "User not authenticated or missing ID.",
            });
        }

        // Check if user has required roles
        if (!user?.customClaims?.roles?.includes("admin")) {
            throw new AuthorizationError({
                message: "User does not have required permissions.",
            });
        }

        // Create mint transaction
        const { data: transaction, error: mintError } = await context.supabase
            .from('token_transactions')
            .insert({
                transaction_type: 'mint',
                to_user_id: input.userId,
                amount: input.amount,
            })
            .select()
            .single();

        if (mintError) {
            throw new Error(`Failed to mint tokens: ${mintError.message}`);
        }

        return {
            success: true,
            message: `Successfully minted ${input.amount} tokens`,
            transaction
        };
    }
}); 