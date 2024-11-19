import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    itemId: z.string(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    const { data: isChecked, error } = await context.supabase.rpc(
      'toggle_shopping_list_item',
      {
        p_user_id: user.customClaims.id,
        p_item_id: input.itemId
      }
    );

    if (error) {
      console.error('Error toggling shopping list item:', error);
      throw new Error(error.message);
    }

    return { id: input.itemId, is_checked: isChecked };
  },
});
