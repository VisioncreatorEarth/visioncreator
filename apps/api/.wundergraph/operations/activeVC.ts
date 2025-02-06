import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context, user }) => {
        if (!user?.customClaims?.id) {
            return { isActive: false };
        }

        try {
            const { data, error } = await context.supabase
                .from('token_balances')
                .select('balance')
                .eq('user_id', user.customClaims.id)
                .eq('token_type', 'VCE')
                .single();

            if (error) {
                console.error('Supabase query error:', error);
                return { isActive: false };
            }

            return { isActive: (data?.balance || 0) > 0 };

        } catch (error) {
            console.error('Error checking VCE balance:', error);
            return { isActive: false };
        }
    }
}); 