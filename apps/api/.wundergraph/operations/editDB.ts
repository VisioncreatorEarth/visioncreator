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

// Initialize Ajv with formats
const ajv = new Ajv({
    strict: false,
    allErrors: true,
    coerceTypes: true,
    useDefaults: true,
    validateFormats: true
});

// Add custom date format validation
ajv.addFormat("date", {
    validate: (dateStr: string) => {
        if (!dateStr) return true; // Allow empty/null values
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date.getTime());
    }
});

addFormats(ajv);

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
                .select("schema")
                .eq("id", input.id)
                .single();

            if (fetchError || !currentItem) {
                throw new Error("Failed to fetch current item");
            }

            const currentDBItem = currentItem as DBItem;

            // Get the schema for validation
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

            // Validate against schema
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