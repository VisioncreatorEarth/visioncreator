import { createOperation, z } from '../generated/wundergraph.factory';
import { AuthorizationError } from '@wundergraph/sdk/operations';

export default createOperation.mutation({
  input: z.object({
    listName: z.string()
  }),
  handler: async ({ context, input, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "User ID does not match." });
    }

    const { data: list, error } = await context.supabase
      .from("shopping_lists")
      .insert({
        name: input.listName,
        user_id: user?.customClaims?.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shopping list:", error);
      throw new Error("Failed to create shopping list");
    }

    return list;
  }
});
