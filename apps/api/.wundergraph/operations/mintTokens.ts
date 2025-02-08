import { createOperation, z } from '../generated/wundergraph.factory';
import { TOKEN_POLICY, INVESTMENT_MILESTONES } from '../utils/tokens';

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

        // Get current metrics before minting
        const totalVCsBefore = await TOKEN_POLICY.getTotalVCs(context);
        console.log('Total VCs before minting:', totalVCsBefore);

        // Calculate token amounts for investment - now supports 4 decimal places directly
        const vceAmount = TOKEN_POLICY.calculateVceTokens(totalVCsBefore);
        const eureAmount = TOKEN_POLICY.calculateAdminPoolTokens(TOKEN_POLICY.BASE_INVESTMENT_AMOUNT);

        // Create VCE token transaction for investment
        const { error: vceError } = await context.supabase
            .from('token_transactions')
            .insert({
                from_user_id: null,
                to_user_id: input.userId,
                token_type: 'VCE',
                transaction_type: 'mint',
                amount: vceAmount, // Can now use decimal values directly
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
                amount: eureAmount, // Can now use decimal values directly
                created_at: new Date().toISOString()
            });

        if (eureError) throw new Error(`Failed to mint EURe tokens: ${eureError.message}`);

        // Get new total VCs after minting
        const totalVCsAfter = await TOKEN_POLICY.getTotalVCs(context);
        console.log('Total VCs after minting:', totalVCsAfter);

        // Debug log all milestones and current total
        console.log('All milestones:', INVESTMENT_MILESTONES.map(m => m.totalVCs));
        console.log('Looking for milestone match with:', totalVCsAfter);

        // Check if we've hit a milestone exactly
        const milestone = INVESTMENT_MILESTONES.find(m => m.totalVCs === totalVCsAfter);
        console.log('Found milestone:', milestone);

        if (milestone) {
            console.log(`Milestone reached: ${milestone.totalVCs} VCs - Adding ${milestone.poolIncrease} VCE bonus to admin pool`);

            // Mint bonus VCE tokens to admin pool for reaching the milestone
            const { error: bonusError } = await context.supabase
                .from('token_transactions')
                .insert({
                    from_user_id: null,
                    to_user_id: TOKEN_POLICY.ADMIN_ACCOUNT_ID,
                    token_type: 'VCE',
                    transaction_type: 'mint',
                    amount: milestone.poolIncrease, // Can now use decimal values directly
                    created_at: new Date().toISOString()
                });

            if (bonusError) {
                console.error('Failed to mint milestone bonus to admin pool:', bonusError);
                console.error('Bonus error details:', bonusError);
            } else {
                console.log('Successfully minted milestone bonus to admin pool');
            }

            return {
                success: true,
                vceAmount,
                eureAmount,
                totalVCs: totalVCsAfter,
                milestoneBonus: milestone.poolIncrease
            };
        } else {
            console.log('No milestone matched for total VCs:', totalVCsAfter);
        }

        return {
            success: true,
            vceAmount,
            eureAmount,
            totalVCs: totalVCsAfter,
            milestoneBonus: 0
        };
    }
}); 