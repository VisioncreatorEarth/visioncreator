import {
  createOperation,
  z,
  AuthorizationError,
} from "../generated/wundergraph.factory";

const defaultViewConfig = {
  id: 'HelloEarth',
  layout: {
    areas: `
      "main"
    `,
    overflow: 'auto',
  },
  children: [
    {
      id: 'xyz1',
      component: 'HelloEarth',
      slot: 'main',
      map: {
        "name": "Human",
        "description": "Nice to have you around, this is your first HominioView"
      },
    }
  ]
};

export default createOperation.mutation({
  input: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    render: z.any().optional(),
    stateMachine: z.any().optional(),
    customConfig: z.any().optional(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ context, input, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    const metadata = {
      name: input.name || "Brilliant View",
      description: input.description || "",
      composer: "ComposeView241119",
    };

    const { data: view, error } = await context.supabase
      .from("views")
      .insert([
        {
          metadata,
          version: "0.0.1",
          is_active: true,
          render: input.render || defaultViewConfig,
          state_machine: input.stateMachine || {},
          custom_config: input.customConfig || {},
          created_by: user.customClaims.id,
          updated_by: user.customClaims.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating view:", error);
      throw new Error("Failed to create view");
    }

    return {
      metadata: {
        id: view.id,
        version: view.version,
        isActive: view.is_active,
        name: view.metadata?.name || "Unnamed View",
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
