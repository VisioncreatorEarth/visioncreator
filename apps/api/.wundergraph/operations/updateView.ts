import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
  input: z.object({
    id: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    render: z.any().optional(),
    stateMachine: z.any().optional(),
    customConfig: z.any().optional(),
    isActive: z.boolean().optional(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, input, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    // Get current view to check version
    const { data: currentView } = await context.supabase
      .from("views")
      .select("version")
      .eq("id", input.id)
      .single();

    if (!currentView) {
      throw new Error("View not found");
    }

    // Parse current version and increment patch number
    const [major, minor, patch] = currentView.version.split(".").map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;

    // Create history record
    await context.supabase.from("views_history").insert([
      {
        view_id: input.id,
        version: currentView.version,
        created_by: user.customClaims.id,
        metadata: {
          name: input.name,
          description: input.description || "",
          composer: "ComposeView241119",
        },
        render: input.render,
        state_machine: input.stateMachine || {},
        custom_config: input.customConfig || {},
      },
    ]);

    const metadata = {
      name: input.name,
      description: input.description || "",
      composer: "ComposeView241119",
    };

    const { data: view, error } = await context.supabase
      .from("views")
      .update({
        metadata,
        version: newVersion,
        is_active: input.isActive ?? true,
        render: input.render,
        state_machine: input.stateMachine || {},
        custom_config: input.customConfig || {},
        updated_by: user.customClaims.id,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating view:", error);
      throw new Error("Failed to update view");
    }

    return {
      metadata: {
        id: view.id,
        version: view.version,
        isActive: view.is_active,
        name: view.metadata?.name || "Untitled View",
        description: view.metadata?.description || "",
        author: view.created_by,
        composer: view.metadata?.composer,
        createdAt: view.created_at,
        updatedAt: view.updated_at,
        createdBy: view.created_by,
        updatedBy: view.updated_by
      },
      render: view.render,
      stateMachine: view.state_machine,
      customConfig: view.custom_config,
    };
  },
});
