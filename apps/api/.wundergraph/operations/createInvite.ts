import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.mutation({
    input: z.object({
        inviter: z.string().uuid().optional()
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ['authenticated'],
    },
    handler: async ({ user, input, context }) => {

        if (!user?.customClaims?.id) {
            console.error('Authorization Error: User ID does not match.');
            throw new AuthorizationError({ message: 'User ID does not match.' });
        }

        const fallbackInviterId = "00000000-0000-0000-0000-000000000001"
        const invitee = user?.customClaims?.id
        const inviterId = input.inviter && input.inviter !== invitee ? input.inviter : fallbackInviterId;

        const existingInvite = await context.supabase
            .from('invites')
            .select()
            .match({ invitee: invitee })
            .single();

        if (existingInvite.data) {
            console.error('Invite already exists for this invitee!');
            return { success: false, error: 'ALREADY INVITED' };
        }

        const retryCount = 3;
        let attempt = 0;
        let success = false;
        let data, error;

        while (attempt < retryCount && !success) {
            attempt++;
            const { data: insertData, error: insertError } = await context.supabase
                .from('invites')
                .insert([
                    { inviter: inviterId, invitee: invitee }
                ])
                .select();

            if (insertError) {
                console.error(`Attempt ${attempt} - Error creating invite: ${insertError.message}`);
                error = insertError;
            } else {
                data = insertData;
                success = true;
            }
        }

        if (!success) {
            return { success: false, error: error.message };
        }

        console.log('--------Invite created successfully!---------');
        return { success: true, data };
    }
});