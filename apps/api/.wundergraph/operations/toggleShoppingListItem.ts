import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    listId: z.string(),
    itemName: z.string()
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    // First get the item ID
    const { data: listItem, error: findError } = await context.supabase
      .from('shopping_list_items')
      .select('id, is_checked, shopping_items!inner(name)')
      .eq('shopping_list_id', input.listId)
      .ilike('shopping_items.name', input.itemName)
      .single();

    if (findError) {
      console.error('Error finding shopping list item:', findError);
      throw new Error(findError.message);
    }

    if (!listItem) {
      throw new Error(`Item "${input.itemName}" not found in list`);
    }

    // Toggle the item
    const { data: updatedItem, error: updateError } = await context.supabase
      .from('shopping_list_items')
      .update({ is_checked: !listItem.is_checked })
      .eq('id', listItem.id)
      .select('id, is_checked')
      .single();

    if (updateError) {
      console.error('Error toggling shopping list item:', updateError);
      throw new Error(updateError.message);
    }

    return updatedItem;
  },
});