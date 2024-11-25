import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    input: z.object({
      ultravoxCallIds: z.array(z.string())
    })
  }),
  requireAuthentication: true,
  handler: async ({ user, input, context }) => {
    try {
      if (!user?.customClaims?.id) {
        throw new Error('User not authenticated');
      }

      const { ultravoxCallIds } = input.input;
      if (!ultravoxCallIds?.length) {
        throw new Error('No call IDs provided');
      }

      console.log('Received call IDs to delete:', ultravoxCallIds);
      const results = [];
      const errors = [];

      // Process each call ID
      for (const callId of ultravoxCallIds) {
        try {
          console.log('Deleting call:', callId);
          // Delete from Ultravox
          await context.ultravox.deleteCall(callId);

          // Mark as deleted in our database
          const { error: updateError } = await context.supabase
            .from('hominio_calls')
            .update({ status: 'deleted' })
            .eq('ultravox_call_id', callId);

          if (updateError) {
            console.error('Database update error:', updateError);
            errors.push({ callId, error: 'Failed to update database status' });
            continue;
          }

          results.push({ callId, success: true });
        } catch (error) {
          console.error('Error processing call:', callId, error);
          errors.push({ callId, error: error instanceof Error ? error.message : String(error) });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors
      };
    } catch (error) {
      console.error('Operation error:', error);
      return {
        success: false,
        results: [],
        errors: [{ error: error instanceof Error ? error.message : String(error) }]
      };
    }
  }
});
