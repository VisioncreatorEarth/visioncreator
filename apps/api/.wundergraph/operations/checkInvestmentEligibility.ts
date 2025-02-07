import { createOperation, z } from '../generated/wundergraph.factory';
import { TOKEN_POLICY } from '../utils/tokens';

export default createOperation.query({
    input: z.object({
        userId: z.string()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ input, context }) => {
        if (!input.userId) {
            return { isEligible: false };
        }

        const isEligible = await TOKEN_POLICY.isEligibleForInvestment(context, input.userId);
        console.log('Checking eligibility for user:', input.userId, 'Result:', isEligible);
        return { isEligible };
    }
}); 