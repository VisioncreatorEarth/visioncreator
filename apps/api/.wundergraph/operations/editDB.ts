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
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new Error("User not authenticated or missing ID");
        }

        try {
            console.log('[editDB] Starting edit operation with input:', {
                id: input.id,
                jsonKeys: typeof input.json === 'object' && input.json ? Object.keys(input.json) : []
            });

            // First, get the current item to find its schema
            let currentItem;
            let fetchError;
            let isArchived = false;

            // Try active db first
            const activeResult = await context.supabase
                .from("db")
                .select("schema, json, version, author")
                .eq("id", input.id)
                .single();

            if (activeResult.error || !activeResult.data) {
                console.log('[editDB] Item not found in active db, checking archive');
                // Try archive if not found in active
                const archiveResult = await context.supabase
                    .from("db_archive")
                    .select("schema, json, version, author")
                    .eq("id", input.id)
                    .single();

                currentItem = archiveResult.data;
                fetchError = archiveResult.error;
                isArchived = true;
            } else {
                currentItem = activeResult.data;
                fetchError = activeResult.error;
            }

            if (fetchError || !currentItem) {
                console.error('[editDB] Failed to fetch current item:', {
                    error: fetchError,
                    id: input.id,
                    checkedLocations: ['db', 'db_archive']
                });
                throw new Error("Failed to fetch current item");
            }

            console.log('[editDB] Successfully fetched current item:', {
                schema: currentItem.schema,
                jsonKeys: typeof currentItem.json === 'object' && currentItem.json ? Object.keys(currentItem.json) : [],
                isArchived
            });

            const currentDBItem = currentItem as DBItem & { version: number; author: string };

            // Special handling for schema updates (meta-schema)
            if (currentDBItem.schema === '00000000-0000-0000-0000-000000000001') {
                console.log('[editDB] Processing schema update (meta-schema)');

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
                    console.error('[editDB] Schema validation failed:', {
                        errors: validate.errors
                    });
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
                console.log('[editDB] Schema validation passed');
            } else {
                console.log('[editDB] Processing regular item update');
                // For regular objects, get their schema for validation
                let schemaData: SchemaData;
                const { data: activeSchema, error: schemaError } = await context.supabase
                    .from("db")
                    .select("json")
                    .eq("id", currentDBItem.schema)
                    .single();

                if (schemaError || !activeSchema) {
                    console.log('[editDB] Schema not found in active db, checking archive');
                    // Try to find schema in archive if not in active db
                    const { data: archivedSchema, error: archiveError } = await context.supabase
                        .from("db_archive")
                        .select("json")
                        .eq("id", currentDBItem.schema)
                        .single();

                    if (archiveError || !archivedSchema) {
                        console.error('[editDB] Failed to fetch schema for validation:', {
                            activeError: schemaError,
                            archiveError: archiveError,
                            schemaId: currentDBItem.schema
                        });
                        throw new Error("Failed to fetch schema for validation");
                    }
                    schemaData = archivedSchema as SchemaData;
                    console.log('[editDB] Found schema in archive');
                } else {
                    schemaData = activeSchema as SchemaData;
                    console.log('[editDB] Found schema in active db');
                }

                console.log('[editDB] Validating against schema:', {
                    schemaType: schemaData.json.type,
                    schemaProperties: Object.keys(schemaData.json.properties || {})
                });

                // Modify the schema to handle relation fields at any nesting level
                const modifiedSchema = modifySchemaForRelations(schemaData.json);

                // Validate against the modified schema
                const validate = ajv.compile(modifiedSchema);
                const valid = validate(input.json);

                if (!valid) {
                    console.error('[editDB] Validation failed:', {
                        errors: validate.errors
                    });
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
                console.log('[editDB] Validation passed');
            }

            // If the item is archived, create a new clone first
            if (isArchived) {
                console.log('[editDB] Creating new clone for archived item');
                const newId = crypto.randomUUID();

                // Keep only the actual data in the json field, not system fields
                const newJson = { ...input.json };
                // Remove any system fields from json if they were accidentally included
                delete newJson.version;
                delete newJson.prev;
                delete newJson.created_at;
                delete newJson.author;
                delete newJson.schema;

                console.log('[editDB] Inserting new clone:', {
                    id: newId,
                    prev: input.id
                });

                // Insert the clone into active db
                const { data: cloneResult, error: cloneError } = await context.supabase
                    .from('db')
                    .insert({
                        id: newId,
                        json: currentDBItem.json, // Use the original json for the clone
                        schema: currentDBItem.schema,
                        author: user.customClaims.id,
                        version: 1,
                        prev: input.id
                    })
                    .select()
                    .single();

                if (cloneError) {
                    console.error('[editDB] Failed to create clone:', cloneError);
                    throw new Error(`Failed to create clone: ${cloneError.message}`);
                }

                console.log('[editDB] Successfully created clone, now updating it');

                // Now update the clone with the new content
                const { data: updateResult, error: updateError } = await context.supabase.rpc('update_db_version', {
                    p_id: newId,
                    p_json: newJson,
                    p_current_user_id: user.customClaims.id
                });

                if (updateError) {
                    console.error('[editDB] Failed to update clone:', updateError);
                    throw new Error(`Failed to update clone: ${updateError.message}`);
                }

                console.log('[editDB] Successfully updated clone');

                // Find composites that might be using this content
                const { data: composites } = await context.supabase
                    .from('composites')
                    .select('id')
                    .eq('compose_id', input.id);

                if (composites && composites.length > 0) {
                    console.log('[editDB] Found composites using this content:', {
                        count: composites.length,
                        compositeIds: composites.map(c => c.id)
                    });
                }

                return {
                    success: true,
                    updatedData: updateResult
                };
            }

            // For active items, proceed with normal update
            // Remove system fields from json before update
            const cleanJson = { ...input.json };
            delete cleanJson.version;
            delete cleanJson.prev;
            delete cleanJson.created_at;
            delete cleanJson.author;
            delete cleanJson.schema;

            console.log('[editDB] Calling update_db_version procedure with cleaned json');
            const { data: result, error } = await context.supabase.rpc('update_db_version', {
                p_id: input.id,
                p_json: cleanJson,
                p_current_user_id: user.customClaims.id
            });

            if (error) {
                console.error('[editDB] Database error:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            console.log('[editDB] Update successful');
            return {
                success: true,
                updatedData: result
            };
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