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

// Helper function to get default variant units based on category and name
function getDefaultVariantUnits(category: string, name: string) {
  const specialCases: Record<string, any> = {
    'Eggs': [
      { unit: 'pcs', multiplier: 1, description: 'Single egg' },
      { unit: '6-pack', multiplier: 6, description: 'Half dozen' },
      { unit: '10-pack', multiplier: 10, description: 'Ten pack' },
      { unit: '12-pack', multiplier: 12, description: 'Dozen' }
    ],
    'Bread': [
      { unit: 'pcs', multiplier: 1, description: 'Single loaf' },
      { unit: 'slices', multiplier: 0.05, description: 'Bread slice' }
    ]
  };

  const lowerName = name.toLowerCase();
  if (specialCases[lowerName]) {
    return specialCases[lowerName];
  }

  // Default variant units based on category
  switch (category.toLowerCase()) {
    case 'fruits':
    case 'vegetables':
      return [
        { unit: 'kg', multiplier: 1, description: 'Kilogram' },
        { unit: 'pcs', description: 'Piece' }
      ];
    case 'dairy':
      return [
        { unit: 'l', multiplier: 1, description: 'Liter' },
        { unit: 'ml', multiplier: 0.001, description: 'Milliliter' }
      ];
    default:
      return [];
  }
}

export default createOperation.mutation({
  input: z.object({
    listId: z.string(),
    items: z.array(z.object({
      name: z.string(),
      category: z.string(),
      icon: z.string().optional(),
      default_unit: z.string().optional(),
      variant_units: z.array(z.object({
        unit: z.string(),
        multiplier: z.number().optional(),
        description: z.string().optional()
      })).optional(),
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

    // Process items with proper capitalization and defaults
    const processedItems = input.items.map(item => {
      const categoryDefaults = getCategoryDefaults(item.category);
      const defaultVariantUnits = getDefaultVariantUnits(item.category, item.name);
      
      return {
        ...item,
        name: capitalizeFirstLetter(item.name),
        category: categoryDefaults.category,
        icon: item.icon || categoryDefaults.icon,
        default_unit: item.default_unit || categoryDefaults.defaultUnit,
        unit: item.unit || categoryDefaults.defaultUnit,
        variant_units: item.variant_units || defaultVariantUnits
      };
    });

    // Start a transaction
    const { data: result, error } = await context.supabase.rpc(
      'handle_shopping_list_update',
      {
        p_user_id: user.customClaims.id,
        p_list_id: input.listId,
        p_list_name: null,
        p_items: processedItems
      }
    );

    if (error) {
      console.error('Error updating shopping list items:', error);
      throw new Error(error.message);
    }

    return result;
  },
});