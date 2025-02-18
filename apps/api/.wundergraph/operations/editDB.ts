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
                                    required: {
                                        oneOf: [
                                            { type: 'boolean' },
                                            {
                                                type: 'array',
                                                items: { type: 'string' }
                                            }
                                        ]
                                    },
                                    nullable: { type: 'boolean' },
                                    properties: { type: 'object' },
                                    items: { type: 'object' },
                                    errorMessage: { type: 'object' },
                                    validate: { type: 'object' },
                                    'x-relation': {
                                        type: 'object',
                                        properties: {
                                            schemaId: { type: 'string', format: 'uuid' },
                                            type: { type: 'string', enum: ['single', 'multiple'] }
                                        },
                                        required: ['schemaId']
                                    }
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
                            field: err.instancePath.slice(1) || 'root',
                            message: err.message,
                            keyword: err.keyword,
                            params: err.params,
                            schemaPath: err.schemaPath
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

                // Modify the schema to handle relation fields at any nesting level
                const modifiedSchema = modifySchemaForRelations(schemaData.json);

                // Validate against the modified schema
                const validate = ajv.compile(modifiedSchema);
                const valid = validate(input.json);

                if (!valid) {
                    return {
                        success: false,
                        error: "Validation failed",
                        details: validate.errors?.map(err => ({
                            field: err.instancePath.slice(1) || 'root',
                            message: err.message,
                            keyword: err.keyword,
                            params: err.params,
                            schemaPath: err.schemaPath
                        }))
                    };
                }
            }

            // If validation passes, proceed with the update
            const { data: result, error } = await context.supabase.rpc('update_db_version', {
                p_id: input.id,
                p_json: input.json
            });

            if (error) {
                console.error("Database error in editDB:", error);
                throw new Error(`Database error: ${error.message}`);
            }

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