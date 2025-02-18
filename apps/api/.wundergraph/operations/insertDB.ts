import { createOperation, z } from "../generated/wundergraph.factory";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { v4 as uuidv4 } from 'uuid';

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

// Create a separate validator instance for schemas with x-relation
const relationAjv = new Ajv({
  strict: false,
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
  validateFormats: true
});

addFormats(relationAjv);

// Add x-relation keyword only to the relation validator
relationAjv.addKeyword({
  keyword: 'x-relation',
  modifying: true,
  compile: (schema: any) => {
    return (data: any) => {
      // For relation fields, accept either a string (ID) or an object
      if (schema && typeof data === 'string') {
        return true; // Accept string IDs for relation fields
      }
      return true; // Default to true and let the type validation handle other cases
    };
  }
});

// Generic schema interface that can handle any JSON Schema
interface JSONSchema {
  type: string;
  title: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: JSONSchema | JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  allOf?: JSONSchema[];
  format?: string;
  default?: any;
  [key: string]: any; // Allow any additional properties
}

interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  format?: string;
  properties?: Record<string, SchemaProperty>;
  required?: boolean;
  'x-relation'?: {
    schemaId: string;
  };
  additionalProperties?: boolean;
  [key: string]: any;
}

export default createOperation.mutation({
  input: z.object({
    json: z.any(),
    type: z.enum(['schema', 'object']).default('object'),
    schema: z.string().uuid()
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

      // Generate a new variation ID for new items
      const variation = uuidv4();

      // If this is an object, validate it against its schema
      if (input.type === 'object') {
        let schemaData;
        const { data: activeSchema, error: schemaError } = await context.supabase
          .from("db")
          .select("json")
          .eq("id", input.schema)
          .single();

        if (schemaError || !activeSchema) {
          // Try to find schema in archive if not in active db
          const { data: archivedSchema, error: archiveError } = await context.supabase
            .from("db_archive")
            .select("json")
            .eq("id", input.schema)
            .single();

          if (archiveError || !archivedSchema) {
            throw new Error("Failed to fetch schema for validation");
          }
          schemaData = archivedSchema;
        } else {
          schemaData = activeSchema;
        }

        try {
          const schema = schemaData.json as JSONSchema;

          // Check if schema has any x-relation fields
          const hasRelations = Object.values(schema.properties || {}).some(
            (prop: any) => prop.type === 'object' && prop['x-relation']
          );

          // For schemas with relations, modify the schema to accept string IDs
          if (hasRelations) {
            const modifiedSchema = {
              ...schema,
              properties: Object.entries(schema.properties || {}).reduce((acc, [key, prop]: [string, any]) => {
                if (prop.type === 'object' && prop['x-relation']) {
                  // For relation fields, accept either string or object
                  acc[key] = {
                    oneOf: [
                      { type: 'string', format: 'uuid' },
                      { type: 'object' }
                    ],
                    'x-relation': prop['x-relation']
                  };
                } else {
                  acc[key] = prop;
                }
                return acc;
              }, {} as Record<string, any>)
            };

            // Use the modified schema for validation
            const validate = relationAjv.compile(modifiedSchema);
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
          } else {
            // For regular schemas without relations, use normal validation
            const validate = ajv.compile(schema);
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

          // Use processed data
          input.json = input.json;
        } catch (validationError) {
          console.error("Validation error:", validationError);
          return {
            success: false,
            error: "Validation error",
            details: validationError instanceof Error ? validationError.message : String(validationError)
          };
        }
      }

      const { data, error } = await context.supabase
        .from("db")
        .insert({
          json: input.json,
          author: user.customClaims.id,
          schema: input.schema,
          version: 1,
          prev: null
        })
        .select();

      if (error) {
        throw new Error("Database insert error: " + error.message);
      }

      return {
        success: true,
        insertedData: data[0]
      };
    } catch (error) {
      console.error("Error in insertDB:", error);
      return {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
