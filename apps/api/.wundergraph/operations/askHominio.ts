import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

// Define categories and their default settings
const CATEGORIES = {
  Fruits: { icon: '🍎', defaultUnit: 'kilogram' },
  Vegetables: { icon: '🥕', defaultUnit: 'kilogram' },
  Dairy: { icon: '🥛', defaultUnit: 'liter' },
  Meat: { icon: '🥩', defaultUnit: 'kilogram' },
  Bakery: { icon: '🍞', defaultUnit: 'piece' },
  Beverages: { icon: '🥤', defaultUnit: 'liter' },
  Snacks: { icon: '🍪', defaultUnit: 'piece' },
  Household: { icon: '🏠', defaultUnit: 'piece' },
  Grains: { icon: '🌾', defaultUnit: 'kilogram' },
  'Personal Care': { icon: '🧴', defaultUnit: 'piece' },
  Other: { icon: '🛍️', defaultUnit: 'piece' }
} as const;

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default createOperation.mutation({
  input: z.object({
    chat_message_prompts: z.array(z.string()).min(1)
  }),
  errors: [UltravoxInitializationError, UltravoxSubscriptionError, UltravoxAuthenticationError],
  handler: async ({ input, context }) => {
    try {
      console.log("🎤 Starting Ultravox API call with prompts:", input.chat_message_prompts);

      const config = {
        systemPrompt: `You are Hominio, a friendly shopping assistant. 
        Always respond in English, even if the user speaks other languages. Always translate any item the user requested into its english equivalent.

Key Behaviors:
1. Add items with quantities immediately
2. Only ask for missing quantities, and very short, f.e. "How many Bananas, How much milk etc."
3. Keep responses brief and focused on current items

Example Interactions:

User: "Add 2 liters milk and bread"
Assistant: "Added: 2 liters of Milk. How much bread do you want?"

User: "3 Stück Brot und 1 kg Kartoffeln" (German)
Assistant: "Added:
- 3 pieces of Bread
- 1 kilo of Potatoes
Need anything else?"

Always speak out the units in full form, not the abbreviations, for example: "1 kilogram" instead of "1 kg"

Categories: ${Object.keys(CATEGORIES).join(', ')}`,
        temperature: 0.7,
        selectedTools: [
          {
            temporaryTool: {
              modelToolName: "addShoppingItems",
              description: "Add items to the shopping list immediately when user mentions any item. Call this tool for EVERY item mentioned, even without quantity.",
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
                          description: "Name of the item in English. Always translate non-English items." 
                        },
                        category: { 
                          type: "string", 
                          enum: Object.keys(CATEGORIES),
                          description: "Category the item belongs to. Required." 
                        },
                        quantity: { 
                          type: "number",
                          description: "Quantity of the item. Default to 1 if not specified."
                        },
                        unit: { 
                          type: "string",
                          description: "Unit of measurement (kilogram, liter, piece). Use category default if not specified."
                        }
                      },
                      required: ["name", "category"]
                    }
                  },
                  required: true
                }
              ],
              client: {
                implementation: async (params: { items: string }) => {
                  try {
                    const items = JSON.parse(params.items);
                    console.log('\n📝 Received items:', items);
                    
                    const processedItems = items.map((item: any) => {
                      // Find category, defaulting to 'Other' if not found
                      const category = Object.keys(CATEGORIES).find(
                        cat => cat.toLowerCase() === item.category.toLowerCase()
                      ) || 'Other';
                      
                      // Get default unit for category
                      const defaultUnit = CATEGORIES[category as keyof typeof CATEGORIES].defaultUnit;
                      
                      // Process item with defaults
                      return {
                        name: capitalizeFirstLetter(item.name),
                        category,
                        quantity: item.quantity || 1,
                        unit: item.unit || defaultUnit,
                        icon: CATEGORIES[category as keyof typeof CATEGORIES].icon
                      };
                    });

                    console.log('\n✅ Processed items:', processedItems);
                    
                    return {
                      success: true,
                      items: processedItems,
                      message: `Added ${processedItems.map(item => 
                        `${item.quantity} ${item.unit}${item.quantity > 1 ? 's' : ''} of ${item.name}`
                      ).join(', ')}`
                    };
                  } catch (error) {
                    console.error('\n❌ Error processing items:', error);
                    throw error;
                  }
                }
              }
            }
          }
        ],
        voice: "b0e6b5c1-3100-44d5-8578-9015aa3023ae",
        transcriptOptional: false,
        initialOutputMedium: "MESSAGE_MEDIUM_VOICE",
        firstSpeaker: "FIRST_SPEAKER_AGENT",
        maxDuration: "3600s",
        joinTimeout: "60s"
      };

      const response = await context.ultravox.call(config);
      console.log("\n📞 Ultravox Call Complete:", {
        status: response.status,
        joinUrl: response.joinUrl,
        timestamp: new Date().toISOString()
      });

      return { 
        data: {
          ...response,
          status: 'active',
          transcript: response.transcript || ''
        }
      };
    } catch (error) {
      console.error('❌ Error:', {
        error,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
});
