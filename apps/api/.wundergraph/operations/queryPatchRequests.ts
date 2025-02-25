import { createOperation, z } from '../generated/wundergraph.factory';

interface PatchRequest {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    old_version_id: string;
    new_version_id: string;
    composite_id: string;
    composite_author: string;
    author: {
        id: string;
        name: string;
    };
    operations: Array<{
        id: string;
        operation_type: string;
        path: string[];
        old_value: any;
        new_value: any;
        created_at: string;
        metadata: Record<string, any>;
    }>;
}

interface DBVersion {
    id: string;
    json: Record<string, any>;
    version: number;
    created_at: string;
}

interface RawPatchRequest {
    id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    old_version_id: string;
    new_version_id: string;
    composite_id: string;
    author: string;
}

interface RawDBVersion {
    id: string;
    json: Record<string, any>;
    version: number;
    created_at: string;
}

interface RawOperation {
    id: string;
    operation_type: string;
    path: string[];
    old_value: any;
    new_value: any;
    created_at: string;
    metadata: Record<string, any>;
    patch_request_id: string;
}

interface Profile {
    id: string;
    name: string;
}

export default createOperation.query({
    input: z.object({
        compositeIds: z.array(z.string())
    }),
    handler: async ({ input, context }) => {
        try {
            // First get the patch requests
            const { data: rawPatchRequests, error: requestsError } = await context.supabase
                .from('patch_requests')
                .select(`
                    id,
                    title,
                    description,
                    status,
                    created_at,
                    updated_at,
                    old_version_id,
                    new_version_id,
                    composite_id,
                    author
                `)
                .in('composite_id', input.compositeIds)
                .order('created_at', { ascending: false });

            if (requestsError) {
                console.error('[queryPatchRequests] Error fetching patch requests:', requestsError);
                throw new Error('Failed to fetch patch requests');
            }

            const patchRequests = (rawPatchRequests || []) as RawPatchRequest[];

            // Get all author IDs
            const authorIds = [...new Set(patchRequests.map(req => req.author))];

            // Get author profiles
            const { data: rawProfiles } = await context.supabase
                .from('profiles')
                .select('id, name')
                .in('id', authorIds);

            const profiles = (rawProfiles || []) as Profile[];
            const profileMap = new Map(profiles.map(p => [p.id, p]));

            // Get composite information including authors
            const { data: composites, error: compositesError } = await context.supabase
                .from('composites')
                .select('id, author')
                .in('id', input.compositeIds);

            if (compositesError) {
                console.error('[queryPatchRequests] Error fetching composites:', compositesError);
                throw new Error('Failed to fetch composites');
            }

            // Create a map of composite IDs to their authors
            const compositeAuthorMap = new Map(
                (composites || []).map(c => [c.id, c.author])
            );

            // Get all version IDs
            const versionIds = patchRequests.reduce((acc: string[], req) => {
                if (req.old_version_id) acc.push(req.old_version_id);
                if (req.new_version_id) acc.push(req.new_version_id);
                return acc;
            }, []);

            // Create a map to store all versions
            const versionsMap = new Map<string, DBVersion>();

            // First, try to get versions from active db
            const { data: rawDbVersions } = await context.supabase
                .from('db')
                .select('id, json, version, created_at')
                .in('id', versionIds);

            const dbVersions = (rawDbVersions || []) as RawDBVersion[];

            // Add active versions to the map
            dbVersions.forEach((v) => {
                versionsMap.set(v.id, {
                    id: v.id,
                    json: v.json,
                    version: v.version,
                    created_at: v.created_at
                });
            });

            // Get remaining versions from archive
            const remainingIds = versionIds.filter(id => !versionsMap.has(id));
            if (remainingIds.length > 0) {
                const { data: rawArchiveVersions } = await context.supabase
                    .from('db_archive')
                    .select('id, json, version, created_at')
                    .in('id', remainingIds);

                const archiveVersions = (rawArchiveVersions || []) as RawDBVersion[];

                // Add archived versions to the map
                archiveVersions.forEach((v) => {
                    versionsMap.set(v.id, {
                        id: v.id,
                        json: v.json,
                        version: v.version,
                        created_at: v.created_at
                    });
                });
            }

            // Get operations for each patch request
            const operationsMap = new Map<string, RawOperation[]>();

            // Fetch operations for all patch requests at once
            const { data: rawOperations, error: operationsError } = await context.supabase
                .from('db_operations')
                .select(`
                    id,
                    patch_request_id,
                    operation_type,
                    path,
                    old_value,
                    new_value,
                    created_at,
                    metadata
                `)
                .in('patch_request_id', patchRequests.map(req => req.id))
                .order('created_at', { ascending: true });

            if (operationsError) {
                console.error('[queryPatchRequests] Error fetching operations:', operationsError);
            } else {
                // Group operations by patch request ID
                const operations = (rawOperations || []) as RawOperation[];
                operations.forEach((op) => {
                    if (!operationsMap.has(op.patch_request_id)) {
                        operationsMap.set(op.patch_request_id, []);
                    }
                    operationsMap.get(op.patch_request_id)?.push({
                        id: op.id,
                        operation_type: op.operation_type,
                        path: op.path,
                        old_value: op.old_value,
                        new_value: op.new_value,
                        created_at: op.created_at,
                        metadata: op.metadata,
                        patch_request_id: op.patch_request_id
                    });
                });
            }

            // Transform the data into the expected format
            const transformedRequests = patchRequests.map((request) => {
                const oldVersion = request.old_version_id ? versionsMap.get(request.old_version_id) : null;
                const newVersion = request.new_version_id ? versionsMap.get(request.new_version_id) : null;
                const author = profileMap.get(request.author);
                const operations = operationsMap.get(request.id) || [];
                const compositeAuthor = compositeAuthorMap.get(request.composite_id) || '';

                return {
                    id: request.id,
                    title: request.title || '',
                    description: request.description || '',
                    created_at: request.created_at,
                    updated_at: request.updated_at,
                    author: {
                        id: author?.id || '',
                        name: author?.name || 'Unknown'
                    },
                    composite_author: compositeAuthor,
                    changes: {
                        content: newVersion?.json?.content,
                        schema: newVersion?.json?.schema,
                        instance: newVersion?.json,
                        version: newVersion?.version,
                        created_at: newVersion?.created_at
                    },
                    previousVersion: {
                        content: oldVersion?.json?.content,
                        schema: oldVersion?.json?.schema,
                        instance: oldVersion?.json,
                        version: oldVersion?.version,
                        created_at: oldVersion?.created_at
                    },
                    status: request.status || 'pending',
                    composite_id: request.composite_id,
                    operations: operations
                };
            });

            return {
                patch_requests: transformedRequests
            };
        } catch (error) {
            console.error('[queryPatchRequests] Unexpected error:', error);
            throw error;
        }
    }
}); 