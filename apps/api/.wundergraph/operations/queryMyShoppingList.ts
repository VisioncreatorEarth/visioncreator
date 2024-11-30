import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    try {
      // Get the user's shopping list or create a default one
      const { data: lists, error } = await context.supabase
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
            created_at,
            updated_at,
            shopping_items (
              id,
              name,
              category,
              icon
            )
          )
        `)
        .eq('user_id', user.customClaims.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching shopping list:', error);
        throw new Error('Failed to fetch shopping list');
      }

      // Return the first list or create a default one if none exists
      if (!lists || lists.length === 0) {
        const { data: newList, error: createError } = await context.supabase
          .from('shopping_lists')
          .insert([{
            name: 'My Shopping List',
            user_id: user.customClaims.id
          }])
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
              created_at,
              updated_at,
              shopping_items (
                id,
                name,
                category,
                icon
              )
            )
          `)
          .single();

        if (createError) {
          console.error('Error creating default shopping list:', createError);
          throw new Error('Failed to create default shopping list');
        }

        return newList;
      }

      return lists[0];
    } catch (error) {
      console.error('Error in queryMyShoppingList:', error);
      throw error;
    }
  }
});
