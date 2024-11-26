import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, user }) => {
    if (!user?.customClaims?.id) {
      return { views: [] };
    }

    const { data: views, error } = await context.supabase
      .from("views")
      .select(`
        id,
        created_at,
        updated_at,
        created_by,
        updated_by,
        version,
        is_active,
        metadata,
        render,
        state_machine,
        custom_config
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching views:", error);
      throw new Error("Failed to fetch views");
    }

    return {
      views: views.map((view) => ({
        metadata: {
          id: view.id,
          version: view.version,
          isActive: view.is_active,
          name: view.metadata?.name || "Untitled View",
          description: view.metadata?.description || "",
          author: view.created_by,
          composer: "ComposeView241119",
          createdAt: view.created_at,
          updatedAt: view.updated_at,
          createdBy: view.created_by,
          updatedBy: view.updated_by
        },
        render: view.render,
        stateMachine: view.state_machine,
        customConfig: view.custom_config
      }))
    };
  },
});
