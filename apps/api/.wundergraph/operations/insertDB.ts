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

          // Enhanced processValue function to handle all JSON Schema formats
          const processValue = (value: any, propertySchema: any): any => {
            // Handle null/undefined/empty values
            if (value === null || value === undefined || value === '') {
              // If the field is nullable and not required, return null
              if (propertySchema.nullable && !propertySchema.required) {
                return null;
              }
              // For required fields, keep empty string if string type
              return propertySchema.required && propertySchema.type === 'string' ? '' : null;
            }

            // Type coercion based on schema type
            switch (propertySchema.type) {
              case 'string':
                // Handle specific string formats
                if (propertySchema.format) {
                  switch (propertySchema.format) {
                    case 'date':
                      try {
                        const date = new Date(value);
                        return date.toISOString().split('T')[0];
                      } catch {
                        return null;
                      }
                    case 'date-time':
                      try {
                        const date = new Date(value);
                        return date.toISOString();
                      } catch {
                        return null;
                      }
                    case 'email':
                      return String(value).toLowerCase().trim();
                    // Add other format handlers as needed
                  }
                }
                return String(value);

              case 'number':
                const num = Number(value);
                return isNaN(num) ? null : num;

              case 'integer':
                const int = parseInt(value);
                return isNaN(int) ? null : int;

              case 'boolean':
                if (typeof value === 'string') {
                  return value.toLowerCase() === 'true';
                }
                return Boolean(value);

              case 'array':
                if (!Array.isArray(value)) {
                  return propertySchema.required ? [] : null;
                }
                // Process each array item according to items schema
                if (propertySchema.items) {
                  return value.map(item => processValue(item, propertySchema.items));
                }
                return value;

              default:
                return value;
            }
          };

          // Enhanced processObject function with better nested object handling
          const processObject = (obj: any, schemaProps: any): any => {
            const result: any = {};

            // First, handle all defined properties in schema
            for (const [key, propSchema] of Object.entries(schemaProps)) {
              if (obj.hasOwnProperty(key)) {
                if (propSchema.type === 'object' && propSchema.properties) {
                  result[key] = processObject(obj[key] || {}, propSchema.properties);
                } else {
                  result[key] = processValue(obj[key], propSchema);
                }
              } else if (propSchema.required) {
                // Handle required properties that are missing
                result[key] = propSchema.type === 'object' && propSchema.properties
                  ? processObject({}, propSchema.properties)
                  : processValue(null, propSchema);
              }
            }

            // Handle additional properties if allowed
            if (schemaProps.additionalProperties !== false) {
              for (const [key, value] of Object.entries(obj)) {
                if (!schemaProps.hasOwnProperty(key)) {
                  result[key] = value;
                }
              }
            }

            return result;
          };

          // Process the input data
          const processedJson = processObject(input.json, schema.properties || {});

          // Validate using ajv
          const validate = ajv.compile(schema);
          const valid = validate(processedJson);

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
