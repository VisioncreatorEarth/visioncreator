import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
    input: z.object({}),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated", "admin"],
    },
    handler: async ({ context }) => {
        const { data: users, error } = await context.supabase
            .from("profiles")
            .select("id, name")
            .order("name");

        if (error) {
            throw new Error("Failed to fetch users");
        }

        return { users };
    },
}); 