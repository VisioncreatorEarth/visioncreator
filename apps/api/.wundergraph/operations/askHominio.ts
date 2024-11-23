import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

// Call configuration
const CALL_CONFIG = {
  defaultSystemPrompt: `
  You are a friendly shopping assistant. Please help me with my shopping list. Always use the updateShoppingList tool to add items to the shopping list.

  Available Categories and their Icons:
  - Vegetables (🥕 mdi:carrot, 🥦 mdi:food-broccoli, 🌿 mdi:leaf)
  - Fruits (🍉 mdi:fruit-watermelon, 🍎 mdi:food-apple, 🍒 mdi:fruit-cherries)
  - Meat (🥩 mdi:food-steak, 🦃 mdi:food-turkey, 🐟 mdi:fish)
  - Grains (🍝 mdi:pasta, 🍚 mdi:rice, 🌾 mdi:grain)
  - Bakery (🍞 mdi:bread-slice, 🥐 mdi:croissant, 🍪 mdi:cookie)
  - Beverages (☕ mdi:cup, 🥤 mdi:bottle-soda, ☕ mdi:coffee)
  - Dairy (🧀 mdi:cheese, 🥛 mdi:milk, 🥚 mdi:egg)
  - Snacks (🍪 mdi:cookie, 🥔 mdi:food-potato, 🍬 mdi:candy)
  - Personal Care (👤 mdi:face-man, 🦷 mdi:toothbrush, 🧴 mdi:lotion)
  - Household (🏠 mdi:home, 🧺 mdi:washing-machine, 🧹 mdi:broom)
  - Other (🛒 mdi:shopping)

  Common Items Per Category:
  - Fruits: Bananas, Apples, Oranges, Strawberries, Grapes, Peaches, Pineapple, Mango
  - Vegetables: Broccoli, Carrots, Tomatoes, Lettuce, Cucumber, Bell Peppers, Spinach, Onions, Potatoes, Garlic
  - Dairy: Milk, Cheese, Yogurt, Butter, Cream, Sour Cream, Cottage Cheese
  - Bakery: Bread, Croissant, Bagels, Muffins, Baguette, Donuts, Cake

  When adding items:
  1. Always specify the category from the list above
  2. Use appropriate units (e.g., kg, pcs, l)
  3. Include quantity with each item
  4. Try to match items with their correct icons when possible
  `,
  voice: 'b0e6b5c1-3100-44d5-8578-9015aa3023ae', // Jessica voice ID
  temperature: 0.8,
  maxDuration: '120s', // 2 minutes in seconds
  timeExceededMessage: 'Maximum calltime exceeded. See you next time!',
  firstSpeaker: 'FIRST_SPEAKER_USER',
} as const;

// Define client tools
const shoppingListTool = {
  temporaryTool: {
    modelToolName: 'updateShoppingList',
    description: 'Update shopping list items. Call this when items are added, removed, or modified.',
    dynamicParameters: [
      {
        name: 'items',
        location: 'PARAMETER_LOCATION_BODY',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the item' },
              quantity: { type: 'number', description: 'Quantity of the item' },
              category: { type: 'string', description: 'Category of the item' },
              icon: { type: 'string', description: 'Icon for the item' },
              default_unit: { type: 'string', description: 'Default unit for the item' },
              variant_units: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    unit: { type: 'string' },
                    multiplier: { type: 'number' },
                    description: { type: 'string' }
                  }
                }
              },
              unit: { type: 'string', description: 'Unit for this item' }
            },
            required: ['name', 'quantity', 'category']
          }
        },
        required: true
      }
    ],
    client: {}
  }
};

export default createOperation.mutation({
  input: z.object({
    action: z.enum(['create', 'end']),
    callId: z.string().optional(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  errors: [UltravoxInitializationError, UltravoxAuthenticationError],
  handler: async ({ input, context }) => {
    try {
      if (input.action === 'create') {
        const callParams = {
          systemPrompt: CALL_CONFIG.defaultSystemPrompt,
          voice: CALL_CONFIG.voice,
          temperature: CALL_CONFIG.temperature,
          maxDuration: CALL_CONFIG.maxDuration,
          timeExceededMessage: CALL_CONFIG.timeExceededMessage,
          firstSpeaker: CALL_CONFIG.firstSpeaker,
          selectedTools: [shoppingListTool]
        };

        console.log('📞 Creating call with params:', callParams);
        const result = await context.ultravox.createCall(callParams);

        if (!result?.data?.callId || !result?.data?.joinUrl) {
          console.error('❌ Invalid call data received:', result);
          throw new Error('Invalid call data received from Ultravox');
        }

        return {
          callId: result.data.callId,
          joinUrl: result.data.joinUrl
        };

      } else if (input.action === 'end' && input.callId) {
        await context.ultravox.endCall(input.callId);
        return { success: true };
      }

      throw new Error('Invalid action or missing callId');
    } catch (error) {
      console.error('❌ Operation error:', error);
      throw error;
    }
  }
});