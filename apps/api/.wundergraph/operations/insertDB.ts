import { createOperation, z } from "../generated/wundergraph.factory";
import Ajv from "ajv";
import addFormats from "ajv-formats";

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

      // If this is an object, validate it against its schema
      if (input.type === 'object') {
        const { data: schemaData, error: schemaError } = await context.supabase
          .from("db")
          .select("json")
          .eq("id", input.schema)
          .single();

        if (schemaError || !schemaData) {
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
        }

        try {
          const schema = schemaData.json as JSONSchema;

          // Process input data to handle null/undefined/empty values
          const processValue = (value: any, propertySchema: any): any => {
            if (value === null || value === undefined || value === '') {
              // Handle date fields specially
              if (propertySchema.title === 'Birth Date') {
                return null;
              }
              // For required fields, keep empty string, otherwise null
              return propertySchema.required ? '' : null;
            }

            // Handle date values
            if (propertySchema.title === 'Birth Date') {
              try {
                const date = new Date(value);
                return date.toISOString().split('T')[0];
              } catch {
                return null;
              }
            }

            return value;
          };

          const processObject = (obj: any, schemaProps: any): any => {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
              const propSchema = schemaProps[key] || {};
              if (typeof value === 'object' && value !== null && propSchema.properties) {
                result[key] = processObject(value, propSchema.properties);
              } else {
                result[key] = processValue(value, propSchema);
              }
            }
            return result;
          };

          // Process the input data
          const processedJson = processObject(input.json, schema.properties || {});

          // Validate
          const validate = ajv.compile(schema);
          const valid = validate(processedJson);

          if (!valid) {
            return {
              success: false,
              error: "Validation failed",
              details: validate.errors
            };
          }

          // Use processed data
          input.json = processedJson;
        } catch (validationError) {
          console.error("Validation error:", validationError);
          return {
            success: false,
            error: "Validation error",
            details: validationError instanceof Error ? validationError.message : String(validationError)
          };
        }
      }

      // Insert new version
      const { data, error } = await context.supabase
        .from("db")
        .insert({
          json: input.json,
          author: user.customClaims.id,
          schema: input.schema,
          version: 1,
          prev: null // New items don't have previous versions
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
      console.error(`Error in insertDB (${input.type}):`, error);
      return {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
