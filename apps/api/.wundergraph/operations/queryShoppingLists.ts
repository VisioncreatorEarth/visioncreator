import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

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
            icon,
            default_unit
          )
        )
      `)
      .eq('user_id', user.customClaims.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shopping lists:', error);
      throw new Error(error.message);
    }

    return lists || [];
  },
});
