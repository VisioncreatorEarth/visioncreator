import { createOperation } from '../generated/wundergraph.factory';
import { TOKEN_POLICY } from '../utils/tokens';

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context }) => {
        return TOKEN_POLICY.getCurrentMetrics(context);
    }
}); 