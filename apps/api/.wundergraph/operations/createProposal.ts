import {
    createOperation,
    z,
    AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        title: z.string(),
        details: z.string(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({ message: "No authenticated user found." });
        }

        // Start a transaction
        const { data: transaction, error: transactionError } = await context.supabase.rpc('create_proposal_with_stake', {
            p_title: input.title,
            p_details: input.details,
            p_author: user.customClaims.id,
            p_stake_amount: 1 // Initial stake of 1 token
        });

        if (transactionError) {
            console.error("Error creating proposal with stake:", transactionError);
            throw new Error("Failed to create proposal: Insufficient tokens or transaction failed");
        }

        return {
            success: true,
            proposal: transaction.proposal,
            transaction: transaction.token_transaction
        };
    },
}); 