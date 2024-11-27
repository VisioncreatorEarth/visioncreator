import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

// Call configuration
const CALL_CONFIG = {
  defaultSystemPrompt: `
  You are Hominio, a personal service assistant for the user. You can switch interface views / apps / services and you have a Shoppinglist Skill. 

  Your other skills are:
  - updating the users name

  You are also a friendly shopping assistant. Please help me with my shopping list. 
  If the user has questions, please always interact in a friendly conversation. 
  
  Always respond instantly and make short smalltalk, while exuting the tools in the background. 

  Please also translate any shoppinglist item into english

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

  Common Items Per Category (those are just examples, please find always the best fitting catgories for the items):
  - Fruits: Bananas, Apples, Oranges, Strawberries, Grapes, Peaches, Pineapple, Mango
  - Vegetables: Broccoli, Carrots, Tomatoes, Lettuce, Cucumber, Bell Peppers, Spinach, Onions, Potatoes, Garlic
  - Dairy: Milk, Cheese, Yogurt, Butter, Cream, Sour Cream, Cottage Cheese
  - Bakery: Bread, Croissant, Bagels, Muffins, Baguette, Donuts, Cake

  For each item in the request:
  1. Always specify the category from the list above
  2. Set the action field to 'add' or 'remove' based on what to do with the item
  3. For 'add' actions:
     - Include quantity (default to 1 if not specified)
     - Use appropriate units (e.g., kg, pcs, l)
     - Try to match items with their correct icons
  4. For 'remove' actions:
     - Only name and category are required
     - Use the same category and name as when adding to ensure proper removal

  ADDITIONAL INSTRUCTIONS:
    - Also allow for combined requests. For example:
      - "Adding 3 Apples and removing Bananas from your list, anything else?"
      - "Adding Milk and removing Bread from your list, aynthing else?"
    - Always repeat what you are adding or removing, but never repeat the actual added items, their catogories or their quantity.
    - Never repeat the same thing twice, like "Adding Apples, I have added Apples". 
    - Always respond in a friendly and helpful manner for ordinary conversations with a normal non-technical Human.
    - Always respond in english language, but accept any langauge as input reqeusts.
 
    - Never tell about anything technical or json or which tool and schema to use in the interaction, just use and execute the tools in the background. Always respond in a friendly and helpful manner for ordinary conversations with a normal non-technical Human. 
    Never apologize for errors just execute the tools. if the tool response gives an error, let the user know and continue the conversation.
  `,
  voice: 'b0e6b5c1-3100-44d5-8578-9015aa3023ae', // Jessica voice ID
  temperature: 0.6,
  maxDuration: '60s',
  timeExceededMessage: 'Maximum calltime exceeded. See you next time!',
  firstSpeaker: 'FIRST_SPEAKER_USER',
  model: 'fixie-ai/ultravox-70B',
  tools: [
    {
      temporaryTool: {
        modelToolName: 'updateShoppingList',
        description: 'Update shopping list items. ALWAYS use this tool when items should be added, removed, or modified to the shoppinglist.',
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
                  icon: { type: 'string', description: 'Icon for the item, choose the best you kind find from Iconify' },
                  unit: { type: 'string', description: 'Unit for this item' },
                  action: { type: 'string', enum: ['add', 'remove'], description: 'Action to perform with this item' }
                },
                required: ['name', 'category', 'action']
              }
            },
            required: true
          }
        ],
        client: {}
      }
    },
    {
      temporaryTool: {
        modelToolName: 'switchView',
        description: 'Switch to a different view component based on the context of the conversation. Use this tool when the conversation indicates a need to switch to a different functionality.',
        dynamicParameters: [
          {
            name: 'component',
            location: 'PARAMETER_LOCATION_BODY',
            schema: {
              type: 'string',
              enum: ['HominioShopWithMe', 'HominioTodoMe', 'HominioHostMe', 'HominioBankMe'],
              description: 'The component to switch to based on the conversation context: HominioShopWithMe for shopping lists, HominioTodoMe for tasks and scheduling, HominioHostMe for booking and hosting, HominioBankMe for banking and payments'
            },
            required: true
          }
        ],
        client: {}
      }
    },
    {
      temporaryTool: {
        modelToolName: 'updateName',
        description: 'Update the name. Use this tool when a name needs to be updated.',
        dynamicParameters: [
          {
            name: 'name',
            location: 'PARAMETER_LOCATION_BODY',
            schema: {
              type: 'string',
              description: 'The new name to be updated'
            },
            required: true,
          }
        ],
        client: {}
      }
    }
  ]
} as const;

export default createOperation.mutation({
  input: z.object({
    action: z.enum(['create', 'end']),
    callId: z.string().optional(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  errors: [UltravoxInitializationError, UltravoxAuthenticationError],
  async handler({ input, context, user, operations }) {
    if (!user?.customClaims?.id) {
      throw new Error('User ID not found');
    }

    try {
      if (input.action === 'create') {
        // Get user profile data
        const { data: profile } = await operations.query({
          operationName: 'queryMe'
        });

        // Get remaining minutes for max call time calculation
        const { data: userCapability } = await context.supabase
          .from('capabilities')
          .select('config')
          .eq('user_id', user.customClaims.id)
          .eq('type', 'TIER')
          .eq('active', true)
          .single();

        // Get actual minutes used from completed calls
        const { data: calls, error: callsError } = await context.supabase
          .from('hominio_calls')
          .select('duration_minutes')
          .eq('user_id', user.customClaims.id)
          .eq('status', 'completed');

        if (callsError) {
          console.log('Backend - Error fetching calls:', callsError);
          throw new Error('Failed to fetch call history');
        }

        const actualMinutesUsed = Number(calls.reduce((total, call) => total + (call.duration_minutes || 0), 0).toFixed(4));
        const minutesLimit = userCapability?.config?.minutesLimit || 0;
        const remainingMinutes = Number((minutesLimit - actualMinutesUsed).toFixed(4)); // Keep 4 decimal places for precision

        console.log('Backend - Actual minutes used:', actualMinutesUsed.toFixed(4));
        console.log('Backend - Minutes limit:', minutesLimit);
        console.log('Backend - Remaining minutes:', remainingMinutes);

        // Require at least 10 seconds (0.1667 minutes)
        if (remainingMinutes < 0.1667) {
          console.log('Backend - Not enough minutes left, minimum required: 0.1667, remaining:', remainingMinutes);
          throw new Error('No available minutes in your current plan');
        }

        // Check if user has available minutes and increment
        const { data: capability, error: capError } = await context.supabase
          .rpc('check_and_increment_ai_minutes', {
            p_user_id: user.customClaims.id,
            p_minutes: Math.min(1, remainingMinutes) // Only deduct what's available if less than 1
          });

        if (capError || !capability) {
          console.log('Backend - Error incrementing minutes:', capError);
          throw new Error('No available minutes in your current plan');
        }

        const maxCallTimeMinutes = Math.min(2, Math.max(0.1667, remainingMinutes));
        console.log('Backend - Max call time minutes:', maxCallTimeMinutes);

        // Get the current shopping list
        const { data: lists, error: listError } = await context.supabase
          .from('shopping_lists')
          .select(`
            id,
            shopping_list_items (
              quantity,
              unit,
              is_checked,
              shopping_items (
                name,
                category
              )
            )
          `)
          .eq('user_id', user.customClaims.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (listError) {
          console.error('Error fetching shopping list:', listError);
          throw new Error('Failed to fetch shopping list');
        }

        // Format current items for context - only include active (unchecked) items
        let currentItemsContext = '';
        if (lists?.[0]?.shopping_list_items?.length > 0) {
          const activeItems = lists[0].shopping_list_items
            .filter(item => !item.is_checked)
            .map(item => `${item.quantity || 1} ${item.unit || 'pcs'} ${item.shopping_items.name} (${item.shopping_items.category})`);

          if (activeItems.length > 0) {
            currentItemsContext = `\nCurrent Active Shopping List:\n${activeItems.join('\n')}`;
          }
        }

        const callParams = {
          systemPrompt: `${CALL_CONFIG.defaultSystemPrompt}${currentItemsContext} This is the users name, always address the user by his name: ${profile?.name}`,
          voice: CALL_CONFIG.voice,
          model: CALL_CONFIG.model,
          temperature: CALL_CONFIG.temperature,
          maxDuration: `${maxCallTimeMinutes * 60}s`, // Convert minutes to seconds
          timeExceededMessage: CALL_CONFIG.timeExceededMessage,
          firstSpeaker: CALL_CONFIG.firstSpeaker,
          selectedTools: CALL_CONFIG.tools
        };

        const result = await context.ultravox.createCall(callParams);

        if (!result?.data?.callId || !result?.data?.joinUrl) {
          throw new Error('Invalid call data received from Ultravox');
        }

        const { data: dbCallId, error: startError } = await context.supabase
          .rpc('start_hominio_call', {
            p_user_id: user.customClaims.id,
            p_ultravox_call_id: result.data.callId,
            p_ultravox_join_url: result.data.joinUrl,
            p_voice_id: CALL_CONFIG.voice,
            p_system_prompt: `${CALL_CONFIG.defaultSystemPrompt}${currentItemsContext}`,
            p_temperature: CALL_CONFIG.temperature,
            p_max_duration: `${maxCallTimeMinutes * 60}s`, // Convert minutes to seconds
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

        // Mark the call as joined so it won't be auto-cleaned
        await context.ultravox.markCallJoined(result.data.callId);

        return {
          callId: dbCallId,
          ultravoxCallId: result.data.callId,
          joinUrl: result.data.joinUrl
        };

      } else if (input.action === 'end' && input.callId) {
        // Get the call details to calculate duration
        const { data: callData, error: lookupError } = await context.supabase
          .from('hominio_calls')
          .select('ultravox_call_id, call_start_time')
          .eq('id', input.callId)
          .single();

        if (lookupError || !callData?.ultravox_call_id) {
          throw new Error('Could not find call in database');
        }

        // Calculate duration in minutes for final minute update
        const duration = (Date.now() - new Date(callData.call_start_time).getTime()) / (1000 * 60);
        const roundedDuration = Math.ceil(duration);

        // Update minutes used (subtract initial deduction)
        if (roundedDuration > 1) {
          const { error: updateError } = await context.supabase
            .rpc('check_and_increment_ai_minutes', {
              p_user_id: user.customClaims.id,
              p_minutes: roundedDuration - 1
            });

          if (updateError) {
            console.error('Error updating minutes:', updateError);
          }
        }

        // End the call first
        await context.ultravox.endCall(callData.ultravox_call_id);

        // Wait a bit for the transcript to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to get the transcript
        let finalTranscript = null;
        try {
          const transcriptResponse = await context.ultravox.getTranscript(callData.ultravox_call_id);
          console.log('📝 Got transcript response:', transcriptResponse);

          if (transcriptResponse?.results?.length > 0) {
            const baseTime = Date.now();
            finalTranscript = [...transcriptResponse.results]
              .reverse()
              .map((message, index) => {
                const messageTime = new Date(baseTime - ((transcriptResponse.results.length - 1 - index) * 1000));
                return {
                  content: message.text || '',
                  timestamp: messageTime.toISOString(),
                  role: message.role || 'unknown',
                  type: 'text',
                  sequence: index + 1
                };
              });
            console.log('📝 Prepared structured transcript for DB:', finalTranscript);
          }
        } catch (transcriptError) {
          console.error('❌ Error handling transcript:', transcriptError);
        }

        // Update the database using the end_hominio_call function
        const { data: endData, error: endError } = await context.supabase
          .rpc('end_hominio_call', {
            p_user_id: user.customClaims.id,
            p_call_id: input.callId,
            p_end_reason: 'user_ended',
            p_transcript: finalTranscript, // This will be stored as JSONB
            p_tool_executions: null
          });

        if (endError) {
          console.error('❌ Database error:', endError);
          throw new Error('Failed to update call in database: ' + endError.message);
        }

        console.log('💾 Database update result:', { endData, endError });

        return {
          success: true,
          message: 'Call ended successfully'
        };
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

      throw error;
    }
  }
});