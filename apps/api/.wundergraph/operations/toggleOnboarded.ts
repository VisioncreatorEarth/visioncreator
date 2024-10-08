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

    const { data, error } = await context.supabase
      .from("profiles")
      .update({ onboarded: true })
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
