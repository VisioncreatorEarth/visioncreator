import { createOperation } from '../generated/wundergraph.factory';
import { TOKEN_POLICY, INVESTMENT_MILESTONES } from '../utils/tokens';

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context }) => {
        try {
            const metrics = await TOKEN_POLICY.getCurrentMetrics(context);

            if (!metrics || !metrics.currentMilestone) {
                throw new Error('Invalid metrics data');
            }

            return {
                totalVCs: metrics.totalVCs,
                currentMilestone: {
                    ...metrics.currentMilestone,
                    milestone: metrics.currentMilestone.milestone ||
                        INVESTMENT_MILESTONES.findIndex(m => m.totalVCs === metrics.currentMilestone.totalVCs) + 1
                },
                nextInvestorRate: metrics.nextInvestorRate ? {
                    ...metrics.nextInvestorRate,
                    milestone: metrics.nextInvestorRate.milestone ||
                        INVESTMENT_MILESTONES.findIndex(m => m.totalVCs === metrics.nextInvestorRate.totalVCs) + 1
                } : metrics.currentMilestone,
                nextMilestone: metrics.nextMilestone,
                progress: metrics.progress,
                baseInvestmentAmount: TOKEN_POLICY.BASE_INVESTMENT_AMOUNT,
                levels: INVESTMENT_MILESTONES.map((level, index) => ({
                    milestone: level.milestone || index + 1,
                    totalVCs: level.totalVCs,
                    newVCs: level.newVCs,
                    vcePerInvestment: level.vcePerInvestment
                }))
            };
        } catch (error) {
            console.error('Investment metrics error:', error);
            throw error;
        }
    }
}); 