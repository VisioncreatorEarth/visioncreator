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
            // Check if user has any direct VCE mints (same logic as getTotalVCs)
            const { data, error } = await context.supabase
                .from('token_transactions')
                .select('id')
                .eq('to_user_id', user.customClaims.id)
                .eq('token_type', 'VCE')
                .eq('transaction_type', 'mint')
                .is('from_user_id', null) // Only count direct mints
                .limit(1);

            if (error) {
                console.error('Supabase query error:', error);
                return { isActive: false };
            }

            // User is active if they have at least one direct VCE mint
            return { isActive: data && data.length > 0 };

        } catch (error) {
            console.error('Error checking VCE balance:', error);
            return { isActive: false };
        }
    }
}); 