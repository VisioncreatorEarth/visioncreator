import { createOperation, z } from '../generated/wundergraph.factory';

// Define the input schema for the edit request update
const EditRequestInput = z.object({
    id: z.string(),
    proposalId: z.string(),
    title: z.string(),
    description: z.string(),
    changes: z.object({
        content: z.string().optional(),
        schema: z.any().optional(),
        instance: z.any().optional()
    }),
    previousVersion: z.object({
        content: z.string().optional(),
        schema: z.any().optional(),
        instance: z.any().optional()
    })
});

export default createOperation.mutation({
    input: EditRequestInput,
    handler: async ({ input }) => {
        // In a real implementation, this would update the database
        // For now, just return a success response with the mock updated data
        return {
            success: true,
            editRequest: {
                id: input.id,
                title: input.title,
                description: input.description,
                createdAt: new Date().toISOString(),
                author: {
                    id: '1', // Mock user ID
                    name: 'Current User'
                },
                changes: input.changes,
                previousVersion: input.previousVersion,
                status: 'pending',
                proposalId: input.proposalId
            }
        };
    }
}); 