import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

// Call configuration
const CALL_CONFIG = {
  defaultSystemPrompt: 'You are a friendly AI assistant. Keep your responses brief and clear.',
  voice: 'b0e6b5c1-3100-44d5-8578-9015aa3023ae', // Jessica voice ID
  temperature: 0.8,
  maxDuration: '120s', // 2 minutes in seconds
  timeExceededMessage: 'Maximum calltime exceeded. See you next time!',
  firstSpeaker: 'FIRST_SPEAKER_USER', // API expects 'FIRST_SPEAKER_AGENT' or 'FIRST_SPEAKER_USER'
} as const;

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
          selectedTools: []
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