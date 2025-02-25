import { createOperation, z } from '../generated/wundergraph.factory';
import { v4 as uuidv4 } from 'uuid';

/**
 * createCompositeVariation - Creates a new variation of an existing composite
 * 
 * This operation:
 * 1. Clones the content from the source composite
 * 2. Creates a new composite with the cloned content
 * 3. Establishes a relationship between the new and original composite
 * 4. Applies any pending changes if specified
 */
export default createOperation.mutation({
    input: z.object({
        sourceCompositeId: z.string().uuid(),
        title: z.string(),
        description: z.string().optional(),
        variationType: z.string().optional().default('variation'),
        applyPendingChanges: z.boolean().optional().default(false),
        pendingEditRequestId: z.string().uuid().optional()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        try {
            if (!user?.customClaims?.id) {
                throw new Error("User not authenticated");
            }

            const userId = user.customClaims.id;
            const { sourceCompositeId, title, description, variationType, applyPendingChanges, pendingEditRequestId } = input;

            console.log("Creating variation with input:", {
                sourceCompositeId,
                title,
                description,
                variationType,
                applyPendingChanges,
                pendingEditRequestId,
                userId
            });

            // 1. Get the source composite
            // First, check if the sourceCompositeId is a compose_id (db id) or a composite id
            const { data: sourceCompositeCheck, error: checkError } = await context.supabase
                .from("composites")
                .select("id, title, description, compose_id")
                .eq("id", sourceCompositeId)
                .maybeSingle();

            if (checkError) {
                throw new Error(`Error checking source composite: ${checkError.message}`);
            }

            let sourceComposite;

            if (sourceCompositeCheck) {
                // We found a composite with this ID
                sourceComposite = sourceCompositeCheck;
                console.log("Found composite by ID:", sourceComposite);
            } else {
                // The ID might be a compose_id (db id), try to find a composite with this compose_id
                const { data: compositeByComposeId, error: composeIdError } = await context.supabase
                    .from("composites")
                    .select("id, title, description, compose_id")
                    .eq("compose_id", sourceCompositeId)
                    .maybeSingle();

                if (composeIdError) {
                    throw new Error(`Error checking composite by compose_id: ${composeIdError.message}`);
                }

                if (!compositeByComposeId) {
                    throw new Error(`No composite found with id or compose_id: ${sourceCompositeId}`);
                }

                sourceComposite = compositeByComposeId;
                console.log("Found composite by compose_id:", sourceComposite);
            }

            // 2. Get the content from the source composite
            const { data: sourceContent, error: contentError } = await context.supabase
                .from("db")
                .select("id, json, author, schema, version")
                .eq("id", sourceComposite.compose_id)
                .maybeSingle();

            if (contentError) {
                throw new Error(`Failed to fetch source content: ${contentError.message}`);
            }

            if (!sourceContent) {
                throw new Error(`No content found for compose_id: ${sourceComposite.compose_id}`);
            }

            // 3. If we're applying pending changes, get the edit request
            let newContentJson = sourceContent.json;

            if (applyPendingChanges && pendingEditRequestId) {
                const { data: editRequest, error: editRequestError } = await context.supabase
                    .from("patch_requests")
                    .select("new_version_id")
                    .eq("id", pendingEditRequestId)
                    .maybeSingle();

                if (editRequestError) {
                    throw new Error(`Failed to fetch edit request: ${editRequestError.message}`);
                }

                if (!editRequest) {
                    throw new Error(`No edit request found with id: ${pendingEditRequestId}`);
                }

                // Get the new version content
                const { data: newVersion, error: newVersionError } = await context.supabase
                    .from("db")
                    .select("json")
                    .eq("id", editRequest.new_version_id as string)
                    .maybeSingle();

                if (newVersionError) {
                    throw new Error(`Failed to fetch new version: ${newVersionError.message}`);
                }

                if (!newVersion) {
                    // Try to get from archive
                    const { data: archivedVersion, error: archiveError } = await context.supabase
                        .from("db_archive")
                        .select("json")
                        .eq("id", editRequest.new_version_id as string)
                        .maybeSingle();

                    if (archiveError) {
                        throw new Error(`Failed to fetch archived version: ${archiveError.message}`);
                    }

                    if (!archivedVersion) {
                        throw new Error(`No content found for new version: ${editRequest.new_version_id}`);
                    }

                    newContentJson = archivedVersion.json;
                } else {
                    newContentJson = newVersion.json;
                }
            }

            // 4. Create a new content entry
            const newContentId = uuidv4();
            const { data: newContent, error: insertError } = await context.supabase
                .from("db")
                .insert({
                    id: newContentId,
                    json: newContentJson,
                    author: userId,
                    schema: sourceContent.schema,
                    version: 1 // Start with version 1 for the new content
                })
                .select()
                .single();

            if (insertError || !newContent) {
                throw new Error(`Failed to create new content: ${insertError?.message || "Unknown error"}`);
            }

            // 5. Create a new composite
            const newCompositeId = uuidv4();
            const { data: newComposite, error: compositeError } = await context.supabase
                .from("composites")
                .insert({
                    id: newCompositeId,
                    title: title,
                    description: description || `Variation of ${sourceComposite.title}`,
                    compose_id: newContentId,
                    author: userId
                })
                .select()
                .single();

            if (compositeError || !newComposite) {
                throw new Error(`Failed to create new composite: ${compositeError?.message || "Unknown error"}`);
            }

            // 6. Create a relationship between the new and original composite
            const { error: relationshipError } = await context.supabase
                .from("composite_relationships")
                .insert({
                    source_composite_id: newCompositeId,
                    target_composite_id: sourceComposite.id,
                    relationship_type: "variation_of",
                    metadata: {
                        created_at: new Date().toISOString(),
                        variation_type: variationType,
                        description: description || `Variation of ${sourceComposite.title}`,
                        target_composite_id: sourceComposite.id
                    }
                });

            if (relationshipError) {
                throw new Error(`Failed to create relationship: ${relationshipError.message}`);
            }

            return {
                success: true,
                message: "Variation created successfully",
                composite: newComposite
            };
        } catch (error) {
            console.error("Error creating variation:", error);
            return {
                success: false,
                message: error.message || "Failed to create variation",
                composite: null
            };
        }
    }
}); 