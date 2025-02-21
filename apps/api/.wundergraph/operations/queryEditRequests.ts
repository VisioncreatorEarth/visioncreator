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
        content?: string | null;
        schema?: any;
        instance?: any;
        version?: number;
        variation?: string;
        created_at?: string;
    };
    previousVersion: {
        content?: string | null;
        schema?: any;
        instance?: any;
        version?: number;
        variation?: string;
        created_at?: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    proposalId: string;
}

interface ProposalData {
    compose: {
        id: string;
    };
}

interface VersionData {
    id: string;
    json: Record<string, any>;
    variation: string;
    version: number;
    created_at: string;
}

interface RawVersionData {
    id: unknown;
    json: unknown;
    variation: unknown;
    version: unknown;
    created_at: unknown;
}

export default createOperation.query({
    input: z.object({
        proposalId: z.string()
    }),
    handler: async ({ input, operations }) => {
        // First get the proposal's compose ID
        const proposalResult = await operations.query({
            operationName: 'queryProposals',
            input: { proposalId: input.proposalId }
        });

        if (!proposalResult.data?.proposal?.compose) {
            return { patch_requests: [] };
        }

        const composeId = proposalResult.data.proposal.compose;

        // Get all composites related to this proposal
        const composeResult = await operations.query({
            operationName: 'queryComposeProposal',
            input: { proposalId: input.proposalId }
        });

        if (!composeResult.data?.compose_data) {
            return { patch_requests: [] };
        }

        // Get all composite IDs (main and related)
        const compositeIds = [
            composeId,
            ...composeResult.data.compose_data.related_composites.map((rc) => rc.id)
        ];

        // Get all patch requests for these composites using internal query
        const patchRequestsResult = await operations.internal.query({
            sql: `
                SELECT 
                    pr.id,
                    pr.title,
                    pr.description,
                    pr.status,
                    pr.created_at,
                    pr.updated_at,
                    pr.old_version_id,
                    pr.new_version_id,
                    pr.composite_id,
                    json_build_object(
                        'id', p.id,
                        'name', p.name
                    ) as author
                FROM patch_requests pr
                JOIN profiles p ON p.id = pr.author
                WHERE pr.composite_id = ANY($1)
                ORDER BY pr.created_at DESC
            `,
            parameters: [compositeIds]
        });

        return {
            patch_requests: patchRequestsResult.data || []
        };
    }
}); 