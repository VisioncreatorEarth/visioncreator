import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    listId: z.string(),
    items: z.array(z.object({
      name: z.string(),
      category: z.string(),
      icon: z.string().optional(),
      default_unit: z.string().optional(),
      quantity: z.number(),
      unit: z.string().optional(),
    }))
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    // Start a transaction
    const { data: result, error } = await context.supabase.rpc(
      'handle_shopping_list_update',
      {
        p_user_id: user.customClaims.id,
        p_list_id: input.listId,
        p_list_name: null,
        p_items: input.items
      }
    );

    if (error) {
      console.error('Error updating shopping list items:', error);
      throw new Error(error.message);
    }

    return result;
  },
});
