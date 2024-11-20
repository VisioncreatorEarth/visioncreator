import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

const DEFAULT_LIST_ID = 'c6daf86b-aba0-4d4b-80ce-7294b38825cb';

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

interface UltravoxConfig {
  systemPrompt: string;
  temperature: number;
  selectedTools: Array<{
    temporaryTool: {
      modelToolName: string;
      description: string;
      dynamicParameters: Array<{
        name: string;
        location: string;
        schema: {
          type: string;
          enum?: string[];
          description: string;
          properties?: Record<string, any>;
        };
        required: boolean;
      }>;
      client: Record<string, any>;
    };
  }>;
  voice: string;
}

export default createOperation.mutation({
  input: z.object({
    chat_message_prompts: z.array(z.string()).min(1)
  }),
  errors: [UltravoxInitializationError, UltravoxSubscriptionError, UltravoxAuthenticationError],
  handler: async ({ input, context, operations }) => {
    try {
      console.log("🎤 Starting Ultravox API call with prompts:", input.chat_message_prompts);
      console.log("⏰ Timestamp:", new Date().toISOString());

      const config: UltravoxConfig = {
        systemPrompt: `You are Hominio, a friendly shopping assistant. 
        Always respond in English, even if the user speaks other languages. Always translate any item the user requested into its english equivalent, before adding it to the shopping list.

Key Behaviors:
1. Add items with quantities immediately
2. Only ask for missing quantities
3. Keep responses brief and focused on current items
4. Only show newly added items, not the full list

Example Interactions:

User: "Add 2 liters milk and bread"
Assistant: "Added: Milk (2 l). How many pieces of bread would you like?"

User: "3 Stück Brot und 1 kg Kartoffeln" (German)
Assistant: "Added:
- Bread: 3 pcs
- Potatoes: 1 kg
Need anything else?"

Example of Units:
- kg: Fruits, Vegetables, Meat, Grains
- l: Beverages, Dairy
- pcs: Others

Also make sure that always pronounce the units in full form, not the abbreviations.  

Categories: ${Object.keys(CATEGORIES).join(', ')}`,
        temperature: 0.7,
        selectedTools: [
          {
            temporaryTool: {
              modelToolName: "addShoppingItems",
              description: "Add items to the shopping list with their categories and quantities",
              dynamicParameters: [
                {
                  name: "items",
                  location: "PARAMETER_LOCATION_BODY",
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description: "Name of the item (first letter capitalized)"
                        },
                        category: {
                          type: "string",
                          enum: Object.keys(CATEGORIES),
                          description: "Category of the item"
                        },
                        quantity: {
                          type: "number",
                          description: "Quantity of the item"
                        },
                        unit: {
                          type: "string",
                          description: "Unit of measurement (e.g., kg, l, pcs)"
                        }
                      },
                      required: ["name", "category"]
                    },
                    description: "List of items to add to the shopping list"
                  },
                  required: true
                }
              ],
              client: {
                implementation: async (params: { items: string }) => {
                  console.log('\n🛒 Tool Execution: addShoppingItems');
                  console.log('⏰ Tool Called at:', new Date().toISOString());
                  console.log('📦 Items to Add:', params);

                  try {
                    const items = JSON.parse(params.items);
                    const processedItems = items.map((item: any) => {
                      const categoryDefaults = getCategoryDefaults(item.category);
                      return {
                        name: capitalizeFirstLetter(item.name),
                        category: categoryDefaults.category,
                        quantity: item.quantity || 1,
                        unit: item.unit || categoryDefaults.defaultUnit,
                        icon: categoryDefaults.icon,
                        default_unit: categoryDefaults.defaultUnit,
                      };
                    });

                    const result = await operations.mutate({
                      operationName: 'updateShoppingListItems',
                      input: {
                        listId: DEFAULT_LIST_ID,
                        items: processedItems
                      }
                    });

                    if (!result.data) {
                      throw new Error('Failed to update shopping list: ' + (result.error?.message || 'Unknown error'));
                    }

                    console.log('✅ DB Operation Result:', JSON.stringify(result.data, null, 2));
                    console.log(`📊 Summary: Added ${items.length} items to list ${DEFAULT_LIST_ID}`);

                    return {
                      success: true,
                      result: {
                        items: result.data,
                        listId: DEFAULT_LIST_ID,
                        message: `Successfully added ${items.length} items to the shopping list`
                      }
                    };
                  } catch (error) {
                    console.error('❌ Error processing items:', error);
                    throw error;
                  }
                }
              }
            }
          }
        ],
        voice: "b0e6b5c1-3100-44d5-8578-9015aa3023ae"
      };

      const response = await context.ultravox.call(config);

      console.log("\n📞 Ultravox Call Complete");
      console.log("⏰ End Timestamp:", new Date().toISOString());
      console.log("🎉 Response Status:", {
        success: response.success,
        message: response.message,
        callId: response.callId,
        hasTranscript: !!response.transcript,
        hasToolExecutions: !!response.toolExecutions
      });

      return {
        data: response
      };
    } catch (error) {
      console.error('❌ Error in askHominio:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },
});
