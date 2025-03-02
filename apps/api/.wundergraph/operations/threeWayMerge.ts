import { createOperation, z } from '../generated/wundergraph.factory';

// Define the response type from the three_way_merge_composites function
interface MergeResponse {
    success: boolean;
    message?: string;
    error?: string;
    details?: string;
    patchRequestId?: string;
    newContentId?: string;
    snapshotId?: string;
    ancestorId?: string;
    conflicts_detected?: number;
    operations_count?: number;
    op_conflicts?: any[];
}

/**
 * Operation to perform a three-way merge between two composites.
 * This uses a common ancestor approach for better conflict resolution.
 * 
 * When used with drag and drop, the source composite is dragged onto the target composite.
 * The merge creates a patch request in the target composite that needs to be approved.
 */
export default createOperation.mutation({
    input: z.object({
        sourceCompositeId: z.string().uuid(),
        targetCompositeId: z.string().uuid(),
        isDragAndDrop: z.boolean().optional().default(false)
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated or missing ID");
        }

        try {
            console.log(`[threeWayMerge] Starting merge from ${input.sourceCompositeId} to ${input.targetCompositeId}`);

            if (input.isDragAndDrop) {
                console.log(`[threeWayMerge] Using drag and drop merge mode`);
            }

            // Call the database function to perform the three-way merge
            const { data, error } = await context.supabase.rpc('three_way_merge_composites', {
                p_user_id: user.customClaims.id,
                p_source_composite_id: input.sourceCompositeId,
                p_target_composite_id: input.targetCompositeId
            });

            if (error) {
                console.error('[threeWayMerge] Error:', error);
                return {
                    success: false,
                    error: error.message,
                    details: error.details
                };
            }

            // Type assertion for the data
            const typedData = data as MergeResponse;

            // Log success metrics
            console.log(`[threeWayMerge] Successfully merged composites. Metrics: ${JSON.stringify({
                conflicts_detected: typedData.conflicts_detected || 0,
                operations_count: typedData.operations_count || 0,
                using_ancestor: typedData.ancestorId ? true : false,
                is_drag_drop: input.isDragAndDrop
            })}`);

            return {
                ...typedData,
                isDragAndDrop: input.isDragAndDrop
            };
        } catch (error) {
            console.error('[threeWayMerge] Unexpected error:', error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }
}); 