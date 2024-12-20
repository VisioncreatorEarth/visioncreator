import {
  z,
  createOperation,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ user, context }) => {
    if (!user?.customClaims?.id) {
      console.error("Authorization Error: User ID does not match.");
      throw new AuthorizationError({ message: "User ID does not match." });
    }
    //
    // Fetch user's name from Supabase
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("name")
      .eq("id", user?.customClaims?.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    const userName = profile.name || "";

    try {
      const checkResponse = await context.nango.proxy({
        method: "GET",
        endpoint: "/subscribers",
        connectionId: "listmonk-vc",
        providerConfigKey: "listmonk",
        params: {
          query: `subscribers.email='${user.email}'`,
          page: "1",
          per_page: "1",
        },
      });

      const subscribers = checkResponse.data.data.results;

      if (subscribers.length === 0) {
        // No subscriber, create new and confirm subscription to list [3]
        const addResponse = await context.nango.proxy({
          method: "POST",
          endpoint: "/subscribers",
          connectionId: "listmonk-vc",
          providerConfigKey: "listmonk",
          data: {
            email: user.email,
            name: userName,
            status: "enabled",
            lists: [3],
            preconfirm_subscriptions: true, // This ensures the subscription is confirmed
          },
        });
        return {
          action: "added",
          success: addResponse.data.data,
          isSubscribed: true,
        };
      } else {
        const subscriber = subscribers[0];
        const isBlocklisted = subscriber.status === "blocklisted";
        const isSubscribedToList3 = subscriber.lists.some(
          (list: any) =>
            list.id === 3 && list.subscription_status === "confirmed"
        );

        if (!isBlocklisted && isSubscribedToList3) {
          // Subscribed and not blocklisted, blocklist
          const blockResponse = await context.nango.proxy({
            method: "PUT",
            endpoint: `/subscribers/${subscriber.id}/blocklist`,
            connectionId: "listmonk-vc",
            providerConfigKey: "listmonk",
          });
          return {
            action: "blocklisted",
            success: blockResponse.data.data,
            isSubscribed: false,
          };
        } else {
          // Either blocklisted or not subscribed to list 3, resubscribe and confirm
          const updateResponse = await context.nango.proxy({
            method: "PUT",
            endpoint: `/subscribers/${subscriber.id}`,
            connectionId: "listmonk-vc",
            providerConfigKey: "listmonk",
            data: {
              email: user.email,
              name: userName,
              status: "enabled",
            },
          });

          // Add to list [3] and confirm subscription
          const addToListResponse = await context.nango.proxy({
            method: "PUT",
            endpoint: "/subscribers/lists",
            connectionId: "listmonk-vc",
            providerConfigKey: "listmonk",
            data: {
              ids: [subscriber.id],
              action: "add",
              target_list_ids: [3],
              status: "confirmed",
            },
          });

          return {
            action: "resubscribed",
            success: updateResponse.data.data && addToListResponse.data,
            isSubscribed: true,
          };
        }
      }
    } catch (error) {
      console.error("Failed to toggle newsletter subscription:", error);
      throw new Error("Failed to toggle newsletter subscription");
    }
  },
});
