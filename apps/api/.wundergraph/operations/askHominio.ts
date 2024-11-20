import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

const DEFAULT_LIST_ID = '685b9b0b-33fa-4672-a634-7a95c0150018';

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

const config: UltravoxConfig = {
  systemPrompt: `You are Hominio, a friendly shopping assistant. 
  Always respond in English, even if the user speaks other languages. Always translate any item the user requested into its english equivalent, before adding it to the shopping list.

Key Behaviors:
1. Add items with quantities immediately
2. Only ask for missing quantities, and very short, f.e. "How many Bananas, How much milk etc."
3. Keep responses brief and focused on current items
4. Only show newly added items, not the full list

Example Interactions:

User: "Add 2 liters milk and bread"
Assistant: "Added: Milk (2 liters). How many pieces of bread would you like?"

User: "3 Stück Brot und 1 kg Kartoffeln" (German)
Assistant: "Added:
- Bread: 3 pieces
- Potatoes: 1 kilogram
Need anything else?"

Example of Units:
- kilogram: Fruits, Vegetables, Meat, Grains
- liter: Beverages, Dairy
- piece: Others

Always speak out the units in full form, not the abbreviations, for example: "1 kilogram" instead of "1 kg"

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
                    description: "Unit of measurement (e.g., kilogram, liter, piece)"
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
            const startTime = new Date();
            console.log('\n🛒 Tool Execution: addShoppingItems');
            console.log('⏰ Tool Called at:', new Date().toISOString());
            console.log('📦 Items to Add:', params);

            try {
              // Parse and normalize items
              const items = JSON.parse(params.items);
              const processedItems = new Map();

              // Single-pass processing for all items
              items.forEach((item: any) => {
                const key = `${item.name.toLowerCase()}-${item.category.toLowerCase()}`;
                const existingItem = processedItems.get(key);

                if (existingItem) {
                  if (item.quantity) {
                    existingItem.quantity = Math.max(existingItem.quantity || 0, item.quantity);
                  }
                } else {
                  const defaults = getCategoryDefaults(item.category);
                  // Convert abbreviated units to full form
                  const unitMap = {
                    'kg': 'kilogram',
                    'g': 'gram',
                    'l': 'liter',
                    'ml': 'milliliter',
                    'pcs': 'piece'
                  };
                  
                  const unit = item.unit ? (unitMap[item.unit] || item.unit) : defaults.defaultUnit;

                  processedItems.set(key, {
                    name: capitalizeFirstLetter(item.name),
                    category: defaults.category,
                    quantity: item.quantity || 1,
                    unit: unit,
                    icon: defaults.icon,
                    default_unit: unit
                  });
                }
              });

              const finalItems = Array.from(processedItems.values());

              // Return processed items for the handler to update the database
              return {
                success: true,
                items: finalItems
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

export default createOperation.mutation({
  input: z.object({
    chat_message_prompts: z.array(z.string()).min(1)
  }),
  errors: [UltravoxInitializationError, UltravoxSubscriptionError, UltravoxAuthenticationError],
  handler: async ({ input, context, operations }) => {
    try {
      console.log("🎤 Starting Ultravox API call with prompts:", input.chat_message_prompts);
      console.log("⏰ Timestamp:", new Date().toISOString());

      const response = await context.ultravox.call(config);

      // Process any tool executions from the response
      if (response.toolExecutions?.length > 0) {
        for (const execution of response.toolExecutions) {
          if (execution.success && execution.result) {
            const result = JSON.parse(execution.result);
            if (result.success && result.items) {
              // Update the shopping list with the processed items
              const dbResult = await operations.mutate({
                operationName: 'updateShoppingListItems',
                input: {
                  listId: DEFAULT_LIST_ID,
                  items: result.items
                }
              });

              if (!dbResult.data) {
                throw new Error('Failed to update shopping list: ' + (dbResult.error?.message || 'Unknown error'));
              }

              console.log('✅ DB Operation Result:', JSON.stringify(dbResult.data, null, 2));
              console.log(`📊 Summary: Added ${result.items.length} items to list ${DEFAULT_LIST_ID}`);
            }
          }
        }
      }

      console.log("\n📞 Ultravox Call Complete");
      console.log("⏰ End Timestamp:", new Date().toISOString());
      console.log("🎉 Response Status:", {
        success: response.success,
        message: response.message,
        callId: response.callId,
        hasTranscript: !!response.transcript,
        hasToolExecutions: !!response.toolExecutions,
        callStatus: response.status || 'active'
      });

      return {
        data: {
          ...response,
          callStatus: response.status || 'active'
        }
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
