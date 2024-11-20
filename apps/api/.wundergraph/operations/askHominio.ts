import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

// Define categories and their default settings
const CATEGORIES = {
  Fruits: { icon: 'mdi:food-apple', defaultUnit: 'piece' },
  Vegetables: { icon: 'mdi:food-carrot', defaultUnit: 'piece' },
  Dairy: { icon: 'mdi:food-milk', defaultUnit: 'liter' },
  Meat: { icon: 'mdi:food-steak', defaultUnit: 'kilogram' },
  Bakery: { icon: 'mdi:food-croissant', defaultUnit: 'piece' },
  Beverages: { icon: 'mdi:cup', defaultUnit: 'liter' },
  Snacks: { icon: 'mdi:food-cookie', defaultUnit: 'piece' },
  Household: { icon: 'mdi:home', defaultUnit: 'piece' },
  Grains: { icon: 'mdi:grain', defaultUnit: 'kilogram' },
  'Personal Care': { icon: 'mdi:face-man', defaultUnit: 'piece' },
  Other: { icon: 'mdi:shopping', defaultUnit: 'piece' }
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
  handler: async ({ input, context, operations }) => {
    try {
      console.log("🎤 Starting Ultravox API call with prompts:", input.chat_message_prompts);

      const config = {
        systemPrompt: `You are Hominio, a friendly shopping assistant. 
        Always respond in English, even if the user speaks other languages. Always translate any item the user requested into its english equivalent.

1. Add items with quantities immediately
2. Only ask for missing quantities, and very short, f.e. "How many Bananas, How much milk etc."
3. Keep responses brief and focused on current items
4. Handle multiple actions in one request:
   - Adding new items
   - Marking items as completed (removing / toggling) or incomplete (adding new or toggling previously existing)
   - Acknowledging already owned items

Available units (be creative and use what makes most sense for each item):
piece, pack, box, can, bottle, jar, bag, carton, bundle, roll, tube, stick, slice, bunch, handful, pinch, scoop, cup, glass, liter, milliliter, gallon, kilogram, gram, ounce, pound, dozen, pair, set, strip, sheet, block, bar, tray, crate, basket

Feel free to use any other unit that makes sense for specific items.

Example Interactions:

User: "Add 2 liters milk and bread"
Assistant: "Added 2L milk and a bread"

User: "Ein Bierkasten Augustiner"
Assistant: "Added a crate of Augustiner (20)"

User: "10er Pack Eier und eine Packung Käse"
Assistant: "Added 10 eggs and a pack of cheese"

User: "Une baguette et deux croissants"
Assistant: "Added a baguette and 2 croissants"

User: "Add tomatoes and rice"
Assistant: "How many tomatoes and how much rice?"
User: "6 tomatoes and 1kg rice"
Assistant: "Added 6 tomatoes and 1kg rice"

Categories: ${Object.keys(CATEGORIES).join(', ')}`,
        temperature: 0.7,
        selectedTools: [
          {
            temporaryTool: {
              modelToolName: "manageShoppingList",
              description: "Manage shopping list items: add new items, toggle completion status, or remove items.",
              dynamicParameters: [
                {
                  name: "actions",
                  location: "PARAMETER_LOCATION_BODY",
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: {
                          type: "string",
                          enum: ["add", "toggle", "remove"],
                          description: "Action to perform: 'add' for new items, 'toggle' for marking complete/incomplete, 'remove' for removing items"
                        },
                        items: {
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
                                description: "Category the item belongs to."
                              },
                              quantity: {
                                type: "number",
                                description: "Quantity of the item. Default to 1 if not specified."
                              },
                              unit: {
                                type: "string",
                                description: "Unit of measurement: Available units (be creative and use what makes most sense for each item) - (f.e. kilogram, liter, piece, pack, box, can, bottle, jar, bag, carton, bundle, roll, tube, stick, slice, bunch, handful, pinch, scoop, cup, glass, liter, milliliter, gallon, kilogram, gram, ounce, pound, dozen, pair, set, strip, sheet, block, bar, tray, crate, basket) "
                              },
                              icon: {
                                type: "string",
                                description: "Iconify icon name. Use mdi (Material Design Icons) for food items (e.g., mdi:food-apple, mdi:food-croissant, mdi:food-drumstick, mdi:food-fork-drink). For beverages use mdi:cup* or mdi:bottle*. For household items use mdi:home* variants. Be creative and specific to the item type. Examples: mdi:food-apple for apples, mdi:bottle-wine for wine, mdi:broom for cleaning supplies."
                              }
                            },
                            required: ["name", "category"]
                          }
                        }
                      },
                      required: ["action", "items"]
                    }
                  },
                  required: true
                }
              ],
              client: {
                implementation: async (params: { actions: string }, context: any) => {
                  try {
                    const actions = JSON.parse(params.actions);
                    console.log('\n📝 Received actions:', actions);

                    const results = [];

                    for (const action of actions) {
                      if (action.action === 'add') {
                        const processedItems = action.items.map((item: any) => {
                          const category = Object.keys(CATEGORIES).find(
                            cat => cat.toLowerCase() === item.category.toLowerCase()
                          ) || 'Other';

                          const typedCategory = category as keyof typeof CATEGORIES;
                          const defaultUnit = CATEGORIES[typedCategory].defaultUnit;

                          return {
                            name: capitalizeFirstLetter(item.name),
                            category,
                            quantity: item.quantity || 1,
                            unit: item.unit || defaultUnit,
                            icon: item.icon || CATEGORIES[typedCategory].icon
                          };
                        });

                        // Add items
                        const { data: addResult, error: addError } = await operations.mutate({
                          operationName: 'updateShoppingListItems',
                          input: {
                            listId: '685b9b0b-33fa-4672-a634-7a95c0150018',
                            items: processedItems
                          }
                        });

                        if (addError) {
                          console.error('\n❌ Error adding items:', addError);
                          throw addError;
                        }

                        results.push({ action: 'add', items: processedItems, result: addResult });
                      } else if (action.action === 'toggle' || action.action === 'remove') {
                        // Handle both toggle and remove actions
                        for (const item of action.items) {
                          const itemName = capitalizeFirstLetter(item.name);
                          const { data: toggleResult, error: toggleError } = await operations.mutate({
                            operationName: 'toggleShoppingListItem',
                            input: {
                              listId: '685b9b0b-33fa-4672-a634-7a95c0150018',
                              itemName
                            }
                          });

                          if (toggleError) {
                            console.error(`\n❌ Error ${action.action === 'remove' ? 'removing' : 'toggling'} item:`, toggleError);
                            throw toggleError;
                          }

                          // If item doesn't exist and we're trying to toggle/remove, add it first
                          if (!toggleResult) {
                            const category = Object.keys(CATEGORIES).find(
                              cat => cat.toLowerCase() === (item.category || 'Other').toLowerCase()
                            ) || 'Other';

                            const typedCategory = category as keyof typeof CATEGORIES;
                            const defaultUnit = CATEGORIES[typedCategory].defaultUnit;

                            const processedItem = {
                              name: itemName,
                              category,
                              quantity: item.quantity || 1,
                              unit: item.unit || defaultUnit,
                              icon: item.icon || CATEGORIES[typedCategory].icon
                            };

                            const { data: addResult, error: addError } = await operations.mutate({
                              operationName: 'updateShoppingListItems',
                              input: {
                                listId: '685b9b0b-33fa-4672-a634-7a95c0150018',
                                items: [processedItem]
                              }
                            });

                            if (addError) {
                              console.error('\n❌ Error adding item:', addError);
                              throw addError;
                            }

                            // Now try toggling again
                            const { data: retryResult, error: retryError } = await operations.mutate({
                              operationName: 'toggleShoppingListItem',
                              input: {
                                listId: '685b9b0b-33fa-4672-a634-7a95c0150018',
                                itemName
                              }
                            });

                            if (retryError) {
                              console.error('\n❌ Error retrying toggle:', retryError);
                              throw retryError;
                            }

                            results.push({
                              action: action.action,
                              item: itemName,
                              result: retryResult
                            });
                          } else {
                            results.push({
                              action: action.action,
                              item: itemName,
                              result: toggleResult
                            });
                          }
                        }
                      }
                    }

                    console.log('\n✅ Actions completed:', results);

                    const message = results.map(r => {
                      if (r.action === 'add') {
                        return `Added: ${r.items.map((i: any) =>
                          `${i.quantity} ${i.unit}${i.quantity > 1 ? 's' : ''} of ${i.name}`
                        ).join(', ')}`;
                      } else if (r.action === 'toggle' || r.action === 'remove') {
                        return `${r.action === 'remove' ? 'Removed' : 'Toggled'}: ${r.item}`;
                      }
                      return '';
                    }).filter(Boolean).join('. ');

                    return {
                      success: true,
                      message
                    };
                  } catch (error) {
                    console.error('\n❌ Error processing actions:', error);
                    return {
                      success: false,
                      message: 'Failed to process actions: ' + (error instanceof Error ? error.message : String(error))
                    };
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
