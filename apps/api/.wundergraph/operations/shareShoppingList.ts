import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        listId: z.string(),
        userId: z.string(),
        accessLevel: z.enum(['read', 'write']),
    }),
    requireAuthentication: true,
    handler: async ({ input, context }) => {
        // Mock checking user capabilities
        const mockUserCapabilities = {
            listSharingLimit: 5,
            currentShares: 2
        };

        // Check if user has reached their sharing limit
        if (mockUserCapabilities.currentShares >= mockUserCapabilities.listSharingLimit) {
            return {
                success: false,
                message: `You've reached your sharing limit of ${mockUserCapabilities.listSharingLimit} users per list`
            };
        }

        // Mock sharing the list
        return {
            success: true,
            message: `Shopping list shared with user ${input.userId} with ${input.accessLevel} access`,
            share: {
                listId: input.listId,
                userId: input.userId,
                accessLevel: input.accessLevel,
                sharedAt: new Date().toISOString()
            }
        };
    },
}); 