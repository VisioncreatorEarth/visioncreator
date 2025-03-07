import { createOperation, z } from '../generated/wundergraph.factory';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Type definition for schema response
interface SchemaResponse {
    success: boolean;
    error?: string;
    details?: string;
    schema_id?: string;
    schema_data?: any;
}

// Type definition for content response
interface ContentResponse {
    content?: any;
    success?: boolean;
    error?: string;
}

// Initialize Ajv with formats and keywords
const ajv = new Ajv({
    strict: false,
    allErrors: true,
    coerceTypes: true,
    useDefaults: true,
    validateFormats: true,
    removeAdditional: false,  // Don't remove additional properties, let validation fail instead
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

// Schema for JSON Patch operation
const jsonPatchOperationSchema = z.object({
    op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
    path: z.string(),
    value: z.any().optional(),
    from: z.string().optional()
});

// Helper function to log structured error details
function logErrorDetails(error: any, context: string) {
    console.error(`[editDB] ${context} error:`, error);

    // Extract and log detailed PostgreSQL error information
    if (error.details) {
        try {
            // Try to parse details as JSON if it's a string
            if (typeof error.details === 'string') {
                try {
                    const parsedDetails = JSON.parse(error.details);
                    console.error('[editDB] Parsed error details:', parsedDetails);
                } catch (parseError) {
                    console.error('[editDB] Error details (raw):', error.details);
                }
            } else {
                console.error('[editDB] Error details:', error.details);
            }
        } catch (logError) {
            console.error('[editDB] Failed to log error details');
        }
    }

    // Log PostgreSQL NOTICE messages if any were captured
    if (error.hint) {
        console.error('[editDB] SQL Hint:', error.hint);
    }

    if (error.code) {
        console.error('[editDB] Error code:', error.code);
    }
}

// Significantly simplified editDB operation that uses the unified database function
export default createOperation.mutation({
    input: z.object({
        id: z.string().uuid(),
        compositeId: z.string().uuid().optional(),
        json: z.any().optional(), // Make json optional for operations-based flow
        operations: z.array(jsonPatchOperationSchema).optional(), // Add operations field for RFC 6902 operations
        createVariation: z.boolean().optional().default(false),
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
            // Check if we're using operations or JSON
            const isUsingOperations = input.operations && Array.isArray(input.operations) && input.operations.length > 0;

            // Log which flow we're using
            console.log(`[editDB] Using ${isUsingOperations ? 'operations-based' : 'JSON-based'} flow`);

            // Check if we're creating a variation
            if (input.createVariation) {
                console.log(`[editDB] Creating variation with createVariation = ${input.createVariation}`);
            }

            // Extract variation metadata if it exists (only for JSON-based flow)
            let jsonToValidate: any = undefined;
            let variationMetadata: { title?: string; description?: string; type?: string } = {};

            if (input.json) {
                jsonToValidate = { ...input.json };

                if (input.createVariation && jsonToValidate.__variation_metadata) {
                    variationMetadata = jsonToValidate.__variation_metadata;
                    // Keep the metadata for variation creation
                    console.log('[editDB] Extracted variation metadata:', variationMetadata);
                }
            }

            // Get current content for operations-based flow
            let currentContent: any = undefined;

            if (isUsingOperations) {
                try {
                    // Get the current content to apply operations to
                    const { data: contentData, error: contentFetchError } = await context.supabase.rpc('get_content', {
                        p_id: input.id
                    });

                    if (contentFetchError) {
                        console.error('[editDB] Error retrieving current content:', contentFetchError);
                        logErrorDetails(contentFetchError, 'Current content fetch');

                        // Instead of failing, let's try to proceed without current content for variations
                        if (!input.createVariation) {
                            return {
                                success: false,
                                error: 'Failed to retrieve current content',
                                details: contentFetchError.message,
                                fullError: contentFetchError
                            };
                        } else {
                            console.log('[editDB] Proceeding with variation creation despite content fetch error');
                        }
                    } else {
                        // Cast contentData to our ContentResponse interface
                        const typedContentData = contentData as ContentResponse;

                        if (!typedContentData || !typedContentData.content) {
                            console.error('[editDB] No content data returned');

                            // For variations, we'll proceed anyway
                            if (!input.createVariation) {
                                return {
                                    success: false,
                                    error: 'Content not found',
                                };
                            }
                        } else {
                            currentContent = typedContentData.content;
                            console.log('[editDB] Current content retrieved successfully');
                        }
                    }
                } catch (error) {
                    console.error('[editDB] Error getting content:', error);
                    // Proceed with the request for variations
                    if (!input.createVariation) {
                        return {
                            success: false,
                            error: 'Error getting content',
                            details: error instanceof Error ? error.message : String(error)
                        };
                    }
                }
            }

            // First, get the schema for this content to perform client-side validation
            const { data: schemaData, error: schemaError } = await context.supabase.rpc('get_content_schema', {
                p_id: input.id
            });

            if (schemaError) {
                console.error('[editDB] Error retrieving content schema:', schemaError);
                logErrorDetails(schemaError, 'Schema retrieval');
                return {
                    success: false,
                    error: 'Failed to retrieve content schema',
                    details: schemaError.message,
                    fullError: schemaError
                };
            }

            // Cast schemaData to our type for TypeScript validation
            const schemaResponse = schemaData as SchemaResponse;

            // For operations-based flow, we'll let the database handle schema validation
            if (!isUsingOperations && jsonToValidate && schemaResponse.success && schemaResponse.schema_data) {
                // If we have a schema, validate the content against it using Ajv (only for JSON-based flow)
                const schema = schemaResponse.schema_data;
                const validate = ajv.compile(schema);
                const isValid = validate(jsonToValidate);

                if (!isValid) {
                    const validationErrors = validate.errors || [];

                    // Format validation errors for better readability
                    const formattedErrors = validationErrors.map(err => ({
                        path: err.instancePath,
                        message: err.message,
                        keyword: err.keyword,
                        params: err.params
                    }));

                    console.error('[editDB] Validation errors:', JSON.stringify(formattedErrors, null, 2));

                    return {
                        success: false,
                        error: 'Content validation failed',
                        details: {
                            message: 'The provided content does not match the required schema',
                            errors: formattedErrors
                        }
                    };
                }

                console.log('[editDB] Content validation passed');
            } else if (!isUsingOperations) {
                console.warn('[editDB] No schema found for validation, proceeding without client-side validation');
            }

            // Whether operations-based or JSON-based, we'll always use process_json_patch
            // For JSON approach, we'll just set operations to empty array
            console.log('[editDB] Using process_json_patch for all flows, including JSON and variations');

            // Prepare parameters for the database function
            const patchParams: any = {
                p_content_id: input.id,
                p_operations: isUsingOperations ? input.operations : [], // Use empty array for JSON-based approach
                p_user_id: user.customClaims.id,
                p_create_variation: input.createVariation || false
            };

            // Add composite ID if provided
            if (input.compositeId) {
                patchParams.p_composite_id = input.compositeId;
                console.log('[editDB] Including composite ID:', input.compositeId);
            }

            // For variations, make sure __variation_metadata is properly handled
            if (input.createVariation) {
                if (input.json && input.json.__variation_metadata) {
                    // If we have JSON with metadata directly, use that
                    console.log('[editDB] Using variation metadata from JSON:', input.json.__variation_metadata);

                    // For operations-based variation, check if we need to add metadata operation
                    if (isUsingOperations) {
                        let hasMetadataOp = false;

                        // Check if operations already contain a metadata operation
                        for (const op of input.operations!) {
                            if (op.path === '/__variation_metadata' || op.path.startsWith('/__variation_metadata/')) {
                                hasMetadataOp = true;
                                break;
                            }
                        }

                        // If no metadata operation, ensure the JSON is passed correctly
                        if (!hasMetadataOp) {
                            console.log('[editDB] Operations might be missing metadata, process_json_patch will handle variation from JSON');
                        }
                    }
                } else if (isUsingOperations) {
                    // For operations-based variation, check if we have the necessary operation
                    let hasMetadataOp = false;

                    for (const op of input.operations!) {
                        if (op.path === '/__variation_metadata' || op.path.startsWith('/__variation_metadata/')) {
                            hasMetadataOp = true;
                            console.log('[editDB] Found variation metadata in operations');
                            break;
                        }
                    }

                    if (!hasMetadataOp) {
                        console.log('[editDB] Warning: Creating variation but no metadata operation found');
                    }
                }
            }

            console.log('[editDB] Calling process_json_patch with params:', JSON.stringify(patchParams, null, 2));

            // Call process_json_patch for all flows
            const { data: patchResult, error: patchError } = await context.supabase.rpc(
                'process_json_patch',
                patchParams
            );

            if (patchError) {
                console.error('[editDB] Error calling process_json_patch:', patchError);
                logErrorDetails(patchError, 'Process JSON patch');

                return {
                    success: false,
                    error: patchError.message,
                    details: patchError.details || patchError.message,
                    fullError: patchError
                };
            }

            console.log('[editDB] Result:', JSON.stringify(patchResult, null, 2));
            return patchResult;

        } catch (error) {
            console.error('[editDB] Unexpected error:', error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            };
        }
    },
}); 