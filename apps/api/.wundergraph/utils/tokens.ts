/**
 * Token Policy Configuration
 * Manages investment rounds, token distribution, and pricing based on Fibonacci sequence
 * 
 * Investment amount is always fixed at 365€
 * What changes is how many VCE tokens you get for this investment
 * The token price is then derived from: 365€ / number of tokens
 */

interface Milestone {
    milestone: number;      // Milestone number (1-30)
    totalVCs: number;      // Total VCs at this milestone
    newVCs: number;        // New VCs in this milestone
    vcePerInvestment: number;  // VCE tokens per investment
    poolIncrease: number;  // Pool increase percentage
}

// Investment milestones with Fibonacci sequence progression
export const INVESTMENT_MILESTONES: Milestone[] = [
    { milestone: 1, totalVCs: 1, newVCs: 1, vcePerInvestment: 365.000, poolIncrease: 110 },
    { milestone: 2, totalVCs: 2, newVCs: 1, vcePerInvestment: 365.000, poolIncrease: 110 },
    { milestone: 3, totalVCs: 3, newVCs: 1, vcePerInvestment: 365.000, poolIncrease: 110 },
    { milestone: 4, totalVCs: 5, newVCs: 2, vcePerInvestment: 25.000, poolIncrease: 15 },
    { milestone: 5, totalVCs: 8, newVCs: 3, vcePerInvestment: 20.000, poolIncrease: 18 },
    { milestone: 6, totalVCs: 13, newVCs: 5, vcePerInvestment: 18.000, poolIncrease: 27 },
    { milestone: 7, totalVCs: 21, newVCs: 8, vcePerInvestment: 12.500, poolIncrease: 30 },
    { milestone: 8, totalVCs: 34, newVCs: 13, vcePerInvestment: 9.615, poolIncrease: 38 },
    { milestone: 9, totalVCs: 55, newVCs: 21, vcePerInvestment: 7.143, poolIncrease: 45 },
    { milestone: 10, totalVCs: 89, newVCs: 34, vcePerInvestment: 6.471, poolIncrease: 66 },
    { milestone: 11, totalVCs: 144, newVCs: 55, vcePerInvestment: 5.818, poolIncrease: 96 },
    { milestone: 12, totalVCs: 233, newVCs: 89, vcePerInvestment: 4.261, poolIncrease: 114 },
    { milestone: 13, totalVCs: 377, newVCs: 144, vcePerInvestment: 3.121, poolIncrease: 135 },
    { milestone: 14, totalVCs: 610, newVCs: 233, vcePerInvestment: 2.285, poolIncrease: 160 },
    { milestone: 15, totalVCs: 987, newVCs: 377, vcePerInvestment: 1.674, poolIncrease: 189 },
    { milestone: 16, totalVCs: 1597, newVCs: 610, vcePerInvestment: 1.226, poolIncrease: 224 },
    { milestone: 17, totalVCs: 2584, newVCs: 987, vcePerInvestment: 0.898, poolIncrease: 266 },
    { milestone: 18, totalVCs: 4181, newVCs: 1597, vcePerInvestment: 0.657, poolIncrease: 315 },
    { milestone: 19, totalVCs: 6765, newVCs: 2584, vcePerInvestment: 0.482, poolIncrease: 373 },
    { milestone: 20, totalVCs: 10946, newVCs: 4181, vcePerInvestment: 0.353, poolIncrease: 442 },
    { milestone: 21, totalVCs: 17711, newVCs: 6765, vcePerInvestment: 0.263, poolIncrease: 534 },
    { milestone: 22, totalVCs: 28657, newVCs: 10946, vcePerInvestment: 0.197, poolIncrease: 645 },
    { milestone: 23, totalVCs: 46368, newVCs: 17711, vcePerInvestment: 0.147, poolIncrease: 780 },
    { milestone: 24, totalVCs: 75025, newVCs: 28657, vcePerInvestment: 0.110, poolIncrease: 942 },
    { milestone: 25, totalVCs: 121393, newVCs: 46368, vcePerInvestment: 0.082, poolIncrease: 1138 },
    { milestone: 26, totalVCs: 196418, newVCs: 75025, vcePerInvestment: 0.061, poolIncrease: 1374 },
    { milestone: 27, totalVCs: 317811, newVCs: 121393, vcePerInvestment: 0.046, poolIncrease: 1660 },
    { milestone: 28, totalVCs: 514229, newVCs: 196418, vcePerInvestment: 0.034, poolIncrease: 2006 },
    { milestone: 29, totalVCs: 832040, newVCs: 317811, vcePerInvestment: 0.025, poolIncrease: 2423 },
    { milestone: 30, totalVCs: 1346269, newVCs: 514229, vcePerInvestment: 0.019, poolIncrease: 2927 }
];

export const TOKEN_POLICY = {
    // Base configuration
    ADMIN_POOL_PERCENTAGE: 0.75,
    ADMIN_ACCOUNT_ID: '00000000-0000-0000-0000-000000000001',
    BASE_INVESTMENT_AMOUNT: 365,

    // Get current milestone based on total VCs
    getCurrentMilestone(totalVCs: number): Milestone {
        for (const milestone of INVESTMENT_MILESTONES) {
            if (totalVCs <= milestone.totalVCs) {
                return milestone;
            }
        }
        return INVESTMENT_MILESTONES[INVESTMENT_MILESTONES.length - 1];
    },

    // Get next milestone rate for the next investor
    getNextInvestorRate(totalVCs: number): Milestone {
        const nextVC = totalVCs + 1;
        for (const milestone of INVESTMENT_MILESTONES) {
            if (nextVC <= milestone.totalVCs) {
                return milestone;
            }
        }
        return INVESTMENT_MILESTONES[INVESTMENT_MILESTONES.length - 1];
    },

    // Calculate VCE tokens for new investor
    calculateVceTokens(totalVCs: number): number {
        const nextMilestone = this.getNextInvestorRate(totalVCs);
        return nextMilestone.vcePerInvestment;
    },

    // Calculate token price for display (derived from investment amount and tokens received)
    calculateTokenPrice: (totalVCs: number): number => {
        const vceAmount = TOKEN_POLICY.calculateVceTokens(totalVCs);
        return TOKEN_POLICY.BASE_INVESTMENT_AMOUNT / vceAmount;
    },

    // Calculate EURe tokens for admin pool (renamed for clarity)
    calculateAdminPoolTokens: (investmentAmount: number): number => {
        return Math.floor(investmentAmount * TOKEN_POLICY.ADMIN_POOL_PERCENTAGE);
    },

    // Check if user is eligible for investment (hasn't invested before)
    async isEligibleForInvestment(context: any, userId: string): Promise<boolean> {
        if (!userId) return false;

        const { data } = await context.supabase
            .from('token_transactions')
            .select('id')
            .eq('to_user_id', userId)
            .eq('token_type', 'VCE')
            .eq('transaction_type', 'mint')
            .limit(1);

        const isEligible = !data || data.length === 0;
        console.log('User:', userId, 'Eligibility check:', isEligible, 'Existing transactions:', data?.length || 0);
        return isEligible;
    },

    // Get total number of VCs (users who have received VCE tokens)
    async getTotalVCs(context: any): Promise<number> {
        const { count } = await context.supabase
            .from('token_transactions')
            .select('to_user_id', { count: 'exact', distinct: true })
            .eq('token_type', 'VCE')
            .eq('transaction_type', 'mint')
            .neq('to_user_id', TOKEN_POLICY.ADMIN_ACCOUNT_ID) // Exclude admin account
            .is('from_user_id', null); // Only count direct mints (not transfers)

        return count || 0;
    },

    // Get investment metrics for current state
    async getCurrentMetrics(context: any): Promise<{
        totalVCs: number;
        currentMilestone: Milestone;
        nextInvestorRate: Milestone;
        nextMilestone: Milestone | null;
        progress: number;
    }> {
        const totalVCs = await TOKEN_POLICY.getTotalVCs(context);

        const currentMilestone = TOKEN_POLICY.getCurrentMilestone(totalVCs);
        const nextInvestorRate = TOKEN_POLICY.getNextInvestorRate(totalVCs);

        const nextMilestoneIndex = INVESTMENT_MILESTONES.indexOf(currentMilestone) + 1;
        const nextMilestone = INVESTMENT_MILESTONES[nextMilestoneIndex] || null;

        return {
            totalVCs,
            currentMilestone,
            nextInvestorRate,
            nextMilestone,
            progress: nextMilestone
                ? Math.max(0, ((totalVCs - currentMilestone.totalVCs) / (nextMilestone.totalVCs - currentMilestone.totalVCs)) * 100)
                : 100
        };
    }
}; 