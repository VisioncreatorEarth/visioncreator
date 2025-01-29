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
        // Get user's token balance
        const { data: balance, error: balanceError } = await context.supabase
            .from('token_balances')
            .select('*')
            .eq('user_id', input.userId)
            .single();

        if (balanceError && balanceError.code !== 'PGRST116') { // Ignore "no rows returned" error
            throw new Error(`Failed to fetch token balance: ${balanceError.message}`);
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

        return {
            balance: balance || { balance: 0, staked_balance: 0 },
            transactions: transactions || []
        };
    }
}); 