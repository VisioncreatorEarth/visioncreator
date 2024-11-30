import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    listName: z.string().min(1).max(100),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    const { data, error } = await context.supabase
      .from('shopping_lists')
      .insert([
        {
          name: input.listName,
          user_id: user.customClaims.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating shopping list:', error);
      throw new Error(error.message);
    }

    return data;
  },
});
