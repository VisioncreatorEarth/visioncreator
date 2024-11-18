import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

export default createOperation.mutation({
  input: z.object({
    chat_message_prompts: z.array(z.string()).min(1)
  }),
  errors: [UltravoxInitializationError, UltravoxSubscriptionError, UltravoxAuthenticationError],
  handler: async ({ input, context }) => {
    try {
      console.log("Starting Ultravox API call...");

      const response = await context.ultravox.call();
      console.log("Ultravox response:", response);

      return {
        data: response
      };
    } catch (error) {
      console.error('Error in askHominio:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new UltravoxInitializationError('Unknown error occurred');
    }
  },
});
