import {
    createOperation,
    z,
    AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        contextId: z.string().uuid(),
        contextType: z.string(),
        content: z.string().min(1).max(2000),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context, input, user }) => {
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({ message: "No authenticated user found." });
        }

        try {
            // First get the user's name
            const { data: profile, error: profileError } = await context.supabase
                .from('profiles')
                .select('name')
                .eq('id', user.customClaims.id)
                .single();

            if (profileError) {
                console.error('Error fetching user profile:', profileError);
                return {
                    success: false,
                    error: profileError.message
                };
            }

            // Insert the new message
            const { data: message, error: insertError } = await context.supabase
                .from('messages')
                .insert({
                    context_id: input.contextId,
                    context_type: input.contextType,
                    content: input.content,
                    sender_id: user.customClaims.id
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating message:', insertError);
                return {
                    success: false,
                    error: insertError.message
                };
            }

            // Transform the response to match the expected format
            const transformedMessage = {
                id: message.id,
                content: message.content,
                sender_id: message.sender_id,
                sender_name: profile.name || 'Unknown',
                created_at: message.created_at,
                updated_at: message.updated_at
            };

            return {
                success: true,
                message: transformedMessage
            };
        } catch (error: any) {
            console.error('Unexpected error creating message:', error);
            return {
                success: false,
                error: error.message || 'An unexpected error occurred'
            };
        }
    },
}); 