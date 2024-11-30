import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.subscription({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async function* ({ context }) {
    while (true) {
      try {
        // Get usage stats
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

        const ultravoxCalls = callsResponse.data?.calls || [];
        
        // Get all call IDs from the last 50 calls
        const callIds = ultravoxCalls.map(call => call.callId);
        
        // Batch fetch hominio calls for the last 50 calls
        const { data: hominioCalls, error: hominioError } = await context.supabase
          .from('hominio_calls')
          .select('ultravox_call_id, user_id')
          .in('ultravox_call_id', callIds);

        if (hominioError) {
          console.error(`Error fetching hominio calls: ${hominioError.message}`);
        }

        // Create a map of call IDs to user IDs
        const callUserMap = new Map(
          hominioCalls?.map(call => [call.ultravox_call_id, call.user_id]) || []
        );

        // Get unique user IDs
        const userIds = [...new Set(hominioCalls?.map(call => call.user_id) || [])];

        // Batch fetch user profiles
        const { data: profiles, error: profileError } = await context.supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        if (profileError) {
          console.error(`Error fetching profiles: ${profileError.message}`);
        }

        // Create a map of user IDs to names
        const userNameMap = new Map(
          profiles?.map(profile => [profile.id, profile.name]) || []
        );

        // Return the combined data
        yield {
          totalCalls: callsResponse.data?.totalCount || 0,
          totalMinutes: timeResponse.data?.totalMinutes || 0,
          totalCost: timeResponse.data?.totalCost || 0,
          hasActiveSubscription: timeResponse.data?.hasActiveSubscription || false,
          calls: ultravoxCalls.map(call => ({
            ...call,
            userName: userNameMap.get(callUserMap.get(call.callId) || '') || 'Unknown'
          }))
        };

        // Wait for 5 seconds before next update
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error in subscription:', error);
        throw error;
      }
    }
  },
  response: z.object({
    totalCalls: z.number(),
    totalMinutes: z.number(),
    totalCost: z.number(),
    hasActiveSubscription: z.boolean(),
    calls: z.array(z.object({
      callId: z.string(),
      created: z.string(),
      ended: z.string().optional(),
      endReason: z.string().optional(),
      firstSpeaker: z.string(),
      systemPrompt: z.string(),
      voice: z.string(),
      userName: z.string()
    }))
  })
});
