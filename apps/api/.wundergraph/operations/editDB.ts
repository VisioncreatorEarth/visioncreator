import { createOperation, z } from '../generated/wundergraph.factory';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { v4 as uuidv4 } from 'uuid';

// Add interfaces for type safety
interface DBItem {
    id: string;
    schema: string;
    json: Record<string, any>;
}

interface SchemaData {
    json: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
        [key: string]: any;
    };
}

interface PatchRequest {
    id: string;
    status: string;
    title: string;
    description: string;
    author: string;
    old_version_id: string;
    new_version_id: string;
    composite_id: string;
}

// Initialize Ajv with formats and keywords
const ajv = new Ajv({
    strict: false,
    allErrors: true,
    coerceTypes: true,
    useDefaults: true,
    validateFormats: true,
    removeAdditional: false,
    validateSchema: true,
});

// Add standard formats
addFormats(ajv);

// Add x-relation keyword for handling relation fields
ajv.addKeyword({
    keyword: 'x-relation',
    modifying: true,
    compile: (schema: any) => {
        return (data: any) => {
            // For relation fields, accept either a string (ID) or an object or null
            if (schema && (typeof data === 'string' || data === null)) {
                return true;
            }
            return true; // Default to true and let the type validation handle other cases
        };
    }
});

// Function to modify schema to handle relation fields at any nesting level
function modifySchemaForRelations(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema;

    // Clone the schema to avoid modifying the original
    const modifiedSchema = { ...schema };

    if (modifiedSchema.properties) {
        modifiedSchema.properties = Object.entries(modifiedSchema.properties).reduce(
            (acc, [key, prop]: [string, any]) => {
                if (prop.type === 'object') {
                    if (prop['x-relation']) {
                        // For relation fields, accept either string or object
                        acc[key] = {
                            oneOf: [
                                { type: 'string', format: 'uuid' },
                                { type: 'object' },
                                { type: 'null' }
                            ],
                            'x-relation': prop['x-relation']
                        };
                    } else if (prop.properties) {
                        // Recursively process nested objects
                        acc[key] = {
                            ...prop,
                            properties: modifySchemaForRelations(prop).properties
                        };
                    } else {
                        acc[key] = prop;
                    }
                } else {
                    acc[key] = prop;
                }
                return acc;
            },
            {} as Record<string, any>
        );
    }

    return modifiedSchema;
}

/**
 * Creates a variation of a composite when a non-author tries to edit it
 * 
 * @param context - The WunderGraph context
 * @param userId - The ID of the current user
 * @param compositeId - The ID of the composite to create a variation of
 * @param newJson - The new JSON content for the variation
 * @returns Object containing the new composite ID and optional patch request ID
 */
async function createCompositeVariation(
    context: any,
    userId: string,
    compositeId: string,
    newJson: any
): Promise<{ compositeId: string; patchRequestId?: string }> {
    try {
        console.log('[editDB] Creating composite variation:', {
            userId,
            compositeId
        });

        // 1. Get the source composite
        const { data: sourceComposite, error: compositeError } = await context.supabase
            .from("composites")
            .select("id, title, description, compose_id, author")
            .eq("id", compositeId)
            .maybeSingle();

        if (compositeError || !sourceComposite) {
            throw new Error(`Failed to fetch source composite: ${compositeError?.message || "Composite not found"}`);
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

        // 3. Create a clone of the original content to serve as our "before" state
        const cloneContentId = uuidv4();
        const { data: clonedContent, error: cloneError } = await context.supabase
            .from("db")
            .insert({
                id: cloneContentId,
                json: sourceContent.json, // Use the original content's JSON
                author: userId,
                schema: sourceContent.schema,
                version: 1
            })
            .select()
            .single();

        if (cloneError) {
            console.error('[editDB] Warning: Failed to create clone for patch request:', cloneError);
            // Continue even if clone creation fails
        }

        // 4. Create a new content entry with the new JSON (the "after" state)
        const newContentId = uuidv4();
        const { data: newContent, error: insertError } = await context.supabase
            .from("db")
            .insert({
                id: newContentId,
                json: newJson,
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
        const variationTitle = `Variation of ${sourceComposite.title}`;
        const variationDescription = `Created by ${userId} as a variation of composite ${compositeId}`;

        const { data: newComposite, error: compositeInsertError } = await context.supabase
            .from("composites")
            .insert({
                id: newCompositeId,
                title: variationTitle,
                description: variationDescription,
                compose_id: newContentId,
                author: userId
            })
            .select()
            .single();

        if (compositeInsertError || !newComposite) {
            throw new Error(`Failed to create new composite: ${compositeInsertError?.message || "Unknown error"}`);
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
                    variation_type: "edit_variation",
                    description: `Created automatically when ${userId} tried to edit a composite they don't own`,
                    target_composite_id: sourceComposite.id
                }
            });

        if (relationshipError) {
            throw new Error(`Failed to create relationship: ${relationshipError.message}`);
        }

        // 7. Create a patch request to track the changes
        const patchRequestTitle = `Edit variation for ${sourceComposite.title}`;
        const patchRequestDescription = `Changes made by ${userId} to create a variation of ${sourceComposite.title}`;

        let patchRequestId: string | undefined = undefined;

        try {
            // Only create a patch request if we successfully created the clone
            if (clonedContent) {
                // Create the patch request first
                const { data: patchRequest, error: patchRequestError } = await context.supabase
                    .from("patch_requests")
                    .insert({
                        title: patchRequestTitle,
                        description: patchRequestDescription,
                        author: userId,
                        old_version_id: cloneContentId, // Use the clone as the "before" state
                        new_version_id: newContentId,   // Use the new content as the "after" state
                        composite_id: newCompositeId,
                        status: 'approved' // Auto-approve since this is a new variation
                    })
                    .select()
                    .single();

                if (patchRequestError) {
                    console.error('[editDB] Warning: Failed to create patch request:', patchRequestError);
                    // Don't throw an error here, as the variation was still created successfully
                    // Just log the error and continue
                } else if (patchRequest && typeof patchRequest.id === 'string') {
                    patchRequestId = patchRequest.id;
                    console.log('[editDB] Successfully created patch request:', {
                        patchRequestId,
                        status: patchRequest.status
                    });

                    // Now manually create some basic operations to track the changes
                    // This is a simplified version of what generate_operations_from_diff does
                    try {
                        // Compare the old and new JSON to find differences
                        const oldJson = clonedContent.json || {};
                        const newJsonObj = newJson || {};

                        // Get all keys from both objects
                        const oldKeys = Object.keys(oldJson);
                        const newKeys = Object.keys(newJsonObj);

                        // Track operations for changed or removed keys
                        for (const key of oldKeys) {
                            if (newJsonObj[key] !== undefined && JSON.stringify(oldJson[key]) !== JSON.stringify(newJsonObj[key])) {
                                // Key exists in both but values differ - create a replace operation
                                await context.supabase.from("db_operations").insert({
                                    patch_request_id: patchRequest.id,
                                    operation_type: 'replace',
                                    path: [key],
                                    old_value: oldJson[key],
                                    new_value: newJsonObj[key],
                                    author: userId,
                                    composite_id: newCompositeId,
                                    content_id: newContentId,
                                    metadata: { property: key }
                                });
                            } else if (newJsonObj[key] === undefined) {
                                // Key exists in old but not in new - create a remove operation
                                await context.supabase.from("db_operations").insert({
                                    patch_request_id: patchRequest.id,
                                    operation_type: 'remove',
                                    path: [key],
                                    old_value: oldJson[key],
                                    new_value: null,
                                    author: userId,
                                    composite_id: newCompositeId,
                                    content_id: newContentId,
                                    metadata: { property: key }
                                });
                            }
                        }

                        // Track operations for added keys
                        for (const key of newKeys) {
                            if (!oldKeys.includes(key)) {
                                // Key exists in new but not in old - create an add operation
                                await context.supabase.from("db_operations").insert({
                                    patch_request_id: patchRequest.id,
                                    operation_type: 'add',
                                    path: [key],
                                    old_value: null,
                                    new_value: newJsonObj[key],
                                    author: userId,
                                    composite_id: newCompositeId,
                                    content_id: newContentId,
                                    metadata: { property: key }
                                });
                            }
                        }

                        console.log('[editDB] Successfully created operations for patch request');
                    } catch (opsError) {
                        console.error('[editDB] Error creating operations:', opsError);
                        // Continue even if operations creation fails
                    }
                }
            } else {
                console.log('[editDB] Skipping patch request creation because clone creation failed');
            }
        } catch (err) {
            console.error('[editDB] Exception creating patch request:', err);
            // Continue even if patch request creation fails
        }

        console.log('[editDB] Successfully created variation:', {
            originalCompositeId: compositeId,
            newCompositeId: newCompositeId
        });

        return {
            compositeId: newCompositeId,
            patchRequestId
        };
    } catch (error) {
        console.error('[editDB] Error creating variation:', error);
        throw error;
    }
}

export default createOperation.mutation({
    input: z.object({
        id: z.string().uuid(),
        json: z.any(),
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
            console.log('[editDB] Starting edit operation with input:', {
                id: input.id,
                jsonKeys: typeof input.json === 'object' && input.json ? Object.keys(input.json) : []
            });

            // Call the database function that handles all the logic
            const { data, error } = await context.supabase.rpc('edit_content_with_validation', {
                p_id: input.id,
                p_json: input.json,
                p_user_id: user.customClaims.id
            });

            if (error) {
                console.error('[editDB] Error calling edit_content_with_validation:', error);
                return {
                    success: false,
                    error: error.message,
                    details: error.details
                };
            }

            console.log('[editDB] Successfully edited content:', {
                result: data
            });

            return data;

        } catch (error) {
            console.error('[editDB] Unexpected error:', error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    },
}); 