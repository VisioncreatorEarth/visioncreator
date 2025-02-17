import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    schema: z.any()
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

      // Insert the schema with version and author
      const { data, error } = await context.supabase
        .from("db")
        .insert({
          json: input.schema,
          author: user.customClaims.id,
          version: 1
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
