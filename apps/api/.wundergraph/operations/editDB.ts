import { createOperation, z } from '../generated/wundergraph.factory';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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

// Initialize Ajv with formats and keywords
const ajv = new Ajv({
    strict: false,
    allErrors: true,
    coerceTypes: true,
    useDefaults: true,
    validateFormats: true,
    removeAdditional: false, // Allow additional properties not in schema
    validateSchema: true, // Validate schemas themselves
});

// Add standard formats
addFormats(ajv);

// Add custom keywords for extended validation
ajv.addKeyword({
    keyword: 'validateIf',
    type: 'object',
    validate: (schema: any, data: any, parentSchema: any) => {
        // Conditional validation based on other fields
        return true; // Implement conditional logic if needed
    },
    errors: true
});

export default createOperation.mutation({
    input: z.object({
        id: z.string().uuid(),
        json: z.any(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }) => {
        try {
            // First, get the current item to find its schema
            const { data: currentItem, error: fetchError } = await context.supabase
                .from("db")
                .select("schema, json")
                .eq("id", input.id)
                .single();

            if (fetchError || !currentItem) {
                throw new Error("Failed to fetch current item");
            }

            const currentDBItem = currentItem as DBItem;

            // Special handling for schema updates (meta-schema)
            if (currentDBItem.schema === '00000000-0000-0000-0000-000000000001') {
                // For schema updates, validate against meta-schema
                const metaSchema = {
                    type: 'object',
                    required: ['type', 'properties'],
                    properties: {
                        type: { type: 'string', enum: ['object'] },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        properties: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                required: ['type', 'title'],
                                properties: {
                                    type: { type: 'string' },
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    format: { type: 'string' },
                                    pattern: { type: 'string' },
                                    minimum: { type: 'number' },
                                    maximum: { type: 'number' },
                                    minLength: { type: 'integer', minimum: 0 },
                                    maxLength: { type: 'integer', minimum: 0 },
                                    required: { type: 'boolean' },
                                    nullable: { type: 'boolean' },
                                    properties: { type: 'object' }, // For nested objects
                                    items: { type: 'object' }, // For arrays
                                    errorMessage: { type: 'object' },
                                    validate: { type: 'object' } // For custom validation rules
                                }
                            }
                        },
                        required: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        display_field: { type: 'string' },
                        additionalProperties: { type: 'boolean' }
                    }
                };

                const validate = ajv.compile(metaSchema);
                const valid = validate(input.json);

                if (!valid) {
                    return {
                        success: false,
                        error: "Schema validation failed",
                        details: validate.errors?.map(err => ({
                            field: err.instancePath.slice(1),
                            message: err.message,
                            keyword: err.keyword,
                            params: err.params
                        }))
                    };
                }
            } else {
                // For regular objects, get their schema for validation
                let schemaData: SchemaData;
                const { data: activeSchema, error: schemaError } = await context.supabase
                    .from("db")
                    .select("json")
                    .eq("id", currentDBItem.schema)
                    .single();

                if (schemaError || !activeSchema) {
                    // Try to find schema in archive if not in active db
                    const { data: archivedSchema, error: archiveError } = await context.supabase
                        .from("db_archive")
                        .select("json")
                        .eq("id", currentDBItem.schema)
                        .single();

                    if (archiveError || !archivedSchema) {
                        throw new Error("Failed to fetch schema for validation");
                    }
                    schemaData = archivedSchema as SchemaData;
                } else {
                    schemaData = activeSchema as SchemaData;
                }

                // Validate against the object's schema
                const validate = ajv.compile(schemaData.json);
                const valid = validate(input.json);

                if (!valid) {
                    return {
                        success: false,
                        error: "Validation failed",
                        details: validate.errors?.map(err => ({
                            field: err.instancePath.slice(1),
                            message: err.message,
                            keyword: err.keyword,
                            params: err.params
                        }))
                    };
                }
            }

            // If validation passes, proceed with the update
            const { data: result, error } = await context.supabase.rpc('update_db_version', {
                p_id: input.id,
                p_json: input.json
            });

            if (error) throw error;

            return {
                success: true,
                updatedData: result
            };
        } catch (error) {
            console.error("Error in editDB:", error);
            return {
                success: false,
                error: "Unexpected error",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    },
}); 