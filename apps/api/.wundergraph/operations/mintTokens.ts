import { createOperation, z } from '../generated/wundergraph.factory';
import { TOKEN_POLICY } from '../utils/tokens';

export default createOperation.mutation({
    input: z.object({
        userId: z.string()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id || user.customClaims.id !== TOKEN_POLICY.ADMIN_ACCOUNT_ID) {
            throw new Error("Only admin can mint tokens");
        }

        // Check if user is eligible (hasn't invested before)
        const isEligible = await TOKEN_POLICY.isEligibleForInvestment(context, input.userId);
        if (!isEligible) {
            throw new Error("User has already invested");
        }

        // Get current metrics
        const totalVCs = await TOKEN_POLICY.getTotalVCs(context);

        // Calculate token amounts
        const vceAmount = TOKEN_POLICY.calculateVceTokens(totalVCs);
        const eureAmount = TOKEN_POLICY.calculateAdminPoolTokens(TOKEN_POLICY.BASE_INVESTMENT_AMOUNT);

        // Create VCE token transaction
        const { error: vceError } = await context.supabase
            .from('token_transactions')
            .insert({
                from_user_id: null,
                to_user_id: input.userId,
                token_type: 'VCE',
                transaction_type: 'mint',
                amount: vceAmount,
                created_at: new Date().toISOString()
            });

        if (vceError) throw new Error(`Failed to mint VCE tokens: ${vceError.message}`);

        // Mint EURe tokens to admin pool
        const { error: eureError } = await context.supabase
            .from('token_transactions')
            .insert({
                from_user_id: null,
                to_user_id: TOKEN_POLICY.ADMIN_ACCOUNT_ID,
                token_type: 'EURe',
                transaction_type: 'mint',
                amount: eureAmount,
                created_at: new Date().toISOString()
            });

        if (eureError) throw new Error(`Failed to mint EURe tokens: ${eureError.message}`);

        return {
            success: true,
            vceAmount,
            eureAmount,
            totalVCs: totalVCs + 1
        };
    }
}); 