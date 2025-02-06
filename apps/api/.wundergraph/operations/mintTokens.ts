import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.mutation({
    input: z.object({
        userId: z.string(),
        amount: z.number().int().positive()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated");
        }

        const adminId = '00000000-0000-0000-0000-000000000001';
        const isAdmin = user.customClaims.id === adminId;

        if (!isAdmin) {
            throw new Error("Only admin can mint tokens");
        }

        // Start a transaction for VCE tokens
        const { error: vceError } = await context.supabase
            .from('token_transactions')
            .insert({
                transaction_type: 'mint',
                token_type: 'VCE',
                to_user_id: input.userId,
                amount: input.amount
            });

        if (vceError) {
            throw new Error(`Failed to mint VCE tokens: ${vceError.message}`);
        }

        let eureMessage = '';

        // If minting exactly 365 VCE tokens, mint 273 EURe tokens to admin (75% of 365 = 273.75, rounded down to 273)
        if (input.amount === 365) {
            const { error: eureError } = await context.supabase
                .from('token_transactions')
                .insert({
                    transaction_type: 'mint',
                    token_type: 'EURe',
                    to_user_id: adminId,
                    amount: 273 // Exactly 273 EURe tokens (75% of 365, rounded down)
                });

            if (eureError) {
                throw new Error(`Failed to mint EURe tokens: ${eureError.message}`);
            }

            eureMessage = ' and 273 EURe tokens to admin';
        }

        return {
            success: true,
            message: `Successfully minted ${input.amount} VCE tokens${eureMessage}`
        };
    }
}); 