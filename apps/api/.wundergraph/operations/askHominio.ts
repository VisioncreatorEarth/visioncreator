import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

export default createOperation.mutation({
  input: z.object({
    action: z.enum(['create', 'end']),
    callId: z.string().optional(),
  }),
  errors: [UltravoxInitializationError, UltravoxAuthenticationError],
  handler: async ({ input, context }) => {
    try {
      if (input.action === 'create') {
        const systemPrompt = `You are a friendly AI assistant. Keep your responses brief and clear.`;
        const result = await context.ultravox.createCall(systemPrompt);
        
        if (!result?.data?.callId || !result?.data?.joinUrl) {
          console.error('❌ Invalid call data received:', result);
          throw new Error('Invalid call data received from Ultravox');
        }

        return result.data;
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