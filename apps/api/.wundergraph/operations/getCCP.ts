import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context, operations }) => {
        try {
            // Get stats using the same operation as other components
            const { data: stats } = await operations.query({
                operationName: 'queryOrgaStats'
            });

            if (!stats) {
                console.error('Error fetching orga stats');
                return { total: 0, distribution: { eure: 0, vce: 0 } };
            }

            // Use the token price from stats
            const vcePrice = stats.currentTokenPrice || 1.0;

            // Get token balances
            const { data: tokenData, error: tokenError } = await context.supabase
                .from('token_balances')
                .select('token_type, balance')
                .eq('user_id', '00000000-0000-0000-0000-000000000001')
                .in('token_type', ['EURe', 'VCE']);

            if (tokenError) {
                console.error('Error fetching CCP balances:', tokenError);
                return { total: 0, distribution: { eure: 0, vce: 0 } };
            }

            const eureBalance = Number(tokenData?.find(t => t.token_type === 'EURe')?.balance || 0);
            const vceBalance = Number(tokenData?.find(t => t.token_type === 'VCE')?.balance || 0);

            const vceValue = vceBalance * vcePrice;
            const totalValue = eureBalance + vceValue;

            return {
                total: totalValue,
                distribution: {
                    eure: totalValue > 0 ? (eureBalance / totalValue) * 100 : 0,
                    vce: totalValue > 0 ? (vceValue / totalValue) * 100 : 0
                }
            };
        } catch (error) {
            console.error('Error calculating CCP:', error);
            return { total: 0, distribution: { eure: 0, vce: 0 } };
        }
    }
}); 