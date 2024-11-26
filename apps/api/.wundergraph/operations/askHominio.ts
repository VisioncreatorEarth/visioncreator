import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

// Call configuration
const CALL_CONFIG = {
  defaultSystemPrompt: `
  You are a friendly shopping assistant. Please help me with my shopping list. Always use the updateShoppingList tool to add items to the shopping list.

  Available Categories and their Icons:
  - Vegetables (mdi:carrot, mdi:food-broccoli, mdi:leaf)
  - Fruits (mdi:fruit-watermelon, mdi:food-apple, mdi:fruit-cherries)
  - Meat (mdi:food-steak, mdi:food-turkey, mdi:fish)
  - Grains (mdi:pasta, mdi:rice, mdi:grain)
  - Bakery (mdi:bread-slice, mdi:croissant, mdi:cookie)
  - Beverages (mdi:cup, mdi:bottle-soda, mdi:coffee)
  - Dairy (mdi:cheese, mdi:milk, mdi:egg)
  - Snacks (mdi:cookie, mdi:food-potato, mdi:candy)
  - Personal Care (mdi:face-man, mdi:toothbrush, mdi:lotion)
  - Household (mdi:home, mdi:washing-machine, mdi:broom)
  - Other (mdi:shopping)

  Common Items Per Category:
  - Fruits: Bananas, Apples, Oranges, Strawberries, Grapes, Peaches, Pineapple, Mango
  - Vegetables: Broccoli, Carrots, Tomatoes, Lettuce, Cucumber, Bell Peppers, Spinach, Onions, Potatoes, Garlic
  - Dairy: Milk, Cheese, Yogurt, Butter, Cream, Sour Cream, Cottage Cheese
  - Bakery: Bread, Croissant, Bagels, Muffins, Baguette, Donuts, Cake

  When adding items:
  1. Always specify the category from the list above
  2. Use appropriate units (e.g., kg, pcs, l or any other unit that would make sense for the item)
  3. Include quantity with each item, if not specified, default to 1
  4. Try to match items with their correct icons when possible
  5. Always execute FIRST the tool and then respond with the items you added. f.e. "Added 3 Apples and 5 Mangos, anything else"

  Never tell the about anything technical or json or which tool and scheam use in the interaction, just use and exceute the tools in the background. Always respond in a friendly and helpful manner for ordinaire conversations with a normal non-technical Human. 
  Never appologize for errors just execute the tools. if the tool response gives an error, let the user know and continue the conversation.
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
  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new Error('User ID not found');
    }

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

        const { data: dbCallId, error: startError } = await context.supabase
          .rpc('start_hominio_call', {
            p_user_id: user.customClaims.id,
            p_ultravox_call_id: result.data.callId,
            p_ultravox_join_url: result.data.joinUrl,
            p_voice_id: CALL_CONFIG.voice,
            p_system_prompt: CALL_CONFIG.defaultSystemPrompt,
            p_temperature: CALL_CONFIG.temperature,
            p_max_duration: CALL_CONFIG.maxDuration,
            p_first_speaker: CALL_CONFIG.firstSpeaker
          })
          .single();

        if (startError) {
          try {
            await context.ultravox.endCall(result.data.callId);
          } catch (cleanupError) {
            console.error('Failed to cleanup Ultravox call after database error:', cleanupError);
          }
          throw new Error('Failed to start call tracking: ' + startError.message);
        }

        return {
          callId: dbCallId,
          ultravoxCallId: result.data.callId,
          joinUrl: result.data.joinUrl
        };

      } else if (input.action === 'end' && input.callId) {
        try {
          // Get the Ultravox call ID from the database
          const { data: callData, error: lookupError } = await context.supabase
            .from('hominio_calls')
            .select('ultravox_call_id')
            .eq('id', input.callId)
            .single();

          if (lookupError || !callData?.ultravox_call_id) {
            console.error('❌ Error looking up call:', lookupError);
            throw new Error('Could not find call in database');
          }

          const ultravoxCallId = callData.ultravox_call_id;

          // End the call first
          await context.ultravox.endCall(ultravoxCallId);

          // Wait a moment for the call to fully end
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Try to get the transcript
          let transcript = null;
          try {
            const transcriptResponse = await context.ultravox.getCallTranscript(ultravoxCallId);
            if (transcriptResponse.error) {
              console.error('❌ Error getting transcript:', transcriptResponse.error);
            } else if (transcriptResponse.data?.transcript) {
              transcript = transcriptResponse.data.transcript;
            }
          } catch (transcriptError) {
            console.error('❌ Error retrieving transcript:', transcriptError);
          }

          // Update the database using the end_hominio_call function
          const { data: endCallResult, error: endError } = await context.supabase
            .rpc('end_hominio_call', {
              p_user_id: user.customClaims.id,
              p_call_id: input.callId, // This is the database ID
              p_end_reason: 'user_ended',
              p_transcript: transcript ? JSON.stringify(transcript) : null,
              p_tool_executions: null
            });

          if (endError) {
            console.error('❌ Error updating call in database:', endError);
            throw endError;
          }

          // Delete the call from Ultravox
          try {
            await context.ultravox.deleteCall(ultravoxCallId);
          } catch (deleteError) {
            console.error('❌ Error deleting call:', deleteError);
          }

          return {
            success: true,
            transcript,
            callData: endCallResult
          };
        } catch (error) {
          // If anything fails, try to mark the call as errored
          try {
            await context.supabase
              .rpc('mark_hominio_call_error', {
                p_user_id: user.customClaims.id,
                p_call_id: input.callId,
                p_error_message: error instanceof Error ? error.message : 'Unknown error'
              });
          } catch (markError) {
            console.error('❌ Error marking call as errored:', markError);
          }

          console.error('❌ Operation error:', error);
          throw error;
        }
      }

      throw new Error('Invalid action or missing callId');
    } catch (error) {
      if (input.callId) {
        try {
          await context.supabase
            .rpc('mark_hominio_call_error', {
              p_user_id: user.customClaims.id,
              p_call_id: input.callId,
              p_error_message: error.message || 'Unknown error occurred'
            });
        } catch (dbError) {
          console.error('Failed to mark call as error:', dbError);
        }
      }

      console.error('❌ Operation error:', error);
      throw error;
    }
  }
});