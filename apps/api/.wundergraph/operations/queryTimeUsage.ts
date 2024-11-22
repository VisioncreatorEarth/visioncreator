import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.subscription({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async function* ({ context }) {
    while (true) {
      try {
        // Get time usage
        const timeResponse = await context.ultravox.getTimeUsage();
        if (timeResponse.error) {
          console.error(`[TimeUsage] Error received:`, timeResponse.error);
          throw new Error(timeResponse.error);
        }

        // Get calls
        const callsResponse = await context.ultravox.getCalls();
        if (callsResponse.error) {
          console.error(`[Calls] Error received:`, callsResponse.error);
          throw new Error(callsResponse.error);
        }

        const result = {
          timeUsed: timeResponse.data?.timeUsed || '0s',
          timeRemaining: timeResponse.data?.timeRemaining || '0s',
          calls: callsResponse.data?.calls || []
        };

        yield result;

        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (error) {
        console.error('[TimeUsage] Failed to get data:', error);
        throw error;
      }
    }
  },
  response: z.object({
    timeUsed: z.string(),
    timeRemaining: z.string(),
    calls: z.array(z.object({
      callId: z.string(),
      created: z.string(),
      ended: z.string().optional(),
      endReason: z.string().optional(),
      firstSpeaker: z.string(),
      systemPrompt: z.string(),
      voice: z.string()
    }))
  }),
});
