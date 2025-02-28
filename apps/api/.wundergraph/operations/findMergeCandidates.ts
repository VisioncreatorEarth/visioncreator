import { createOperation, z } from '../generated/wundergraph.factory';

interface MergeCandidate {
    composite_id: string;
    title: string;
    relationship_type: string | null;
    last_updated: string;
    author_id: string;
    author_name: string;
}

/**
 * Operation to find potential composite merge candidates.
 * This finds other composites that could be merged with the specified composite.
 */
export default createOperation.query({
    input: z.object({
        compositeId: z.string().uuid()
    }),
    handler: async ({ input, context }) => {
        try {
            console.log('[findMergeCandidates] Finding candidates for composite:', input.compositeId);

            // Call the database function to find potential merge candidates
            const { data, error } = await context.supabase.rpc('find_merge_candidates', {
                p_composite_id: input.compositeId
            });

            if (error) {
                console.error('[findMergeCandidates] Error:', error);
                return {
                    success: false,
                    error: error.message,
                    candidates: []
                };
            }

            // Type assertion for the data
            const allCandidates = data as MergeCandidate[];

            // Extra safety check to filter out the current composite ID
            const candidates = allCandidates.filter(
                candidate => candidate.composite_id !== input.compositeId
            );

            console.log(
                `[findMergeCandidates] Found ${candidates.length} candidates (filtered from ${allCandidates.length})`
            );

            return {
                success: true,
                candidates: candidates || []
            };
        } catch (error) {
            console.error('[findMergeCandidates] Unexpected error:', error);
            return {
                success: false,
                error: "Unexpected error occurred while finding merge candidates",
                candidates: []
            };
        }
    }
}); 