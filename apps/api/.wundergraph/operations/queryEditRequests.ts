import { createOperation, z } from '../generated/wundergraph.factory';

interface EditRequest {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    author: {
        id: string;
        name: string;
    };
    changes: {
        content?: string;
        schema?: any;
        instance?: any;
    };
    previousVersion: {
        content?: string;
        schema?: any;
        instance?: any;
    };
    status: 'pending' | 'approved' | 'rejected';
    proposalId: string;
}

// Mock data for development
const mockEditRequests: EditRequest[] = [
    {
        id: '1',
        title: 'Update project goals',
        description: 'Refined the project goals to better reflect current direction',
        createdAt: '2024-02-20T10:00:00Z',
        author: {
            id: '1',
            name: 'Alice'
        },
        changes: {
            content: '# Updated Goals\n\nNew project goals with refined objectives...'
        },
        previousVersion: {
            content: '# Goals\n\nOriginal project goals...'
        },
        status: 'pending',
        proposalId: '44444444-4444-4444-4444-444444444444'
    },
    {
        id: '2',
        title: 'Fix typos in description',
        description: 'Corrected several typos in the main description',
        createdAt: '2024-02-19T15:30:00Z',
        author: {
            id: '2',
            name: 'Bob'
        },
        changes: {
            content: '# Description\n\nFixed content with corrected spelling...'
        },
        previousVersion: {
            content: '# Description\n\nOriginal content with typos...'
        },
        status: 'approved',
        proposalId: '44444444-4444-4444-4444-444444444444'
    },
    {
        id: '3',
        title: 'Update schema structure',
        description: 'Modified schema to include new fields',
        createdAt: '2024-02-18T09:15:00Z',
        author: {
            id: '3',
            name: 'Charlie'
        },
        changes: {
            schema: {
                type: 'object',
                properties: {
                    newField: { type: 'string' }
                }
            }
        },
        previousVersion: {
            schema: {
                type: 'object',
                properties: {}
            }
        },
        status: 'rejected',
        proposalId: '44444444-4444-4444-4444-444444444444'
    }
];

export default createOperation.query({
    input: z.object({
        proposalId: z.string()
    }),
    handler: async ({ input }): Promise<{ editRequests: EditRequest[] }> => {
        // In a real implementation, this would query the database
        // For now, return mock data filtered by proposalId
        const filteredRequests = mockEditRequests.filter(
            request => request.proposalId === input.proposalId
        );

        return {
            editRequests: filteredRequests
        };
    }
}); 