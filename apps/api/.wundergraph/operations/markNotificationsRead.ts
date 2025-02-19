import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.mutation({
    input: z.object({
        notificationIds: z.array(z.string().uuid())
    }),
    handler: async ({ input, context }) => {
        const { notificationIds } = input;

        // Update notification recipients to mark them as read
        const { error } = await context.supabase
            .from('notification_recipients')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .in('id', notificationIds);

        if (error) {
            console.error('Error marking notifications as read:', error);
            throw new Error(`Failed to mark notifications as read: ${error.message}`);
        }

        return {
            success: true
        };
    }
}); 