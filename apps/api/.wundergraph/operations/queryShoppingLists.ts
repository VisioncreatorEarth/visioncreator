import { createOperation, z } from '../generated/wundergraph.factory';
import { AuthorizationError } from '@wundergraph/sdk/operations';

export default createOperation.query({
  input: z.object({
    userId: z.string()
  }),
  handler: async ({ input, user, context }) => {
    if (input.userId !== user?.customClaims?.id) {
      throw new AuthorizationError({ message: "User ID does not match." });
    }

    const { data: lists, error: listsError } = await context.supabase
      .from('shopping_lists')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        shopping_list_items (
          id,
          quantity,
          unit,
          is_checked,
          shopping_items (
            id,
            name,
            icon,
            category,
            default_unit
          )
        )
      `)
      .eq('user_id', input.userId)
      .order('created_at', { ascending: false });

    if (listsError) {
      console.error("Error fetching shopping lists:", listsError);
      throw new Error("Failed to fetch shopping lists");
    }

    return lists;
  },
});
