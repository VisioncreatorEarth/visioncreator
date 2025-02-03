import {
    createOperation,
    z,
} from "../generated/wundergraph.factory";

export default createOperation.query({
    input: z.object({
        userId: z.string(),
    }),
    handler: async ({ input, context }) => {
        const { data: profile, error } = await context.supabase
            .from("profiles")
            .select("id, name, onboarded")
            .eq("id", input.userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", { error, userId: input.userId });
            throw new Error("Failed to fetch profile details");
        }

        return {
            id: profile.id,
            name: profile.name,
            onboarded: profile.onboarded,
        };
    },
}); 