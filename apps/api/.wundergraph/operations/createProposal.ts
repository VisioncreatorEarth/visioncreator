import {
    createOperation,
    z,
    AuthorizationError,
} from "../generated/wundergraph.factory";

export default createOperation.mutation({
    input: z.object({
        title: z.string(),
        details: z.string(),
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({ message: "No authenticated user found." });
        }

        const { data: proposal, error } = await context.supabase
            .from("proposals")
            .insert([
                {
                    title: input.title,
                    details: input.details,
                    author: user.customClaims.id,
                    state: 'idea',
                    votes_count: 0,
                    total_tokens_staked: 0,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating proposal:", error);
            throw new Error("Failed to create proposal");
        }

        return {
            success: true,
            proposal
        };
    },
}); 