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
    // if (input.id !== user?.customClaims?.id) {
    //   console.error("Authorization Error: User ID does not match.");
    //   throw new AuthorizationError({ message: "User ID does not match." });
    // }
    //
    // Fetch user's name from Supabase
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("name")
      .eq("id", input.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    const userName = profile.name || "";
    console.log("User profile fetched. Name:", userName);

    try {
      console.log("Checking for existing subscriber with email:", input.email);
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
      console.log("Subscribers found:", subscribers.length);

      if (subscribers.length === 0) {
        console.log("No subscriber found. Creating new subscriber...");
        // No subscriber, create new and confirm subscription to list [3]
        const addResponse = await context.nango.proxy({
          method: "POST",
          endpoint: "/subscribers",
          connectionId: "listmonk-vc",
          providerConfigKey: "listmonk",
          data: {
            email: input.email,
            name: userName,
            status: "enabled",
            lists: [3],
            preconfirm_subscriptions: true, // This ensures the subscription is confirmed
          },
        });
        console.log("New subscriber added:", addResponse.data.data);
        return {
          action: "added",
          success: addResponse.data.data,
          isSubscribed: true,
        };
      } else {
        const subscriber = subscribers[0];
        console.log("Existing subscriber found:", subscriber);
        const isBlocklisted = subscriber.status === "blocklisted";
        const isSubscribedToList3 = subscriber.lists.some(
          (list: any) =>
            list.id === 3 && list.subscription_status === "confirmed"
        );
        console.log(
          "Subscriber status - Blocklisted:",
          isBlocklisted,
          "Subscribed to List 3:",
          isSubscribedToList3
        );

        if (!isBlocklisted && isSubscribedToList3) {
          console.log("Subscriber is active and subscribed. Blocklisting...");
          // Subscribed and not blocklisted, blocklist
          const blockResponse = await context.nango.proxy({
            method: "PUT",
            endpoint: `/subscribers/${subscriber.id}/blocklist`,
            connectionId: "listmonk-vc",
            providerConfigKey: "listmonk",
          });
          console.log("Blocklist response:", blockResponse.data);
          return {
            action: "blocklisted",
            success: blockResponse.data.data,
            isSubscribed: false,
          };
        } else {
          console.log(
            "Subscriber needs resubscription. Updating and confirming..."
          );
          // Either blocklisted or not subscribed to list 3, resubscribe and confirm
          const updateResponse = await context.nango.proxy({
            method: "PUT",
            endpoint: `/subscribers/${subscriber.id}`,
            connectionId: "listmonk-vc",
            providerConfigKey: "listmonk",
            data: {
              email: input.email,
              name: userName,
              status: "enabled",
            },
          });
          console.log("Update response:", updateResponse.data);

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
          console.log("Add to list response:", addToListResponse.data);

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
