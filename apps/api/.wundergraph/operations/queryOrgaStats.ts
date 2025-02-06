import { createOperation, z } from '../generated/wundergraph.factory';

// Fibonacci sequence and corresponding prices
const vcPriceMap = new Map([
    [1, 1.00],
    [2, 1.00],
    [3, 1.00],
    [5, 14.60],
    [8, 18.25],
    [13, 20.28],
    [21, 29.20],
    [34, 37.96],
    [55, 51.10],
    [89, 56.41],
    [144, 62.73],
    [233, 85.67],
    [377, 116.97],
    [610, 159.71],
    [987, 218.08],
    [1597, 297.77],
    [2584, 406.58],
    [4181, 555.16],
    [6765, 758.03],
    [10946, 1035.04]
]);

// Helper function to find the closest Fibonacci number and its price
function getTokenPrice(activeVCs: number): number {
    // If less than or equal to first tier, return base price
    if (activeVCs <= 3) return 1.00;

    // Convert map to array for easier manipulation
    const vcPrices = Array.from(vcPriceMap.entries());

    // Find the closest Fibonacci number that's less than or equal to activeVCs
    for (let i = vcPrices.length - 1; i >= 0; i--) {
        if (activeVCs >= vcPrices[i][0]) {
            return vcPrices[i][1];
        }
    }

    // If we exceed the last tier, return the highest price
    return vcPrices[vcPrices.length - 1][1];
}

export default createOperation.query({
    handler: async ({ context }) => {
        // Get count of users with positive token balance
        const { data: activeVCs, error } = await context.supabase
            .from('token_balances')
            .select('user_id, balance')
            .gt('balance', 0);

        if (error) {
            throw new Error(`Failed to fetch organization stats: ${error.message}`);
        }

        // Calculate total active Visioncreators
        const totalActiveVCs = activeVCs?.length || 0;

        // Calculate current token price based on active VCs
        const currentTokenPrice = getTokenPrice(totalActiveVCs);

        // Calculate pools and revenue
        const ccpPool = Math.floor(totalActiveVCs * 365 * 0.75); // Yearly contribution pool
        const monthlyRevenue = Math.floor(totalActiveVCs * 365); // Monthly recurring revenue
        const totalTokens = activeVCs?.reduce((sum, vc) => sum + Number(vc.balance || 0), 0) || 0;

        return {
            totalActiveVCs,
            ccpPool,
            monthlyRevenue,
            totalTokens,
            currentTokenPrice,
            updatedAt: new Date().toISOString()
        };
    }
}); 