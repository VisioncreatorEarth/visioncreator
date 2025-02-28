import { createOperation, z } from '../generated/wundergraph.factory';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';


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
            console.log('[editDB] Starting edit operation with input:', {
                id: input.id,
                jsonKeys: typeof input.json === 'object' && input.json ? Object.keys(input.json) : [],
                createVariation: input.createVariation
            });

            // Call the simplified database function that handles all the logic
            const { data, error } = await context.supabase.rpc('edit_content_with_validation', {
                p_id: input.id,
                p_json: input.json,
                p_user_id: user.customClaims.id,
                p_create_variation: input.createVariation
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