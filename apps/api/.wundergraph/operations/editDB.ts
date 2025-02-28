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


// Significantly simplified editDB operation that uses the unified database function
export default createOperation.mutation({
    input: z.object({
        id: z.string().uuid(),
        json: z.any(),
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
            // First, get the schema for this content to perform client-side validation
            const { data: contentData, error: contentError } = await context.supabase.rpc('get_content_schema', {
                p_id: input.id
            });

            if (contentError) {
                console.error('[editDB] Error retrieving content schema:', contentError);
                return {
                    success: false,
                    error: 'Failed to retrieve content schema',
                    details: contentError.message
                };
            }

            // Cast contentData to our type for TypeScript validation
            const schemaResponse = contentData as SchemaResponse;

            // If we have a schema, validate the content against it using Ajv
            if (schemaResponse.success && schemaResponse.schema_data) {
                const schema = schemaResponse.schema_data;
                const validate = ajv.compile(schema);
                const isValid = validate(input.json);

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
            } else {
                console.warn('[editDB] No schema found for validation, proceeding without client-side validation');
            }

            // Call the simplified database function that handles all the logic
            const { data, error } = await context.supabase.rpc('edit_content_with_validation', {
                p_id: input.id,
                p_json: input.json,
                p_user_id: user.customClaims.id,
                p_create_variation: input.createVariation
            });

            if (error) {
                console.error('[editDB] Error calling edit_content_with_validation:', error);

                // Enhanced error reporting
                let errorDetails = error.details || error.message;
                let formattedError = {
                    success: false,
                    error: error.message,
                    details: errorDetails
                };

                // Log more details for debugging
                console.debug('[editDB] Full validation error:', JSON.stringify(formattedError, null, 2));

                return formattedError;
            }

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