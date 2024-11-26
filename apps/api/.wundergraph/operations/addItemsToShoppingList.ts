import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

// Define categories and their default settings
const CATEGORIES = {
  Fruits: { icon: 'mdi:fruit-watermelon', defaultUnit: 'kg' },
  Vegetables: { icon: 'mdi:carrot', defaultUnit: 'kg' },
  Dairy: { icon: 'mdi:milk', defaultUnit: 'l' },
  Meat: { icon: 'mdi:food-steak', defaultUnit: 'kg' },
  Bakery: { icon: 'mdi:bread-slice', defaultUnit: 'pcs' },
  Beverages: { icon: 'mdi:cup', defaultUnit: 'l' },
  Snacks: { icon: 'mdi:cookie', defaultUnit: 'pcs' },
  Household: { icon: 'mdi:home', defaultUnit: 'pcs' },
  Grains: { icon: 'mdi:grain', defaultUnit: 'kg' },
  'Personal Care': { icon: 'mdi:face-man', defaultUnit: 'pcs' },
  Other: { icon: 'mdi:shopping', defaultUnit: 'pcs' }
} as const;

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Helper function to get category defaults
const getCategoryDefaults = (category: string) => {
  const normalizedCategory = Object.keys(CATEGORIES).find(
    cat => cat.toLowerCase() === category.toLowerCase()
  ) || 'Other';
  return {
    category: normalizedCategory,
    ...CATEGORIES[normalizedCategory as keyof typeof CATEGORIES]
  };
};

// Helper function for retrying database operations
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};

export default createOperation.mutation({
  input: z.object({
    action: z.enum(['add', 'remove']),
    items: z.array(z.object({
      name: z.string(),
      category: z.string(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      icon: z.string().optional()
    }))
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: 'No authenticated user found.' });
    }

    try {
      // 1. Get or create default shopping list
      const listId = await retryOperation(async () => {
        const { data: lists, error: listError } = await context.supabase
          .from('shopping_lists')
          .select('id, name')
          .eq('user_id', user.customClaims.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (listError) throw new Error('Error fetching shopping lists: ' + listError.message);

        if (!lists || lists.length === 0) {
          const { data: newList, error: createError } = await context.supabase
            .from('shopping_lists')
            .insert([{ name: 'My Shopping List', user_id: user.customClaims.id }])
            .select()
            .single();

          if (createError) throw new Error('Error creating default shopping list: ' + createError.message);
          return newList.id;
        }
        return lists[0].id;
      });

      // 2. Process items in batches
      const results = await Promise.all(input.items.map(async (item) => {
        const categoryDefaults = getCategoryDefaults(item.category);

        // Find or create the item
        const itemId = await retryOperation(async () => {
          const { data: existingItems, error: findError } = await context.supabase
            .from('shopping_items')
            .select('id')
            .eq('name', capitalizeFirstLetter(item.name))
            .eq('category', categoryDefaults.category)
            .limit(1);

          if (findError) throw new Error('Error finding item: ' + findError.message);

          if (!existingItems || existingItems.length === 0) {
            const { data: newItem, error: createItemError } = await context.supabase
              .from('shopping_items')
              .insert([{
                name: capitalizeFirstLetter(item.name),
                category: categoryDefaults.category,
                icon: item.icon || categoryDefaults.icon,
                default_unit: categoryDefaults.defaultUnit
              }])
              .select()
              .single();

            if (createItemError) throw new Error('Error creating item: ' + createItemError.message);
            return newItem.id;
          }
          return existingItems[0].id;
        });

        // Update shopping list items
        await retryOperation(async () => {
          if (input.action === 'add') {
            const { error: upsertError } = await context.supabase
              .from('shopping_list_items')
              .upsert([{
                shopping_list_id: listId,
                item_id: itemId,
                quantity: item.quantity || 1,
                unit: item.unit || categoryDefaults.defaultUnit,
                is_checked: false
              }], {
                onConflict: 'shopping_list_id,item_id'
              });

            if (upsertError) throw new Error('Error adding item to list: ' + upsertError.message);
          } else {
            const { error: toggleError } = await context.supabase
              .from('shopping_list_items')
              .update({ is_checked: true })
              .eq('shopping_list_id', listId)
              .eq('item_id', itemId);

            if (toggleError) throw new Error('Error toggling item: ' + toggleError.message);
          }
        });

        return { success: true, itemId, action: input.action };
      }));

      return { success: true, listId, results };
    } catch (error) {
      console.error('Error in addItemsToShoppingList:', error);
      throw error;
    }
  }
});
