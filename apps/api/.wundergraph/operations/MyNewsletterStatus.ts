import {
  z,
  createOperation,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.query({
  input: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, input, user }) => {
    if (input.id !== user?.customClaims?.id) {
      console.error("Authorization Error: User ID does not match.");
      throw new AuthorizationError({ message: "User ID does not match." });
    }
    try {
      const checkResponse = await context.nango.proxy({
        method: "GET",
        endpoint: "/subscribers",
        connectionId: "listmonk-vc",
        providerConfigKey: "listmonk",
        params: {
          query: `subscribers.email='${input.email}'`,
          page: "1",
          per_page: "1",
        },
      });

      const subscribers = checkResponse.data.data.results;

      if (subscribers.length > 0) {
        const subscriber = subscribers[0];
        const isBlocklisted = subscriber.status === "blocklisted";
        const isSubscribedToList3 = subscriber.lists.some(
          (list: any) =>
            list.id === 3 && list.subscription_status === "confirmed"
        );

        // Return true if the subscriber is not blocklisted AND is subscribed to list 3
        return !isBlocklisted && isSubscribedToList3;
      }

      return false;
    } catch (error) {
      console.error("Failed to check newsletter subscription status:", error);
      throw new Error("Failed to check newsletter subscription status");
    }
  },
});
