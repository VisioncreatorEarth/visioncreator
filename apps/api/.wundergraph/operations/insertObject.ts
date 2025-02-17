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
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ input, context, user }) => {
    try {
      if (!user?.customClaims?.id) {
        throw new Error("User not authenticated");
      }

      if (!input.object.schema_id) {
        throw new Error("Object must have a schema_id property");
      }

      // Insert the object with version and author
      const newObject = {
        type: "object",
        title: `New ${input.object.title} Object`,
        description: `Object created from ${input.object.title} schema`,
        schema_id: input.object.schema_id,
        ...input.object
      };

      const { data, error } = await context.supabase
        .from("db")
        .insert({
          json: newObject,
          author: user.customClaims.id,
          version: 1
        })
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
