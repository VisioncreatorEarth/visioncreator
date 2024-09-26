import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    userId: z.string().uuid(),
  }),
  handler: async ({ input, context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", input.userId)
      .select();

    if (error) {
      console.error("Error toggling onboarded status:", error);
      return {
        success: false,
        message: "Failed to toggle onboarded status",
      };
    }

    return {
      success: true,
      message: "Onboarded status toggled successfully",
      data: data[0],
    };
  },
});
