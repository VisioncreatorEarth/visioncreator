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
        proposalId: z.string(),
        status: z.enum(['pending', 'approved', 'rejected']).optional()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }): Promise<{ editRequests: EditRequest[] }> => {
        try {
            // First, get the composite ID for the proposal
            const { data: proposal, error: proposalError } = await context.supabase
                .from('proposals')
                .select('compose:composites(id)')
                .eq('id', input.proposalId)
                .single() as { data: ProposalData | null; error: any };

            if (proposalError || !proposal?.compose?.id) {
                console.error('[queryEditRequests] Error fetching proposal:', proposalError);
                return { editRequests: [] };
            }

            const compositeId = proposal.compose.id;

            // Now get patch requests for this composite
            let query = context.supabase
                .from('patch_requests')
                .select(`
                    id,
                    title,
                    description,
                    status,
                    created_at,
                    author_info:profiles!patch_requests_author_fkey(id, name),
                    old_version_id,
                    new_version_id,
                    composite:composites!patch_requests_composite_id_fkey(id)
                `)
                .eq('composite_id', compositeId)
                .order('created_at', { ascending: false });

            // Apply status filter if provided
            if (input.status) {
                query = query.eq('status', input.status);
            }

            const { data: patchRequests, error: requestsError } = await query;

            if (requestsError) {
                console.error('[queryEditRequests] Error fetching patch requests:', requestsError);
                throw new Error('Failed to fetch patch requests');
            }

            // Get all version IDs
            const versionIds = (patchRequests || []).reduce((acc: string[], req) => {
                if (req.old_version_id && typeof req.old_version_id === 'string') acc.push(req.old_version_id);
                if (req.new_version_id && typeof req.new_version_id === 'string') acc.push(req.new_version_id);
                return acc;
            }, []);

            // Create a map to store all versions
            const versionsMap = new Map<string, VersionData>();

            // First, try to get versions from active db
            const { data: dbVersions } = await context.supabase
                .from('db')
                .select('id, json, variation, version, created_at')
                .in('id', versionIds);

            // Add active versions to the map
            (dbVersions || []).forEach((v: RawVersionData) => {
                if (
                    v?.id &&
                    typeof v.id === 'string' &&
                    typeof v.variation === 'string' &&
                    typeof v.version === 'number' &&
                    typeof v.created_at === 'string'
                ) {
                    versionsMap.set(v.id, {
                        id: v.id,
                        json: v.json as Record<string, any>,
                        variation: v.variation,
                        version: v.version,
                        created_at: v.created_at
                    });
                }
            });

            // Get remaining versions from archive
            const remainingIds = versionIds.filter(id => !versionsMap.has(id));
            if (remainingIds.length > 0) {
                const { data: archiveVersions } = await context.supabase
                    .from('db_archive')
                    .select('id, json, variation, version, created_at')
                    .in('id', remainingIds);

                // Add archived versions to the map
                (archiveVersions || []).forEach((v: RawVersionData) => {
                    if (
                        v?.id &&
                        typeof v.id === 'string' &&
                        typeof v.variation === 'string' &&
                        typeof v.version === 'number' &&
                        typeof v.created_at === 'string'
                    ) {
                        versionsMap.set(v.id, {
                            id: v.id,
                            json: v.json as Record<string, any>,
                            variation: v.variation,
                            version: v.version,
                            created_at: v.created_at
                        });
                    }
                });
            }

            // Transform the data into the expected format
            const editRequests: EditRequest[] = (patchRequests || []).map((request: any) => {
                const oldVersion = request.old_version_id ? versionsMap.get(request.old_version_id) : null;
                const newVersion = request.new_version_id ? versionsMap.get(request.new_version_id) : null;

                return {
                    id: request.id,
                    title: request.title || '',
                    description: request.description || '',
                    createdAt: request.created_at,
                    author: {
                        id: request.author_info?.id || '',
                        name: request.author_info?.name || 'Unknown'
                    },
                    changes: {
                        content: newVersion?.json?.content || undefined,
                        schema: newVersion?.json?.schema,
                        instance: newVersion?.json,
                        version: newVersion?.version,
                        variation: newVersion?.variation,
                        created_at: newVersion?.created_at
                    },
                    previousVersion: {
                        content: oldVersion?.json?.content || undefined,
                        schema: oldVersion?.json?.schema,
                        instance: oldVersion?.json,
                        version: oldVersion?.version,
                        variation: oldVersion?.variation,
                        created_at: oldVersion?.created_at
                    },
                    status: request.status || 'pending',
                    proposalId: input.proposalId
                };
            });

            return { editRequests };
        } catch (error) {
            console.error('[queryEditRequests] Unexpected error:', error);
            throw error;
        }
    }
}); 