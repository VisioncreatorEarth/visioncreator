import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
    input: z.object({
        contextId: z.string().uuid(),
        contextType: z.string(),
    }),
    handler: async ({ input, context }) => {
        // First get messages
        const { data: messages, error: messagesError } = await context.supabase
            .from('messages')
            .select('*')
            .eq('context_id', input.contextId)
            .eq('context_type', input.contextType)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

        if (messagesError) {
            console.error('Error fetching messages:', messagesError);
            return {
                success: false,
                error: messagesError.message,
                messages: []
            };
        }

        // Then get all unique sender profiles in one query
        const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
        const { data: profiles, error: profilesError } = await context.supabase
            .from('profiles')
            .select('id, name')
            .in('id', senderIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return {
                success: false,
                error: profilesError.message,
                messages: []
            };
        }

        // Create a map of sender_id to name for quick lookup
        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

        // Transform the response to match the expected format
        const transformedMessages = messages?.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            sender_name: profileMap.get(msg.sender_id) || 'Unknown',
            created_at: msg.created_at,
            updated_at: msg.updated_at
        })) || [];

        return {
            success: true,
            messages: transformedMessages
        };
    },
}); 