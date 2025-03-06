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

            // Log detailed information about the operations if present
            if (isUsingOperations && input.operations) {
                console.log(`[editDB] Operations count: ${input.operations.length}`);
                console.log(`[editDB] Operations:`, JSON.stringify(input.operations, null, 2));
            }

            // Extract variation metadata if it exists (only for JSON-based flow)
            let jsonToValidate: any = undefined;
            let variationMetadata: { title?: string; description?: string; type?: string } = {};

            if (!isUsingOperations && input.json) {
                jsonToValidate = { ...input.json };

                if (input.createVariation && jsonToValidate.__variation_metadata) {
                    variationMetadata = jsonToValidate.__variation_metadata;
                    // Remove the metadata from the JSON to be validated
                    delete jsonToValidate.__variation_metadata;
                }
            }

            // Get current content for operations-based flow
            let currentContent: any = undefined;

            if (isUsingOperations) {
                // Get the current content to apply operations to
                const { data: contentData, error: contentFetchError } = await context.supabase.rpc('get_content', {
                    p_id: input.id
                });

                if (contentFetchError) {
                    console.error('[editDB] Error retrieving current content:', contentFetchError);
                    logErrorDetails(contentFetchError, 'Current content fetch');
                    return {
                        success: false,
                        error: 'Failed to retrieve current content',
                        details: contentFetchError.message,
                        fullError: contentFetchError
                    };
                }

                // Cast contentData to our ContentResponse interface
                const typedContentData = contentData as ContentResponse;

                if (!typedContentData || !typedContentData.content) {
                    console.error('[editDB] No content data returned');
                    return {
                        success: false,
                        error: 'Content not found',
                    };
                }

                currentContent = typedContentData.content;
                console.log('[editDB] Current content retrieved successfully');
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

            // Choose which database function to call based on flow
            if (isUsingOperations) {
                // Operations-based flow - use the new process_json_patch_operations function
                console.log('[editDB] Using operations-based flow with server-side validation');

                // Prepare parameters for the database function
                const operationsParams: any = {
                    p_content_id: input.id,
                    p_operations: input.operations,
                    p_user_id: user.customClaims.id,
                    p_create_variation: input.createVariation || false
                };

                // Add composite ID if provided
                if (input.compositeId) {
                    operationsParams.p_composite_id = input.compositeId;
                    console.log('[editDB] Including composite ID:', input.compositeId);
                }

                console.log('[editDB] Calling process_json_patch_operations with params:', JSON.stringify(operationsParams, null, 2));

                // Call the new database function for operations-based processing
                const { data: operationsResult, error: operationsError } = await context.supabase.rpc(
                    'process_json_patch_operations',
                    operationsParams
                );

                if (operationsError) {
                    console.error('[editDB] Error calling process_json_patch_operations:', operationsError);
                    logErrorDetails(operationsError, 'Process JSON patch operations');

                    return {
                        success: false,
                        error: operationsError.message,
                        details: operationsError.details || operationsError.message,
                        fullError: operationsError
                    };
                }

                console.log('[editDB] Operations result:', JSON.stringify(operationsResult, null, 2));
                return operationsResult;

            } else {
                // JSON-based flow - use the existing edit_content_with_validation function
                console.log('[editDB] Using JSON-based flow with client-side validation');

                if (!input.json) {
                    return {
                        success: false,
                        error: 'Missing JSON data for update'
                    };
                }

                // Prepare parameters for the database function
                const params: any = {
                    p_id: input.id,
                    p_json: jsonToValidate,
                    p_user_id: user.customClaims.id,
                    p_create_variation: input.createVariation,
                    p_variation_type: 'alternative' // Always specify variation_type to resolve function overloading
                };

                // Add composite ID if provided
                if (input.compositeId) {
                    params.p_composite_id = input.compositeId;
                    console.log('[editDB] Using provided composite ID:', input.compositeId);
                }

                // Add variation metadata if available
                if (input.createVariation && Object.keys(variationMetadata).length > 0) {
                    if (variationMetadata.title) params.p_variation_title = variationMetadata.title;
                    if (variationMetadata.description) params.p_variation_description = variationMetadata.description;
                    if (variationMetadata.type) params.p_variation_type = variationMetadata.type;
                }

                // Call the simplified database function that handles all the logic
                const { data, error } = await context.supabase.rpc('edit_content_with_validation', params);

                if (error) {
                    console.error('[editDB] Error calling edit_content_with_validation:', error);
                    logErrorDetails(error, 'Edit content with validation');

                    // Enhanced error reporting
                    let errorDetails = error.details || error.message;
                    let formattedError = {
                        success: false,
                        error: error.message,
                        details: errorDetails,
                        fullError: error
                    };

                    // Log more details for debugging
                    console.debug('[editDB] Full validation error:', JSON.stringify(formattedError, null, 2));

                    return formattedError;
                }

                return data;
            }
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