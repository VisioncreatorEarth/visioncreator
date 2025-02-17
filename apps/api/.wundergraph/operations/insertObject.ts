import { createOperation, z } from "../generated/wundergraph.factory";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// Initialize Ajv with formats and basic configuration
const ajv = new Ajv({
  strict: false,
  validateSchema: false,
  allErrors: true
});
addFormats(ajv);

export default createOperation.mutation({
  input: z.object({
    object: z.any(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["admin"],
  },
  handler: async ({ input, context }) => {
    try {
      if (!input.object.schema_id) {
        throw new Error("Object must have a schema_id property");
      }

      // Fetch the schema
      const { data: schemaData, error: schemaError } = await context.supabase
        .from("db")
        .select("json")
        .eq("id", input.object.schema_id)
        .single();

      if (schemaError) {
        throw new Error("Failed to fetch schema: " + schemaError.message);
      }

      // Validate the object against its schema
      const validate = ajv.compile(schemaData.json);
      const valid = validate(input.object);

      if (!valid) {
        throw new Error("Validation error: " + ajv.errorsText(validate.errors));
      }

      // Insert the validated object
      const { data, error } = await context.supabase
        .from("db")
        .insert({ json: input.object })
        .select();

      if (error) {
        throw new Error("Database insert error: " + error.message);
      }

      return {
        success: true,
        insertedData: data[0]
      };
    } catch (error) {
      console.error("Error in insertObject:", error);
      return {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
