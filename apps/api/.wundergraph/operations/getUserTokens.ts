import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
    input: z.object({
        userId: z.string()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }) => {
        // Get user's token balances for all token types
        const { data: balances, error: balanceError } = await context.supabase
            .from('token_balances')
            .select('*')
            .eq('user_id', input.userId);

        if (balanceError && balanceError.code !== 'PGRST116') { // Ignore "no rows returned" error
            throw new Error(`Failed to fetch token balances: ${balanceError.message}`);
        }

        // Get recent transactions
        const { data: transactions, error: txError } = await context.supabase
            .from('token_transactions')
            .select('*')
            .or(`to_user_id.eq.${input.userId},from_user_id.eq.${input.userId}`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (txError) {
            throw new Error(`Failed to fetch transactions: ${txError.message}`);
        }

        // Format balances by token type
        const formattedBalances = {
            VCE: balances?.find(b => b.token_type === 'VCE') || { balance: 0, staked_balance: 0 },
            EURe: balances?.find(b => b.token_type === 'EURe') || { balance: 0, staked_balance: 0 }
        };

        return {
            balances: formattedBalances,
            transactions: transactions || []
        };
    }
}); 