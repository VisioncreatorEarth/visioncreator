import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    id: z.string().uuid(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ input, context, user }) => {
    if (input.id !== user?.customClaims?.id) {
      throw new AuthorizationError({ message: "User ID does not match." });
    }

    // Check if user is admin
    const isAdmin = input.id === "00000000-0000-0000-0000-000000000001";

    const { data, error } = await context.supabase
      .from("profiles")
      .update({ 
        onboarded: true, 
        // Only set active to true if not admin
        ...(isAdmin ? {} : { active: true })
      })
      .eq("id", input.id)
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
