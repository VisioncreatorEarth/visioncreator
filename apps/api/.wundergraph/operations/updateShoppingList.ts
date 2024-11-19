import { createOperation, z } from '../generated/wundergraph.factory';
import { AuthorizationError } from '@wundergraph/sdk/operations';

export default createOperation.mutation({
  input: z.object({
    userId: z.string(),
    listId: z.string().optional(),
    listName: z.string(),
    items: z.array(z.object({
      name: z.string(),
      category: z.string(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      icon: z.string().optional(),
      default_unit: z.string().optional()
    }))
  }),
  handler: async ({ context, input, user }) => {
    if (input.userId !== user?.customClaims?.id) {
      throw new AuthorizationError({ message: "User ID does not match." });
    }

    // Start a transaction
    const { data: result, error } = await context.supabase.rpc('handle_shopping_list_update', {
      p_user_id: input.userId,
      p_list_id: input.listId,
      p_list_name: input.listName,
      p_items: input.items
    });

    if (error) {
      console.error("Error updating shopping list:", error);
      throw new Error("Failed to update shopping list");
    }

    return result;
  }
});
