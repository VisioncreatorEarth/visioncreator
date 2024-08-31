import {
  z,
  createOperation,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, input, user }) => {
    console.log("Newsletter toggle initiated for user:", input.id);
    if (input.id !== user?.customClaims?.id) {
      console.error("Authorization Error: User ID does not match.");
      throw new AuthorizationError({ message: "User ID does not match." });
    }
    console.log("Authorization passed. Fetching user profile...");
    // Fetch user's name from Supabase
    return "Geht doch";
  },
});
