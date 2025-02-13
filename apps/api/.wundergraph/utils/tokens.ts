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
    tokenPrice: number;    // Token price in EUR
}

// Investment milestones with Fibonacci sequence progression
export const INVESTMENT_MILESTONES: Milestone[] = [
    { milestone: 1, totalVCs: 1, newVCs: 1, vcePerInvestment: 365.000, poolIncrease: 110, tokenPrice: 1.00 },
    { milestone: 2, totalVCs: 2, newVCs: 1, vcePerInvestment: 365.000, poolIncrease: 110, tokenPrice: 1.00 },
    { milestone: 3, totalVCs: 3, newVCs: 1, vcePerInvestment: 365.000, poolIncrease: 110, tokenPrice: 1.00 },
    { milestone: 4, totalVCs: 5, newVCs: 2, vcePerInvestment: 25.000, poolIncrease: 15, tokenPrice: 14.60 },
    { milestone: 5, totalVCs: 8, newVCs: 3, vcePerInvestment: 20.000, poolIncrease: 18, tokenPrice: 18.25 },
    { milestone: 6, totalVCs: 13, newVCs: 5, vcePerInvestment: 18.000, poolIncrease: 27, tokenPrice: 20.28 },
    { milestone: 7, totalVCs: 21, newVCs: 8, vcePerInvestment: 12.500, poolIncrease: 30, tokenPrice: 29.20 },
    { milestone: 8, totalVCs: 34, newVCs: 13, vcePerInvestment: 9.615, poolIncrease: 38, tokenPrice: 37.96 },
    { milestone: 9, totalVCs: 55, newVCs: 21, vcePerInvestment: 7.143, poolIncrease: 45, tokenPrice: 51.10 },
    { milestone: 10, totalVCs: 89, newVCs: 34, vcePerInvestment: 6.471, poolIncrease: 66, tokenPrice: 56.41 },
    { milestone: 11, totalVCs: 144, newVCs: 55, vcePerInvestment: 5.818, poolIncrease: 96, tokenPrice: 62.73 },
    { milestone: 12, totalVCs: 233, newVCs: 89, vcePerInvestment: 4.261, poolIncrease: 114, tokenPrice: 85.67 },
    { milestone: 13, totalVCs: 377, newVCs: 144, vcePerInvestment: 3.121, poolIncrease: 135, tokenPrice: 116.97 },
    { milestone: 14, totalVCs: 610, newVCs: 233, vcePerInvestment: 2.285, poolIncrease: 160, tokenPrice: 159.71 },
    { milestone: 15, totalVCs: 987, newVCs: 377, vcePerInvestment: 1.674, poolIncrease: 189, tokenPrice: 218.08 },
    { milestone: 16, totalVCs: 1597, newVCs: 610, vcePerInvestment: 1.226, poolIncrease: 224, tokenPrice: 297.77 },
    { milestone: 17, totalVCs: 2584, newVCs: 987, vcePerInvestment: 0.898, poolIncrease: 266, tokenPrice: 406.58 },
    { milestone: 18, totalVCs: 4181, newVCs: 1597, vcePerInvestment: 0.657, poolIncrease: 315, tokenPrice: 555.16 },
    { milestone: 19, totalVCs: 6765, newVCs: 2584, vcePerInvestment: 0.482, poolIncrease: 373, tokenPrice: 758.03 },
    { milestone: 20, totalVCs: 10946, newVCs: 4181, vcePerInvestment: 0.353, poolIncrease: 442, tokenPrice: 1035.04 },
    { milestone: 21, totalVCs: 17711, newVCs: 6765, vcePerInvestment: 0.263, poolIncrease: 534, tokenPrice: 1386.38 },
    { milestone: 22, totalVCs: 28657, newVCs: 10946, vcePerInvestment: 0.197, poolIncrease: 645, tokenPrice: 1856.98 },
    { milestone: 23, totalVCs: 46368, newVCs: 17711, vcePerInvestment: 0.147, poolIncrease: 780, tokenPrice: 2487.32 },
    { milestone: 24, totalVCs: 75025, newVCs: 28657, vcePerInvestment: 0.110, poolIncrease: 942, tokenPrice: 3331.62 },
    { milestone: 25, totalVCs: 121393, newVCs: 46368, vcePerInvestment: 0.082, poolIncrease: 1138, tokenPrice: 4462.51 },
    { milestone: 26, totalVCs: 196418, newVCs: 75025, vcePerInvestment: 0.061, poolIncrease: 1374, tokenPrice: 5977.28 },
    { milestone: 27, totalVCs: 317811, newVCs: 121393, vcePerInvestment: 0.046, poolIncrease: 1660, tokenPrice: 8006.23 },
    { milestone: 28, totalVCs: 514229, newVCs: 196418, vcePerInvestment: 0.034, poolIncrease: 2006, tokenPrice: 10723.89 },
    { milestone: 29, totalVCs: 832040, newVCs: 317811, vcePerInvestment: 0.025, poolIncrease: 2423, tokenPrice: 14364.04 },
    { milestone: 30, totalVCs: 1346269, newVCs: 514229, vcePerInvestment: 0.019, poolIncrease: 2927, tokenPrice: 19239.82 }
];

export const TOKEN_POLICY = {
    // Base configuration
    ADMIN_POOL_PERCENTAGE: 0.75,
    ADMIN_ACCOUNT_ID: '00000000-0000-0000-0000-000000000001',
    BASE_INVESTMENT_AMOUNT: 365,

    // Get current milestone based on total VCs
    getCurrentMilestone(totalVCs: number): Milestone {

        // For first 3 milestones with fixed price
        if (totalVCs <= 3) {
            for (const milestone of INVESTMENT_MILESTONES) {
                if (totalVCs <= milestone.totalVCs) {
                    return milestone;
                }
            }
        }

        // For all other milestones
        for (let i = 3; i < INVESTMENT_MILESTONES.length; i++) {
            const currentMilestone = INVESTMENT_MILESTONES[i];
            const previousMilestone = INVESTMENT_MILESTONES[i - 1];


            if (totalVCs > previousMilestone.totalVCs && totalVCs <= currentMilestone.totalVCs) {
                return currentMilestone;
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

    // Calculate token price for display (using current milestone's price)
    calculateTokenPrice: (totalVCs: number): number => {
        // Use getCurrentMilestone instead of getNextInvestorRate
        // because we want the current price, not the next investment's price
        const milestone = TOKEN_POLICY.getCurrentMilestone(totalVCs);
        return milestone.tokenPrice;
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