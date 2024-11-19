import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, user }) => {
    if (!user?.customClaims?.id) {
      console.error("Authorization Error: No authenticated user found.");
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, name, onboarded")
      .eq("id", user.customClaims.id)
      .single();

    if (error) {
      console.error("Error fetching user details:", error);
      throw new Error("Failed to fetch user details");
    }

    return {
      id: profiles.id,
      name: profiles.name,
      onboarded: profiles.onboarded,
    };
  },
});
