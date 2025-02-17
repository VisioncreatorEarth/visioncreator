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
      console.log("[insertObject] Received input:", JSON.stringify(input.object, null, 2));

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
        console.error("[insertObject] Failed to fetch schema:", schemaError);
        throw new Error("Failed to fetch schema: " + schemaError.message);
      }

      console.log("[insertObject] Found schema:", JSON.stringify(schemaData.json, null, 2));

      // Validate the object against its schema
      const validate = ajv.compile(schemaData.json);
      const valid = validate(input.object);

      if (!valid) {
        console.error("[insertObject] Validation errors:", validate.errors);
        throw new Error("Validation error: " + ajv.errorsText(validate.errors));
      }

      // Insert the validated object
      const { data, error } = await context.supabase
        .from("db")
        .insert({ json: input.object })
        .select();

      if (error) {
        console.error("[insertObject] Database insert error:", error);
        throw new Error("Database insert error: " + error.message);
      }

      console.log("[insertObject] Successfully inserted object:", data[0].id);
      return {
        success: true,
        insertedData: data[0]
      };
    } catch (error) {
      console.error("[insertObject] Error:", error);
      return {
        success: false,
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  },
});
