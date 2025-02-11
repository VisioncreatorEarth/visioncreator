// This operation checks if a user is considered "active" based on their VCE tokens
// It uses the same calculation method as getInvestmentMetrics to ensure consistency
// An active user is someone who has received VCE tokens through the official minting process

import { createOperation, z } from '../generated/wundergraph.factory';
import { TOKEN_POLICY } from '../utils/tokens';

export default createOperation.query({
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context, user }) => {
        if (!user?.customClaims?.id) {
            return { isActive: false };
        }

        try {
            // Use the same metrics calculation as getInvestmentMetrics
            const metrics = await TOKEN_POLICY.getCurrentMetrics(context);

            if (!metrics || !metrics.totalVCs) {
                return { isActive: false };
            }

            // Check if the user's ID is included in the total VCs count
            const { data: userVCs, error } = await context.supabase
                .from('token_transactions')
                .select('id')
                .eq('to_user_id', user.customClaims.id)
                .eq('token_type', 'VCE')
                .eq('transaction_type', 'mint')
                .is('from_user_id', null); // Only count direct mints

            if (error) {
                console.error('Supabase query error:', error);
                return { isActive: false };
            }

            // User is active if they have at least one VCE token according to the same
            // calculation method used in getInvestmentMetrics
            return {
                isActive: userVCs && userVCs.length > 0,
                totalVCs: metrics.totalVCs // Adding this for verification purposes
            };

        } catch (error) {
            console.error('Error checking VCE balance:', error);
            return { isActive: false };
        }
    }
}); 